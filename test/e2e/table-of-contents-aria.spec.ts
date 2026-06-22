/**
 * Issue #2983: 目次ブロック（Pro）の開閉トグルを <input type="checkbox"> + <label> から
 * <button aria-expanded aria-controls> に変更し、スクリーンリーダーへ開閉状態を伝える。
 *
 * テスト観点:
 *  - 新マークアップ(button): フロントで aria-expanded がクリックごとに true ⇔ false でトグルする
 *  - 旧マークアップ(checkbox+label): 既存投稿として保存された内容でも開閉が引き続き機能する（後方互換）
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

// クリーンアップ用に作成した投稿 ID を保持
const createdPostIds: number[] = [];

// REST 経由で投稿を作成して ID を返す
async function createPost(
	requestUtils: RequestUtils,
	title: string,
	content: string
): Promise<number> {
	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title, status: 'publish', content },
	});
	createdPostIds.push(post.id);
	return post.id;
}

// 新マークアップ（#2983 以降）: <button aria-expanded> ベース
const NEW_MARKUP = `<!-- wp:vk-blocks/table-of-contents-new {"blockId":"e2etoc01","renderHtml":"\\n<li class=\\u0022vk_tableOfContents_list_item vk_tableOfContents_list_item-h-2\\u0022>\\n<a href=\\u0022#e2e-h2\\u0022 class=\\u0022vk_tableOfContents_list_item_link\\u0022>\\n<span class=\\u0022vk_tableOfContents_list_item_link_preNumber\\u0022>1. </span>\\nHeading\\n</a>\\n</li>\\n"} -->
<div class="wp-block-vk-blocks-table-of-contents-new vk_tableOfContents vk_tableOfContents-style-default tabs" data-use-custom-levels="false" data-custom-levels=""><div class="tab"><div class="vk_tableOfContents_title">Table of Contents</div><button type="button" class="tab-label vk_tableOfContents_openCloseBtn button_status button_status-open" id="vk-tab-label-toc-e2etoc01" aria-expanded="true" aria-controls="vk-toc-content-e2etoc01">CLOSE</button><ul id="vk-toc-content-e2etoc01" class="vk_tableOfContents_list tab_content-open">
<li class="vk_tableOfContents_list_item vk_tableOfContents_list_item-h-2"><a href="#e2e-h2" class="vk_tableOfContents_list_item_link"><span class="vk_tableOfContents_list_item_link_preNumber">1. </span>Heading</a></li>
</ul></div></div>
<!-- /wp:vk-blocks/table-of-contents-new -->
<!-- wp:heading -->
<h2 class="wp-block-heading" id="e2e-h2">Heading</h2>
<!-- /wp:heading -->`;

// 旧マークアップ（1.121.1 以前）: <input type="checkbox"> + <label> ベース
const LEGACY_MARKUP = `<!-- wp:vk-blocks/table-of-contents-new {"blockId":"e2etoc02","renderHtml":"\\n<li class=\\u0022vk_tableOfContents_list_item vk_tableOfContents_list_item-h-2\\u0022>\\n<a href=\\u0022#e2e-h2b\\u0022 class=\\u0022vk_tableOfContents_list_item_link\\u0022>\\n<span class=\\u0022vk_tableOfContents_list_item_link_preNumber\\u0022>1. </span>\\nHeading\\n</a>\\n</li>\\n"} -->
<div class="wp-block-vk-blocks-table-of-contents-new vk_tableOfContents vk_tableOfContents-style-default tabs" data-use-custom-levels="false" data-custom-levels=""><div class="tab"><div class="vk_tableOfContents_title">Table of Contents</div><input type="checkbox" id="chck-toc-e2etoc02"/><label class="tab-label vk_tableOfContents_openCloseBtn button_status button_status-open" for="chck-toc-e2etoc02" id="vk-tab-label-toc-e2etoc02">CLOSE</label><ul class="vk_tableOfContents_list tab_content-open">
<li class="vk_tableOfContents_list_item vk_tableOfContents_list_item-h-2"><a href="#e2e-h2b" class="vk_tableOfContents_list_item_link"><span class="vk_tableOfContents_list_item_link_preNumber">1. </span>Heading</a></li>
</ul></div></div>
<!-- /wp:vk-blocks/table-of-contents-new -->
<!-- wp:heading -->
<h2 class="wp-block-heading" id="e2e-h2b">Heading</h2>
<!-- /wp:heading -->`;

test.describe('Issue #2983 Table of Contents aria-expanded toggle', () => {
	test.beforeAll(async ({ requestUtils }) => {
		// フロント表示にはアクティブなテーマが必要。
		// （このリポジトリでは playwright の globalSetup が無効のため明示的に有効化する）
		await requestUtils.activateTheme('twentytwentyfive');
	});

	test.afterAll(async ({ requestUtils }) => {
		// 作成した投稿を削除
		for (const id of createdPostIds) {
			try {
				await requestUtils.rest({
					path: `/wp/v2/posts/${id}?force=true`,
					method: 'DELETE',
				});
			} catch {
				// 削除失敗は無視
			}
		}
	});

	test('新マークアップ: button の aria-expanded がクリックでトグルする', async ({
		requestUtils,
		page,
	}) => {
		const postId = await createPost(
			requestUtils,
			'TOC2983 New Markup',
			NEW_MARKUP
		);
		await page.goto(`/?p=${postId}`);

		const button = page.locator(
			'#vk-tab-label-toc-e2etoc01.vk_tableOfContents_openCloseBtn'
		);
		await expect(button).toHaveCount(1);

		// 初期状態（open）: aria-expanded="true"
		await expect(button).toHaveAttribute('aria-expanded', 'true');

		// 1 回目クリック → 閉じる: aria-expanded="false"
		await button.click();
		await expect(button).toHaveAttribute('aria-expanded', 'false');

		// 2 回目クリック → 開く: aria-expanded="true"
		await button.click();
		await expect(button).toHaveAttribute('aria-expanded', 'true');
	});

	test('エディタ: button クリックで開閉プレビューがトグルする', async ({
		admin,
		editor,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({
			name: 'vk-blocks/table-of-contents-new',
		});

		const button = editor.canvas.locator(
			'.vk_tableOfContents_openCloseBtn'
		);
		const list = editor.canvas.locator('.vk_tableOfContents_list');
		await expect(button).toBeVisible();

		// 初期状態（open 既定）: aria-expanded="true" / tab_content-open
		await expect(button).toHaveAttribute('aria-expanded', 'true');
		await expect(list).toHaveClass(/tab_content-open/);

		// クリック → 閉じる
		await button.click();
		await expect(button).toHaveAttribute('aria-expanded', 'false');
		await expect(list).toHaveClass(/tab_content-close/);

		// 再クリック → 開く
		await button.click();
		await expect(button).toHaveAttribute('aria-expanded', 'true');
		await expect(list).toHaveClass(/tab_content-open/);
	});

	test('旧マークアップ: checkbox+label の既存投稿でも開閉が機能する（後方互換）', async ({
		requestUtils,
		page,
	}) => {
		const postId = await createPost(
			requestUtils,
			'TOC2983 Legacy Markup',
			LEGACY_MARKUP
		);
		await page.goto(`/?p=${postId}`);

		const label = page.locator(
			'#vk-tab-label-toc-e2etoc02.vk_tableOfContents_openCloseBtn'
		);
		const list = page.locator(
			'#chck-toc-e2etoc02 ~ ul.vk_tableOfContents_list'
		);
		await expect(label).toHaveCount(1);

		// 初期状態（open）: tab_content-open クラスを持つ
		await expect(list).toHaveClass(/tab_content-open/);

		// クリック → 閉じる: tab_content-close へ切替わる
		await label.click();
		await expect(list).toHaveClass(/tab_content-close/);

		// 再クリック → 開く: tab_content-open へ戻る
		await label.click();
		await expect(list).toHaveClass(/tab_content-open/);
	});
});
