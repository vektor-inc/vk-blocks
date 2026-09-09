import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import type { Browser, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { registerPostCleanup } from './utils/post-cleanup';
import { waitForSwiperInit, waitForAutoplayRunning } from './utils/swiper';

/**
 * スライダー / 投稿リストスライダー：停止/再生ボタンのラベルと翻訳（#3071）。
 * Slider / Post List Slider: the pause / play button's label and its translation (#3071).
 *
 * 【背景】
 *   停止/再生ボタンの aria-label / data-label-* は React の `save` が `__()` の実行結果を
 *   そのまま書き込んでいた。静的ブロックの save 出力は現行の save 結果とバイト単位で
 *   突き合わされるため、翻訳（languages/vk-blocks-pro-ja.po）を変更すると保存済み
 *   コンテンツが「このブロックには問題が含まれています」になってしまい、結果として
 *   文言を一切変更できない状態になっていた。
 *
 * 【Background】
 *   The pause / play button's aria-label / data-label-* used to be whatever `__()`
 *   returned at the moment React's `save` ran, written straight into the saved markup.
 *   A static block's save output is compared byte for byte against the current save
 *   result, so changing the translation (languages/vk-blocks-pro-ja.po) turned every
 *   already-saved post into "This block contains unexpected or invalid content" —
 *   which meant the wording could never be changed at all.
 *
 * 【修正後の仕様】
 *   - save 出力にはラベルを一切含めない（ボタン要素とアイコンのみ）
 *   - フロントのラベルは PHP の render_block フィルタ
 *     （inc/vk-blocks/view/slider-pause-button-label.php）が描画時に付与する
 *   - ボタンの特定はマーカー属性ではなくクラス（.swiper-pause-button）で行うため、
 *     旧バージョンで訳文が焼き付いた保存済みコンテンツも、フロント表示は現在の訳文で
 *     上書きされる
 *   - ラベルはサイトのロケールで解決される（従来は「投稿を編集した人のロケール」だった）
 *
 * 【Spec after the fix】
 *   - The save output never includes the labels at all (just the button element and icons)
 *   - The front-end label is applied at render time by a PHP render_block filter
 *     (inc/vk-blocks/view/slider-pause-button-label.php)
 *   - Buttons are matched by class (.swiper-pause-button) rather than by a marker
 *     attribute, so content saved by an older version with a stale translation baked
 *     in is also overwritten with the current translation on the front end
 *   - The label is resolved in the site's locale (previously it was locked to the
 *     locale of whoever happened to edit the post)
 *
 * 【このスペックで固定する挙動】
 *   1. 保存された post_content にラベルが焼き付かない
 *   2. フロントでは PHP が付けた data-label-* が出ており、aria-label は落ち着いた
 *      再生状態を反映している
 *   3. 押下でアクセシブルネームが「一時停止」⇔「再生」に切り替わる
 *   4. JavaScript が無効でもラベルが出ている（PHP 注入案を採った最大の理由）
 *   5. 投稿リストスライダー（Pro・動的ブロック）でも data-label-* が出ている
 *   6. サイトのロケールを切り替えると data-label-* / aria-label の訳文が切り替わる
 *   7. ラベルが焼き付いた 2 世代（1.124.0 まで / 1.125.0〜1.126.4）の保存済みコンテンツを
 *      エディタで開いてもリカバリーが不要で、投稿は dirty にならない。焼き付いた訳文が
 *      現在の訳文と一致しない場合も同様（各世代 2 パターン・計 4 件）
 *   8. 旧形式に焼き付いた古い訳文は、フロントでは現在の訳文に上書きされる
 *
 * 【Behavior pinned down by this spec】
 *   1. The saved post_content never has the label baked into it
 *   2. The front end shows the data-label-* PHP attached, and aria-label reflects the
 *      settled playback state
 *   3. Pressing the button flips the accessible name between "pause" and "play"
 *   4. The label is present even with JavaScript disabled (the main reason the PHP
 *      injection approach was chosen)
 *   5. The Post List Slider (Pro, a dynamic block) also shows the data-label-*
 *   6. Switching the site locale switches the translation of data-label-* / aria-label
 *   7. Opening a saved post with the label baked in — in either of the two generations
 *      (up to 1.124.0 and 1.125.0 through 1.126.4) — needs no recovery in the editor and
 *      does not mark the post dirty. The same holds when the baked-in wording matches no
 *      current translation (two variants per generation, four cases in total)
 *   8. A stale translation baked into legacy content is overwritten with the current
 *      translation on the front end
 *
 * 【aria-label と data-label-* の役割分担（#3071 の e2e 修正で追記）】
 *   data-label-pause / data-label-play は PHP が render 時に付与した値そのもので、
 *   view.js はこの 2 属性を読むだけで書き換えない。「PHP がラベルを付与していること」の
 *   直接証拠はこの 2 属性と、JS を無効化したケース（4）に委ねている。
 *   aria-label は view.js の updateState() が再生状態に応じて data-label-* のいずれかを
 *   書き込む値。Playwright の既定コンテキスト（@wordpress/scripts の playwright.config.js
 *   が指定する reducedMotion: 'reduce'）では、このスペックが作るスライダー（すべて
 *   autoPlay: true, pauseButton: true）は PRM 抑止（#3044）により初期化直後に自動再生が
 *   止まるため、落ち着いた後の aria-label は必ず「再生」側（Play slideshow 系の訳文）に
 *   なる。2, 5, 6, 8 の aria-label 期待値がそちら側になっているのはこのため。
 *   （このコンテキスト設定や各投稿の autoPlay/pauseButton の組み合わせを変えた場合は、
 *   この前提も合わせて見直すこと）
 *
 * 【Division of roles between aria-label and data-label-* (added in the #3071 e2e fix)】
 *   data-label-pause / data-label-play are exactly the values PHP attached at render
 *   time; view.js only reads these two attributes and never rewrites them. The direct
 *   proof that "PHP is the one applying the label" therefore rests on these two
 *   attributes and on the JS-disabled case (4). aria-label, on the other hand, is a
 *   value view.js's updateState() writes from one of the data-label-* attributes
 *   depending on the current playback state. Under Playwright's default context (set
 *   by @wordpress/scripts' playwright.config.js, which specifies reducedMotion:
 *   'reduce'), every slider this spec creates (all with autoPlay: true, pauseButton:
 *   true) has its autoplay stopped right after init by the PRM suppression (#3044), so
 *   once settled aria-label is always on the "play" side (the "Play slideshow" family
 *   of translations). That is why the aria-label expectations in cases 2, 5, 6 and 8
 *   are on that side. (If this context setting or a post's autoPlay/pauseButton
 *   combination changes, revisit this assumption too.)
 *
 * 【ブロックエディタでの検証エラーについて】
 *   当初このスペックには「deprecated の save も `__()` を実行するため、翻訳を変更した後に
 *   旧データを開くケースは原理的に救えない」と書いていたが、**これは誤りだった**。
 *   救えないのではなく、救っていなかった。deprecated の attributes で保存済みマークアップの
 *   ラベルを `source: 'attribute'` として読み、save がその実値を出力すれば、訳文が何であろうと
 *   必ず一致する（deprecated/save/index.js の `bakedPauseButtonLabelAttributes`）。
 *   ケース 7 の「訳文が現在と不一致」の 2 件がこの性質を固定している。
 *
 * 【On block editor validation errors】
 *   This header used to state that a deprecated `save` also runs `__()` and therefore
 *   "opening old data after the wording changed" could never be rescued in principle.
 *   **That was wrong** — it was not unrescuable, it simply was not being rescued. Reading the
 *   labels out of the saved markup as `source: 'attribute'` in the deprecation's attributes
 *   and emitting those actual values from `save` matches whatever the translation happens to
 *   be (see `bakedPauseButtonLabelAttributes` in deprecated/save/index.js). The two
 *   "labels matching no current translation" entries in case 7 pin that property down.
 */

const SLIDER = 'vk-blocks/slider';
const POST_LIST_SLIDER = 'vk-blocks/post-list-slider';

// 翻訳前（英語）と日本語のラベル。日本語は languages/vk-blocks-pro-ja.po の訳文。
// The untranslated (English) labels and their Japanese translations. The Japanese
// strings are the translations from languages/vk-blocks-pro-ja.po.
const LABEL_PAUSE_EN = 'Pause slideshow';
const LABEL_PLAY_EN = 'Play slideshow';
const LABEL_PAUSE_JA = 'スライドショーを一時停止';
const LABEL_PLAY_JA = 'スライドショーを再生';

// ラベルが焼き付いていた頃の保存済みマークアップ。fixture を実データとして再利用する。
// 実行時のカレントディレクトリに依存しないよう、このファイルの位置から解決する。
// The saved markup from the era when the labels were baked in, reused as real fixture
// data. Resolved from this file's own location so it does not depend on the runtime's
// current directory.
const FIXTURE_DIR = path.join(
	__dirname,
	'..',
	'e2e-tests',
	'fixtures',
	'blocks'
);

// ラベルが焼き付いた保存形式は 2 世代ある。どちらも救済できることを確認する必要がある。
//   - 1.124.0 まで: 旧クラス `swiper-container` を併記していた頃
//   - 1.125.0〜1.126.4: 旧クラス削除後。実際にリリース済みで、利用者の投稿に最も多く存在する
// 1.126.4 側の救済が抜けていたことが #3090 のレビューで見つかっているため、両方を回す。
//
// Two generations of saved markup carry baked-in labels, and both have to be rescued.
//   - up to 1.124.0: the root element still carried the legacy `swiper-container` class
//   - 1.125.0 through 1.126.4: after that class was dropped. This one actually shipped, so
//     it is the format most user content is in.
// The 1.126.4 side was found to be unrescued during the review of #3090, so both are run.
const FIXTURE_LEGACY_CLASS =
	'vk-blocks__slider__deprecated-1-124-0-pause-button.html';
const FIXTURE_CURRENT_CLASS =
	'vk-blocks__slider__deprecated-1-126-4-pause-button.html';

// 焼き付いたラベルが「いま `__()` が返す訳文」と食い違う保存済みコンテンツ。
// 上の 2 つはラベルが英語（= e2e 環境の管理画面ロケールで `__()` が返す値）のため、
// deprecated の save が `__()` でラベルを作り直していた頃でもたまたま一致してしまい、
// この修正の有無を区別できない。ラベルが現在の訳文と一致しない状態を明示的に作った
// この 2 つだけが、保存済みマークアップから実値を読む方式であることを証明する。#3071
//
// Saved content whose baked-in labels differ from whatever `__()` returns right now.
// The two above carry English labels — exactly what `__()` returns under the e2e
// environment's admin locale — so they matched even back when the deprecated save rebuilt
// the labels with `__()`, and cannot tell the fix apart from its absence. Only these two,
// which deliberately hold labels that match no current translation, prove that the values
// are read from the saved markup. #3071
const FIXTURE_LEGACY_CLASS_STALE_LABEL =
	'vk-blocks__slider__deprecated-1-124-0-stale-label.html';
const FIXTURE_CURRENT_CLASS_STALE_LABEL =
	'vk-blocks__slider__deprecated-1-126-4-stale-label.html';

const BAKED_LABEL_FIXTURES = [
	{
		label: '1.124.0 まで（旧クラスあり） / up to 1.124.0 (with the legacy class)',
		file: FIXTURE_LEGACY_CLASS,
	},
	{
		label: '1.125.0〜1.126.4（旧クラスなし） / 1.125.0 through 1.126.4 (no legacy class)',
		file: FIXTURE_CURRENT_CLASS,
	},
	{
		label: '1.124.0 まで・訳文が現在と不一致 / up to 1.124.0, labels matching no current translation',
		file: FIXTURE_LEGACY_CLASS_STALE_LABEL,
	},
	{
		label: '1.125.0〜1.126.4・訳文が現在と不一致 / 1.125.0 through 1.126.4, labels matching no current translation',
		file: FIXTURE_CURRENT_CLASS_STALE_LABEL,
	},
] as const;

// 加工して使うテストの既定 fixture。配列の並び順に依存させないよう、名前付き定数を直接指す。
// 添字で参照すると、配列を並べ替えた時に別世代を検証し始めても誰も気づけない（#3083 で
// deprecated の添字依存を排除したのと同じ理由）。
// The default fixture for the tests that transform it. It points at the named constant rather
// than an array position: an index would silently start exercising a different generation if the
// array were ever reordered (the same reason index dependency was removed from the deprecations
// in #3083).
const LEGACY_FIXTURE = FIXTURE_LEGACY_CLASS;

const createdPostIds = registerPostCleanup();

/**
 * 停止/再生ボタン付きのスライダーブロックを挿入して公開し、投稿 ID を返す。
 * Inserts and publishes a Slider block with the pause / play button, returning the post ID.
 *
 * @param admin  Admin フィクスチャ / the Admin fixture.
 * @param editor Editor フィクスチャ / the Editor fixture.
 */
const publishSliderPost = async (
	admin: Admin,
	editor: Editor
): Promise<number> => {
	await admin.createNewPost();
	await editor.insertBlock({
		name: SLIDER,
		attributes: { autoPlay: true, pauseButton: true },
		innerBlocks: [
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
		],
	});
	const postId = await editor.publishPost();
	// publishPost() は null を返し得るため、以降の URL 組み立ての前に検証する
	// publishPost() may return null, so validate it before building any URL from it.
	expect(postId).not.toBeNull();
	createdPostIds.push(postId as number);
	return postId as number;
};

/**
 * 投稿リストスライダーブロック（Pro・動的ブロック）を挿入して公開し、投稿 ID を返す。
 * Inserts and publishes a Post List Slider block (Pro, a dynamic block), returning the post ID.
 *
 * スライドに使う投稿も 2 件作成する（global-setup が全投稿を削除するため、
 * 実行時点で既存の投稿は無い前提）。1 件も無いと render callback がボタンごと
 * 出力しないため、ここを省略するとテストが「ボタンが無い」で落ちる。
 *
 * Also creates the 2 posts used as slides (global-setup deletes every post, so no
 * post is assumed to exist at this point). Without at least one post the render
 * callback omits the button entirely, so skipping this makes the test fail with
 * "no button".
 *
 * @param admin        Admin フィクスチャ / the Admin fixture.
 * @param editor       Editor フィクスチャ / the Editor fixture.
 * @param requestUtils RequestUtils フィクスチャ / the RequestUtils fixture.
 */
const publishPostListSliderPost = async (
	admin: Admin,
	editor: Editor,
	requestUtils: RequestUtils
): Promise<number> => {
	// requestUtils.createPost() は型定義が date_gmt を必須にしている（上流の型不備）ため、
	// 姉妹スペック（slider-autoplay-reduced-motion）と同様に rest() で直接作成する。
	// requestUtils.createPost()'s type definition requires date_gmt (an upstream type
	// gap), so — like the sibling spec (slider-autoplay-reduced-motion) — create the
	// post directly via rest() instead.
	for (const title of ['pause label seed A', 'pause label seed B']) {
		const seed = await requestUtils.rest({
			path: '/wp/v2/posts',
			method: 'POST',
			data: { title, content: title, status: 'publish' },
		});
		createdPostIds.push(seed.id);
	}

	await admin.createNewPost();
	await editor.insertBlock({
		name: POST_LIST_SLIDER,
		attributes: { autoPlay: true, pauseButton: true },
	});
	const postId = await editor.publishPost();
	expect(postId).not.toBeNull();
	createdPostIds.push(postId as number);
	return postId as number;
};

/**
 * 保存済み content から停止/再生ボタンのマークアップだけを抜き出す。
 * Extracts just the pause / play button's markup out of the saved content.
 *
 * content 全体に対して `not.toContain('aria-label')` を掛けると、将来スライダー内の
 * 別要素（矢印・ページネーション等）に aria-label を足した時点で、この修正とは
 * 無関係な理由で落ちてしまう。ボタン以外への aria-label 追加はアクセシビリティの
 * 改善なので、それを妨げるガードにしないため対象をボタン要素に限定する。
 *
 * Running `not.toContain('aria-label')` against the whole content would break the
 * moment an unrelated element inside the slider (an arrow, pagination, ...) gains an
 * aria-label of its own, for a reason that has nothing to do with this fix. Adding an
 * aria-label to something other than the button is an accessibility improvement, so
 * the guard is scoped to the button element to avoid standing in its way.
 *
 * @param content 保存済みの post_content / the saved post_content.
 * @return ボタン要素のマークアップ / the button element's markup.
 */
const extractPauseButtonMarkup = (content: string): string => {
	const match = content.match(
		/<button\b[^>]*\bswiper-pause-button\b[\s\S]*?<\/button>/
	);
	if (!match) {
		throw new Error(
			'保存済み content に停止/再生ボタンのマークアップが見つかりません' +
				' / The saved content does not contain the pause / play button markup'
		);
	}
	return match[0];
};

/**
 * 旧形式（ラベルが焼き付いた save 出力）をそのまま content に持つ公開済み投稿を作る。
 * Creates a published post whose content is exactly the legacy (label baked into
 * save output) markup.
 *
 * @param requestUtils      RequestUtils フィクスチャ / the RequestUtils fixture.
 * @param title             投稿タイトル / the post title.
 * @param options           省略可能な設定 / optional settings.
 * @param options.transform fixture の内容を加工する関数（省略時はそのまま使う） / a
 *                          function that transforms the fixture content (used as-is if
 *                          omitted).
 * @param options.fixture   使用する fixture のファイル名（省略時は旧クラスありの世代） /
 *                          the fixture file name to use (defaults to the generation that
 *                          still carries the legacy class).
 */
const createLegacyPost = async (
	requestUtils: RequestUtils,
	title: string,
	{
		transform = (content: string) => content,
		fixture = LEGACY_FIXTURE,
	}: {
		transform?: (_content: string) => string;
		fixture?: string;
	} = {}
): Promise<number> => {
	const content = transform(
		readFileSync(path.join(FIXTURE_DIR, fixture), 'utf8')
	);
	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title, content, status: 'publish' },
	});
	createdPostIds.push(post.id);
	return post.id;
};

