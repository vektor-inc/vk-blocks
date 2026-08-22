const gulp = require('gulp');
const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('sass'));
// 本プロジェクトが使用する gulp-autoprefixer v10 は ESM のため、require で読み込むと
// 関数本体が default プロパティに入る。そのため CommonJS から読み込む場合は .default を参照する。
const autoprefixer = require('gulp-autoprefixer').default;
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const path = require('path');
const fs = require('fs');
const { finished } = require('stream/promises');

const waitForStream = (stream) => finished(stream);

// =============================================================================
// Breakpoint consistency check (issue #3091)
// ブレークポイント整合性チェック（issue #3091）
// =============================================================================
// gulp build ではモジュール解決が通らない単体ビルドの view.js が複数存在し、
// src/utils/_breakpoints.scss の値を import で共有できない。そのため値そのものは
// 各 view.js にリテラルで直書きしたまま、ビルド時にこの一覧と _breakpoints.scss を
// 突き合わせ、ズレていたらビルドを失敗させることで一致を保証する（値の自動注入はしない）。
// Several view.js files are built standalone by gulp (uglify + concat only, no
// webpack/babel), so they cannot `import` the values from
// src/utils/_breakpoints.scss. Instead of injecting values at build time, each
// view.js keeps its breakpoint constant as a literal number, and this list is
// checked against _breakpoints.scss on every build; a mismatch fails the build.
//
// 対象を増やす場合はこの配列に1行追加するだけでよい。
// To cover another file, just add one entry to this array.
const BREAKPOINT_CHECKS = [
	{
		jsFile: 'src/blocks/_pro/animation/view.js',
		jsConstant: 'MOBILE_BREAKPOINT',
		scssVariable: 'sm',
	},
	{
		jsFile: 'src/extensions/core/group/view.js',
		jsConstant: 'MOBILE_BREAKPOINT',
		scssVariable: 'xs',
	},
	{
		jsFile: 'src/extensions/core/group/view.js',
		jsConstant: 'TABLET_BREAKPOINT',
		scssVariable: 'md',
	},
];

const BREAKPOINTS_SCSS_FILE = 'src/utils/_breakpoints.scss';

/**
 * _breakpoints.scss から `$変数名: 数値px;` の数値を抽出する。
 * Extracts the numeric value of `$variableName: numberpx;` from _breakpoints.scss.
 *
 * @param {string} scssContent  _breakpoints.scss の中身 / file contents
 * @param {string} variableName 変数名（`$` を除く）/ variable name without `$`
 * @return {number|null} 数値（px）。見つからない場合は null / the number in px, or null if not found
 */
function extractScssBreakpointValue(scssContent, variableName) {
	const pattern = new RegExp(
		`\\$${variableName}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`
	);
	const match = scssContent.match(pattern);
	return match ? Number(match[1]) : null;
}

/**
 * view.js から `const 定数名 = 数値;` の数値を抽出する。
 * Extracts the numeric value of `const constantName = number;` from a view.js file.
 *
 * @param {string} jsContent   JSファイルの中身 / file contents
 * @param {string} constantName 定数名 / constant name
 * @return {number|null} 数値。見つからない場合は null / the number, or null if not found
 */
function extractJsBreakpointValue(jsContent, constantName) {
	const pattern = new RegExp(
		`\\bconst\\s+${constantName}\\s*=\\s*(\\d+(?:\\.\\d+)?)\\s*;`
	);
	const match = jsContent.match(pattern);
	return match ? Number(match[1]) : null;
}

