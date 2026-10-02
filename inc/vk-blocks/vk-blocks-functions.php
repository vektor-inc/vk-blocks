<?php
/**
 * Load VK Blocks Files
 *
 * このファイルはinc/vk-blocks内にあるフォルダ内を読み込むだけ
 *
 * @package vk_blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load Files
require_once __DIR__ . '/utils/hex-to-rgba.php';
require_once __DIR__ . '/utils/color-slug-to-color-code.php';
require_once __DIR__ . '/utils/array-merge.php';
require_once __DIR__ . '/utils/minify-css.php';
require_once __DIR__ . '/extensions/core/heading.php';
require_once __DIR__ . '/extensions/core/image.php';
require_once __DIR__ . '/extensions/core/list.php';
require_once __DIR__ . '/extensions/core/site-logo.php';
require_once __DIR__ . '/extensions/core/site-title.php';
require_once __DIR__ . '/extensions/core/navigation.php';
require_once __DIR__ . '/style/balloon.php';
require_once __DIR__ . '/style/flow.php';
require_once __DIR__ . '/style/hidden-extension.php';
require_once __DIR__ . '/style/common-margin.php';
require_once __DIR__ . '/view/responsive-br.php';
require_once __DIR__ . '/view/slider-pause-button-label.php';
require_once __DIR__ . '/view/class-vk-blocks-postlist.php';
require_once __DIR__ . '/view/class-vk-blocks-scrollhintrenderer.php';
VK_Blocks_ScrollHintRenderer::init();
require_once __DIR__ . '/view/class-vk-blocks-link-to-post.php';
VK_Blocks_Link_To_Post::init();
require_once __DIR__ . '/view/class-vk-blocks-link-to-custom-field.php';
VK_Blocks_Link_To_Custom_Field::init();

require_once __DIR__ . '/class-vk-blocks-print-css-variables.php';

// グローバル設定を定義
require_once __DIR__ . '/class-vk-blocks-global-settings.php';
VK_Blocks_Global_Settings::init();

require_once __DIR__ . '/class-vk-blocks-block-loader.php';
VK_Blocks_Block_Loader::init();

// オプション値を定義
require_once __DIR__ . '/class-vk-blocks-options.php';
VK_Blocks_Options::init();

// font-awesome
require_once __DIR__ . '/font-awesome/font-awesome-config.php';

// VK Blocks の管理画面.
require_once __DIR__ . '/admin/admin.php';
require_once __DIR__ . '/init.php';
require_once __DIR__ . '/blocks.php';
require_once __DIR__ . '/App/RestAPI/BlockMeta/class-vk-blocks-entrypoint.php';
new Vk_Blocks_EntryPoint();

// ブロック関連の処理
require_once __DIR__ . '/blocks/class-vk-blocks-faq-schema-manager.php';
VK_Blocks_Faq_Schema_Manager::init();

/**
 * VK Blocks active
 */
function vk_blocks_active() {
	return true;
}

// 翻訳を実行
add_action(
	'plugins_loaded',
	function () {
		// サイトのロケールを取得
		$locale = determine_locale();
		// 翻訳ファイルのパスを指定
		$path = plugin_dir_path( __FILE__ ) . 'languages';

		// 日本語の設定のみ翻訳ファイルを読み込み
		if ( strpos( $locale, 'ja' ) === 0 ) {
			// PHPファイルの翻訳読み込み
			load_textdomain( 'vk-blocks-pro', $path . '/vk-blocks-pro-ja.mo' );

			// JavaScriptファイルの翻訳設定
			add_action(
				'wp_enqueue_scripts',
				function () use ( $path ) {
					// スクリプト登録後に翻訳設定
					wp_set_script_translations( 'vk-blocks-build-js', 'vk-blocks-pro', $path );
					wp_set_script_translations( 'vk-blocks-admin-js', 'vk-blocks-pro', $path );
				}
			);
		}
	}
);