/**
 * REST API で保存済みの post_content を取得する。
 * Fetches the saved post_content via the REST API.
 *
 * @param requestUtils RequestUtils フィクスチャ / the RequestUtils fixture.
 * @param postId       取得する投稿 ID / the post ID to fetch.
 */
const getSavedContent = async (
	requestUtils: RequestUtils,
	postId: number
): Promise<string> => {
	const post = await requestUtils.rest({
		path: `/wp/v2/posts/${postId}?context=edit`,
	});
	return post.content.raw as string;
};

/**
 * サイトのロケール（WPLANG）を設定する。設定が実際に反映されたことまで確認する。
 * Sets the site's locale (WPLANG), verifying that the setting actually took effect.
 *
 * 空文字を渡すと既定（en_US）に戻る。翻訳文そのものは plugin 同梱の
 * languages/vk-blocks-pro-ja.mo から読まれるが、**ロケールを設定できるかどうかは
 * コアの言語パックが入っているかに依存する**。`/wp/v2/settings` の language は
 * `get_available_languages()` に無いロケールをエラーにせず黙って捨てるため、言語パックが
 * 無い環境では WPLANG が空のまま、フロントは英語のままになる。それを「訳文が出ない」と
 * 誤読しないよう、ここで反映を確認して落とす。言語パックの導入は
 * `test/e2e/global-setup.js` が担う（手動導入は `npm run test:env:install-ja`）。
 *
 * Passing an empty string reverts to the default (en_US). The translations themselves come
 * from the plugin's bundled languages/vk-blocks-pro-ja.mo, but **whether the locale can be
 * selected at all depends on the core language pack being installed**: the `language` field of
 * `/wp/v2/settings` silently drops a locale that is not in `get_available_languages()` rather
 * than erroring, so on an environment without the pack WPLANG stays empty and the front end
 * stays English. This function verifies the change landed and fails loudly instead, so that is
 * not misread as "the translation is missing". Installing the pack is handled by
 * `test/e2e/global-setup.js` (or manually with `npm run test:env:install-ja`).
 *
 * @param requestUtils RequestUtils フィクスチャ / the RequestUtils fixture.
 * @param language     ロケールコード（例: 'ja'）。既定に戻す場合は空文字 / the locale code
 *                     (e.g. 'ja'); pass an empty string to revert to the default.
 */