// check-breakpoints
gulp.task('check-breakpoints', (done) => {
	const scssPath = path.resolve(__dirname, BREAKPOINTS_SCSS_FILE);
	const scssContent = fs.readFileSync(scssPath, 'utf8');

	const errors = [];

	BREAKPOINT_CHECKS.forEach(({ jsFile, jsConstant, scssVariable }) => {
		const jsPath = path.resolve(__dirname, jsFile);
		// Pro 専用ファイルは無料版ビルド時に .freeignore で除外され存在しないため、
		// 存在しないファイルはチェック対象から除外する（Pro ビルド時は必ず存在する）。
		if (!fs.existsSync(jsPath)) {
			return;
		}
		const jsContent = fs.readFileSync(jsPath, 'utf8');

		const scssValue = extractScssBreakpointValue(scssContent, scssVariable);
		const jsValue = extractJsBreakpointValue(jsContent, jsConstant);

		if (scssValue === null) {
			errors.push(
				`[check-breakpoints] ${BREAKPOINTS_SCSS_FILE} に $${scssVariable} が見つかりません。 / ` +
					`$${scssVariable} not found in ${BREAKPOINTS_SCSS_FILE}.`
			);
			return;
		}

		if (jsValue === null) {
			errors.push(
				`[check-breakpoints] ${jsFile} に定数 ${jsConstant} が見つかりません。 / ` +
					`Constant ${jsConstant} not found in ${jsFile}.`
			);
			return;
		}

		if (scssValue !== jsValue) {
			errors.push(
				`[check-breakpoints] ${jsFile} の ${jsConstant} (実際の値/actual: ${jsValue}) が ` +
					`${BREAKPOINTS_SCSS_FILE} の $${scssVariable} (期待値/expected: ${scssValue}) と一致しません。 / ` +
					`${jsFile}'s ${jsConstant} (actual: ${jsValue}) does not match ` +
					`${BREAKPOINTS_SCSS_FILE}'s $${scssVariable} (expected: ${scssValue}).`
			);
		}
	});

	if (errors.length > 0) {
		done(new Error(`\n${errors.join('\n')}`));
		return;
	}

	done();
});

// 同梱している third-party の Bootstrap (lib/bootstrap) のソースは古い Sass 記法
// （@import / グローバル組み込み関数 / "/" 除算 / if() / darken()・lighten() など）を
// 使っており、Dart Sass 1.80+ で大量の非推奨警告を出す。これらは Bootstrap 側のコードに
// 起因し、当プラグイン自身の SCSS には該当箇所が無い。上流コードを書き換えるのは不適切なため、
// ビルド時はこれらの非推奨警告を抑制する（quietDeps: 依存として読み込まれたファイルの警告を抑制、
// silenceDeprecations: 該当する種類の非推奨警告を抑制）。
const sassQuietDeprecations = {
	quietDeps: true,
	silenceDeprecations: [
		'import',
		'global-builtin',
		'slash-div',
		'if-function',
		'color-functions',
	],
};

