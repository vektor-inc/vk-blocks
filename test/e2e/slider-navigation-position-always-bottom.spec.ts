import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { saveDraftThenPublishViaRest } from './utils/publish';
import { registerPostCleanup } from './utils/post-cleanup';
import { waitForSwiperInit } from './utils/swiper';

/**
 * スライダーブロック（本体）・投稿リストスライダーブロック（Pro）:
 * ナビゲーションの位置に「Bottom on all devices」（`always-bottom`）を追加する PR #3063 の確認。
 *
 * 【背景 / issue #3062】
 *   既存の「中央」を選ぶとPC・タブレットサイズで矢印がスライド左右中央に表示され、
 *   スライダーアイテムにキャプション等のテキストを重ねているケースで矢印がテキストに
 *   被って邪魔になることがあった。PC・タブレットサイズでも常時矢印を下部に固定できる
 *   新しい選択肢 `always-bottom` を追加した。
 *
 * 【追加修正 / commit a17add18a】
 *   投稿リストスライダー（Pro）のみ、モバイル幅で `always-bottom` を既存の
 *   `mobile-bottom` と同じ `bottom: 0` に揃えた（本体スライダーは対象外、10px のまま）。
 *
 * このスペックで確認すること:
 *   1. エディタの「Navigation Position」に「Bottom on all devices」が選択肢として表示される
 *      （スライダー本体・投稿リストスライダー(Pro) 両方）
 *   2. `always-bottom` 選択時、フロント表示で PC・タブレット・モバイル幅いずれでも
 *      矢印が下部に固定表示される（本体・Pro 両方）
 *   3. 投稿リストスライダー(Pro) で、モバイル幅において `always-bottom` と
 *      既存の `mobile-bottom` のオフセット位置が一致する（今回の追加修正のポイント）
 *   4. 既存の `hide` / `center` / `mobile-bottom` の挙動にデグレがないこと
 *
 * flaky 防止のため固定待機（waitForTimeout）は使わず、要素の出現・状態待機で確認する。
 */

const SLIDER = 'vk-blocks/slider';
const POST_LIST_SLIDER = 'vk-blocks/post-list-slider';

// ビューポート幅（PR本文の確認手順に準拠）
const VIEWPORT = {
	pc: { width: 1200, height: 800 },
	tablet: { width: 768, height: 900 },
	mobile: { width: 400, height: 900 },
};

// このスペックで作成した投稿の ID。afterAll で対象を絞って削除する
// （全削除だと他スペックのデータに影響し得るため、姉妹スペックの慣習に合わせる）
const createdPostIds = registerPostCleanup();

/**
 * スライダーブロック（slider-item 2枚、高さ 300px 固定）を指定の navigationPosition で
 * 挿入・公開し、投稿 ID を返す。
 * 高さを固定するのは、「center」（中央配置）と「bottom 固定」の見た目の違いを
 * オフセット計測で明確に区別できるようにするため。
 *
 * @param admin              Admin フィクスチャ
 * @param editor             Editor フィクスチャ
 * @param page               Page フィクスチャ
 * @param requestUtils       RequestUtils フィクスチャ
 * @param navigationPosition 検証したい navigationPosition の値
 */
const publishSliderPost = async (
	admin: Admin,
	editor: Editor,
	page: Page,
	requestUtils: RequestUtils,
	navigationPosition: string
): Promise<number> => {
	await admin.createNewPost();
	await editor.insertBlock({
		name: SLIDER,
		attributes: { pc: 300, unit: 'px', navigationPosition },
		innerBlocks: [
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
		],
	});
	const postId = await saveDraftThenPublishViaRest(
		page,
		requestUtils,
		createdPostIds
	);
	return postId;
};

