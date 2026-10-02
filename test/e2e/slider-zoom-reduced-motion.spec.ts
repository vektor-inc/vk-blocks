import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { registerPostCleanup } from './utils/post-cleanup';
import { waitForSwiperInit } from './utils/swiper';

/**
 * スライダー：背景ズームと prefers-reduced-motion（PRM）の関係。issue #3082。
 *
 * 自動再生の停止は #3044 で PRM に追随するようになったが、背景ズームだけは
 * ガードが無く動き続けていた（スライドの切り替えは止まっているのに背景だけ動く）。
 *
 * 修正後の仕様:
 *  - PRM: reduce → 背景は初期倍率のまま静止する。背景画像自体は表示されたまま
 *  - PRM: no-preference → 従来どおりズームが再生される
 *
 * ⚠️ @wordpress/scripts の Playwright 既定コンテキストは reducedMotion: 'reduce' なので、
 * 何も指定しなければ PRM 有効側になる。どちらのケースも emulateMedia で明示する。
 *
 * 【ズーム CSS の出どころが 2 つあることと、各ケースが何を弁別するか】
 *
 * ズーム CSS は 2 か所から出る。どちらを見ているのかでケースの意味が変わるため、
 * 追加・変更時はここを踏まえること。
 *
 *  (a) 本文の `<style>`（保存マークアップ）: index.js の blocks.getSaveElement が出す
 *  (b) `<head>` の `<style>`: view.js が表示時に差し込む
 *
 * 修正は (a)(b) 双方に入っている。(a) は最終倍率を `no-preference` で包み、
 * (b) はそれに加えて `reduce` で初期倍率を `!important` で上書きする。
 * (b) の `reduce` ブロックが要るのは **修正前に保存された投稿** のためで、そちらの本文には
 * 包まれていない最終倍率が残り続ける（本文の `<style>` は後から `<head>` へ足す
 * (b) より後勝ちなので、`!important` でしか打ち消せない）。
 *
 * したがって:
 *  - 現行形式（`insertBlock` で作る投稿）のケースは (a) だけでも成立してしまい、
 *    (b) の `reduce` ブロックを消しても落ちない。既定値のままだと基本規則の
 *    `scale(1)` が残るので「等倍」の確認にすらならないため、カスタム倍率で測る
 *    （＝ `reduce` 側が初期倍率を決め打ちしていないことを弁別する）
 *  - **(b) の `reduce` ブロックそのものを固定しているのは旧形式（1.121.1）のケースだけ。**
 *    あのケースは本文に包まれていない `scale(2.5)` を持つ投稿を実際に開くので、
 *    `reduce` ブロックを 1 行でも削れば `2.5` が通って落ちる
 *
 * Where the zoom CSS comes from, and what each case actually pins down.
 *
 * There are two sources: (a) the `<style>` in the saved markup, emitted by
 * blocks.getSaveElement in index.js, and (b) the `<style>` view.js appends to `<head>`
 * at display time. The fix touches both: (a) wraps the final scale in `no-preference`,
 * and (b) additionally re-asserts the initial scale under `reduce` with `!important`.
 * That `reduce` block exists for posts saved *before* the fix, whose content still
 * carries an unguarded final scale — and since a `<style>` in the content wins over
 * (b), only `!important` can neutralize it.
 *
 * So the current-format cases would still pass on (a) alone even if (b)'s `reduce`
 * block were deleted; they use a custom scale so they at least prove the reduce branch
 * does not hard-code the initial scale. The legacy (1.121.1) case is the one that pins
 * down (b)'s `reduce` block: it loads a real post carrying an unguarded `scale(2.5)`,
 * so removing that block lets `2.5` through and the case fails.
 */

// 旧形式の保存済みマークアップを実データとして再利用する。実行時のカレント
// ディレクトリに依存しないよう、このファイルの位置から解決する。
const FIXTURE_DIR = path.join(
	__dirname,
	'..',
	'e2e-tests',
	'fixtures',
	'blocks'
);
const readFixture = (name: string): string =>
	readFileSync(path.join(FIXTURE_DIR, name), 'utf8');

