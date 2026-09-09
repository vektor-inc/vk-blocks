const { execFileSync } = require('child_process');
const path = require('path');
const { request } = require('@playwright/test');
const { RequestUtils } = require('@wordpress/e2e-test-utils-playwright');

// `.wp-env.tests.json` があるリポジトリルート。このファイルは test/e2e/ にあるので 2 つ上。
//
// playwright の `FullConfig.rootDir` を使ってはいけない。あれは「設定ファイルのある
// ディレクトリ」ではなく **全 testDir の共通ルート** で、この設定では `testDir: './test/e2e'`
// のため `<repo>/test/e2e` になる。そこを cwd にすると相対パスの `--config` が
// `<repo>/test/e2e/.wp-env.tests.json` を指して必ず解決に失敗する（実際に一度作り込んだ）。
//
// The repository root, where `.wp-env.tests.json` lives. This file sits in test/e2e/, so it is
// two levels up.
//
// Do NOT use playwright's `FullConfig.rootDir` here: that is the common root of all testDirs,
// not the directory holding the config file. With `testDir: './test/e2e'` it resolves to
// `<repo>/test/e2e`, and using it as the cwd makes the relative `--config` point at
// `<repo>/test/e2e/.wp-env.tests.json`, which never resolves (this was actually built once).
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// テスト環境のプラグイン名。`.wp-env.tests.json` が `"plugins": ["."]` を指定しているため、
// wp-env が使うプラグインの basename はチェックアウト先のディレクトリ名と一致する。
// worktree ではディレクトリ名が変わり得るので、決め打ちせずルートから導出する。
//
// The plugin slug in the test environment. `.wp-env.tests.json` declares `"plugins": ["."]`, so
// the basename wp-env uses is the checkout directory's name. That name differs in a worktree, so
// derive it from the root instead of hard-coding it.
const PLUGIN_SLUG = path.basename(REPO_ROOT);

// wp-env の実行ファイルの絶対パス。
//
// `npx wp-env` を起動する形にしてはいけない。Windows では `npx` が `npx.cmd` のため
// `execFile` から直接起動できず `shell: true` が必要になるが、shell 経由では引数が
// エスケープされずに連結される（Node の DEP0190）。この関数には `PLUGIN_SLUG` のような
// ディレクトリ名由来の非リテラルを渡すため、空白を含む名前で引数が割れたり、`&` を含む
// 名前で別のコマンドが実行され得る。実行ファイルを Node で直接起動すれば shell は不要で、
// 引数配列がそのまま渡る。
//
// `bin/wp-env` は package.json の `exports` に無く `require.resolve` で直接引けないため、
// 引ける `package.json` から `bin` フィールド経由で解決する。パスを決め打ちしないので
// npm の巻き上げ位置が変わっても追従する。
//
// The absolute path to wp-env's executable.
//
// Do NOT invoke this as `npx wp-env`. On Windows `npx` is `npx.cmd`, which `execFile` cannot
// spawn directly, so it would need `shell: true` — and going through a shell concatenates the
// arguments without escaping them (Node's DEP0190). This function is handed non-literals such
// as `PLUGIN_SLUG`, which comes from a directory name, so a name containing a space would split
// into extra arguments and one containing `&` could run another command. Launching the
// executable with Node directly needs no shell and passes the argument array through as is.
//
// `bin/wp-env` is absent from package.json's `exports` and cannot be required directly, so it
// is resolved through the `bin` field of the `package.json`, which can be. Nothing is
// hard-coded, so this follows npm wherever it hoists the package.
const WP_ENV_PACKAGE_JSON = require.resolve('@wordpress/env/package.json');

// npm は `bin` を「名前→パス」の対応表としても、実行ファイル 1 本だけの文字列ショートハンド
// （`"bin": "bin/wp-env"`）としても許す。対応表決め打ちで書くと、上流が後者へ変わった日に
// `path.join()` へ undefined が渡り、`ERR_INVALID_ARG_TYPE` が globalSetup の読み込み時点で
// 出る。落ちること自体は健全だが、エラーが `path.join` を指すため wp-env の話だと分からない。
// 両方の形を受け、解決できなければ理由を述べて落とす。
//
// npm allows `bin` to be either a name-to-path map or, for a package with a single executable,
// the string shorthand (`"bin": "bin/wp-env"`). Assuming the map means that the day upstream
// switches to the shorthand, `path.join()` gets undefined and throws ERR_INVALID_ARG_TYPE while
// this module is still loading — sound enough as a failure, but the error points at `path.join`
// and never mentions wp-env. Accept both shapes and fail with a reason when neither resolves.
const wpEnvBinField = require(WP_ENV_PACKAGE_JSON).bin;
const wpEnvBinRelativePath =
	typeof wpEnvBinField === 'string'
		? wpEnvBinField
		: wpEnvBinField?.['wp-env'];