/**
 * VK Blocks 用の CSS クラスを追加
 */
add_filter(
	'body_class',
	function ( $body_class ) {
		$body_class[] = 'vk-blocks';
		return $body_class;
	}
);

/**
 * VK Blocks Assets
 */
function vk_blocks_blocks_assets() {
	$vk_blocks_options = VK_Blocks_Options::get_options();
	$has_theme_json    = false;

	// テーマに theme.json があるかどうかを判定（ content-width-half のパネル表示制御で使用 ）
	if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
		$has_theme_json = true;
	} elseif ( function_exists( 'wp_theme_has_theme_json' ) ) {
		$has_theme_json = wp_theme_has_theme_json();
	} else {
		$theme          = wp_get_theme();
		$has_theme_json = file_exists( $theme->get_stylesheet_directory() . '/theme.json' ) || file_exists( $theme->get_template_directory() . '/theme.json' );
	}

	// プロ版の値をフロントエンドに出力.
	include_once ABSPATH . 'wp-admin/includes/plugin.php';
	if ( is_plugin_active( 'vk-blocks-pro/vk-blocks.php' ) ) {
		wp_localize_script( 'vk-blocks-build-js', 'vk_blocks_check', array( 'is_pro' => true ) );
	} else {
		wp_localize_script( 'vk-blocks-build-js', 'vk_blocks_check', array( 'is_pro' => false ) );
	}

	wp_localize_script(
		'vk-blocks-build-js',
		'vk_blocks_params',
		array(
			'home_url'                    => home_url( '/' ),
			'show_custom_css_editor_flag' => $vk_blocks_options['show_custom_css_editor_flag'],
			'balloon_meta_lists'          => $vk_blocks_options['balloon_meta_lists'],
			'custom_format_lists'         => $vk_blocks_options['custom_format_lists'],
			'block_variation_lists'       => $vk_blocks_options['block_variation_lists'],
			'has_theme_json'              => $has_theme_json,
		)
	);

	global $vk_blocks_common_attributes;
	$vk_blocks_common_attributes = array(
		'vkb_hidden'       => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xxl'   => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xl_v2' => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xl'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_lg'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_md'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_sm'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xs'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'marginTop'        => array(
			'type'    => 'string',
			'default' => '',
		),
		'marginBottom'     => array(
			'type'    => 'string',
			'default' => '',
		),
	);

	// Pro版のためfunction_existsを挟む
	$dynamic_css = '';
	if ( function_exists( 'vk_blocks_get_custom_format_lists_inline_css' ) ) {
		$dynamic_css .= vk_blocks_get_custom_format_lists_inline_css();
	}

	$dynamic_css = vk_blocks_minify_css( $dynamic_css );

	// 分割読み込みが有効な場合は、フロント側ではローダー側で該当ハンドルに付与する
	if ( method_exists( 'VK_Blocks_Block_Loader', 'should_load_separate_assets' )
		&& VK_Blocks_Block_Loader::should_load_separate_assets() && ! is_admin() ) {
		if ( $dynamic_css ) {
			wp_add_inline_style( 'vk-blocks-utils-common-css', $dynamic_css );
		}
	} elseif ( $dynamic_css ) {
		// 一括読み込み時や管理画面では従来通り
		wp_add_inline_style( 'vk-blocks-build-css', $dynamic_css );
		wp_add_inline_style( 'vk-blocks-utils-common-css', $dynamic_css );
		// エディターにも追加
		wp_add_inline_style( 'wp-edit-blocks', $dynamic_css );
	}
}
add_action( 'init', 'vk_blocks_blocks_assets', 10 );

