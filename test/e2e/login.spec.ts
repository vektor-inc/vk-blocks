import { test } from '@wordpress/e2e-test-utils-playwright';

test('login', async ({ page }) => {
	// 絶対 URL ではなく baseURL（WP_BASE_URL で上書き可能）に対する相対パスを使い、
	// 環境（dev:8888 / tests:8889 等）に依存しないようにする。
	await page.goto('/wp-login.php');
	await page.getByLabel('Username or Email Address').click();
	await page.getByLabel('Username or Email Address').fill('admin');
	await page.getByLabel('Username or Email Address').press('Tab');
	await page.getByLabel('Password', { exact: true }).fill('password');
	await page.getByRole('button', { name: 'Log In' }).click();
	await page.goto('/wp-admin/');
	// 固定待機ではなく、ログイン済みでのみ表示される管理バーの出現でダッシュボード到達を判定する。
	await page.locator('#wpadminbar').waitFor({ state: 'visible' });
});