if (!wpEnvBinRelativePath) {
	throw new Error(
		`wp-env の実行ファイルを ${WP_ENV_PACKAGE_JSON} の bin フィールドから解決できませんでした。` +
			' @wordpress/env の bin の形が変わった可能性があります。' +
			` / Could not resolve wp-env's executable from the bin field of ${WP_ENV_PACKAGE_JSON};` +
			" the shape of @wordpress/env's bin may have changed."
	);
}

const WP_ENV_BIN = path.join(
	path.dirname(WP_ENV_PACKAGE_JSON),
	wpEnvBinRelativePath
);

/**
 * テスト環境の WP-CLI をひと呼び分だけ実行する。
 * Runs a single WP-CLI command against the test environment.
 *
 * @param {string[]} args    `wp` に続けて渡す引数 / the arguments following `wp`.
 * @param {number}   timeout ミリ秒の上限 / the cap in milliseconds.
 */
function runWpCli(args, timeout) {
	execFileSync(
		process.execPath,
		[
			WP_ENV_BIN,
			'run',
			'cli',
			'--config',
			'.wp-env.tests.json',
			'wp',
			...args,
		],
		{
			stdio: 'inherit',
			// `--config` は相対パスなので、playwright を別ディレクトリから起動されても
			// 同じファイルを指すよう、リポジトリルートを明示する。
			// `--config` is relative, so pin the repository root to keep it pointing at the
			// same file even when playwright is launched from another directory.
			cwd: REPO_ROOT,
			// shell を通さないことがこの呼び出しの安全性の要。上の WP_ENV_BIN のコメントを参照。
			// Not going through a shell is what makes this call safe — see the comment on
			// WP_ENV_BIN above.
			shell: false,
			// 応答が返らないまま同期呼び出しでブロックすると、playwright からは中断できず
			// e2e 全体が固まる。必ず上限を設ける。
			// A hung call would block this synchronous call with no way for playwright to
			// abort it, freezing the whole run. Always cap it.
			timeout,
		}
	);
}

/**
 * テスト対象のプラグインが有効化されていることを保証する。
 *
 * `.wp-env.tests.json` の `"plugins": ["."]` により wp-env は起動時にプラグインを
 * 有効化するが、**それを行う `configureWordPress()` は毎回は走らない**。
 * `node_modules/@wordpress/env/lib/runtime/docker/index.js` が
 * 「設定が変わった時だけ」に絞っているため、`wp-env clean`（reset）や初回インストールでは
 * 有効化されるものの、**普通の `wp-env start` の再実行では走らない**。
 *
 * そのため何かの拍子（PHP fatal による自動無効化、DB だけ古い状態など）でプラグインが
 * 無効になると、誰も復旧させないまま全スペックが `publishPost()` のタイムアウトで落ちる。
 * 原因がタイムアウトの山に埋もれて分からなくなるため、ここで先に有効化しておく。
 * 有効化済みの場合、WP-CLI は警告を出すだけで成功終了する。
 *
 * Makes sure the plugin under test is active.
 *
 * `.wp-env.tests.json` declares `"plugins": ["."]`, so wp-env activates the plugin on setup —
 * but the `configureWordPress()` that does so does NOT run every time.
 * `node_modules/@wordpress/env/lib/runtime/docker/index.js` gates it on the configuration
 * having changed, so a `wp-env clean` (reset) or a first install activates the plugin while a
 * plain re-run of `wp-env start` does not.
 *
 * If the plugin then ends up deactivated for any reason (a PHP fatal auto-deactivating it, a
 * stale database, ...), nothing puts it back and every spec fails on a `publishPost()` timeout
 * instead, burying the cause under a pile of timeouts. Activating here up front avoids that.
 * WP-CLI merely warns and exits successfully when the plugin is already active.
 */
