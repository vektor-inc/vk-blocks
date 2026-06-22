import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * ボタンブロック：サイズ5段階化 + 任意文字サイズ(fontSizeValue)方式の検証。
 * issue #2951 / PR #2986。
 *
 * UI は案B（コアの FontSizePicker 風）に整理済み。
 *  - 既定はプリセット（XS/S/M/L/XL）のセグメントを表示。
 *  - 「カスタムサイズ切替トグル（歯車アイコン / Set custom size）」を押すと
 *    セグメントが隠れ、数値入力（UnitControl）と Reset が現れる。
 *  - もう一度トグル（Use size preset）を押すとプリセットへ戻る（fontSizeValue は解除）。
 *
 * 観点:
 *  1. 既存ユーザー無破壊（fontSizeValue 未設定なら btn-{size} 付与・font-size 非出力）
 *  2. コア文字サイズ(Font size)コントロールがインスペクタに出ない
 *  3. 排他動作（数値指定→btn-* 消えて inline font-size 出力 / Reset・プリセット復帰で戻る）
 */
test.describe('Button font size (fontSizeValue)', () => {
	test.beforeEach(async ({ admin, editor }) => {
		await admin.createNewPost();
		// 設定サイドバーが閉じている環境（CI / 直前テストの状態次第）だと
		// サイドバー内の「Set custom size」等が見つからずタイムアウト FAIL するため、
		// 各テストの前に設定サイドバーを必ず開いた状態にしておく。
		await editor.openDocumentSettingsSidebar();
	});

	// blockId は挿入ごとに変わる UUID なので比較前に固定値へ正規化する。
	const normalize = (content: string) =>
		content.replace(/"blockId":"[^"]*"/, '"blockId":"test-button"');

	test('項目1: 既定挿入は btn-md 付与・font-size 非出力（既存ユーザー無破壊）', async ({
		editor,
	}) => {
		await editor.insertBlock({ name: 'vk-blocks/button' });

		const content = normalize(await editor.getEditedPostContent());

		// 既定（fontSizeValue 未設定・buttonSize=md）では btn-md が付き、
		// インライン font-size は出力されないこと。
		expect(content).toContain('btn-md');
		expect(content).not.toContain('font-size');
		expect(content).not.toContain('fontSizeValue');
	});

	test('項目1: 既存の保存済みボタン（btn-md・fontSizeValue 無し）を開いてもリカバリーが出ず出力が不変（後方互換）', async ({
		editor,
		page,
	}) => {
		// 「既存ユーザーが過去に保存した HTML」を再現するため、まず現行 save で
		// 1 個挿入してその出力（fontSizeValue 無し・btn-md）を取得する。
		// 手書き HTML はクラス順や属性の僅かな差でブロック検証が落ち、本来の検証
		// 意図（リカバリーが出ない）とは無関係な偽 FAIL を招くため、現行 save の
		// 出力をそのまま「既存データ」として往復させる方式を採る。
		await editor.insertBlock({ name: 'vk-blocks/button' });
		const legacyHtml = await editor.getEditedPostContent();

		// 取得した出力が「既存データ」の前提（btn-md・font-size 無し・fontSizeValue 無し）を
		// 満たしていることを念のため確認する。
		expect(legacyHtml).toContain('btn-md');
		expect(legacyHtml).not.toContain('font-size');
		expect(legacyHtml).not.toContain('fontSizeValue');

		// いったん全消去し、上記の「既存保存 HTML」をそのまま流し込んで再度開く。
		await editor.setContent(legacyHtml);

		// ブロックの検証エラー（リカバリーUI = .block-editor-warning）が出ていないこと。
		// 既存データが現行 save と一致して読み込めていれば、リカバリーは表示されない。
		await expect(page.locator('.block-editor-warning')).toHaveCount(0);

		// 再シリアライズ後も btn-md が残り、インライン font-size / fontSizeValue が
		// 付与されないこと（＝既存の保存済み HTML が無破壊で再保存される）。
		const reserialized = await editor.getEditedPostContent();
		expect(reserialized).toContain('btn-md');
		expect(reserialized).not.toContain('font-size');
		expect(reserialized).not.toContain('fontSizeValue');
		// 往復で出力 HTML が変化していないこと（バイト不変）。
		expect(normalize(reserialized)).toBe(normalize(legacyHtml));
	});

	test('項目3: カスタムサイズ切替→数値指定すると btn-* が消えて inline font-size が出力される', async ({
		editor,
		page,
	}) => {
		await editor.insertBlock({ name: 'vk-blocks/button' });

		const settings = page.getByRole('region', { name: 'Editor settings' });

		// 既定（プリセットモード）では数値入力欄(UnitControl)は表示されていない。
		// まず「カスタムサイズ切替トグル（Set custom size）」を押して数値入力欄を出す。
		await settings.getByRole('button', { name: 'Set custom size' }).click();

		// 出てきた Font Size(UnitControl) に 24px を入力する。
		// UnitControl のラベル "Font Size" で入力欄を特定する。
		const fontSizeInput = settings.getByRole('spinbutton', {
			name: 'Font Size',
		});
		await fontSizeInput.fill('24');

		// 反映待ち（属性更新→再シリアライズ）。
		await expect(async () => {
			const content = await editor.getEditedPostContent();
			// 数値指定時は btn-md（プリセット）が消え、inline font-size:24px が乗る。
			expect(content).toContain('"fontSizeValue":"24px"');
			expect(content).toMatch(/font-size:24px/);
			expect(content).not.toContain('btn-md');
		}).toPass({ timeout: 5000 });
	});

	test('項目3: プリセットへ戻すトグルで fontSizeValue が消え btn-md が復活する', async ({
		editor,
		page,
	}) => {
		await editor.insertBlock({ name: 'vk-blocks/button' });

		const settings = page.getByRole('region', { name: 'Editor settings' });

		// カスタムサイズ切替→数値入力。
		await settings.getByRole('button', { name: 'Set custom size' }).click();
		await settings
			.getByRole('spinbutton', { name: 'Font Size' })
			.fill('24');

		await expect(async () => {
			const content = await editor.getEditedPostContent();
			expect(content).toContain('"fontSizeValue":"24px"');
		}).toPass({ timeout: 5000 });

		// カスタムサイズモード中はトグルのラベルが「Use size preset」に変わる。
		// これを押すとプリセットへ戻り、fontSizeValue が解除される。
		await settings.getByRole('button', { name: 'Use size preset' }).click();

		await expect(async () => {
			const content = normalize(await editor.getEditedPostContent());
			// プリセット復帰後は btn-md が復活し、font-size は消えること。
			expect(content).toContain('btn-md');
			expect(content).not.toContain('font-size');
			expect(content).not.toContain('fontSizeValue');
		}).toPass({ timeout: 5000 });

		// プリセットのセグメント（XS/S/M/L/XL）が再表示されていること。
		// セグメントの「Extra Small」オプションの可視性で判定する。
		await expect(
			settings.getByRole('radio', { name: 'Extra Small' })
		).toBeVisible();
		// カスタムサイズの数値入力欄(UnitControl)は隠れていること。
		await expect(
			settings.getByRole('spinbutton', { name: 'Font Size' })
		).toHaveCount(0);
	});

	// 数値入力(UnitControl)の min=10 / max=100 / step=1 が、新規入力には効きつつ、
	// レンジ外のレガシー保存値（'200px'・'1.2em' 等）を「開いただけ／フォーカス→ブラー
	// しただけ」で書き換えないこと（後方互換）を検証する。
	// UnitControl に min/max を渡すと内部の number input がブラー時にレンジ外値を
	// 境界へクランプし onChange を発火しうるため、edit.js 側のガードでこの受動クランプを
	// 無視している。その効果を実ブラウザ・実コンポーネントで確認する。
	const insertLegacyFontSizeButton = async (
		editor,
		fontSizeValue: string
	) => {
		// 既存ユーザーがレンジ外の値を保存していた状態を再現する。現行 UI では
		// レンジ外値を新規入力できないため、属性を直接与えてブロックを挿入する。
		await editor.insertBlock({
			name: 'vk-blocks/button',
			attributes: { fontSizeValue },
		});
	};

	for (const legacy of ['200px', '1.2em']) {
		test(`項目1: レンジ外レガシー値(${legacy})は開いてフォーカス→ブラーしても書き換わらない（後方互換）`, async ({
			editor,
			page,
		}) => {
			await insertLegacyFontSizeButton(editor, legacy);

			// 挿入直後（マウントしただけ）で fontSizeValue が保持されていること。
			await expect(async () => {
				const content = await editor.getEditedPostContent();
				expect(content).toContain(`"fontSizeValue":"${legacy}"`);
			}).toPass({ timeout: 5000 });

			const settings = page.getByRole('region', {
				name: 'Editor settings',
			});

			// レガシー値があるとカスタムサイズモードで開くため、数値入力欄が見えている。
			const fontSizeInput = settings.getByRole('spinbutton', {
				name: 'Font Size',
			});
			await expect(fontSizeInput).toBeVisible();

			// 値を変えずにフォーカス→ブラー（別要素へフォーカス移動）する。
			// これが受動クランプ（200→100 / 1.2→10）を誘発しうる操作。
			await fontSizeInput.focus();
			await fontSizeInput.blur();

			// ブラー後も fontSizeValue がレガシー値のまま書き換わっていないこと。
			// しばらく待ってから確認し、遅延クランプも捕捉する。
			await page.waitForTimeout(500);
			const after = await editor.getEditedPostContent();
			expect(after).toContain(`"fontSizeValue":"${legacy}"`);
			expect(after).not.toContain('"fontSizeValue":"100px"');
			expect(after).not.toContain('"fontSizeValue":"10px"');
		});
	}

	test('項目1: 新規入力は min/max/step が効く（5→10 クランプ・53.5→54 整数化・150→100 クランプ）', async ({
		editor,
		page,
	}) => {
		await editor.insertBlock({ name: 'vk-blocks/button' });

		const settings = page.getByRole('region', { name: 'Editor settings' });
		await settings.getByRole('button', { name: 'Set custom size' }).click();
		const fontSizeInput = settings.getByRole('spinbutton', {
			name: 'Font Size',
		});

		// 下限未満 5 → 10 にクランプ。
		await fontSizeInput.fill('5');
		await fontSizeInput.blur();
		await expect(async () => {
			const content = await editor.getEditedPostContent();
			expect(content).toContain('"fontSizeValue":"10px"');
		}).toPass({ timeout: 5000 });

		// 小数 53.5 → 54 に整数化（step=1）。
		await fontSizeInput.fill('53.5');
		await fontSizeInput.blur();
		await expect(async () => {
			const content = await editor.getEditedPostContent();
			expect(content).toContain('"fontSizeValue":"54px"');
		}).toPass({ timeout: 5000 });

		// 上限超過 150 → 100 にクランプ。
		await fontSizeInput.fill('150');
		await fontSizeInput.blur();
		await expect(async () => {
			const content = await editor.getEditedPostContent();
			expect(content).toContain('"fontSizeValue":"100px"');
		}).toPass({ timeout: 5000 });
	});

	test('項目2: コアの文字サイズ(Font size)コントロールがインスペクタに出ない', async ({
		editor,
		page,
	}) => {
		await editor.insertBlock({ name: 'vk-blocks/button' });

		// 「スタイル」タブへ切り替える（WP 6.x の Settings/Styles 2タブ構造）。
		const stylesTab = page
			.getByRole('region', { name: 'Editor settings' })
			.getByRole('tab', { name: 'Styles' });
		if (await stylesTab.isVisible().catch(() => false)) {
			await stylesTab.click();
		}

		// コアの typography が出す Font size コントロール（preset/custom）は
		// block.json から __experimentalFontSize を外したので存在しないはず。
		// 特定のパネル class（.typography-block-support-panel 等）に依存すると、
		// その要素が無いときに「どこに出ていても」素通りで pass してしまうため、
		// Editor settings リージョン全体を対象に "Font size" ラベルの不在を確認する。
		// コア由来は小文字 s の "Font size"、独自 UnitControl は大文字 S の
		// "Font Size" なので、exact 一致では独自コントロールを誤検知しない。
		const editorSettings = page.getByRole('region', {
			name: 'Editor settings',
		});
		const hasCoreFontSize = await editorSettings
			.getByText('Font size', { exact: true })
			.count();
		expect(hasCoreFontSize).toBe(0);
	});
});
