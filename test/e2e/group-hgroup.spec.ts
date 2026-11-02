import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * グループブロックの「見出しグループ（hgroup）」スイッチの確認。
 *
 * 【確認すること】
 *   1. スイッチを ON にすると <hgroup> で保存され、OFF にすると div に戻る
 *   2. 既存の div グループ・section グループを開いても、ブロックのリカバリーが出ない
 *   3. hgroup の中身が仕様に合わないとき、またはグループのリンクがあるときだけ警告が出る
 *
 * 認証・baseURL は標準 e2e ハーネス（global-setup / playwright.config）に従う。
 */

// 表示言語は英語（global-setup の既定）なので、画面上の文言は英語で探す
const SWITCH_LABEL = 'Mark up as a heading group (<hgroup>)';
const CONTENT_WARNING =
	'<hgroup> can only contain one Heading block and Paragraph blocks, such as a subtitle.';
const LINK_WARNING = 'Group links cannot be used with <hgroup>.';

// 見出し 1 つ + 段落 1 つ（hgroup の仕様に合う中身）
const headingAndParagraph = [
	{ name: 'core/heading', attributes: { content: 'Title', level: 2 } },
	{ name: 'core/paragraph', attributes: { content: 'Subtitle' } },
];

/**
 * サイドバーの警告（Notice）を文言で探す。
 * Notice は読み上げ用の隠し要素にも同じ文言が入るため、Notice の枠で絞る。
 *
 * @param {import('@playwright/test').Page} page ページ
 * @param {string}                          text 警告の文言
 */
const getNotice = (page, text) =>
	page.locator('.components-notice', { hasText: text });

/**
 * サイドバーの「Advanced」パネルを開く（閉じている場合だけ開く）。
 *
 * @param {import('@playwright/test').Page} page ページ
 */
const openAdvancedPanel = async (page) => {
	const toggle = page.getByRole('button', {
		name: 'Advanced',
		exact: true,
	});
	await toggle.waitFor();
	if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
		await toggle.click();
	}
};

