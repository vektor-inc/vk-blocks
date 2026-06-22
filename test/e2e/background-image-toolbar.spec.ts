import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * 背景画像系ブロック（アウター / スライドアイテム）のブロックツールバーから
 * 背景画像（PC / タブレット / モバイル）を変更できる UI が表示されることを確認する。
 *
 * @see https://github.com/vektor-inc/vk-blocks-pro/issues/2972
 */
test.describe('Background image toolbar', () => {
	test.beforeEach(async ({ admin }) => {
		// 各テストの前に新規投稿を作成する
		await admin.createNewPost();
	});

	test('Outer block: ツールバーから背景画像のポップオーバーを開ける', async ({
		editor,
		page,
	}) => {
		// アウターブロックを挿入する
		await editor.insertBlock({ name: 'vk-blocks/outer' });

		// ツールバーに「Background Image」ボタンが表示されること
		const button = page.getByRole('button', { name: 'Background Image' });
		await expect(button).toBeVisible();

		// クリックするとポップオーバーが開き、レスポンシブ別の 3 項目が表示されること
		await button.click();
		await expect(
			page.getByText('Background Image PC', { exact: true })
		).toBeVisible();
		await expect(
			page.getByText('Background Image Tablet', { exact: true })
		).toBeVisible();
		await expect(
			page.getByText('Background Image Mobile', { exact: true })
		).toBeVisible();
	});

	test('Slider item: ツールバーから背景画像のポップオーバーを開ける', async ({
		editor,
		page,
	}) => {
		// スライダー（内部にスライドアイテム）を挿入する
		await editor.insertBlock({
			name: 'vk-blocks/slider',
			innerBlocks: [{ name: 'vk-blocks/slider-item' }],
		});

		// スライドアイテムを選択してブロックツールバーを表示させる
		await editor.selectBlocks(
			editor.canvas
				.getByRole('document', { name: /Slider Item/i })
				.first()
		);

		// ツールバーに「Background Image」ボタンが表示されること
		const button = page.getByRole('button', { name: 'Background Image' });
		await expect(button).toBeVisible();

		// クリックするとポップオーバーが開き、レスポンシブ別の 3 項目が表示されること
		await button.click();
		await expect(
			page.getByText('Background Image PC', { exact: true })
		).toBeVisible();
		await expect(
			page.getByText('Background Image Tablet', { exact: true })
		).toBeVisible();
		await expect(
			page.getByText('Background Image Mobile', { exact: true })
		).toBeVisible();
	});
});