// 1.121.1 形式で「ズーム有効・初期倍率 1.5・最終倍率 2.5」で保存された投稿の fixture。
// 本文の <style> は @media で包まれていない（＝修正前に出荷された形）。
const LEGACY_ZOOM_FIXTURE =
	'vk-blocks__slider__deprecated-1-121-1-zoom-custom-scale.html';
// 上の fixture が持つ倍率。fixture 側を変えたらここも合わせること
const LEGACY_INITIAL_SCALE = 1.5;
const LEGACY_FINAL_SCALE = 2.5;

const createdPostIds = registerPostCleanup();

// スライドの背景画像。ズームは ::before の背景に効くため、背景画像が消えていないことも
// 併せて確認できるよう実画像の URL を入れる（読み込み結果ではなく算出値だけを見る）。
const BG_IMAGE =
	'https://www.vektor-inc.co.jp/wp-content/uploads/2020/08/vk-blocks-logo_og.png';

// 画面幅ごとに別の指定を持つため、3 つとも入れておく（fixture と同じ揃え方）
const bgImageAttributes = {
	bgImage: BG_IMAGE,
	bgImageTablet: BG_IMAGE,
	bgImageMobile: BG_IMAGE,
};

/**
 * ズーム有効・背景画像ありのスライダーブロックを挿入して公開し、投稿 ID を返す。
 *
 * @param admin                       Admin フィクスチャ
 * @param editor                      Editor フィクスチャ
 * @param zoomScales                  倍率の指定。省略時は block.json の既定値
 * @param zoomScales.zoomInitialScale 初期倍率（既定 1）
 * @param zoomScales.zoomFinalScale   最終倍率（既定 1.25）
 */
const publishZoomSliderPost = async (
	admin: Admin,
	editor: Editor,
	zoomScales: { zoomInitialScale?: number; zoomFinalScale?: number } = {}
): Promise<number> => {
	await admin.createNewPost();
	// 自動再生は切っておく。ズームは「アクティブなスライド」に効くもので、自動再生が
	// 動いているとアクティブが入れ替わるたびに測定対象が変わってしまう。また自動再生の
	// PRM 対応（#3044）は別スペックで固定済みなので、ここではズームだけを見る。
	await editor.insertBlock({
		name: 'vk-blocks/slider',
		attributes: { zoomAnimation: true, autoPlay: false, ...zoomScales },
		innerBlocks: [
			{ name: 'vk-blocks/slider-item', attributes: bgImageAttributes },
			{ name: 'vk-blocks/slider-item', attributes: bgImageAttributes },
		],
	});
	const postId = await editor.publishPost();
	// publishPost() は null を返し得るため、以降の URL 組み立ての前に検証する
	expect(postId).not.toBeNull();
	createdPostIds.push(postId as number);
	return postId as number;
};

/**
 * fixture のマークアップをそのまま content に持つ公開済み投稿を作り、投稿 ID を返す。
 *
 * 旧形式は現行の save 出力と一致しないため、エディタ経由では再現できない。REST で
 * post_content を直接入れて `?p=` で開く。
 *
 * ⚠️ **この e2e 自体はブロック検証（`isValid`）を見ないが、fixture はブロック検証を
 * 通る形を保つこと。** `test/e2e-tests/fixtures/blocks/` 配下は full-content の
 * 往復テスト（`npm run test-unit` / `fixtures:regenerate`）の対象で、そちらでは
 * 検証を通ることが必須になる。
 *
 * 具体的には、**ブロックコメントの属性 JSON と `data-vkb-slider` の値を食い違わせない
 * こと。** slider の属性には `source` が 1 つも無いため、属性 JSON に書かなかった値は
 * その世代の deprecated スキーマの既定値で解決される。deprecated の save は解決後の値で
 * `data-vkb-slider` を再生成するので、既定値と違う値を本文にだけ書くと再シリアライズ結果が
 * 一致せず `isValid: false` になる（既定から外す値は属性 JSON にも実値を書く）。
 * `fixtures:regenerate` は未生成の JSON を自動生成するため、この状態でも CI は緑のまま
 * 誤ったスナップショットが固定される。**追加・変更時は `isValid` を必ず確認すること。**
 *
 * ⚠️ This spec does not itself check block validation, but the fixture must still pass
 * it: everything under `test/e2e-tests/fixtures/blocks/` feeds the full-content
 * round-trip tests (`npm run test-unit` / `fixtures:regenerate`), where validity is
 * required. Concretely, never let the block comment's attribute JSON disagree with
 * `data-vkb-slider`. No slider attribute uses `source`, so anything omitted from the
 * attribute JSON resolves to that generation's deprecated-schema default, and the
 * deprecated save regenerates `data-vkb-slider` from the resolved values — writing a
 * non-default value only in the markup makes the re-serialized output differ and the
 * block invalid. Because `fixtures:regenerate` happily generates the JSON for an invalid
 * fixture, CI stays green and the wrong snapshot gets frozen: always check `isValid`
 * when adding or changing a fixture.
 *
 * @param requestUtils RequestUtils フィクスチャ
 * @param fixtureName  fixture のファイル名
 * @param title        投稿タイトル
 */
