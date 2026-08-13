import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import { registerPostCleanup } from './utils/post-cleanup';

/**
 * スライダーブロック: 編集画面のラッパー class が blockId 基準であることの回帰テスト
 *
 * 【背景 / issue #2556 の副作用】
 *   高さ・ズーム用の CSS は blockId をキーに生成される（src/blocks/slider/index.js）が、
 *   編集画面のラッパー class は以前 clientId を使っていた（src/blocks/slider/edit.js）。
 *   #2556 で blockId をリロード毎に再採番しなくなった結果、リロード後は
 *   blockId ≠ clientId となり、編集画面だけ高さ CSS のセレクタ（.vk_slider_<blockId>）が
 *   ラッパー（.vk_slider_<clientId>）に当たらず、スライドが帯状に重なって崩れていた
 *   （VWS フォーラム報告 / フロントは blockId で統一されているため正常）。
 *
 * 【修正】
 *   編集画面のラッパー class を clientId → blockId に統一（CSS セレクタ・save 出力と一致）。
 *
 * 【このテストで確認すること】
 *   1. 配置→保存→リロード後、blockId ≠ clientId の状況でも
 *      ラッパー class が .vk_slider_<blockId> になっている（clientId ではない）
 *   2. 複製すると blockId が再採番され、2つのラッパー class が別々になる
 *      （編集画面で高さ CSS が互いに衝突しない）
 *
 * 認証・baseURL は標準 e2e ハーネス（global-setup / playwright.config）に従う。
 * flaky 防止のため固定待機（waitForTimeout）は使わず、状態待機（waitForFunction）で待つ。
 */

const SLIDER = 'vk-blocks/slider';

// スライダーの各インスタンスに blockId が付与される（補完 useEffect が走り切る）まで待つ。
// blockId 補完は clientId 確定後の useEffect で setAttributes されるため、これが完了の指標になる。
// count 個すべてに blockId が付くまで待つ（複製時は 2 個そろうまで待てる）。
async function waitForSliderBlockIds(page, count = 1) {
	await page.waitForFunction(
		({ name, expected }) => {
			const sliders = window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.filter((b) => b.name === name);
			return (
				sliders.length >= expected &&
				sliders.slice(0, expected).every((b) => !!b.attributes?.blockId)
			);
		},
		{ name: SLIDER, expected: count }
	);
}

// 指定 clientId のブロック（useBlockProps のルート要素 = data-block を持つ要素）の
// class トークン配列を編集画面（iframe 化され得るため editor.canvas）から取得する。
async function getWrapperClassTokens(editor, clientId) {
	const cls = await editor.canvas
		.locator(`[data-block="${clientId}"]`)
		.getAttribute('class');
	return (cls ?? '').split(/\s+/);
}

// このスペックは下書きを 1 件保存するため、終了時に削除されるよう登録しておく
const createdPostIds = registerPostCleanup();

