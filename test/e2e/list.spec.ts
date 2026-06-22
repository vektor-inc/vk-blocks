import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe('List', () => {
	test.beforeEach(async ({ admin }) => {
		// それぞれのテストの前に新しい投稿を作成する
		// NOTE: 旧テストでは lightning テーマをインストール／有効化していたが、
		// Playwright でのテーマ切り替えは環境依存で扱いづらいため行わない。
		// テスト環境で有効なテーマが提供するカラーパレットを利用する。
		await admin.createNewPost();
	});

	test('insertBlock List', async ({ editor, page }) => {
		// List ブロックを挿入する
		await editor.insertBlock({ name: 'core/list' });

		// ドキュメント設定サイドバーを開く
		await editor.openDocumentSettingsSidebar();

		// 挿入直後は内側の List item が選択され、親 List ブロックの
		// InspectorControls（List Icon Color パネル）が表示されないため、
		// 親の List ブロックを明示的に選択する。
		await editor.selectBlocks(
			editor.canvas.getByRole('document', {
				name: 'Block: List',
				exact: true,
			})
		);

		// List のようなコンテナーブロックを選択すると、ブロックインスペクターの
		// 既定タブが「List View」になり「Settings」タブの InspectorControls
		// （List Icon Color パネル）が表示されない。そのため「Settings」タブを
		// 明示的にアクティブにする。
		await page.getByRole('tab', { name: 'Settings' }).click();

		// 「List Icon Color」パネルを開く
		await page.getByRole('button', { name: /List Icon Color/i }).click();

		// List Icon Color パネル内の最初のカラースウォッチをクリックする。
		// スウォッチの aria-label は有効テーマのパレット色名（例: Foreground / Black）
		// に依存するため、名前ではなくパネル本体内の最初の色オプションを選択する。
		const listIconColorPanel = page
			.locator('.components-panel__body')
			.filter({ hasText: 'List Icon Color' });
		await listIconColorPanel
			.locator('.components-circular-option-picker__option')
			.first()
			.click();

		// List Icon Color を適用すると、選択した色のスラッグが List ブロックの
		// color 属性に設定される。付与される色のスラッグは有効テーマのパレット先頭色に
		// 依存する（旧テストは lightning テーマ前提で vk-has-black-color クラスを確認して
		// いたが、WP6.2 以降ではクラスではなく color 属性＋インラインスタイルで適用される）。
		// テーマ非依存にするため、color 属性に何らかの値が設定されたことを確認する。
		await expect
			.poll(async () =>
				page.evaluate(() => {
					// window.wp は型定義が無いため最小限のキャストで参照する。
					const wp = (window as any).wp;
					return (
						wp.data.select('core/block-editor').getSelectedBlock()
							?.attributes?.color ?? ''
					);
				})
			)
			.not.toBe('');
	});
});