const setSiteLanguage = async (
	requestUtils: RequestUtils,
	language: string
): Promise<void> => {
	const settings = await requestUtils.rest({
		path: '/wp/v2/settings',
		method: 'POST',
		data: { language },
	});

	expect(
		settings.language,
		`サイトのロケールを '${language}' に設定できませんでした。` +
			'コアの言語パックが未導入の可能性があります' +
			'（`npm run test:env:install-ja` で導入できます）。' +
			` / Could not set the site locale to '${language}'. The core language pack is` +
			' probably not installed (install it with `npm run test:env:install-ja`).'
	).toBe(language);
};

/**
 * フロントの投稿ページを開き、停止/再生ボタンのラベル関連属性を読む。
 * Opens the front-end post page and reads the pause / play button's label attributes.
 *
 * data-label-pause / data-label-play は PHP が render 時に付与した値そのもので、
 * view.js はこの 2 属性を読むだけで書き換えない。一方 aria-label は view.js の
 * updateState() が再生状態に応じて data-label-* のいずれかを書き込む値であり、
 * Playwright の既定コンテキスト（@wordpress/scripts の playwright.config.js が
 * 指定する reducedMotion: 'reduce'）では、autoPlay + pauseButton を両方 true で
 * 作ったスライダーに対して PRM 抑止（#3044）が初期化直後に自動再生を止め、
 * aria-label を「再生」側へ書き換える。
 *
 * data-label-pause / data-label-play are exactly the values PHP attached at render
 * time; view.js only reads these two attributes and never rewrites them. aria-label,
 * on the other hand, is a value view.js's updateState() writes from one of the
 * data-label-* attributes depending on the playback state. Under Playwright's default
 * context (set by @wordpress/scripts' playwright.config.js, which specifies
 * reducedMotion: 'reduce'), a slider created with both autoPlay and pauseButton true
 * has its autoplay stopped right after init by the PRM suppression (#3044), which
 * rewrites aria-label to the "play" side.
 *
 * Swiper の初期化を待たずに読むと、この書き換えが goto() の解決前に終わっている
 * かどうかにテスト結果が左右されるレースになる（#3071 で実際に踏んだ。初期化直後の
 * autoplay.running の確定タイミングは Swiper のバージョンや実行環境の負荷で前後する）。
 * ここでは初期化と PRM 抑止が完了して「落ち着いた後」の状態を待ってから読むことで、
 * 結果を決定的にする。
 *
 * Reading before Swiper's initialization settles turns into a race on whether this
 * rewrite finished before goto() resolved (this actually bit us in #3071; exactly when
 * autoplay.running settles right after init shifts with the Swiper version and the
 * runtime's load). Waiting here for initialization and the PRM suppression to finish
 * — i.e. reading the "settled" state — makes the result deterministic instead.
 *
 * したがって、この関数の戻り値のうち「PHP が付与した値そのもの」の直接証拠になる
 * のは data-label-pause / data-label-play であり、aria-label は「現在の再生状態に
 * 応じた値になっているか」の確認に使う（PHP 由来であることの証明は、JS を無効化
 * した別ケース「JavaScript が無効でもラベルが出ている」に委ねる）。
 *
 * Consequently, of this function's return value, the direct evidence that "this is
 * the exact value PHP applied" is data-label-pause / data-label-play. aria-label is
 * used only to confirm "does it match the current playback state" (proving the label
 * is PHP-sourced is left to the separate JS-disabled case, "the label is present even
 * with JavaScript disabled").
 *
 * この関数の呼び出し元はすべて PHP 側でも aria-label を出している（すなわち
 * `data-label-pause` / `data-label-play` の両方が入っている）ことを前提にしている。
 * PHP がその値を出していること自体の唯一の直接証拠は
 * test/phpunit/pro/test-slider-pause-button-label-render.php の PHPUnit であり、
 * この e2e はそれを再証明しない（Pro には JS 無効ケースの相当品が無いため）。
 *
 * Every caller of this function assumes PHP has already applied aria-label (i.e. both
 * `data-label-pause` and `data-label-play` are present). The only direct proof that
 * PHP itself emits that value is the PHPUnit suite in
 * test/phpunit/pro/test-slider-pause-button-label-render.php — this e2e spec does not
 * re-prove it (there is no JS-disabled counterpart for the Pro block).
 *
 * @param page   Page フィクスチャ / the Page fixture.
 * @param postId 表示する投稿 ID / the post ID to display.
 */