/**
 * 投稿リストスライダーブロック（Pro）を指定の navigationPosition で挿入・公開し、
 * 投稿 ID を返す。スライドに使う投稿も2件作成する
 * （global-setup が全投稿を削除するため、実行時点で既存の投稿は無い前提）。
 *
 * @param admin              Admin フィクスチャ
 * @param editor             Editor フィクスチャ
 * @param page               Page フィクスチャ
 * @param requestUtils       RequestUtils フィクスチャ
 * @param navigationPosition 検証したい navigationPosition の値
 */
const publishPostListSliderPost = async (
	admin: Admin,
	editor: Editor,
	page: Page,
	requestUtils: RequestUtils,
	navigationPosition: string
): Promise<number> => {
	const seedA = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: {
			title: 'always-bottom slider post A',
			content: 'A',
			status: 'publish',
		},
	});
	createdPostIds.push(seedA.id);
	const seedB = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: {
			title: 'always-bottom slider post B',
			content: 'B',
			status: 'publish',
		},
	});
	createdPostIds.push(seedB.id);

	await admin.createNewPost();
	await editor.insertBlock({
		name: POST_LIST_SLIDER,
		attributes: { navigationPosition },
	});
	const postId = await saveDraftThenPublishViaRest(
		page,
		requestUtils,
		createdPostIds
	);
	return postId;
};

/**
 * フロントの投稿ページを指定ビューポートで開き、スライダーの矢印（prev/next）が
 * DOM に出現し、かつ Swiper の初期化が完了するまで待つ（hide のケースでは呼ばない）。
 *
 * 矢印は save.js が出力する静的マークアップなので、出現を待っただけでは初期化完了に
 * ならない。Swiper がスライドの寸法を確定させる前に矩形を測ると、スライダー自身の
 * 下端がずれて計測値が変わってしまうため、初期化完了も待つ
 * （詳細は waitForSwiperInit の JSDoc を参照）。本体・Pro どちらの view.js も
 * `window[`swiper${index}`]` にインスタンスを入れるため、同じヘルパーで待てる。
 *
 * @param page            Page フィクスチャ
 * @param postId          表示する投稿 ID
 * @param viewport        ビューポートサイズ
 * @param viewport.width
 * @param viewport.height
 */
const visitFrontendWithArrows = async (
	page: Page,
	postId: number,
	viewport: { width: number; height: number }
): Promise<void> => {
	await page.setViewportSize(viewport);
	await page.goto(`/?p=${postId}`);
	await page.locator('.swiper-button-next').first().waitFor();
	await waitForSwiperInit(page);
};

/**
 * スライダーコンテナ（.vk_slider または .vk_post_list_slider）の下端から
 * 「次へ」矢印ボタンの下端までの距離（px）を計測する。
 * position: absolute の bottom オフセットに対応する値になるため、
 * 「下部に固定」されているかどうかを数値で判定できる。
 *
 * @param page              Page フィクスチャ
 * @param containerSelector スライダーコンテナのセレクタ
 */
const getNextArrowBottomGap = async (
	page: Page,
	containerSelector: string
): Promise<number> => {
	return await page.evaluate((selector) => {
		const container = document.querySelector(selector) as HTMLElement;
		const button = container.querySelector(
			'.swiper-button-next'
		) as HTMLElement;
		const containerRect = container.getBoundingClientRect();
		const buttonRect = button.getBoundingClientRect();
		return containerRect.bottom - buttonRect.bottom;
	}, containerSelector);
};

