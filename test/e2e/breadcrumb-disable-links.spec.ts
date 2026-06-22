import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * パンくずリスト（Pro）ブロックのエディタ内リンク無効化のテスト。
 *
 * 修正内容（#2968）:
 *   投稿編集画面でパンくずブロックを挿入したとき、エディタ内のパンくず内 <a> をクリックすると
 *   画面遷移してしまっていた不具合を `useDisableLinks` の適用で抑止する。
 *
 * 観点:
 *   1) エディタ内（iframe canvas）でパンくず内リンクに `pointer-events: none` が適用されていること
 *   2) リンクをクリックしてもエディタが他ページに遷移しないこと
 */
test.describe('Breadcrumb (Pro): エディタ内リンク無効化', () => {
	test.beforeEach(async ({ admin, page }) => {
		// パーマリンクを「投稿名」に設定（パンくず生成のため）
		await admin.visitAdminPage('options-permalink.php');
		await page.getByText('Post name').click();
		await page.getByRole('button', { name: 'Save Changes' }).click();

		// 新規投稿を作成
		await admin.createNewPost();
	});

	test('パンくず内 <a> に pointer-events: none が当たり、クリックしても画面遷移しない', async ({
		editor,
		page,
	}) => {
		// パンくずブロックを挿入する
		await editor.insertBlock({
			name: 'vk-blocks/breadcrumb',
		});

		// パンくず本体（.vk_breadcrumb）がエディタ canvas 内に表示されるまで待機
		// ServerSideRender で描画されるため、表示まで時間がかかる
		const breadcrumb = editor.canvas.locator('.vk_breadcrumb');
		await expect(breadcrumb).toBeVisible({ timeout: 15000 });

		// パンくず内のリンクを取得
		const breadcrumbLinks = editor.canvas.locator('.vk_breadcrumb a');

		// 少なくとも1つ以上 <a> があることを確認（HOMEリンクなど）
		await expect
			.poll(async () => await breadcrumbLinks.count())
			.toBeGreaterThan(0);

		// 全ての <a> に pointer-events: none が当たっていることを確認
		const count = await breadcrumbLinks.count();
		for (let i = 0; i < count; i++) {
			const link = breadcrumbLinks.nth(i);
			// useDisableLinks が MutationObserver で適用するため、適用待ち
			await expect
				.poll(
					async () =>
						await link.evaluate(
							(el) => window.getComputedStyle(el).pointerEvents
						),
					{ timeout: 5000 }
				)
				.toBe('none');
		}

		// 現在の URL を保存し、リンクをクリックしても遷移しないことを確認
		const beforeUrl = page.url();
		// pointer-events: none のため通常クリックは効かないが、念のため強制クリックして「遷移しない」ことを確認
		await breadcrumbLinks.first().click({ force: true });
		// 短時間待ってから URL を比較
		await page.waitForTimeout(500);
		const afterUrl = page.url();
		expect(afterUrl).toBe(beforeUrl);
	});

	test('フロント側ではパンくずリンクが通常どおり機能する', async ({
		editor,
		page,
	}) => {
		// パンくずブロックを挿入して投稿を公開
		await editor.insertBlock({
			name: 'vk-blocks/breadcrumb',
		});
		const postId = await editor.publishPost();
		expect(postId).toBeTruthy();

		// 公開された投稿のフロント側へ移動
		await page.goto(`/?p=${postId}`);

		// フロント側にパンくず本体が表示されることを確認
		const frontBreadcrumb = page.locator('.vk_breadcrumb').first();
		await expect(frontBreadcrumb).toBeVisible();

		// フロント側のパンくず内リンク（HOMEなど）を取得
		const frontLink = page.locator('.vk_breadcrumb a').first();
		await expect(frontLink).toBeVisible();

		// pointer-events が "none" になっていない（通常通り操作可能）ことを確認
		const pointerEvents = await frontLink.evaluate(
			(el) => window.getComputedStyle(el).pointerEvents
		);
		expect(pointerEvents).not.toBe('none');

		// 実際にクリックして遷移することを確認
		const href = await frontLink.getAttribute('href');
		expect(href).toBeTruthy();

		await Promise.all([
			page.waitForURL(href as string, { timeout: 10000 }),
			frontLink.click(),
		]);
	});
});