const readFrontendLabels = async (
	page: Page,
	postId: number
): Promise<{
	ariaLabel: string | null;
	labelPause: string | null;
	labelPlay: string | null;
}> => {
	await page.goto(`/?p=${postId}`);
	const button = page.locator('.swiper-pause-button');
	await expect(button).toHaveCount(1);

	// PRM 抑止による停止が完了するまで待つ。呼び出し元はいずれも
	// autoPlay: true, pauseButton: true のスライダーを作るため、既定コンテキスト
	// （reducedMotion: 'reduce'）では必ず「停止」に落ち着く。
	// Wait for the PRM suppression to finish stopping autoplay. Every caller creates a
	// slider with autoPlay: true, pauseButton: true, so under the default context
	// (reducedMotion: 'reduce') it always settles into "stopped".
	await waitForSwiperInit(page);
	await waitForAutoplayRunning(page, false);

	return {
		ariaLabel: await button.getAttribute('aria-label'),
		labelPause: await button.getAttribute('data-label-pause'),
		labelPlay: await button.getAttribute('data-label-play'),
	};
};

/**
 * 投稿をエディタで開き、スライダーブロックがパース（＝自動 migrate）されるまで待つ。
 * Opens the post in the editor and waits for the Slider block to be parsed (i.e. auto-migrated).
 *
 * @param admin  Admin フィクスチャ / the Admin fixture.
 * @param page   Page フィクスチャ / the Page fixture.
 * @param postId 開く投稿 ID / the post ID to open.
 */
