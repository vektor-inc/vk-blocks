import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * ボタンブロック：文字サイズUIの a11y 実測。
 * issue #2951 / PR #2986。植草(UX) の案B（コア FontSizePicker 風）検証。
 *
 * UI 構成（案B）:
 *  - 既定はプリセット（XS/S/M/L/XL）のセグメントを表示。
 *  - 「カスタムサイズ切替トグル（歯車 / Set custom size）」を押すと
 *    セグメントが隠れ、数値入力(UnitControl)＋Reset が現れる。
 *  - トグルには aria-pressed が付き、ON/OFF を支援技術へ伝える。
 *  - 状態変化は aria-live=polite の live region でアナウンスする。
 *
 * 観点(項目6):
 *  - カスタムサイズ切替トグルの aria-pressed 状態遷移
 *  - live region(aria-live=polite) の到達性
 *  - キーボードのみでトグル→数値→Reset を操作でき、フォーカスリングが見える
 */

test.describe('Button font size UI a11y', () => {
	test('項目6: カスタムサイズ切替トグルの aria-pressed と live region 到達性', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		// 設定サイドバーが閉じている環境だとサイドバー内要素が見つからないため、
		// 操作前に必ず開いた状態にしておく。
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock({ name: 'vk-blocks/button' });

		const settings = page.getByRole('region', { name: 'Editor settings' });

		// 既定（プリセットモード）ではトグルは「Set custom size」で aria-pressed=false。
		const toggleToCustom = settings.getByRole('button', {
			name: 'Set custom size',
		});
		await expect(toggleToCustom).toBeVisible();
		expect(await toggleToCustom.getAttribute('aria-pressed')).toBe('false');

		// プリセットのセグメントが見えていること。
		await expect(
			settings.getByRole('radio', { name: 'Extra Small' })
		).toBeVisible();

		// トグルを押してカスタムサイズモードへ。
		await toggleToCustom.click();

		// カスタムモードではトグルは「Use size preset」で aria-pressed=true。
		const toggleToPreset = settings.getByRole('button', {
			name: 'Use size preset',
		});
		await expect(toggleToPreset).toBeVisible();
		expect(await toggleToPreset.getAttribute('aria-pressed')).toBe('true');

		// セグメントが隠れ、数値入力欄(UnitControl)が現れていること。
		await expect(
			settings.getByRole('radio', { name: 'Extra Small' })
		).toHaveCount(0);
		await expect(
			settings.getByRole('spinbutton', { name: 'Font Size' })
		).toBeVisible();

		// live region(aria-live=polite) が存在し、状態変化のアナウンスに使えること。
		const liveRegion = settings.locator(
			'[aria-live="polite"].screen-reader-text'
		);
		expect(await liveRegion.count()).toBeGreaterThan(0);

		// 数値を入力すると「数値指定優先」のアナウンスが live region に流れる。
		await settings
			.getByRole('spinbutton', { name: 'Font Size' })
			.fill('24');
		await expect(liveRegion).toContainText(
			'The numeric font size takes priority.'
		);
	});

	test('項目6: キーボードのみでトグル→数値→プリセット復帰トグルを操作できフォーカスが見える', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		// 設定サイドバーが閉じている環境だとサイドバー内要素が見つからないため、
		// 操作前に必ず開いた状態にしておく。
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock({ name: 'vk-blocks/button' });

		const settings = page.getByRole('region', { name: 'Editor settings' });

		// カスタムサイズ切替トグルにフォーカスし、フォーカスリングが見えること。
		const toggleToCustom = settings.getByRole('button', {
			name: 'Set custom size',
		});
		await toggleToCustom.focus();
		const toggleFocusStyle = await toggleToCustom.evaluate((el) => {
			const s = getComputedStyle(el);
			return { outline: s.outlineStyle, boxShadow: s.boxShadow };
		});
		expect(
			toggleFocusStyle.outline !== 'none' ||
				(toggleFocusStyle.boxShadow &&
					toggleFocusStyle.boxShadow !== 'none')
		).toBeTruthy();

		// Enter/Space でトグルを発火し、数値入力欄を出す。
		await toggleToCustom.press('Enter');
		const fontSizeInput = settings.getByRole('spinbutton', {
			name: 'Font Size',
		});
		await expect(fontSizeInput).toBeVisible();

		// キーボードで入力欄にフォーカスして数値入力する。
		await fontSizeInput.focus();
		await fontSizeInput.fill('24');

		// カスタムサイズモード中はトグルが「Use size preset」（＝プリセットへ戻す
		// クリア導線）に変わる。これがキーボードで到達でき、フォーカスリングが見えること。
		const toggleToPreset = settings.getByRole('button', {
			name: 'Use size preset',
		});
		await expect(toggleToPreset).toBeVisible();

		await toggleToPreset.focus();
		const focusStyle = await toggleToPreset.evaluate((el) => {
			const s = getComputedStyle(el);
			return { outline: s.outlineStyle, boxShadow: s.boxShadow };
		});
		const hasFocusRing =
			focusStyle.outline !== 'none' ||
			(focusStyle.boxShadow && focusStyle.boxShadow !== 'none');
		expect(hasFocusRing).toBeTruthy();

		// Enter でプリセット復帰を発火でき、fontSizeValue が消え btn-md が復活すること。
		await toggleToPreset.press('Enter');
		await expect(async () => {
			const content = await editor.getEditedPostContent();
			expect(content).not.toContain('fontSizeValue');
			expect(content).toContain('btn-md');
		}).toPass({ timeout: 5000 });
	});
});