test.describe('スライダー: 編集画面ラッパー class が blockId 基準（回帰 / #2556 副作用）', () => {
	test('リロード後 blockId ≠ clientId でもラッパー class は .vk_slider_<blockId>', async ({
		admin,
		editor,
		page,
	}) => {
		// 高さを設定したスライダー（アイテム 2 枚）を配置する。
		// 高さ CSS（.vk_slider_<blockId> .vk_slider_item）は blockId をキーに生成される。
		await admin.createNewPost();
		await editor.insertBlock({
			name: SLIDER,
			attributes: { pc: 300, unit: 'px' },
			innerBlocks: [
				{ name: 'vk-blocks/slider-item' },
				{ name: 'vk-blocks/slider-item' },
			],
		});

		// blockId 補完後、ストア API で下書き保存する。
		// publishPost の UI フロー（公開確認パネル）は WP のバージョン差で不安定なため使わない。
		await waitForSliderBlockIds(page, 1);
		await page.evaluate(async () => {
			await window.wp.data.dispatch('core/editor').savePost();
		});
		await page.waitForFunction(
			() => !window.wp.data.select('core/editor').isSavingPost()
		);

		// 保存した投稿を開き直す（clientId が再採番され、保存済み blockId と食い違う状況を作る）。
		const postId = await page.evaluate(() =>
			window.wp.data.select('core/editor').getCurrentPostId()
		);
		createdPostIds.push(postId);
		await admin.editPost(postId);
		await waitForSliderBlockIds(page, 1);

		// リロード後の clientId（実行時）と blockId（保存値）を取得する。
		const { clientId, blockId } = await page.evaluate((name) => {
			const slider = window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.find((b) => b.name === name);
			return {
				clientId: slider.clientId,
				blockId: slider.attributes.blockId,
			};
		}, SLIDER);

		// 前提: リロード後は blockId（保存値）と clientId（実行時）が食い違う。
		// （食い違わなければ、このテストは blockId/clientId を区別できず意味を持たない）
		expect(clientId).not.toBe(blockId);

		// 編集画面のラッパー要素（data-block=clientId, useBlockProps のルート）の class を取得する。
		const tokens = await getWrapperClassTokens(editor, clientId);

		// ラッパー class は blockId 基準（.vk_slider_<blockId>）になっている。
		expect(tokens).toContain(`vk_slider_${blockId}`);
		// clientId 基準の class は付いていない
		// （clientId に戻すと .vk_slider_<clientId> が付き、高さ CSS が当たらず崩れる = このアサートで検知）。
		expect(tokens).not.toContain(`vk_slider_${clientId}`);
	});

	test('複製するとラッパー class が別々になる（blockId 再採番・編集画面の CSS 衝突なし）', async ({
		admin,
		editor,
		page,
	}) => {
		// スライダー（アイテム 2 枚）を 1 つ配置する。
		await admin.createNewPost();
		await editor.insertBlock({
			name: SLIDER,
			innerBlocks: [
				{ name: 'vk-blocks/slider-item' },
				{ name: 'vk-blocks/slider-item' },
			],
		});
		await waitForSliderBlockIds(page, 1);

		// 1 つ目のスライダーを複製する。
		await page.evaluate(async (name) => {
			const be = window.wp.data.select('core/block-editor');
			const { duplicateBlocks } =
				window.wp.data.dispatch('core/block-editor');
			const original = be.getBlocks().find((b) => b.name === name);
			await duplicateBlocks([original.clientId]);
		}, SLIDER);

		// 複製先の blockId 補完 useEffect（衝突検出 → 再採番）が完了するまで状態待機する。
		// 条件: スライダーが 2 個・両方に blockId が付与済み・2 つの blockId が互いに異なる。
		await page.waitForFunction(
			(name) => {
				const sliders = window.wp.data
					.select('core/block-editor')
					.getBlocks()
					.filter((b) => b.name === name);
				if (sliders.length !== 2) {
					return false;
				}
				const [a, b] = sliders.map((s) => s.attributes?.blockId);
				return !!a && !!b && a !== b;
			},
			SLIDER,
			{ timeout: 5000 }
		);

		// 2 つのスライダーの (clientId, blockId) を取得する。
		const sliders = await page.evaluate((name) => {
			return window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.filter((b) => b.name === name)
				.map((b) => ({
					clientId: b.clientId,
					blockId: b.attributes.blockId,
				}));
		}, SLIDER);
		expect(sliders).toHaveLength(2);

		// 各ラッパー要素の class を取得し、それぞれ自分の blockId 基準になっていることを確認する。
		const heightSelectors = [];
		for (const s of sliders) {
			const tokens = await getWrapperClassTokens(editor, s.clientId);
			expect(tokens).toContain(`vk_slider_${s.blockId}`);
			heightSelectors.push(`vk_slider_${s.blockId}`);
		}

		// 2 つのラッパー class（.vk_slider_<blockId>）は互いに異なる
		// = 編集画面で高さ CSS のセレクタが衝突せず、各スライダーが自分の高さを持てる。
		expect(heightSelectors[0]).not.toBe(heightSelectors[1]);
	});
});