test.describe('スライダー(本体)・投稿リストスライダー(Pro): Navigation Position に Bottom on all devices を追加 (#3062 / PR #3063)', () => {
	test('エディタ: スライダー(本体)の Navigation Position に Bottom on all devices が表示される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({
			name: SLIDER,
			innerBlocks: [
				{ name: 'vk-blocks/slider-item' },
				{ name: 'vk-blocks/slider-item' },
			],
		});

		// ブロックを選択し、サイドバーの「Slider Settings」パネルを開く
		await editor.selectBlocks(
			await editor.canvas.locator('[data-type="vk-blocks/slider"]')
		);
		await page.getByRole('button', { name: 'Slider Settings' }).click();

		// BaseControl の label は SelectControl の id と紐付いていないため
		// getByLabel では取得できない（他フィールドも同様の既存実装パターン）。
		// 「Navigation Position」というテキストを含む BaseControl 内の select を辿る。
		const select = page
			.locator('.components-base-control', {
				hasText: 'Navigation Position',
			})
			.locator('select');
		await expect(select).toBeVisible();

		// 既存3値 + 新選択肢が揃っていることを確認
		const optionTexts = await select.locator('option').allTextContents();
		expect(optionTexts).toEqual(
			expect.arrayContaining([
				'Hide',
				'Center',
				'Bottom on Mobile device',
				'Bottom on all devices',
			])
		);
	});

	test('エディタ: 投稿リストスライダー(Pro)の Navigation Position に Bottom on all devices が表示される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({ name: POST_LIST_SLIDER });

		await editor.selectBlocks(
			await editor.canvas.locator(
				'[data-type="vk-blocks/post-list-slider"]'
			)
		);
		await page.getByRole('button', { name: 'Slider Settings' }).click();

		// BaseControl の label は SelectControl の id と紐付いていないため
		// getByLabel では取得できない（他フィールドも同様の既存実装パターン）。
		// 「Navigation Position」というテキストを含む BaseControl 内の select を辿る。
		const select = page
			.locator('.components-base-control', {
				hasText: 'Navigation Position',
			})
			.locator('select');
		await expect(select).toBeVisible();

		const optionTexts = await select.locator('option').allTextContents();
		expect(optionTexts).toEqual(
			expect.arrayContaining([
				'Hide',
				'Center',
				'Bottom on Mobile device',
				'Bottom on all devices',
			])
		);
	});

	test('フロント: スライダー(本体) always-bottom は PC・タブレット・モバイル幅いずれでも矢印が下部固定される', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'always-bottom'
		);

		for (const [device, viewport] of Object.entries(VIEWPORT)) {
			await visitFrontendWithArrows(page, postId, viewport);

			// クラスが付与されていること
			await expect(
				page.locator('.swiper-button-next').first()
			).toHaveClass(/swiper-button-always-bottom/);

			// 下端からのオフセットが 10px 前後（common.scss の bottom:10px）であること。
			// 本体スライダーには Pro のようなモバイル専用の上書きが無いため、
			// PC・タブレット・モバイルいずれも同じ 10px になる想定。
			const gap = await getNextArrowBottomGap(page, '.vk_slider');
			expect(
				gap,
				`${device} 幅 (${viewport.width}px) でのオフセット`
			).toBeGreaterThanOrEqual(8);
			expect(
				gap,
				`${device} 幅 (${viewport.width}px) でのオフセット`
			).toBeLessThanOrEqual(13);
		}
	});

	test('フロント: 投稿リストスライダー(Pro) always-bottom は PC・タブレット幅で10px、モバイル幅で0pxに下部固定される', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'always-bottom'
		);

		// PC・タブレット幅: common.scss の bottom:10px がそのまま適用される
		for (const device of ['pc', 'tablet'] as const) {
			await visitFrontendWithArrows(page, postId, VIEWPORT[device]);
			await expect(
				page.locator('.swiper-button-next').first()
			).toHaveClass(/swiper-button-always-bottom/);
			const gap = await getNextArrowBottomGap(
				page,
				'.vk_post_list_slider'
			);
			expect(gap, `${device} 幅でのオフセット`).toBeGreaterThanOrEqual(8);
			expect(gap, `${device} 幅でのオフセット`).toBeLessThanOrEqual(13);
		}

		// モバイル幅: 今回の追加修正（commit a17add18a）で post-list-slider/style.scss に
		// bottom:0 の上書きが入っている。既存の mobile-bottom と同じ 0px になる想定。
		await visitFrontendWithArrows(page, postId, VIEWPORT.mobile);
		const mobileGap = await getNextArrowBottomGap(
			page,
			'.vk_post_list_slider'
		);
		expect(mobileGap, 'モバイル幅でのオフセット').toBeGreaterThanOrEqual(0);
		expect(mobileGap, 'モバイル幅でのオフセット').toBeLessThanOrEqual(3);
	});

	test('重要: 投稿リストスライダー(Pro) モバイル幅で always-bottom と mobile-bottom のオフセットが一致する', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const alwaysBottomPostId = await publishPostListSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'always-bottom'
		);
		const mobileBottomPostId = await publishPostListSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'mobile-bottom'
		);

		await visitFrontendWithArrows(
			page,
			alwaysBottomPostId,
			VIEWPORT.mobile
		);
		const alwaysBottomGap = await getNextArrowBottomGap(
			page,
			'.vk_post_list_slider'
		);

		await visitFrontendWithArrows(
			page,
			mobileBottomPostId,
			VIEWPORT.mobile
		);
		const mobileBottomGap = await getNextArrowBottomGap(
			page,
			'.vk_post_list_slider'
		);

		// 1px 未満の丸め誤差を許容しつつ、両者が同じオフセットであることを確認する。
		// これが今回の追加修正（commit a17add18a）で揃えたポイント。
		expect(
			Math.abs(alwaysBottomGap - mobileBottomGap),
			`always-bottom(${alwaysBottomGap}px) と mobile-bottom(${mobileBottomGap}px) の差`
		).toBeLessThanOrEqual(1);
	});

	test('回帰: スライダー(本体) hide は矢印が表示されない', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'hide'
		);

		await page.setViewportSize(VIEWPORT.pc);
		await page.goto(`/?p=${postId}`);
		await page.locator('.vk_slider').waitFor();

		await expect(
			page.locator('.vk_slider .swiper-button-next')
		).toHaveCount(0);
		await expect(
			page.locator('.vk_slider .swiper-button-prev')
		).toHaveCount(0);
	});

	test('回帰: スライダー(本体) center はPC幅で矢印が下部固定されず中央寄りに表示される', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'center'
		);

		await visitFrontendWithArrows(page, postId, VIEWPORT.pc);
		await expect(page.locator('.swiper-button-next').first()).toHaveClass(
			/swiper-button-center/
		);

		// 高さ300pxのスライダーで、下端からの距離が bottom固定(10px前後)よりも
		// 明らかに大きい（＝中央寄り）ことを確認する。
		const gap = await getNextArrowBottomGap(page, '.vk_slider');
		expect(gap).toBeGreaterThan(30);
	});

	test('回帰: スライダー(本体) mobile-bottom は既存どおりモバイル幅でのみ下部固定される（PC幅では中央寄りのまま）', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'mobile-bottom'
		);

		// PC幅では中央寄りのまま（bottom固定されない）
		await visitFrontendWithArrows(page, postId, VIEWPORT.pc);
		const pcGap = await getNextArrowBottomGap(page, '.vk_slider');
		expect(pcGap).toBeGreaterThan(30);

		// モバイル幅では下部固定（10px前後、本体は既存どおり変更なし）
		await visitFrontendWithArrows(page, postId, VIEWPORT.mobile);
		const mobileGap = await getNextArrowBottomGap(page, '.vk_slider');
		expect(mobileGap).toBeGreaterThanOrEqual(8);
		expect(mobileGap).toBeLessThanOrEqual(13);
	});

	test('回帰: 投稿リストスライダー(Pro) hide は矢印が表示されない', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'hide'
		);

		await page.setViewportSize(VIEWPORT.pc);
		await page.goto(`/?p=${postId}`);
		await page.locator('.vk_post_list_slider').waitFor();

		await expect(
			page.locator('.vk_post_list_slider .swiper-button-next')
		).toHaveCount(0);
		await expect(
			page.locator('.vk_post_list_slider .swiper-button-prev')
		).toHaveCount(0);
	});
});