function activatePluginUnderTest() {
	try {
		// この呼び出しはセッション最初の `docker compose run` にあたり、コンテナが冷えている分
		// 最も遅い。タイムアウトは `execFileSync` が投げる点で言語パック側と同じだが、
		// 向こうは catch して警告で流すのに対しこちらは下の catch で throw し直すため、
		// 上限が短いと「Docker が遅かっただけ」を「プラグインを有効化できなかった」と
		// 誤って報告し、全スペックを止めてしまう。言語パック側と同じ 120 秒を確保する。
		//
		// This is the session's first `docker compose run` and therefore the slowest, with a
		// cold container. A timeout throws out of `execFileSync` here exactly as it does for the
		// language pack — the difference is what happens next: that call catches it and warns,
		// while the catch below rethrows. So too tight a cap would report "could not activate
		// the plugin" for what was merely a slow Docker and abort every spec. Budget the same
		// 120 seconds as the language-pack call.
		runWpCli(['plugin', 'activate', PLUGIN_SLUG], 120000);
	} catch (error) {
		// 言語パックと違い、これは全スペックの前提。警告で流すと原因不明のタイムアウトが
		// 大量に出るだけなので、ここで明示的に止める。
		// Unlike the language pack, this is a precondition for every spec. Letting it through
		// as a warning would only produce a pile of unexplained timeouts, so fail loudly here.
		throw new Error(
			`テスト対象のプラグイン '${PLUGIN_SLUG}' を有効化できませんでした。` +
				'この状態では全スペックが publishPost() のタイムアウトで落ちます。' +
				` / Could not activate the plugin under test ('${PLUGIN_SLUG}'). ` +
				'Every spec would fail on a publishPost() timeout in this state. ' +
				`(${error.message})`
		);
	}
}

/**
 * コアの日本語言語パックをテスト環境へ導入する。
 *
 * サイトのロケールを切り替えるスペック（例: slider-pause-button-i18n）は、コアの言語パックが
 * 入っていないと必ず落ちる。`/wp/v2/settings` の `language` は `get_available_languages()` に
 * 無いロケールをエラーにせず黙って捨てるため、WPLANG が空のままフロントが英語で描画されるからだ。
 *
 * ここで導入するのは、置き場所として次の 2 つが不適切なため。
 *   - `test:env:start`（npm script）: PHPUnit の CI が `npm run test:env:start -- --update` で
 *     呼んでおり、`&&` で繋ぐと `--update` が後段のコマンドへ流れて wp-env に届かなくなる。
 *     さらに PHPUnit が使いもしない言語パックのダウンロード可否に CI の成否が左右される
 *   - playwright の `webServer`: ポートの待ち受けで解決するためダウンロード完了を待たない。
 *     加えて `reuseExistingServer` が効くと、環境が既に起動していればコマンド自体が走らない
 *
 * globalSetup は webServer 起動後・テスト実行前に同期的に走るため、この 2 つを同時に満たす。
 *
 * 導入に失敗しても、ここでは警告に留めてテストは続行する。ネットワークの一時的な不調で
 * 全スペックを落とさないためで、ロケールに依存するスペックは各々の検証で
 * 「言語パックが未導入の可能性がある」と明示して落ちる。
 *
 * Installs the core Japanese language pack into the test environment.
 *
 * Specs that switch the site locale (e.g. slider-pause-button-i18n) always fail without it: the
 * `language` field of `/wp/v2/settings` silently drops a locale missing from
 * `get_available_languages()` rather than erroring, leaving WPLANG empty and the front end English.
 *
 * It lives here because neither alternative works:
 *   - the `test:env:start` npm script: the PHPUnit CI invokes it as
 *     `npm run test:env:start -- --update`, and chaining with `&&` sends `--update` to the second
 *     command instead of wp-env. It would also tie that CI job to the availability of a language
 *     pack PHPUnit never uses
 *   - playwright's `webServer`: it resolves on the port accepting connections, so it does not wait
 *     for the download; and with `reuseExistingServer` the command is skipped entirely when the
 *     environment is already up
 *
 * globalSetup runs after the web server is up and before any test, synchronously, so it satisfies both.
 *
 * A failure here is only warned about, not thrown: a transient network problem should not take down
 * every spec, and the locale-dependent specs fail on their own checks with a message pointing at
 * the missing language pack.
 */
function installJapaneseLanguagePack() {
	try {
		runWpCli(['language', 'core', 'install', 'ja'], 120000);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn(
			'コアの日本語言語パックを導入できませんでした。サイトのロケールを切り替える' +
				'テストは失敗します（`npm run test:env:install-ja` で手動導入できます）。' +
				' / Could not install the core Japanese language pack; tests that switch the' +
				' site locale will fail (install it manually with `npm run test:env:install-ja`).',
			error.message
		);
	}
}

async function globalSetup(config) {
	const { storageState, baseURL } = config.projects[0].use;
	const storageStatePath =
		typeof storageState === 'string' ? storageState : undefined;

	activatePluginUnderTest();
	installJapaneseLanguagePack();

	const requestContext = await request.newContext({
		baseURL,
	});

	const requestUtils = new RequestUtils(requestContext, {
		storageStatePath,
	});

	// Authenticate and save the storageState to disk.
	await requestUtils.setupRest();

	// Reset the test environment before running the tests.
	await Promise.all([
		requestUtils.activateTheme('twentytwentyfive'),
		requestUtils.deleteAllPosts(),
		requestUtils.deleteAllBlocks(),
		requestUtils.resetPreferences(),
	]);

	await requestContext.dispose();
}

module.exports = globalSetup;