if ( ! function_exists( 'vk_blocks_set_wp_version' ) ) {
	/**
	 * VK Blocks Set WP Version
	 */
	function vk_blocks_set_wp_version() {
		global $wp_version;

		// RC版の場合ハイフンを削除.
		if ( strpos( $wp_version, '-' ) !== false ) {
			$_wp_version = strstr( $wp_version, '-', true );
		} else {
			$_wp_version = $wp_version;
		}

		echo '<script>',
			'var wpVersion = "' . esc_attr( $_wp_version ) . '";',
		'</script>';
	}
	add_action( 'admin_head', 'vk_blocks_set_wp_version', 10, 0 );
}

if ( ! function_exists( 'vk_blocks_localize_slider_actual_count_label' ) ) {
	/**
	 * スライダーブロックの「実際のスライド数で表示」用 aria-label テンプレートを
	 * JavaScript へ渡す（#3080）。
	 *
	 * Gutenbergの save() は決定的関数である必要があるため（保存時のロケールで翻訳した文字列を
	 * data-vkb-slider-actual-count-label 属性として保存HTMLに埋め込むと、後で
	 * サイトの言語設定を変えた際に save() の再計算結果（新ロケールの翻訳）と保存済み
	 * HTML（保存時点の翻訳）が食い違い、ブロック検証エラーになる）、翻訳済み文字列は
	 * save() の出力に含めず、この関数で現在のロケールに基づき wp_localize_script()
	 * 経由でフロントエンドの view.js へ渡す。view.js は gulp で直接 minify され
	 * ES module import が使えないため、window.vkBlocksSliderI18n グローバル経由で
	 * 受け取る（vk-blocks-fixed-display 等、既存の gulp ビルド JS と同じ localize
	 * パターン）。
	 *
	 * Passes the "Show actual slide count" aria-label template to JavaScript for the
	 * Slider block (#3080). save() must be a deterministic function: embedding the
	 * locale-resolved translation directly into the saved HTML (as the
	 * data-vkb-slider-actual-count-label attribute) would make save()'s recomputed
	 * output (using whatever locale is active later) diverge from the frozen saved
	 * HTML (translated at save time) if the site's language setting changes,
	 * triggering a block-validation error. So the translated string is kept out of
	 * save()'s output and instead passed here, resolved against the current locale,
	 * via wp_localize_script() to the front-end view.js. view.js is minified
	 * directly by gulp and cannot use ES module imports, so it reads this off the
	 * window.vkBlocksSliderI18n global (the same localize pattern already used for
	 * other gulp-built scripts such as vk-blocks-fixed-display).
	 *
	 * @param string $handle 対象スクリプトのハンドル名.
	 */
	function vk_blocks_localize_slider_actual_count_label( $handle ) {
		if ( ! wp_script_is( $handle, 'registered' ) && ! wp_script_is( $handle, 'enqueued' ) ) {
			return;
		}
		// 同じハンドルに対して二重に wp_localize_script() を呼ばないようにする
		// ガード（#3080, CodeRabbit指摘・再修正）。この関数は、page-content
		// ブロック経由の enqueue（vk_blocks_content_enqueue_scripts()）と
		// 通常の enqueue（vk_blocks_load_scripts()）の両方から呼ばれうる。
		// 1ページに両方の呼び出し経路が組み合わさると、二重呼び出しになる。
		// wp_localize_script() は同じハンドルへ複数回呼ぶと（上書きではなく）
		// 既存の inline data に追記するため、ガードが無いと同じ内容の
		// <script> タグが重複出力されてしまう（実害はないが無駄）。
		//
		// 判定は、wp_localize_script() が生成する
		// "var vkBlocksSliderI18n = ..." という文字列がハンドルの inline data
		// に含まれているかを見る方式（strpos）をやめた。これは WordPress
		// コアの生成する変数宣言の書式（例: "var" から "const"/"let" への
		// 変更、フォーマットの変更）に暗黙に依存しており、コア側の実装が
		// 変わると静かに壊れる（CodeRabbit指摘）。
		//
		// 代わりに、処理済みかどうかのフラグを wp_scripts() の
		// add_data()/get_data() 経由でハンドル自身に直接紐付ける（コアの
		// 生成するJS文字列の書式には一切依存しない、自前のキー）。
		// なお、単純な「ハンドル名だけをキーにしたPHPの静的配列」は採用しな
		// かった: PHPUnitのように同一プロセス内で複数のテストメソッドが
		// 実行される環境では、あるテストが一度このハンドル名を処理済みに
		// すると、後続の別テストが同じハンドル名で
		// wp_register_script()/wp_deregister_script() により登録し直しても、
		// 純粋なPHP静的変数はハンドルの再登録と無関係にプロセスの寿命いっぱい
		// 残ってしまい、後続テストが誤ってスキップされてしまうことを実際の
		// テスト実行で確認した。wp_scripts() のデータに紐付ける方式なら、
		// wp_register_script() でハンドルを再登録すると WP_Dependencies が
		// そのハンドルの依存オブジェクトを作り直すため、以前付与したフラグは
		// 自然に失われ、この問題が起きない。
		//
		// Guards against calling wp_localize_script() twice for the same
		// handle (#3080, CodeRabbit feedback, re-fixed). This function can be
		// called from both the page-content-block enqueue path
		// (vk_blocks_content_enqueue_scripts()) and the regular enqueue path
		// (vk_blocks_load_scripts()); a single page combining both paths
		// would call it twice. wp_localize_script() appends to (rather than
		// overwrites) a handle's existing inline data when called more than
		// once, so without this guard the same <script> tag content would be
		// output twice (harmless but wasteful).
		//
		// The check used to look for the "var vkBlocksSliderI18n = ..."
		// string wp_localize_script() generates inside the handle's inline
		// data (strpos). That was dropped because it implicitly depends on
		// WordPress core's variable declaration format (e.g. would silently
		// break if core switched "var" to "const"/"let", or changed the
		// formatting) (CodeRabbit feedback).
		//
		// Replaced with a "processed" flag attached directly to the handle via
		// wp_scripts()'s add_data()/get_data() (a key we control ourselves,
		// with no dependence on core's generated JS text format). A plain PHP
		// static array keyed only by handle name was deliberately not used:
		// in an environment like PHPUnit where multiple test methods run in
		// the same process, once one test marks a handle name as processed, a
		// later test re-registering/deregistering the same handle name would
		// still see the stale flag (a plain PHP static persists for the
		// process's lifetime regardless of handle re-registration), wrongly
		// skipping the later test — confirmed by actually running the test
		// suite. Attaching the flag to wp_scripts() avoids this: re-registering
		// a handle via wp_register_script() makes WP_Dependencies rebuild that
		// handle's dependency object, so any previously attached flag is
		// naturally lost.
		$processed_flag_key = 'vk_blocks_slider_i18n_localized';
		if ( wp_scripts()->get_data( $handle, $processed_flag_key ) ) {
			return;
		}
		wp_scripts()->add_data( $handle, $processed_flag_key, true );
		wp_localize_script(
			$handle,
			'vkBlocksSliderI18n',
			array(
				/* translators: %1$s: start slide number, %2$s: end slide number, %3$s: total number of slides */
				'actualCountLabel' => __( 'Showing %1$s to %2$s of %3$s', 'vk-blocks' ),
			)
		);
	}
}

/**
 * スクリプトの読み込み
 */
function vk_blocks_load_scripts() {
	wp_enqueue_script( 'vk-blocks-slider', VK_BLOCKS_DIR_URL . 'build/vk-slider.min.js', array( 'vk-swiper-script' ), VK_BLOCKS_VERSION, true );
	vk_blocks_localize_slider_actual_count_label( 'vk-blocks-slider' );

	// Group Block Scrollable Extension
	wp_enqueue_script( 'vk-blocks-group-scrollable', VK_BLOCKS_DIR_URL . 'build/vk-group-scrollable.min.js', array(), VK_BLOCKS_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'vk_blocks_load_scripts' );
