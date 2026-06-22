import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe('Block', () => {
	test.beforeEach(async ({ admin, page, requestUtils }) => {
		// 見出しブロックの色アサーション（has-accent-1-color）はテーマのカラーパレットに
		// 依存する。前回実行で別テーマ（twentytwentytwo 等）が残っていると accent-1 が
		// 存在せず失敗するため、twentytwentyfive を明示的に有効化して基準を揃える。
		await requestUtils.activateTheme('twentytwentyfive');

		// パーマリンクを設定
		await admin.visitAdminPage('options-permalink.php');
		await page.getByText('Post name').click();
		await page.getByRole('button', { name: 'Save Changes' }).click();

		// 非推奨ブロックを有効化
		await admin.visitAdminPage(
			'options-general.php?page=vk_blocks_options'
		);
		await page
			.getByRole('checkbox', { name: 'VKDeprecated Blocks' })
			.check();
		await page
			.locator('div')
			.filter({ hasText: /^Save setting$/ })
			.click();

		// それぞれのテストの前に新しい投稿を作成する
		await admin.createNewPost();
	});

	test('should be created', async ({ editor, page }) => {
		// ブロックを挿入する
		await editor.insertBlock({
			name: 'vk-blocks/heading',
		});

		// 文字を変更
		await editor.canvas.getByLabel('Input title…').click();
		await editor.canvas.getByLabel('Input title…').fill('aaaa');

		// マージン変更
		// #inspector-input-control-N は自動採番 ID で依存更新（@wordpress/components）により
		// 変動する（実測で 0/1/3 → 1/3/7 に変化）。これらの number 入力には aria-label が
		// 無いため、「Margin Setting」パネル内の number 入力を出現順で取得する（ID 非依存）。
		const marginPanel = page.locator('.components-panel__body', {
			hasText: 'Margin Setting',
		});
		const titleMargin = marginPanel.getByRole('spinbutton').nth(0);
		await titleMargin.click();
		await titleMargin.fill('1');
		const outerMargin = marginPanel.getByRole('spinbutton').nth(1);
		await outerMargin.click();
		await outerMargin.fill('1');

		// 見出し文字
		await page.getByRole('spinbutton', { name: 'Text size (rem)' }).click();
		await page
			.getByRole('spinbutton', { name: 'Text size (rem)' })
			.fill('2');
		// 見出しの文字色を Accent 1 に設定する。色 swatch の id（-N-M）は連番で不安定なため
		// aria-label「Accent 1」で取得する（最初の色パレット = 見出し文字色）。
		await page.getByLabel('Accent 1', { exact: true }).first().click();

		// サブテキスト
		await page.getByLabel('Display', { exact: true }).check();
		await editor.canvas.getByLabel('Input sub text…').click();
		await editor.canvas.getByLabel('Input sub text…').fill('bbbb');
		// サブテキストのサイズ用 RangeControl にはラベルが無く spinbutton 名で取れないため、
		// 「Sub Text Settings」パネル内に限定して number 入力を取得する（自動採番 ID 非依存）。
		const subTextSize = page
			.locator('.components-panel__body', {
				hasText: 'Sub Text Settings',
			})
			.getByRole('spinbutton')
			.first();
		await subTextSize.click();
		await subTextSize.fill('2');
		// サブテキストの文字色を設定する。色 swatch の id（components-circular-option-picker-N-M）は
		// レンダリング順に依存する連番で不安定なため、サブテキスト設定（最後に表示される
		// 色パレット）の最初の色を構造的に選択する。色の種類は後続アサーションで問わない。
		await page
			.locator('.components-circular-option-picker')
			.last()
			.locator('button.components-circular-option-picker__option')
			.first()
			.click();

		// 見出しに変換
		await page
			.getByLabel('Heading ( not recommended )', { exact: true })
			.click();
		await page.getByRole('menuitem', { name: 'Heading' }).click();

		// 変換内容
		// wp-elements-N の N は Style Engine が発行する連番で、テスト前の状態に依存して変動するため正規表現で吸収する
		await expect(editor.canvas.locator('.wp-block-heading')).toHaveClass(
			/^block-editor-rich-text__editable block-editor-block-list__block wp-block is-multi-selected wp-elements-\d+ has-accent-1-color has-text-color wp-block-heading rich-text$/
		);
		await expect(editor.canvas.locator('.wp-block-heading')).toHaveCSS(
			'margin-bottom',
			'16px'
		);
		await expect(editor.canvas.locator('p.has-text-color')).toHaveCSS(
			'font-size',
			'26.1152px'
		);
	});
});