const openPostWithSlider = async (
	admin: Admin,
	page: Page,
	postId: number
): Promise<void> => {
	await admin.editPost(postId);
	await page.waitForFunction(
		(blockName) =>
			window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.some((block) => block.name === blockName),
		SLIDER
	);
};

test.describe('スライダー: 停止/再生ボタンのラベルと翻訳 (#3071)', () => {
	// ロケール切り替えはテスト内の finally で必ず戻しているが、そこへ到達する前に
	// タイムアウト等で中断された場合に備えて二重に戻す。ja が残ると後続スペックが
	// 日本語 UI を引いて原因の分かりにくい失敗になるため、握りつぶさず必ず実行する。
	//
	// test.describe.configure({ mode: 'serial' }) は付けていない。同一スペック内の
	// テストは元々同じワーカーで順に走るため直列化の効果が無く、代わりに「1 件失敗
	// したら以降を skip する」挙動が付いて、他ケースの結果が見えなくなるため。
	//
	// The locale switch is always reverted in a `finally` inside the test that changes
	// it, but this reverts it a second time in case a timeout or similar interrupts
	// the test before it reaches that `finally`. Leaving the locale on ja would make
	// later specs pick up the Japanese UI and fail for a reason that is hard to trace,
	// so this is run unconditionally rather than swallowed.
	//
	// test.describe.configure({ mode: 'serial' }) is deliberately not set. Tests
	// within one spec already run in order on the same worker, so serial mode would
	// add nothing there — it would only add the "skip the rest after one failure"
	// behavior, which would hide the results of the other cases.
	test.afterAll(async ({ requestUtils }) => {
		await setSiteLanguage(requestUtils, '');
	});

	test('保存された post_content にラベルが焼き付かない', async ({
		admin,
		editor,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(admin, editor);
		const content = await getSavedContent(requestUtils, postId);

		// ボタン自体は保存されている（save から消したのはラベルだけ）
		// The button element itself is still saved; only the labels were removed from save.
		const button = extractPauseButtonMarkup(content);
		// ラベル 3 属性はいずれもボタンの保存出力に入らない。これが焼き付きの回帰ガード。
		// None of the 3 label attributes end up in the button's saved output. This is the
		// regression guard against them getting baked in again.
		expect(button).not.toContain('aria-label');
		expect(button).not.toContain('data-label-pause');
		expect(button).not.toContain('data-label-play');
		// 訳文そのものが content のどこにも入っていないことも直接確認する。
		// こちらは訳文リテラルなので、他要素へ aria-label が増えても影響を受けない。
		// Also directly confirm the translated strings themselves appear nowhere in the
		// content. Being literal strings, this check is unaffected even if aria-label is
		// later added to other elements.
		expect(content).not.toContain(LABEL_PAUSE_EN);
		expect(content).not.toContain(LABEL_PLAY_EN);
		expect(content).not.toContain(LABEL_PAUSE_JA);
		expect(content).not.toContain(LABEL_PLAY_JA);
	});

	test('フロントでは PHP が付けた data-label-* が出ており、aria-label は落ち着いた再生状態を反映する', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor);
		const labels = await readFrontendLabels(page, postId);

		// data-label-pause / data-label-play は JS が書き換えないので、PHP が
		// 付与した値そのものの証拠になる。
		// data-label-pause / data-label-play are never rewritten by JS, so they are
		// direct evidence of the exact value PHP applied.
		expect(labels.labelPause).toBe(LABEL_PAUSE_EN);
		expect(labels.labelPlay).toBe(LABEL_PLAY_EN);
		// aria-label は readFrontendLabels() が PRM 抑止の完了まで待った後の値。
		// この投稿は autoPlay: true, pauseButton: true で作っており、既定コンテキスト
		// （reducedMotion: 'reduce'）では PRM 抑止（#3044）が初期化直後に自動再生を
		// 止めるため、落ち着いた後は必ず「停止中」＝ LABEL_PLAY_EN になる。
		// この前提が崩れる変更（reducedMotion の既定値変更など）をした場合は、この
		// 期待値も合わせて見直すこと。「PHP が値を付与していること」自体の証明は
		// 上の data-label-* と、下の「JavaScript が無効でもラベルが出ている」に譲る。
		//
		// aria-label is the value after readFrontendLabels() has waited for the PRM
		// suppression to finish. This post was created with autoPlay: true,
		// pauseButton: true, so under the default context (reducedMotion: 'reduce') the
		// PRM suppression (#3044) stops autoplay right after init, and once settled it
		// is always "stopped" — i.e. LABEL_PLAY_EN. If this assumption breaks (e.g. the
		// reducedMotion default changes), revisit this expectation too. Proving "PHP is
		// what applies the value" is left to the data-label-* assertions above and to
		// the "the label is present even with JavaScript disabled" case below.
		expect(labels.ariaLabel).toBe(LABEL_PLAY_EN);
	});

	test('押下でアクセシブルネームが「一時停止」⇔「再生」に切り替わる', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor);

		// PRM: reduce だと初期化直後に自動再生が停止し、初期状態が「停止中」になる。
		// ここで見たいのは押下によるラベル遷移なので、再生中から始まる方に固定する。
		// Under PRM: reduce, autoplay stops right after init, making the initial state
		// "stopped". What this test wants to see is the transition caused by pressing
		// the button, so it pins the starting state to "playing" instead.
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto(`/?p=${postId}`);
		await waitForSwiperInit(page);
		await waitForAutoplayRunning(page, true);

		// 属性の直読みではなくアクセシブルネームで確認する。スクリーンリーダーに
		// 何と読まれるかが要件そのものなので、getByRole でその解決結果を検証する。
		// Verify via the accessible name rather than reading the raw attribute. What a
		// screen reader would announce is the requirement itself, so this checks
		// getByRole's resolved result.
		const pauseNamed = page.getByRole('button', { name: LABEL_PAUSE_EN });
		const playNamed = page.getByRole('button', { name: LABEL_PLAY_EN });

		// 再生中は「一時停止」（＝押すと何が起きるか）と読まれる
		// While playing, it is announced as "pause" (i.e. what pressing it will do).
		await expect(pauseNamed).toBeVisible();
		await expect(playNamed).toHaveCount(0);

		// 押すと停止し、名前が「再生」に変わる。
		// updateState() から data-label-* のゲートを外した変更の回帰テスト。
		// ここが壊れると、停止したのに「一時停止」と読まれ続ける（無ラベルより有害）。
		//
		// Pressing it stops playback and the name changes to "play".
		// This is the regression guard for the change that removed the data-label-*
		// gate from updateState(). If this breaks, the button keeps announcing "pause"
		// even though it is stopped — worse than having no label at all.
		await page.locator('.swiper-pause-button').click();
		await waitForAutoplayRunning(page, false);
		await expect(playNamed).toBeVisible();
		await expect(pauseNamed).toHaveCount(0);

		// もう一度押すと再生に戻り、名前も元に戻る
		// Pressing it again resumes playback and the name reverts too.
		await page.locator('.swiper-pause-button').click();
		await waitForAutoplayRunning(page, true);
		await expect(pauseNamed).toBeVisible();
		await expect(playNamed).toHaveCount(0);
	});

	test('JavaScript が無効でもラベルが出ている', async ({
		admin,
		editor,
		browser,
	}) => {
		const postId = await publishSliderPost(admin, editor);

		// PHP 注入案を採った最大の理由（アクセシブルネームを JS の成否に賭けない）を
		// 直接固定する。案 A（view.js が wp.i18n でラベルを付ける）だと、ここは
		// 無名ボタンになって落ちる。
		//
		// Directly pins down the main reason the PHP injection approach was chosen: the
		// accessible name must not depend on JS succeeding. Under option A (view.js
		// applying the label via wp.i18n), this case would end up with an unnamed
		// button and fail.
		//
		// `browser` フィクスチャ（テストランナー提供）経由の `newContext()` は、
		// playwright.config.ts の `use` セクションのオプションを継承する。ここで上書きして
		// いるのは `javaScriptEnabled` だけで、相対 URL は `use.baseURL` で解決される。
		// （継承は playwright 1.60 時点では `_setupArtifacts` フィクスチャが
		// `runBeforeCreateBrowserContext` で `use` の値を後入れマージすることによる。
		// private API なので裏取りの参考程度に。既に指定済みのキーは上書きされない）
		//
		// ⚠️ `baseURL` をここへ明示的に渡す必要は無い（#3071 の CodeRabbit レビューで
		// 「継承されない」という指摘を受けたが、それが当てはまるのは `chromium.launch()` で
		// 手動起動した browser の場合）。また、同じ経路で `storageState`（管理者ログイン
		// 状態）・`reducedMotion`・`locale` なども継承されているため、`baseURL` だけを明示
		// しても手動起動へ切り替えた際の事故は防げない。1 つだけ明示すると「明示してあるから
		// 安全」という誤解を生む。
		//
		// `newContext()` on the `browser` fixture (provided by the test runner) inherits the
		// options from the `use` section of playwright.config.ts. The only option overridden
		// here is `javaScriptEnabled`; relative URLs resolve against `use.baseURL`. (As of
		// playwright 1.60 the inheritance comes from the `_setupArtifacts` fixture merging the
		// `use` values in via `runBeforeCreateBrowserContext` — a private API, so treat this as
		// a pointer for verification. Keys already present are left alone.)
		//
		// ⚠️ There is no need to pass `baseURL` explicitly here. (The CodeRabbit review on
		// #3071 claimed it is not inherited; that applies to a browser launched manually with
		// `chromium.launch()`.) The same path also carries `storageState` (the logged-in admin
		// state), `reducedMotion` and `locale`, so pinning only `baseURL` would not prevent the
		// breakage that switching to a manual launch would cause — it would just create false
		// confidence.
		const context = await (browser as Browser).newContext({
			javaScriptEnabled: false,
		});
		try {
			const jsDisabledPage = await context.newPage();
			await jsDisabledPage.goto(`/?p=${postId}`);
			const button = jsDisabledPage.locator('.swiper-pause-button');
			await expect(button).toHaveCount(1);
			await expect(button).toHaveAttribute('aria-label', LABEL_PAUSE_EN);
			await expect(button).toHaveAttribute(
				'data-label-pause',
				LABEL_PAUSE_EN
			);
			await expect(button).toHaveAttribute(
				'data-label-play',
				LABEL_PLAY_EN
			);
		} finally {
			await context.close();
		}
	});

	test('投稿リストスライダー（Pro）でも data-label-* が出ており、aria-label は落ち着いた再生状態を反映する', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			requestUtils
		);

		// 投稿リストスライダーは動的ブロックで、index.php からラベル生成を撤去した結果、
		// ボタンの data-label-* は render_block フィルタに完全に依存している。
		// ここが通らないとボタンは恒久的に無名（WCAG 4.1.2 違反）になる。
		//
		// The Post List Slider is a dynamic block, and removing the label generation
		// from its index.php means the button's data-label-* now depends entirely on
		// the render_block filter. If this case fails, the button ends up permanently
		// unnamed (a WCAG 4.1.2 violation).
		const labels = await readFrontendLabels(page, postId);

		expect(labels.labelPause).toBe(LABEL_PAUSE_EN);
		expect(labels.labelPlay).toBe(LABEL_PLAY_EN);
		// aria-label は落ち着いた再生状態を反映する値。この投稿も autoPlay: true,
		// pauseButton: true で作っているため、既定コンテキスト（reducedMotion: 'reduce'）
		// の PRM 抑止により落ち着いた後は必ず「停止中」＝ LABEL_PLAY_EN になる
		// （理由は readFrontendLabels() の docblock を参照）。
		//
		// aria-label reflects the settled playback state. This post was also created
		// with autoPlay: true, pauseButton: true, so under the default context's PRM
		// suppression (reducedMotion: 'reduce') it always settles into "stopped" — i.e.
		// LABEL_PLAY_EN (see readFrontendLabels()'s docblock for the reasoning).
		expect(labels.ariaLabel).toBe(LABEL_PLAY_EN);
	});

	test('サイトのロケールを切り替えるとフロントのラベルが切り替わる', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(admin, editor);

		// 保存時点（英語ロケール）の post_content にはラベルが入っていない
		// At save time (English locale) the post_content carries no label at all.
		const content = await getSavedContent(requestUtils, postId);
		expect(extractPauseButtonMarkup(content)).not.toContain('aria-label');

		// ⚠️ WPLANG はサイト全体のグローバル設定なので、ja のまま別のテストが走ると
		// 日本語 UI を引いて原因の分かりにくい失敗になる。afterAll だけに任せず、
		// このテストの中で必ず戻す（finally）ことで ja である区間をここに閉じ込める。
		// なお Playwright の workers は @wordpress/scripts の既定設定（workers: 1）を
		// playwright.config.ts がそのまま継承しており、スペックが並列実行されることは
		// 現状ない。この finally はその設定が将来変わった場合の保険でもある。
		//
		// ⚠️ WPLANG is a site-wide global setting, so if it stayed on ja another test
		// would pick up the Japanese UI and fail for a reason that is hard to trace.
		// Rather than relying solely on afterAll, this test reverts it itself in a
		// `finally`, confining the ja window to right here. Playwright's workers
		// setting is inherited as-is from @wordpress/scripts' default (workers: 1) via
		// playwright.config.ts, so specs do not currently run in parallel; this
		// `finally` is also a safety net in case that setting ever changes.
		let labels;
		try {
			await setSiteLanguage(requestUtils, 'ja');
			labels = await readFrontendLabels(page, postId);
		} finally {
			await setSiteLanguage(requestUtils, '');
		}

		// 保存内容を一切変えていないのに、フロントの文言だけが切り替わる。
		// ＝ ラベルが保存済み HTML ではなく描画時に解決されていることの証明。
		// The saved content was never touched, yet only the front-end wording changes.
		// This is the proof that the label is resolved at render time, not baked into
		// the saved HTML.
		expect(labels.labelPause).toBe(LABEL_PAUSE_JA);
		expect(labels.labelPlay).toBe(LABEL_PLAY_JA);
		// aria-label は落ち着いた再生状態（この投稿も autoPlay: true, pauseButton: true
		// なので既定コンテキストの PRM 抑止で必ず「停止中」に落ち着く）を、
		// 切り替え後のロケールの訳文で反映したもの。
		//
		// aria-label reflects the settled playback state (this post was also created
		// with autoPlay: true, pauseButton: true, so it always settles into "stopped"
		// under the default context's PRM suppression), expressed in the translation
		// of the locale it was switched to.
		expect(labels.ariaLabel).toBe(LABEL_PLAY_JA);
	});

	for (const { label, file } of BAKED_LABEL_FIXTURES) {
		test(`旧形式（ラベル焼き付きあり: ${label}）を開いてもリカバリー不要・投稿は dirty にならない`, async ({
			admin,
			page,
			requestUtils,
		}) => {
			const postId = await createLegacyPost(
				requestUtils,
				`pause button labels: legacy content (${file})`,
				{ fixture: file }
			);
			await openPostWithSlider(admin, page, postId);

			const state = await page.evaluate((blockName) => {
				const { select } = window.wp.data;
				const slider = select('core/block-editor')
					.getBlocks()
					.find((block) => block.name === blockName);
				if (!slider) {
					throw new Error(
						`${blockName} ブロックが見つかりません（openPostWithSlider で待ってから呼んでください）`
					);
				}
				return {
					isValid: slider.isValid,
					isDirty: select('core/editor').isEditedPostDirty(),
					pauseButton: slider.attributes.pauseButton ?? null,
				};
			}, SLIDER);

			// deprecated/save/1.124.0 と deprecated/save/1.126.4 がそれぞれ当時の出力を
			// 再現するため valid のまま。
			// deprecated/save/1.124.0 and deprecated/save/1.126.4 each reproduce the output
			// of their era, so the block stays valid.
			expect(state.isValid).toBe(true);
			// 開くだけでは「変更あり」にしない（離脱警告・意図しないリビジョンを出さない）
			// Merely opening it must not mark it as "changed" (no leave-page warning, no
			// unintended revision).
			expect(state.isDirty).toBe(false);
			// 設定が失われていない
			// The setting is not lost.
			expect(state.pauseButton).toBe(true);
		});
	}

	test('旧形式に焼き付いた古い訳文は、フロントでは現在の訳文に上書きされる', async ({
		page,
		requestUtils,
	}) => {
		// 「翻訳を変更した後」を再現するため、保存済みマークアップのラベルだけを
		// 過去の訳文に見立てた別文字列へ置き換える。
		// To reproduce "after the translation changed", replace only the labels in the
		// saved markup with a different string standing in for a past translation.
		//
		// この 1 件はテスト 7 と違い 1 世代（1.124.0 まで）でのみ回す。ラベル付与は PHP が
		// クラス `swiper-pause-button` で拾って行い、ボタンのマークアップは 2 世代で同一の
		// ため、世代を変えても通る経路が同じで冗長になるからである。世代差が出るのは
		// ブロック検証（＝テスト 7）だけ。
		// Unlike test 7 this one runs against a single generation (up to 1.124.0). PHP attaches
		// the labels by matching the class `swiper-pause-button`, and the button markup is
		// identical across both generations, so another generation would exercise the very same
		// code path. The generations only differ for block validation, which is test 7's job.
		const postId = await createLegacyPost(
			requestUtils,
			'pause button labels: stale translation',
			{
				transform: (content) => {
					// 置換件数を検証せずに進むと、fixture が将来変わって置換対象の文字列が
					// 0 件になった場合でも黒白判定できない。その場合このテストは「古い訳文が
					// 存在しない HTML」を投入し、「古い訳文が出ていない」ことを確認するだけの
					// 空振りになり、本来検証したい「上書きされる」動作を一切見ないまま
					// パスしてしまう。置換前に件数を数え、1 件以上あることを確認してから
					// 置換する（CodeRabbit の指摘 #3090 review 対応）。
					//
					// Proceeding without checking the replacement count would make this
					// pass/fail undecidable if the fixture ever changes so that the target
					// strings no longer appear. In that case the test would feed in "HTML
					// with no stale translation at all" and merely confirm "the stale
					// translation is absent" — passing without ever exercising the
					// "overwritten" behavior it is meant to verify. Count the occurrences
					// before replacing and assert there is at least one of each, then
					// replace (addresses CodeRabbit's review comment on #3090).
					const pauseMatches =
						content.match(/Pause slideshow/g) ?? [];
					const playMatches = content.match(/Play slideshow/g) ?? [];
					expect(
						pauseMatches.length,
						'fixture に "Pause slideshow" が見つかりません（置換対象が無いとこのテストは空振りします）' +
							' / The fixture does not contain "Pause slideshow" (with nothing to replace, this test would pass vacuously)'
					).toBeGreaterThan(0);
					expect(
						playMatches.length,
						'fixture に "Play slideshow" が見つかりません（置換対象が無いとこのテストは空振りします）' +
							' / The fixture does not contain "Play slideshow" (with nothing to replace, this test would pass vacuously)'
					).toBeGreaterThan(0);

					return content
						.replace(/Pause slideshow/g, 'OLD PAUSE LABEL')
						.replace(/Play slideshow/g, 'OLD PLAY LABEL');
				},
			}
		);

		const labels = await readFrontendLabels(page, postId);

		// 保存済みの古い訳文は表示されず、現在の訳文で上書きされる。
		// マーカー属性方式ではなくクラス指定方式を採った理由そのもの。
		// The stale translation baked into the saved content is never shown; it is
		// overwritten with the current translation. This is the whole reason the
		// buttons are matched by class rather than by a dedicated marker attribute.
		expect(labels.labelPause).toBe(LABEL_PAUSE_EN);
		expect(labels.labelPlay).toBe(LABEL_PLAY_EN);
		// aria-label も落ち着いた再生状態（この fixture も autoPlay: true,
		// pauseButton: true なので PRM 抑止で必ず「停止中」に落ち着く）を、
		// 上書き後の現在の訳文で反映したもの。
		//
		// aria-label likewise reflects the settled playback state (this fixture was
		// also created with autoPlay: true, pauseButton: true, so it always settles
		// into "stopped" under the PRM suppression), expressed in the current
		// translation after the overwrite.
		expect(labels.ariaLabel).toBe(LABEL_PLAY_EN);

		// 古い訳文がページのどこにも残っていないことを、描画後の HTML 全体で確認する。
		//
		// ⚠️ ここを `expect(page.locator('body')).not.toContainText('OLD PAUSE LABEL')` と
		// 書いてはいけない。`toContainText` は要素の textContent を見るが、この訳文は
		// aria-label / data-label-* という**属性値にしか入らない**ため、上書きが失敗しても
		// 必ず成功してしまう空振りの検証になる（CodeRabbit の指摘 #3090 review 対応）。
		//
		// 対象はボタン 1 個の属性ではなく HTML 全体にする。現在の fixture では旧訳文は
		// 単一ボタンの 3 属性にしかなく、readFrontendLabels がその 3 つを厳密一致で見ている
		// ため、いまはこの検証は実質的に冗長である。fixture が将来変わって別の場所に旧訳文が
		// 入った場合の保険として置いている（実行コストも不安定さも増えない）。
		//
		// Assert against the whole rendered HTML that the stale translation survives nowhere.
		//
		// ⚠️ Do NOT write this as
		// `expect(page.locator('body')).not.toContainText('OLD PAUSE LABEL')`:
		// `toContainText` inspects an element's textContent, but this string only ever lives in
		// the aria-label / data-label-* ATTRIBUTES, so such an assertion passes even when the
		// overwrite fails — a vacuous check (addresses CodeRabbit's review comment on #3090).
		//
		// The subject is the whole HTML rather than the one button's attributes. With the current
		// fixture the stale label only ever lives in a single button's three attributes, which
		// readFrontendLabels already checks by exact match, so today this is effectively
		// redundant. It is kept as insurance for a future fixture that puts the stale label
		// somewhere else — it costs no runtime and adds no flakiness.
		const html = await page.content();
		expect(html).not.toContain('OLD PAUSE LABEL');
		expect(html).not.toContain('OLD PLAY LABEL');
	});
});