const createLegacyZoomPost = async (
	requestUtils: RequestUtils,
	fixtureName: string,
	title: string
): Promise<number> => {
	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title, content: readFixture(fixtureName), status: 'publish' },
	});
	createdPostIds.push(post.id);
	return post.id as number;
};

/**
 * PRM の状態をエミュレートしてフロントの投稿ページを開き、Swiper の初期化完了まで待つ。
 * ズーム CSS は view.js が load ハンドラ内で差し込むため、emulateMedia は必ず goto より
 * 前に呼ぶ必要がある（順序をこのヘルパーで固定する）。
 *
 * @param page          Page フィクスチャ
 * @param postId        表示する投稿 ID
 * @param reducedMotion エミュレートする prefers-reduced-motion の値
 */
const visitFrontend = async (
	page: Page,
	postId: number,
	reducedMotion: 'reduce' | 'no-preference'
): Promise<void> => {
	await page.emulateMedia({ reducedMotion });
	await page.goto(`/?p=${postId}`);
	await waitForSwiperInit(page);
	// アクティブなスライドが確定してから測る（クラス付与は Swiper 初期化の中で行われる）
	await page
		.locator('.vk_slider .vk_slider_item.swiper-slide-active')
		.first()
		.waitFor();
};

/**
 * アクティブなスライドの `::before` に効いている拡大率を返す。
 *
 * ズームは `transform: scale()` で作っているため、算出値の matrix の 1 つ目
 * （水平方向の拡大率）を読めば「今どこまでズームしたか」が分かる。
 *
 * @param page Page フィクスチャ
 */
const getActiveSlideZoomScale = async (page: Page): Promise<number> =>
	page.evaluate(() => {
		const slide = document.querySelector(
			'.vk_slider .vk_slider_item.swiper-slide-active'
		);
		// 見つからないまま算出値を読むと「null のプロパティ」という、何を測ろうとして
		// いたのか分からない例外になるため、先に名指しで落とす
		if (!slide) {
			throw new Error(
				'アクティブなスライドが見つかりません（Swiper 初期化前の可能性）'
			);
		}
		const { transform } = window.getComputedStyle(slide, '::before');
		// transform 未指定は等倍。0 や NaN を返して後段の比較を曖昧にしない
		if (!transform || transform === 'none') {
			return 1;
		}
		const matrix = transform.match(/^matrix\(([^)]+)\)$/);
		if (!matrix) {
			throw new Error(`transform を解釈できません: ${transform}`);
		}
		return parseFloat(matrix[1].split(',')[0]);
	});

/**
 * アクティブなスライドの `::before` に効いている背景画像の算出値を返す。
 *
 * @param page Page フィクスチャ
 */
