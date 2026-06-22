import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * ボタンブロック：フロントエンドの computed font-size 検証。
 * issue #2951 / PR #2986。
 *
 * 観点:
 *  4. 5段階レンダリング（XL=1.5rem / L=1.25rem / M=1rem / S=0.875rem / XS=0.75rem）
 *  5. アイコン連動（iconSize 未指定→文字サイズに連動 / iconSize 指定→固定）
 *
 * ルート要素の font-size を 16px と仮定して rem を px 換算する。
 * （WP フロントの html は通常 16px。テスト内で実 root font-size も取得して計算する。）
 */
test.describe('Button font size (front-end render)', () => {
	test('項目4: 5段階プリセットの computed font-size', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();

		// XS / S / M / L / XL の5ボタンを順に挿入する（識別用に content を変える）。
		const sizes: Array<[string, number]> = [
			['xs', 0.75],
			['sm', 0.875],
			['md', 1],
			['lg', 1.25],
			['xl', 1.5],
		];
		for (const [size] of sizes) {
			await editor.insertBlock({
				name: 'vk-blocks/button',
				attributes: {
					buttonSize: size,
					content: `SIZE-${size}`,
				},
			});
		}

		const postId = await editor.publishPost();
		await page.goto(`/?p=${postId}`);

		// フロントの root font-size（rem の基準）を取得する。
		const rootFontPx = await page.evaluate(() =>
			parseFloat(
				getComputedStyle(document.documentElement).fontSize || '16'
			)
		);

		for (const [size, rem] of sizes) {
			const link = page.locator(`a.vk_button_link.btn-${size}`);
			await expect(link).toBeVisible();
			const fontPx = await link.evaluate((el) =>
				parseFloat(getComputedStyle(el).fontSize)
			);
			const expectedPx = rem * rootFontPx;
			// 端数を許容して比較する。
			expect(
				Math.abs(fontPx - expectedPx),
				`btn-${size}: expected ~${expectedPx}px, got ${fontPx}px`
			).toBeLessThan(1.5);
		}
	});

	test('項目3+4: 数値指定(24px)は inline font-size でフロント描画される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({
			name: 'vk-blocks/button',
			attributes: {
				fontSizeValue: '24px',
				content: 'NUM-24',
			},
		});

		const postId = await editor.publishPost();
		await page.goto(`/?p=${postId}`);

		// 数値指定時は btn-* が付かず、inline font-size:24px が乗る。
		const link = page.locator('a.vk_button_link', {
			hasText: 'NUM-24',
		});
		await expect(link).toBeVisible();
		const fontPx = await link.evaluate((el) =>
			parseFloat(getComputedStyle(el).fontSize)
		);
		expect(Math.abs(fontPx - 24)).toBeLessThan(0.5);
		// btn-* プリセットクラスが付いていないこと。
		const classAttr = (await link.getAttribute('class')) || '';
		expect(classAttr).not.toMatch(/\bbtn-(xs|sm|md|lg|xl)\b/);
	});

	test('項目5: アイコンは iconSize 未指定なら文字サイズに連動する', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();

		// (a) 数値文字サイズ 32px + アイコン（iconSize 未指定）→ アイコンは親 32px に連動（1em）。
		await editor.insertBlock({
			name: 'vk-blocks/button',
			attributes: {
				fontSizeValue: '32px',
				fontAwesomeIconBefore: '<i class="fas fa-star"></i>',
				content: 'ICON-LINK',
			},
		});
		// (b) 数値文字サイズ 32px + アイコン + iconSizeBefore=10px 固定 → アイコンは 10px 固定。
		await editor.insertBlock({
			name: 'vk-blocks/button',
			attributes: {
				fontSizeValue: '32px',
				fontAwesomeIconBefore: '<i class="fas fa-star"></i>',
				iconSizeBefore: '10px',
				content: 'ICON-FIXED',
			},
		});

		const postId = await editor.publishPost();
		await page.goto(`/?p=${postId}`);

		// (a) 連動: アイコン font-size ≒ ボタン font-size(32px)。
		const linkA = page.locator('a.vk_button_link', {
			hasText: 'ICON-LINK',
		});
		await expect(linkA).toBeVisible();
		const iconA = linkA.locator('.vk_button_link_before').first();
		const iconAPx = await iconA.evaluate((el) =>
			parseFloat(getComputedStyle(el).fontSize)
		);
		// FontAwesome のアイコンは 1em（親 font-size 継承）。inline 指定が無ければ親 32px に連動。
		expect(
			Math.abs(iconAPx - 32),
			`連動アイコン: expected ~32px, got ${iconAPx}px`
		).toBeLessThan(1);

		// (b) 固定: アイコン font-size = 10px（iconSizeBefore 指定）。
		const linkB = page.locator('a.vk_button_link', {
			hasText: 'ICON-FIXED',
		});
		await expect(linkB).toBeVisible();
		const iconB = linkB.locator('.vk_button_link_before').first();
		const iconBPx = await iconB.evaluate((el) =>
			parseFloat(getComputedStyle(el).fontSize)
		);
		expect(
			Math.abs(iconBPx - 10),
			`固定アイコン: expected 10px, got ${iconBPx}px`
		).toBeLessThan(0.5);
	});
});
