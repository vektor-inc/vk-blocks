import type { Page } from '@playwright/test';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * 指定したテーマをインストール（未インストールの場合のみ）して有効化する。
 *
 * Playwright 版の e2e-test-utils には旧 jest-puppeteer 版の `installTheme()`
 * 相当が無いため、wp-admin の theme-install.php で読み込まれる WordPress 標準の
 * 更新スクリプト（`wp.updates.installTheme`）をテスト内から呼び出してインストールする。
 * これは管理画面の「テーマを追加」と同じ仕組みで、wp.org のテーマディレクトリから取得する。
 *
 * 前提:
 * - 対象テーマが wordpress.org のテーマディレクトリに存在すること（lightning / x-t9 等）。
 * - wp-env が `FS_METHOD: direct` 設定のため、インストール時にファイルシステム認証情報を要求されない。
 *
 * @param page         Playwright の Page（管理者としてログイン済みであること）
 * @param requestUtils REST 経由でテーマ有効化を行うためのユーティリティ
 * @param slug         テーマスラッグ（例: 'lightning', 'x-t9'）
 */
export async function installAndActivateTheme(
	page: Page,
	requestUtils: RequestUtils,
	slug: string
): Promise<void> {
	// まずは有効化を試みる。すでにインストール済みなら成功するのでインストールは不要。
	try {
		await requestUtils.activateTheme(slug);
		return;
	} catch {
		// 未インストールの場合は activateTheme が失敗するため、以降でインストールを行う。
	}

	// theme-install.php を開くと wp.org からテーマを取得する更新スクリプト
	// （wp.updates）と必要なノンスがロードされる。
	await page.goto('/wp-admin/theme-install.php');

	// 管理画面の「テーマを追加」と同じ wp.updates.installTheme を呼び出してインストールする。
	// 完了（success）/ 失敗（error）はコールバックで通知されるため Promise でラップする。
	await page.evaluate((themeSlug) => {
		return new Promise<void>((resolve, reject) => {
			// window.wp は型定義が無いため最小限のキャストで参照する。
			const wp = (window as any).wp;
			if (!wp?.updates?.installTheme) {
				reject(new Error('wp.updates.installTheme is not available'));
				return;
			}
			wp.updates.installTheme({
				slug: themeSlug,
				success: () => resolve(),
				error: (response: { errorMessage?: string }) =>
					reject(
						new Error(
							response?.errorMessage ||
								`Failed to install theme: ${themeSlug}`
						)
					),
			});
		});
	}, slug);

	// インストール後に有効化する。
	await requestUtils.activateTheme(slug);
}