const getActiveSlideBackgroundImage = async (page: Page): Promise<string> =>
	page.evaluate(() => {
		const slide = document.querySelector(
			'.vk_slider .vk_slider_item.swiper-slide-active'
		);
		if (!slide) {
			throw new Error(
				'アクティブなスライドが見つかりません（Swiper 初期化前の可能性）'
			);
		}
		return window.getComputedStyle(slide, '::before').backgroundImage;
	});

/**
 * 本文（`.entry-content` 等ではなく `<body>` 配下の、`<head>` 以外）に
 * 「@media で包まれていない最終倍率」を持つ `<style>` があるかを返す。
 *
 * 旧形式のケースは「本文に焼かれた無防備な最終倍率に、`<head>` の `reduce` 上書きが
 * 勝つ」ことを見るテストなので、その打ち消し対象が実在することが前提になる。
 * fixture が差し替わって前提が消えた場合、確認そのものは（何も無いので）通ってしまい、
 * テストが空回りしていることに気付けない。前提の方を先に固定する。
 *
 * 判定にはセレクターと `@media` の不在だけでなく **倍率の値そのもの** も含める。
 * これが無いと、本文の `<style>` が初期倍率（＝打ち消す必要が無い値）を持つ形に
 * 差し替わっても前提 assert が通ってしまい、空回りの検出という役目を果たさない。
 *
 * The value itself is part of the check, not just the selector and the absence of the
 * media query: without it, a fixture rewritten to bake the *initial* scale — nothing to
 * override — would still satisfy the precondition and the case would silently go hollow.
 *
 * @param page       Page フィクスチャ
 * @param finalScale 本文に焼かれているはずの最終倍率
 */
const hasUnguardedFinalScaleInContent = async (
	page: Page,
	finalScale: number
): Promise<boolean> =>
	page.evaluate(
		(scale) =>
			Array.from(document.body.querySelectorAll('style')).some(
				(style) => {
					const css = style.textContent ?? '';
					return (
						css.includes('.swiper-slide-active::before') &&
						css.includes(`scale(${scale})`) &&
						!css.includes('prefers-reduced-motion')
					);
				}
			),
		finalScale
	);

// 「動かないこと」を確かめる待機時間（ms）。ズームの transition は
// アクティブクラスが付いた瞬間から linear に進むため、再生される環境なら
// 数十 ms で等倍から外れる（下の no-preference のテストがそれを固定している）。
// 2 秒は「起きるなら十分起きている」ための余裕であって、動きの完了を待つ時間ではない。
// 不在の証明は時間経過でしか取れないため、ここだけは固定待機を使う。
const NO_MOTION_OBSERVATION_MS = 2000;

