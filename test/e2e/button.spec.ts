import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe('Button', () => {
	test.beforeEach(async ({ admin }) => {
		// それぞれのテストの前に新しい投稿を作成する
		await admin.createNewPost();
	});

	test('VK Button Block ( single )', async ({ editor }) => {
		// VK ボタンブロックを挿入する
		await editor.insertBlock({ name: 'vk-blocks/button' });

		// ボタンのラベル（RichText）に「VK ボタン」を入力する
		// 挿入したブロック内のボタンリンクテキストにフォーカスして入力する
		const buttonText = editor.canvas
			.getByRole('document', { name: 'Block: Button' })
			.locator('.vk_button_link_txt');
		await buttonText.click();
		// 入力前にキャレットを末尾へ移動する。:root ではなく対象の RichText 自体に
		// キーを送る（:root だとフォーカスが文書ルートへ移ってしまう）。
		await buttonText.press('End');
		await buttonText.pressSequentially('VK ボタン');

		// シリアライズされた内容を取得する。
		// blockId はブロック挿入時に自動生成される UUID のため、比較前に固定値へ正規化する。
		let content = await editor.getEditedPostContent();
		content = content.replace(
			/"blockId":"[^"]*"/,
			'"blockId":"test-button"'
		);

		// シリアライズされた内容が期待値と一致することを確認する。
		// 現行のボタンブロックはラベルを vk_button_link_caption でラップする出力になっている。
		expect(content).toBe(
			`<!-- wp:vk-blocks/button {"blockId":"test-button"} -->
<div class="wp-block-vk-blocks-button vk_button vk_button-color-custom vk_button-align-left"><a class="vk_button_link btn has-background has-vk-color-primary-background-color btn-md" role="button" aria-pressed="true" rel="noopener"><div class="vk_button_link_caption"><span class="vk_button_link_txt">VK ボタン</span></div></a></div>
<!-- /wp:vk-blocks/button -->`
		);
	});
});
