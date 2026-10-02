import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * アイコンブロック（vk-blocks/icon）の「スタイルをコピー/貼り付け」（issue #3205）
 *
 * Icon block (vk-blocks/icon) "Copy styles" / "Paste styles" (issue #3205).
 *
 * クリップボード API を使うため、各テストの前にブラウザコンテキストへ
 * clipboard-read / clipboard-write の権限を付与する。
 *
 * Grants clipboard-read / clipboard-write permissions on the browser context
 * before each test, since the feature relies on the Clipboard API.
 */
test.describe('Icon block - スタイルをコピー/貼り付け', () => {
	test.beforeEach(async ({ admin, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await admin.createNewPost();
	});

	test('ブロック設定メニュー（⋮）に「Copy styles」「Paste styles」が表示される', async ({
		editor,
		page,
	}) => {
		await editor.insertBlock({ name: 'vk-blocks/icon' });

		// ブロック設定メニュー（⋮）を開く
		await editor.clickBlockToolbarButton('Options');

		await expect(
			page.getByRole('menuitem', { name: 'Copy styles' })
		).toBeVisible();
		await expect(
			page.getByRole('menuitem', { name: 'Paste styles' })
		).toBeVisible();
	});

	test('色・サイズを変えたアイコンをコピーし、faIcon・リンク・配置を別に設定したアイコンへ貼り付けると、スタイルだけ移り faIcon・リンク・配置は変わらない', async ({
		editor,
		page,
	}) => {
		// 1つ目のアイコン: 色・サイズ・余白・角丸・形状を変更する（コピー元）
		await editor.insertBlock({ name: 'vk-blocks/icon' });
		const firstBlock = editor.canvas
			.locator('[data-type="vk-blocks/icon"]')
			.first();
		await firstBlock.click();

		await editor.openDocumentSettingsSidebar();

		// サイズを 60px に変更する
		const sizeInput = page
			.locator('.vk_icon_custombox_number input')
			.first();
		await sizeInput.fill('60');
		await sizeInput.press('Tab');

		// アイコン色は「親カラーを継承」を外して背景色を変更する。
		const inheritCheckbox = page.getByRole('checkbox', {
			name: 'Inherit Parent Color',
		});
		if (await inheritCheckbox.isChecked()) {
			await inheritCheckbox.uncheck();
		}

		const contentAfterEdit = await editor.getEditedPostContent();
		expect(contentAfterEdit).toContain('"iconSize":60');

		// 「Copy styles」を実行する
		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Copy styles' }).click();
		// 通知はスナックバー（画面下）とスクリーンリーダー向け読み上げ領域の
		// 2箇所に同じ文言が出るため、スナックバーに絞って確認する。
		await expect(
			page
				.getByTestId('snackbar')
				.filter({ hasText: 'Styles copied to clipboard.' })
		).toBeVisible();

		// 2つ目のアイコン（貼り付け先）: faIcon・リンク URL・配置をあらかじめ
		// コピー元とは別の値に設定しておく。コピー対象外の属性のため、貼り付け後も
		// この値のまま変わらないことを確認する。
		await editor.insertBlock({
			name: 'vk-blocks/icon',
			attributes: {
				faIcon: '<i class="fas fa-star"></i>',
				iconUrl: 'https://example.com/target-link',
				iconAlign: 'right',
			},
		});
		const secondBlock = editor.canvas
			.locator('[data-type="vk-blocks/icon"]')
			.nth(1);
		await secondBlock.click();

		// 「Paste styles」を実行する
		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Paste styles' }).click();
		await expect(
			page
				.getByTestId('snackbar')
				.filter({ hasText: 'Pasted styles to Icon.' })
		).toBeVisible();

		const contentAfterPaste = await editor.getEditedPostContent();

		// 2つ目のアイコンにも "iconSize":60 が反映されている（スタイルが移った）
		const iconSizeMatches = contentAfterPaste.match(/"iconSize":60/g);
		expect(iconSizeMatches?.length).toBe(2);

		// コピー対象外の属性（faIcon・リンク URL・配置）は貼り付け先の設定のまま変わらない
		expect(contentAfterPaste).toContain('fa-star');
		expect(contentAfterPaste).toContain(
			'"iconUrl":"https://example.com/target-link"'
		);
		expect(contentAfterPaste).toContain('"iconAlign":"right"');
	});

	test('Icon Outer の子アイコンへ貼り付けると色だけ反映され、その旨の通知が出る', async ({
		editor,
		page,
	}) => {
		// コピー元: 色を変更したアイコン
		await editor.insertBlock({
			name: 'vk-blocks/icon',
			attributes: { iconColor: '#ff0000' },
		});
		await editor.canvas
			.locator('[data-type="vk-blocks/icon"]')
			.first()
			.click();
		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Copy styles' }).click();
		await expect(
			page
				.getByTestId('snackbar')
				.filter({ hasText: 'Styles copied to clipboard.' })
		).toBeVisible();

		// Icon Outer ブロックを追加する（テンプレートで子アイコンが2つ生成される）
		await editor.insertBlock({ name: 'vk-blocks/icon-outer' });
		const childIcon = editor.canvas
			.locator(
				'[data-type="vk-blocks/icon-outer"] [data-type="vk-blocks/icon"]'
			)
			.first();
		await childIcon.click();

		// 子アイコンに「Paste styles」を実行する
		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Paste styles' }).click();

		// 色だけ反映され、サイズ等は親の設定に従う旨の通知が出る
		await expect(
			page.getByTestId('snackbar').filter({
				hasText:
					'Pasted color to 1 icon in the Icon Outer block. Size, margin, corner radius and style follow the Icon Outer block setting.',
			})
		).toBeVisible();

		const content = await editor.getEditedPostContent();
		// 子アイコンの色は反映されている
		expect(content).toContain('#ff0000');
		// サイズは Icon Outer の既定値（36px）のまま（親の設定に従う）
		expect(content).not.toContain('"iconSize":60');
	});

	test('複数のアイコンを選択して貼り付けると、1回の元に戻すで全て戻る', async ({
		editor,
		page,
		pageUtils,
	}) => {
		// コピー元: サイズを変更したアイコン
		await editor.insertBlock({ name: 'vk-blocks/icon' });
		await editor.canvas
			.locator('[data-type="vk-blocks/icon"]')
			.first()
			.click();
		await editor.openDocumentSettingsSidebar();
		const sizeInput = page
			.locator('.vk_icon_custombox_number input')
			.first();
		await sizeInput.fill('60');
		await sizeInput.press('Tab');

		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Copy styles' }).click();
		await expect(
			page
				.getByTestId('snackbar')
				.filter({ hasText: 'Styles copied to clipboard.' })
		).toBeVisible();

		// 貼り付け先の2つのアイコン（既定値）を追加する
		await editor.insertBlock({ name: 'vk-blocks/icon' });
		await editor.insertBlock({ name: 'vk-blocks/icon' });

		// 2つ目・3つ目のアイコンを両方選択する
		const secondBlock = editor.canvas
			.locator('[data-type="vk-blocks/icon"]')
			.nth(1);
		const thirdBlock = editor.canvas
			.locator('[data-type="vk-blocks/icon"]')
			.nth(2);
		await secondBlock.click();
		await thirdBlock.click({ modifiers: ['Shift'] });

		// 「Paste styles」を実行する
		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Paste styles' }).click();
		await expect(
			page
				.getByTestId('snackbar')
				.filter({ hasText: 'Pasted styles to 2 blocks.' })
		).toBeVisible();

		const contentAfterPaste = await editor.getEditedPostContent();
		expect(contentAfterPaste.match(/"iconSize":60/g)?.length).toBe(3);

		// 1回の「元に戻す」で、貼り付けた2ブロック分がまとめて戻る
		await pageUtils.pressKeys('primary+z');
		const contentAfterUndo = await editor.getEditedPostContent();
		expect(contentAfterUndo.match(/"iconSize":60/g)?.length).toBe(1);
	});

	test('見出しブロックをコピーした状態でアイコンに「Paste styles」を実行すると警告通知が出る', async ({
		editor,
		page,
	}) => {
		// 見出しブロックを作成し、コアの「Copy」でクリップボードへコピーする
		await editor.insertBlock({
			name: 'core/heading',
			attributes: { content: 'サンプル見出し' },
		});
		await editor.clickBlockToolbarButton('Options');
		await page
			.getByRole('menuitem', { name: 'Copy' })
			.filter({ hasNotText: 'styles' })
			.click();

		// アイコンブロックを追加して「Paste styles」を実行する
		await editor.insertBlock({ name: 'vk-blocks/icon' });
		await editor.clickBlockToolbarButton('Options');
		await page.getByRole('menuitem', { name: 'Paste styles' }).click();

		await expect(
			page.getByTestId('snackbar').filter({
				hasText:
					"Unable to paste styles. Block styles couldn't be found within the copied content.",
			})
		).toBeVisible();
	});
});
