/**
 * External dependencies
 */
import path from 'path';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test('import option', async ({ admin, page }) => {
	await admin.visitAdminPage('options-general.php?page=vk_blocks_options');

	const originalEntries = await page.locator('.balloonIconList li').count();

	// Select the file to upload.
	const testReusableBlockFile = path.join(__dirname, 'import-export.json');
	await page.setInputFiles('input[type="file"]', testReusableBlockFile);

	// 画面の「Import」ボタンを押すと、確認モーダル（Import data confirmation）が開く。
	// Click the page's Import button; it opens the confirmation modal.
	await page.getByRole('button', { name: 'Import', exact: true }).click();

	// 確認モーダルの中の「Import」を押して取り込みを確定する。
	// 以前は同じセレクターで 2 回押していたが、モーダルが開いている間は画面側の
	// 「Import」ボタン（DOM 上で先に見つかる）がモーダルに覆われて押せず、
	// タイミングによってはタイムアウトしていた。モーダルの中に絞って押す。
	// Click Import inside the modal to confirm. Clicking the same page-level selector twice
	// hit the page's Import button, which the open modal covers, and timed out depending on timing.
	const confirmDialog = page.getByRole('dialog', {
		name: 'Import data confirmation',
	});
	await confirmDialog
		.getByRole('button', { name: 'Import', exact: true })
		.click();

	await expect(page.locator('.balloonIconList li')).toHaveCount(
		originalEntries + 1
	);
});
