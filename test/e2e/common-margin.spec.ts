import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe('Block', () => {
	test.beforeEach(async ({ admin, page }) => {
		// パーマリンクを設定
		await admin.visitAdminPage('options-permalink.php');
		await page.getByText('Post name').click();
		await page.getByRole('button', { name: 'Save Changes' }).click();

		// このテストが挿入する vk-blocks/breadcrumb は通常ブロックであり、
		// 「VKDeprecated Blocks」設定の有効化は不要なため設定操作は行わない。

		// それぞれのテストの前に新しい投稿を作成する
		await admin.createNewPost();
	});

	test('should be created', async ({ editor, page }) => {
		// ブロックを挿入する
		await editor.insertBlock({
			name: 'vk-blocks/breadcrumb',
		});
		await page.getByRole('button', { name: 'Margin the block' }).click();
		await page.getByRole('menuitem', { name: 'Top XL' }).click();

		// クラスの完全一致・順序依存は脆いため、必要なクラスのみ包含を検証する。
		await expect(
			editor.canvas.getByLabel('Block: Breadcrumb')
		).toContainClass(
			'wp-block-vk-blocks-breadcrumb is-selected vk_block-margin-xl--margin-top'
		);
	});
});
