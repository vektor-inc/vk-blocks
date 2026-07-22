import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * タブブロックのタブラベル パディング・角丸設定（issue #3022）の確認
 *
 * サイドバーから設定したパディング・角丸が、
 * ブロックの属性・ラッパーの CSS変数・フロントエンド出力に反映されることを確認する。
 */
test.describe('Tab block - タブラベルのパディング・角丸設定', () => {
	test.beforeEach(async ({ admin }) => {
		// 各テストの前に新しい投稿を作成する
		await admin.createNewPost();
	});

	test('サイドバーで設定したパディング・角丸が属性とラッパーの CSS変数に反映される', async ({
		editor,
		page,
	}) => {
		// タブブロックを挿入する（子のタブアイテムはテンプレートで自動生成される）
		await editor.insertBlock({ name: 'vk-blocks/tab' });

		// 設定サイドバーを開く
		await editor.openDocumentSettingsSidebar();

		// 「Tab Label Design」パネルを開く
		const panelToggle = page.getByRole('button', {
			name: 'Tab Label Design',
		});
		await panelToggle.click();

		// 上下パディングに 20（px）を入力する
		const verticalInput = page.getByRole('spinbutton', {
			name: 'Top and bottom',
		});
		await verticalInput.fill('20');
		await verticalInput.press('Enter');

		// 左右パディングに 30（px）を入力する
		const horizontalInput = page.getByRole('spinbutton', {
			name: 'Left and right',
		});
		await horizontalInput.fill('30');
		await horizontalInput.press('Enter');

		// 角丸（左上）に 10（px）を入力する
		const topLeftInput = page.getByRole('spinbutton', {
			name: 'Top left',
		});
		await topLeftInput.fill('10');
		await topLeftInput.press('Enter');

		// シリアライズされた内容に属性が保存されていることを確認する
		const content = await editor.getEditedPostContent();
		expect(content).toContain('"tabLabelPaddingVertical":"20px"');
		expect(content).toContain('"tabLabelPaddingHorizontal":"30px"');
		expect(content).toContain('"tabLabelBorderRadiusTopLeft":"10px"');

		// エディタ内のラッパー（.vk_tab）に CSS変数が付与されていることを確認する
		const wrapper = editor.canvas.locator('.vk_tab').first();
		const styleAttr = await wrapper.getAttribute('style');
		expect(styleAttr).toContain('--vk-tab-label-padding-vertical: 20px');
		expect(styleAttr).toContain('--vk-tab-label-padding-horizontal: 30px');
		expect(styleAttr).toContain(
			'--vk-tab-label-border-radius-top-left: 10px'
		);
	});

	test('未設定の場合はラッパーに CSS変数を出力しない（後方互換）', async ({
		editor,
	}) => {
		// タブブロックを挿入する
		await editor.insertBlock({ name: 'vk-blocks/tab' });

		// パディング・角丸を設定していない場合、属性は既定の空文字のまま
		const content = await editor.getEditedPostContent();
		// 空文字の属性はシリアライズされないため、値付きの属性が含まれないことを確認する
		expect(content).not.toContain('tabLabelPaddingVertical');
		expect(content).not.toContain('tabLabelBorderRadiusTopLeft');

		// エディタ内のラッパー（.vk_tab）にタブラベル用の CSS変数が付与されていないことを確認する
		// （WordPress が別目的で style を付与する場合に備え、style の有無ではなく該当変数の不在で判定する）
		const wrapper = editor.canvas.locator('.vk_tab').first();
		const styleAttr = await wrapper.getAttribute('style');
		expect(
			styleAttr === null || !styleAttr.includes('--vk-tab-label')
		).toBe(true);
	});
});
