import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe('Spacer', () => {
	test.beforeEach(async ({ admin }) => {
		// それぞれのテストの前に新しい投稿を作成する
		await admin.createNewPost();
	});

	test('should insert spacer block', async ({ editor }) => {
		// レスポンシブスペーサーブロックを挿入する
		// （言語依存のスラッシュコマンドを避け、ブロック名で挿入する）
		await editor.insertBlock({ name: 'vk-blocks/spacer' });

		// シリアライズされたブロックの内容が期待値（スナップショット）と一致することを確認する
		expect(await editor.getEditedPostContent()).toBe(
			`<!-- wp:vk-blocks/spacer -->
<div class="wp-block-vk-blocks-spacer vk_spacer vk_spacer-type-margin-top"><div class="vk_block-margin-md--margin-top"></div></div>
<!-- /wp:vk-blocks/spacer -->`
		);
	});
});