test.describe('Slider 背景ズームと prefers-reduced-motion (#3082)', () => {
	test('PRM: reduce: 背景は初期倍率のまま静止し、背景画像は表示されたまま', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishZoomSliderPost(admin, editor);

		await visitFrontend(page, postId, 'reduce');

		// 再生される環境なら等倍から外れているだけの時間を置いてから測る
		await page.waitForTimeout(NO_MOTION_OBSERVATION_MS);
		expect(await getActiveSlideZoomScale(page)).toBeCloseTo(1, 3);

		// 最終倍率だけを @media で包む設計の要。基本規則ごと包むと
		// 背景画像が描画されなくなるため、そこを取り違えたらここで落ちる
		expect(await getActiveSlideBackgroundImage(page)).not.toBe('none');
	});

	test('PRM: reduce: 手動でスライドを送っても背景は初期倍率のまま静止する', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishZoomSliderPost(admin, editor);

		await visitFrontend(page, postId, 'reduce');

		// 次へボタンで手動送りする。初期表示だけでなく、送るたびに新しいアクティブ
		// スライドでズームが再生されていた（issue #3082 の症状）ため、送った後も測る
		await page.locator('.vk_slider .swiper-button-next').first().click();
		await page
			.locator('.vk_slider .vk_slider_item.swiper-slide-active')
			.first()
			.waitFor();

		await page.waitForTimeout(NO_MOTION_OBSERVATION_MS);
		expect(await getActiveSlideZoomScale(page)).toBeCloseTo(1, 3);
	});

	// 既定値（初期倍率 1）だけで測ると、`reduce` 側の上書きが無くても基本規則の
	// `scale(1)` が残るため「等倍だった」が成立してしまい、上書きが効いているのか
	// 元から等倍なのかを区別できない。既定値から外した倍率で測ることで、
	// `reduce` 側が初期倍率を決め打ち（例: `scale(1)`）していないことまで弁別する。
	// A default initial scale of 1 cannot tell the override apart from the base rule that
	// already sits at scale(1). Measuring with a non-default value also proves the reduce
	// branch honours zoomInitialScale rather than hard-coding scale(1).
	test('PRM: reduce: 初期倍率をカスタム値にしても、その倍率のまま静止する', async ({
		admin,
		editor,
		page,
	}) => {
		const zoomInitialScale = 1.5;
		const postId = await publishZoomSliderPost(admin, editor, {
			zoomInitialScale,
			// 最終倍率も既定（1.25）から離しておく。動いてしまった場合に
			// 初期倍率との差が大きく、`toBeCloseTo` の精度に頼らず外れる
			zoomFinalScale: 2.5,
		});

		await visitFrontend(page, postId, 'reduce');

		// 再生される環境なら初期倍率から外れているだけの時間を置いてから測る
		await page.waitForTimeout(NO_MOTION_OBSERVATION_MS);
		expect(await getActiveSlideZoomScale(page)).toBeCloseTo(
			zoomInitialScale,
			3
		);

		// カスタム倍率でも背景画像は消えない（基本規則を @media で包んでいないこと）
		expect(await getActiveSlideBackgroundImage(page)).not.toBe('none');
	});

	// この PR の要である「既存投稿の救済」を踏むのはこのケースだけ。
	// 1.121.1 形式の投稿は本文の <style> に @media で包まれていない最終倍率を持ち、
	// 本文の <style> は view.js が後から <head> へ足す <style> より後勝ちになる。
	// view.js の `@media (prefers-reduced-motion: reduce)` ブロック（初期倍率の
	// !important 上書き）を消すと、ここで最終倍率が通って落ちる。
	// This is the only case that exercises the rescue of already-published posts, and the
	// only one that fails if view.js's reduce block is removed.
	test('PRM: reduce: 修正前(1.121.1形式)に保存された投稿でも初期倍率のまま静止する', async ({
		page,
		requestUtils,
	}) => {
		const postId = await createLegacyZoomPost(
			requestUtils,
			LEGACY_ZOOM_FIXTURE,
			'legacy zoom: unguarded final scale in content'
		);

		await visitFrontend(page, postId, 'reduce');

		// 打ち消す対象（本文に焼かれた無防備な最終倍率）が実在することを先に確認する。
		// これが無いと、以降の「初期倍率のまま」は何も打ち消していなくても通ってしまう
		expect(
			await hasUnguardedFinalScaleInContent(page, LEGACY_FINAL_SCALE),
			`本文に @media で包まれていない scale(${LEGACY_FINAL_SCALE}) の <style> がありません（fixture が現行形式に差し替わっていないか、倍率が変わっていないか確認してください）`
		).toBe(true);

		await page.waitForTimeout(NO_MOTION_OBSERVATION_MS);
		const scale = await getActiveSlideZoomScale(page);
		expect(
			scale,
			`本文の scale(${LEGACY_FINAL_SCALE}) を打ち消せていません（<head> 側の reduce 上書きが効いていない）`
		).toBeCloseTo(LEGACY_INITIAL_SCALE, 3);
	});

	test('PRM 未設定: 従来どおりズームが再生される', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishZoomSliderPost(admin, editor);

		await visitFrontend(page, postId, 'no-preference');

		// 単発で読むと transition の開始とレースするため、等倍から外れるまで待つ。
		// 最終倍率（既定 1.25）への到達は待たない（尺が 4.25 秒あり、遅いだけで
		// 落ちるテストになるため）。「動いていること」が確認できれば十分。
		await expect
			.poll(() => getActiveSlideZoomScale(page))
			.toBeGreaterThan(1.01);
	});
});