test.describe('Group hgroup switch', () => {
	test.beforeEach(async ({ admin, editor }) => {
		await admin.createNewPost();
		await editor.setPreferences('core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		});
	});

	test('ON で hgroup として保存され、OFF で div に戻る', async ({
		editor,
		page,
	}) => {
		// 見出し + 段落を入れたグループを挿入（挿入直後はグループが選択された状態）
		await editor.insertBlock({
			name: 'core/group',
			innerBlocks: headingAndParagraph,
		});
		await editor.openDocumentSettingsSidebar();
		await openAdvancedPanel(page);

		const hgroupSwitch = page.getByRole('checkbox', {
			name: SWITCH_LABEL,
		});

		// 初期状態は OFF で、保存内容は div
		await expect(hgroupSwitch).not.toBeChecked();
		expect(await editor.getEditedPostContent()).not.toContain('<hgroup');

		// ON にすると <hgroup> で保存され、tagName 属性も hgroup になる
		await hgroupSwitch.check();
		await expect(hgroupSwitch).toBeChecked();
		const contentOn = await editor.getEditedPostContent();
		expect(contentOn).toContain('<hgroup class="wp-block-group">');
		expect(contentOn).toContain('"tagName":"hgroup"');

		// 本体の「HTML element」セレクトは選択肢に無い値のため「Default」表示になる
		await expect
			.poll(() =>
				page
					.getByRole('combobox', { name: 'HTML element' })
					.evaluate((select) => select.selectedOptions[0].textContent)
			)
			.toContain('Default');

		// 見出し + 段落だけなので警告は出ない
		await expect(getNotice(page, CONTENT_WARNING)).toHaveCount(0);

		// OFF に戻すと div に戻り、hgroup は残らない
		await hgroupSwitch.uncheck();
		await expect(hgroupSwitch).not.toBeChecked();
		const contentOff = await editor.getEditedPostContent();
		expect(contentOff).not.toContain('<hgroup');
		expect(contentOff).toContain('<div class="wp-block-group">');
	});

	test('本体の HTML 要素で section を選ぶとスイッチは OFF になる', async ({
		editor,
		page,
	}) => {
		await editor.insertBlock({
			name: 'core/group',
			attributes: { tagName: 'hgroup' },
			innerBlocks: headingAndParagraph,
		});
		await editor.openDocumentSettingsSidebar();
		await openAdvancedPanel(page);

		const hgroupSwitch = page.getByRole('checkbox', {
			name: SWITCH_LABEL,
		});
		await expect(hgroupSwitch).toBeChecked();

		// 本体のセレクトで section を選ぶ → tagName が section になりスイッチは OFF
		await page
			.getByRole('combobox', { name: 'HTML element' })
			.selectOption('section');
		await expect(hgroupSwitch).not.toBeChecked();
		expect(await editor.getEditedPostContent()).toContain(
			'<section class="wp-block-group">'
		);
	});

	test('既存の div / section / hgroup グループでブロックのリカバリーが出ない', async ({
		editor,
		page,
	}) => {
		// 保存済みの形のグループ（div・section と、hgroup で保存済みのもの）
		await editor.setContent(
			[
				'<!-- wp:group {"layout":{"type":"constrained"}} -->',
				'<div class="wp-block-group"><!-- wp:paragraph --><p>div group</p><!-- /wp:paragraph --></div>',
				'<!-- /wp:group -->',
				'<!-- wp:group {"tagName":"section","layout":{"type":"constrained"}} -->',
				'<section class="wp-block-group"><!-- wp:paragraph --><p>section group</p><!-- /wp:paragraph --></section>',
				'<!-- /wp:group -->',
				'<!-- wp:group {"tagName":"hgroup","layout":{"type":"constrained"}} -->',
				'<hgroup class="wp-block-group"><!-- wp:heading --><h2 class="wp-block-heading">Title</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Subtitle</p><!-- /wp:paragraph --></hgroup>',
				'<!-- /wp:group -->',
			].join('\n')
		);

		// すべてのグループが有効なブロックとして読み込まれている
		const validity = await page.evaluate(() =>
			window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.map((block) => block.isValid)
		);
		expect(validity).toEqual([true, true, true]);

		// リカバリーボタン（ブロックの警告）が出ていない
		await expect(
			page.locator('.block-editor-warning'),
			'ブロックの警告（リカバリー）が出ていない'
		).toHaveCount(0);

		// 読み込んだだけでは保存内容が変わらない
		const content = await editor.getEditedPostContent();
		expect(content).toContain('<div class="wp-block-group">');
		expect(content).toContain('<section class="wp-block-group">');
		expect(content).toContain('<hgroup class="wp-block-group">');
	});

	test('中身が仕様に合わないときだけ警告が出る', async ({ editor, page }) => {
		// 見出し 1 つ + 画像（見出し・段落以外）のグループで ON
		await editor.insertBlock({
			name: 'core/group',
			attributes: { tagName: 'hgroup' },
			innerBlocks: [
				{ name: 'core/heading', attributes: { content: 'Title' } },
				{ name: 'core/image' },
			],
		});
		await editor.openDocumentSettingsSidebar();
		await openAdvancedPanel(page);

		// 画像が混ざっているので警告が出る（閉じるボタンは無い）
		const warning = getNotice(page, CONTENT_WARNING);
		await expect(warning).toBeVisible();
		await expect(page.locator('.components-notice__dismiss')).toHaveCount(
			0
		);

		// 警告が出ていても編集は妨げない（スイッチを OFF にできる）
		const hgroupSwitch = page.getByRole('checkbox', {
			name: SWITCH_LABEL,
		});
		await hgroupSwitch.uncheck();
		await expect(warning).toHaveCount(0);
	});

	test('見出しが 1 つでないときの警告（見出しを足すと消える）', async ({
		editor,
		page,
	}) => {
		// 見出しが 0 個（段落だけ）なら警告が出る
		await editor.insertBlock({
			name: 'core/group',
			attributes: { tagName: 'hgroup' },
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Only' } },
			],
		});
		await editor.openDocumentSettingsSidebar();
		await openAdvancedPanel(page);
		await expect(getNotice(page, CONTENT_WARNING)).toBeVisible();

		// 見出しを足して見出し 1 + 段落 1 にすると警告が消える
		await editor.insertBlock(
			{ name: 'core/heading', attributes: { content: 'Title' } },
			{ clientId: await getSelectedClientId(page) }
		);
		await editor.selectBlocks(
			editor.canvas.locator('[data-type="core/group"]').first()
		);
		await expect(getNotice(page, CONTENT_WARNING)).toHaveCount(0);
	});

	test('hgroup でグループのリンクがあるときだけリンクの警告が出る', async ({
		editor,
		page,
	}) => {
		// リンク付きの hgroup（中身は仕様に合う形）
		await editor.insertBlock({
			name: 'core/group',
			attributes: {
				tagName: 'hgroup',
				linkUrl: 'https://example.com/',
			},
			innerBlocks: headingAndParagraph,
		});
		await editor.openDocumentSettingsSidebar();
		await openAdvancedPanel(page);

		// リンクの警告だけが出る
		await expect(getNotice(page, LINK_WARNING)).toBeVisible();
		await expect(getNotice(page, CONTENT_WARNING)).toHaveCount(0);

		// OFF にするとリンクの警告は消える（リンクは自動では解除されない）
		await page.getByRole('checkbox', { name: SWITCH_LABEL }).uncheck();
		await expect(getNotice(page, LINK_WARNING)).toHaveCount(0);
		expect(await editor.getEditedPostContent()).toContain(
			'"linkUrl":"https://example.com/"'
		);
	});

	test('中身が空の hgroup では警告が出ない', async ({ editor, page }) => {
		await editor.insertBlock({
			name: 'core/group',
			attributes: { tagName: 'hgroup' },
		});
		await editor.openDocumentSettingsSidebar();
		await openAdvancedPanel(page);

		await expect(
			page.getByRole('checkbox', { name: SWITCH_LABEL })
		).toBeChecked();
		await expect(getNotice(page, CONTENT_WARNING)).toHaveCount(0);
		await expect(getNotice(page, LINK_WARNING)).toHaveCount(0);
	});
});

/**
 * 現在選択中のブロックの clientId を返す。
 *
 * @param {import('@playwright/test').Page} page ページ
 * @return {Promise<string>} 選択中のブロックの clientId
 */
async function getSelectedClientId(page) {
	return page.evaluate(() =>
		window.wp.data.select('core/block-editor').getSelectedBlockClientId()
	);
}