// replace_text_domain
gulp.task('text-domain-free', () => {
	return Promise.all([
		waitForStream(
			gulp.src(['./inc/**',])
		.pipe(replace(/__\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "__( $1, 'vk-blocks' )"))
		.pipe(replace(/_e\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_e( $1, 'vk-blocks' )"))
		.pipe(replace(/_n_noop\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_n_noop( $1, $2, 'vk-blocks' )"))
		.pipe(replace(/_x\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_x( $1, $2, 'vk-blocks' )"))
		.pipe(replace("$vk_blocks_components_textdomain = 'vk-blocks-pro';", "$vk_blocks_components_textdomain = 'vk-blocks';"))
		.pipe(replace("wp_set_script_translations( 'vk-blocks-admin-js', 'vk-blocks-pro', VK_BLOCKS_DIR_PATH . 'languages' );", "wp_set_script_translations( 'vk-blocks-admin-js', 'vk-blocks' );"))
		.pipe(replace("wp_set_script_translations( 'vk-blocks-build-js', 'vk-blocks-pro', VK_BLOCKS_DIR_PATH . 'languages' );", "wp_set_script_translations( 'vk-blocks-build-js', 'vk-blocks' );"))
		.pipe(gulp.dest('./inc/'))
		),
		waitForStream(
			gulp.src(['./src/**'])
		.pipe(replace(/__\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gsm, "__( $1, 'vk-blocks' )"))
		.pipe(replace(/_e\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gsm, "_e( $1, 'vk-blocks' )"))
		.pipe(replace(/_n_noop\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gsm, "_n_noop( $1, $2, 'vk-blocks' )"))
		.pipe(replace(/_x\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gsm, "_x( $1, $2, 'vk-blocks' )"))
		.pipe(replace(/"textdomain":\s*?["']vk-blocks-pro["']/gsm, '"textdomain": "vk-blocks"'))
		.pipe(gulp.dest('./src/'))
		),
		waitForStream(
			gulp.src(['./test/**'])
		.pipe(replace(/__\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "__( $1, 'vk-blocks' )"))
		.pipe(replace(/_e\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_e( $1, 'vk-blocks' )"))
		.pipe(replace(/_n_noop\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_n_noop( $1, $2, 'vk-blocks' )"))
		.pipe(replace(/_x\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_x( $1, $2, 'vk-blocks' )"))
		.pipe(gulp.dest('./test/'))
		),
		waitForStream(
			gulp.src(['./vk-blocks.php'])
		.pipe(replace(/__\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "__( $1, 'vk-blocks' )"))
		.pipe(replace(/_e\(\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_e( $1, 'vk-blocks' )"))
		.pipe(replace(/_n_noop\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_n_noop( $1, $2, 'vk-blocks' )"))
		.pipe(replace(/_x\(\s*?(['"`].*?['"`]),\s*?(['"`].*?['"`]),\s*?['"`]vk-blocks-pro['"`]\s*?\)/gm, "_x( $1, $2, 'vk-blocks' )"))
		.pipe(replace("Text Domain: vk-blocks-pro", "Text Domain: vk-blocks"))
		.pipe(gulp.dest('./'))
		),
	]);
});

gulp.task('helper-js', () => {
	return Promise.all([
		waitForStream(
			gulp.src('src/blocks/faq2/view.js')
		.pipe(uglify())
		.pipe(concat('vk-faq2.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/slider/view.js')
		.pipe(uglify())
		.pipe(concat('vk-slider.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/extensions/core/group/view.js')
		.pipe(uglify())
		.pipe(concat('vk-group-scrollable.min.js'))
		.pipe(gulp.dest('./build/'))
		),
	]);
});

gulp.task('helper-js-pro', () => {
	return Promise.all([
		waitForStream(
			gulp.src('src/blocks/_pro/accordion/view.js')
		.pipe(uglify())
		.pipe(concat('vk-accordion.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/_pro/animation/view.js')
		.pipe(uglify())
		.pipe(concat('vk-animation.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/_pro/breadcrumb/view.js')
		.pipe(uglify())
		.pipe(concat('vk-breadcrumb.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/_pro/fixed-display/view.js')
		.pipe(uglify())
		.pipe(concat('vk-fixed-display.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/_pro/tab/view.js')
		.pipe(uglify())
		.pipe(concat('vk-tab.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/_pro/table-of-contents-new/view.js')
		.pipe(uglify())
		.pipe(concat('vk-table-of-contents-new.min.js'))
		.pipe(gulp.dest('./build/'))
		),
		waitForStream(
			gulp.src('src/blocks/_pro/post-list-slider/view.js')
		.pipe(uglify())
		.pipe(concat('vk-post-list-slider.min.js'))
		.pipe(gulp.dest('./build/'))
		),
	]);
});

gulp.task('sass', () => {
	return gulp.src(['./src/**/*.scss'])
		.pipe(
			plumber({
				errorHandler: notify.onError('<%= error.message %>'),
			})
		)
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
				// モダン Dart Sass API ではロードパスの指定は includePaths ではなく loadPaths。
				loadPaths: [path.resolve(__dirname, 'src')],
			})
		)
		.pipe(autoprefixer())
		.pipe(concat('block-build.css'))
		.pipe(gulp.dest('./build/'));
});

gulp.task('sass_editor', () => {
	return gulp.src([
		'./editor-css/_editor_common_core.scss',
		'./editor-css/_editor_before.scss',
		'./editor-css/_editor_after.scss',
	])
		.pipe(concat('editor-block-build-marge.scss'))
		.pipe(gulp.dest('./editor-css/'))
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
				// モダン Dart Sass API ではロードパスの指定は includePaths ではなく loadPaths。
				loadPaths: [path.resolve(__dirname, 'src')],
			})
		)
		.pipe(autoprefixer())
		.pipe(concat('block-build-editor.css'))
		.pipe(gulp.dest('./build/'));
});

// vk_blocks_options管理画面 css
gulp.task('sass_vk_blocks_options', () => {
	return gulp.src(['./options-css/*.scss'])
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
			})
		)
		.pipe(autoprefixer())
		.pipe(concat('vk_blocks_options.css'))
		.pipe(gulp.dest('./build/'));
});

// VK Block で使用しているBootstrapのみコンパイル
// ※ Lightning 以外のテーマで利用の際に読込
gulp.task('sass_bootstrap', () => {
	return gulp.src(['./lib/bootstrap/scss/bootstrap.scss'])
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
			})
		)
		.pipe(autoprefixer())
		.pipe(concat('bootstrap_vk_using.css'))
		.pipe(gulp.dest('./build/'));
});

// VK Block で使用しているBootstrapのみコンパイル
// ※ Lightning 以外のテーマで利用の際に読込
gulp.task('sass_vk_components', () => {
	return gulp.src(['./vendor/vektor-inc/vk-component/src/assets/scss'])
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
			})
		)
		.pipe(autoprefixer())
		.pipe(concat('vk-components.css'))
		.pipe(gulp.dest('./build/'));
});

// ブロックごとのscssそれぞれビルド free
gulp.task('sass-separate-free', () => {
	return Promise.all([
		waitForStream(
			gulp.src('./src/blocks/**/*.scss')
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
				// モダン Dart Sass API ではロードパスの指定は includePaths ではなく loadPaths。
				loadPaths: [path.resolve(__dirname, 'src')],
			})
		)
		.pipe(autoprefixer())
		.pipe(gulp.dest('./build'))
		),
	// extensions内をビルド
		waitForStream(
			gulp.src('./src/extensions/**/**/*.scss')
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
				// モダン Dart Sass API ではロードパスの指定は includePaths ではなく loadPaths。
				loadPaths: [path.resolve(__dirname, 'src')],
			})
		)
		.pipe(autoprefixer())
		.pipe(gulp.dest('./build/extensions'))
		),
	// utils内をビルド
		waitForStream(
			gulp.src('./src/utils/*.scss')
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
				// モダン Dart Sass API ではロードパスの指定は includePaths ではなく loadPaths。
				loadPaths: [path.resolve(__dirname, 'src')],
			})
		)
		.pipe(autoprefixer())
		.pipe(gulp.dest('./build/utils'))
		),
	]);
});

// ブロックごとのscssそれぞれビルド pro
gulp.task('sass-separate-pro', () => {
	return gulp.src('./src/blocks/_pro/**/*.scss')
		.pipe(
			sass({
				// gulp-sass v6 はモダン Dart Sass API を使うため、旧 API オプションの
				// errLogToConsole は廃止、出力形式は outputStyle ではなく style で指定する。
				style: 'compressed',
				// Bootstrap 由来の非推奨警告を抑制する（詳細は sassQuietDeprecations の定義参照）。
				...sassQuietDeprecations,
				// モダン Dart Sass API ではロードパスの指定は includePaths ではなく loadPaths。
				loadPaths: [path.resolve(__dirname, 'src')],
			})
		)
		.pipe(autoprefixer())
		.pipe(gulp.dest('./build/pro'));
});

// watch
gulp.task('watch', () => {
	gulp.watch('editor-css/_editor_before.scss', gulp.parallel('sass_editor'));
	// gulp.watch('editor-css/*.scss', gulp.parallel('sass_editor'));
	gulp.watch('src/**/*.scss', gulp.series('sass', 'sass_editor', 'sass-separate-free', 'sass-separate-pro'));
	//watch enque-front.js
	gulp.watch('src/**/*.js', gulp.series('helper-js', 'helper-js-pro'));
	gulp.watch(
		'lib/bootstrap/scss/*.scss',
		gulp.parallel('sass_bootstrap', 'sass_editor')
	);
	gulp.watch(
		'./vendor/vektor-inc/vk-component/src/assets/scss',
		gulp.parallel('sass_vk_components', 'sass_editor')
	);
	gulp.watch(
		'options-css/*.scss',
		gulp.parallel('sass_vk_blocks_options')
	);
});

//Build : Development
gulp.task(
	'build:dev:free',
	gulp.series(
		'check-breakpoints',
		'text-domain-free',
		'sass',
		'helper-js',
		'sass_editor',
		'sass_bootstrap',
		'sass_vk_components'
	)
);
gulp.task(
	'build:dev:pro',
	gulp.series(
		'check-breakpoints',
		'sass',
		'helper-js',
		'helper-js-pro',
		'sass_editor',
		'sass_bootstrap',
		'sass_vk_components'
	)
);

// Build : Production
gulp.task(
	'build:free',
	gulp.series(
		'check-breakpoints',
		'text-domain-free',
		'sass',
		'helper-js',
		'sass_editor',
		'sass_vk_blocks_options',
		'sass_bootstrap',
		'sass_vk_components',
		'sass-separate-free'
	)
);
gulp.task(
	'build:pro',
	gulp.series(
		'check-breakpoints',
		'sass',
		'helper-js',
		'helper-js-pro',
		'sass_editor',
		'sass_vk_blocks_options',
		'sass_bootstrap',
		'sass_vk_components',
		'sass-separate-free',
		'sass-separate-pro'
	)
);

// Default Tasks
gulp.task('default', gulp.series('watch'));
