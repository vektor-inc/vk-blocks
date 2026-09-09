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

	test('Button Outer から単体化すると横並び属性を解除し、親へ戻した後も再設定できる', async ({
		editor,
		page,
	}) => {
		// 横並び専用の幅・ギャップを持つボタンを Button Outer 内に配置する。
		await editor.insertBlock({
			name: 'vk-blocks/button-outer',
			attributes: { gap: '24px' },
			innerBlocks: [
				{
					name: 'vk-blocks/button',
					attributes: {
						content: '移動するボタン',
						buttonWidthMobile: 100,
						buttonWidthTablet: 50,
						buttonWidth: 25,
						outerGap: '24px',
					},
				},
			],
		});

		// Button Outer の子から投稿ルートへ移動する。clientId を維持する移動でも
		// 親子関係の変化を検知して、横並び専用属性がすべて解除されることを確認する。
		const ids = await page.evaluate(() => {
			const blockEditor = window.wp.data.select('core/block-editor');
			const outer = blockEditor
				.getBlocks()
				.find((block) => block.name === 'vk-blocks/button-outer');
			return {
				outerClientId: outer.clientId,
				buttonClientId: outer.innerBlocks[0].clientId,
			};
		});
		await page.evaluate(({ outerClientId, buttonClientId }) => {
			window.wp.data
				.dispatch('core/block-editor')
				.moveBlocksToPosition([buttonClientId], outerClientId, '', 1);
		}, ids);

		await page.waitForFunction((buttonClientId) => {
			const button = window.wp.data
				.select('core/block-editor')
				.getBlock(buttonClientId);
			return (
				button?.attributes.buttonWidthMobile === 0 &&
				button?.attributes.buttonWidthTablet === 0 &&
				button?.attributes.buttonWidth === 0 &&
				button?.attributes.outerGap === null
			);
		}, ids.buttonClientId);

		const standaloneContent = await editor.getEditedPostContent();
		expect(standaloneContent).not.toContain('vk_button-width-mobile-');
		expect(standaloneContent).not.toContain('vk_button-width-tablet-');
		expect(standaloneContent).not.toContain('vk_button-width-25');
		expect(standaloneContent).not.toContain('width: calc(');

		// 同じボタンを Button Outer へ戻すと親の gap が再反映され、幅を再設定すれば
		// 横並びの幅クラスと gap 計算 CSS を再び生成できることも確認する。
		await page.evaluate(({ outerClientId, buttonClientId }) => {
			window.wp.data
				.dispatch('core/block-editor')
				.moveBlocksToPosition([buttonClientId], '', outerClientId, 0);
		}, ids);
		await page.waitForFunction((buttonClientId) => {
			const button = window.wp.data
				.select('core/block-editor')
				.getBlock(buttonClientId);
			return button?.attributes.outerGap === '24px';
		}, ids.buttonClientId);
		await page.evaluate((buttonClientId) => {
			window.wp.data
				.dispatch('core/block-editor')
				.updateBlockAttributes(buttonClientId, {
					buttonWidthMobile: 100,
					buttonWidthTablet: 50,
					buttonWidth: 25,
				});
		}, ids.buttonClientId);

		const nestedContent = await editor.getEditedPostContent();
		expect(nestedContent).toContain('vk_button-width-mobile-100');
		expect(nestedContent).toContain('vk_button-width-tablet-50');
		expect(nestedContent).toContain('vk_button-width-25');
		expect(nestedContent).toContain('width: calc(');
	});
});
