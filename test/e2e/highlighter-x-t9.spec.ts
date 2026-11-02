import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import { installAndActivateTheme } from './utils/theme';

/**
 * x-t9 テーマ依存の Highlighter（マーカー）テスト
 *
 * このテストはハイライト色を「x-t9」テーマのカラーパレットから取得する。
 * そのため x-t9 テーマがテスト実行環境にインストール・有効化されている必要がある。
 *
 * テーマのインストールについて:
 * - 未インストールの場合は beforeEach で wordpress.org のテーマディレクトリから自動的に
 *   インストールしてから有効化する（installAndActivateTheme ヘルパーを使用）。
 *   旧 jest-puppeteer 版の `installTheme()` 相当の処理をテスト内で行うことで、
 *   テーマ未インストール環境でもテストが通るようにしている。
 */
test.describe('x-t9 Highlighter', () => {
	// 各テスト前に x-t9 テーマをインストール（未インストール時のみ）して有効化する。
	// page は test スコープのフィクスチャのため beforeAll では使えず、beforeEach で行う。
	test.beforeEach(async ({ requestUtils, page }) => {
		await installAndActivateTheme(page, requestUtils, 'x-t9');
	});

	// 全テスト後にデフォルトテーマへ戻す。
	// global-setup のリセットと揃えて、最新 WP に必ず同梱される twentytwentyfive を使う
	// （twentytwentytwo は環境によって未インストールのため後片付けで失敗し得る）。
	test.afterAll(async ({ requestUtils }) => {
		await requestUtils.activateTheme('twentytwentyfive');
	});

	// 各テスト後に Global Styles（サイト側の独自色）を元へ戻す。
	// 残すと後続のテストのカラーパレットが変わる。
	test.afterEach(async ({ requestUtils }) => {
		await requestUtils.resetThemeGlobalStyles();
	});

	/**
	 * 段落に "1" と入力し、蛍光マーカーで指定した色を適用する。
	 *
	 * 以下の 'More' / 'Highlighter' / 色名は英語 UI ロケール前提のアクセシブルネーム。
	 * 他言語ロケールでは表示文言が変わるため、本テストは英語 UI 環境での実行を前提とする。
	 *
	 * @param admin     admin フィクスチャ
	 * @param editor    editor フィクスチャ
	 * @param page      page フィクスチャ
	 * @param colorName カラーパレットで選ぶ色の名前（パレットの name）
	 */
	async function applyHighlighter(admin, editor, page, colorName: string) {
		// 新しく投稿を作る
		await admin.createNewPost();

		// 段落ブロックを挿入し、テキスト "1" を入力する
		// （insertBlock 直後は新しい段落ブロックにフォーカスが当たっているため、
		//   そのままキーボード入力できる）
		await editor.insertBlock({ name: 'core/paragraph' });
		await page.keyboard.type('1');

		// 入力したテキストを全選択する
		await page.keyboard.press('ControlOrMeta+a');

		// ブロックツールバーのリッチテキスト「More」（フォーマット用）メニューを開く
		await page.getByRole('button', { name: 'More', exact: true }).click();

		// メニューから「Highlighter」を選択する
		await page.getByRole('menuitem', { name: 'Highlighter' }).click();

		// カラーパレットのスウォッチは role="option" でレンダリングされ、
		// アクセシブルネームは色名（パレットの name）になる
		await page
			.getByRole('option', { name: colorName, exact: true })
			.click();
	}

	test('x-t9 Highlighter', async ({ admin, editor, page }) => {
		// 色オプション「Text Secondary」を選択する（x-t9 パレット由来 → rgba(0,0,0,0.5)）
		await applyHighlighter(admin, editor, page, 'Text Secondary');

		// 出力された HTML が期待通り（vk_highlighter span）であることを検証する。
		// パレットの色なので色コードではなくスラッグが保存され、表示は CSS 変数で解決する。
		const content = await editor.getEditedPostContent();
		expect(content).toBe(
			`<!-- wp:paragraph -->
<p><span data-color="text-secondary" style="--vk-highlighter-color: var(--wp--preset--color--text-secondary, rgba(0,0,0,0.5));" class="vk_highlighter">1</span></p>
<!-- /wp:paragraph -->`
		);

		// #1356 の回帰ガード: 不透明度つきのパレット色には 0.7 を掛けない。
		// 0.7 を掛ける側の変数（--vk-highlighter-base）に入ると 0.5 が 0.35 へ二重に薄くなるため、
		// その変数名が出力に現れないことを明示的に確認する。
		expect(content).not.toContain('--vk-highlighter-base');
	});

	test('x-t9 Highlighter with a custom color in Global Styles', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		// サイト側の独自色（外観 > エディター > スタイル > 色 > パレット）を1色追加する。
		// WordPress コアは getSettings().colors に custom / theme / default のうち1階層しか
		// 入れない（wp-includes/block-editor.php）。独自色が1色でもあるとそこが custom 階層に
		// なり、テーマパレットの色が一覧から丸ごと外れる。この状態でもテーマパレットの色が
		// スラッグで保存される（= パレットの色変更に追従する）ことを確認する。
		const globalStylesPostId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		await requestUtils.rest({
			method: 'POST',
			path: `/wp/v2/global-styles/${globalStylesPostId}`,
			data: {
				id: globalStylesPostId,
				settings: {
					color: {
						palette: {
							custom: [
								{
									name: 'My Custom Color',
									slug: 'my-custom-color',
									color: '#abcdef',
								},
							],
						},
					},
				},
				styles: {},
			},
		});

		// テーマパレットの色「Primary」を選ぶ（x-t9 パレット由来 → #233A73）
		await applyHighlighter(admin, editor, page, 'Primary');

		expect(await editor.getEditedPostContent()).toBe(
			`<!-- wp:paragraph -->
<p><span data-color="primary" style="--vk-highlighter-base: var(--wp--preset--color--primary, #233A73);" class="vk_highlighter">1</span></p>
<!-- /wp:paragraph -->`
		);
	});

	test('x-t9 Highlighter follows a later change to the palette color', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		// テーマパレットの色「Primary」でマーカーを引いて公開する（x-t9 パレット由来 → #233A73）
		await applyHighlighter(admin, editor, page, 'Primary');
		const postId = await editor.publishPost();

		// フロントのマーカーについて、ベース色（--vk-highlighter-base）の解決結果と背景の有無を読む。
		// 背景は color-mix() の計算結果がブラウザごとに違う表記で返るため値そのものは比べず、
		// CSS 変数が指す色と、線が引かれていること（none でない）を見る。
		const readMarker = async () => {
			await page.goto(`/?p=${postId}`);
			return page.locator('.vk_highlighter').evaluate((element) => {
				const computed = getComputedStyle(element);
				return {
					base: computed
						.getPropertyValue('--vk-highlighter-base')
						.trim(),
					backgroundImage: computed.backgroundImage,
				};
			});
		};

		// パレットを変える前: マーカーを引いた時の色になっている
		const before = await readMarker();
		expect(before.base.toLowerCase()).toBe('#233a73');
		expect(before.backgroundImage).toContain('linear-gradient');

		// サイト側でテーマパレットの「Primary」を別の色へ変更する（サイトエディターでテーマの色を
		// 編集したときと同じ形）。記事本文は書き換えない。
		const globalStylesPostId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		await requestUtils.rest({
			method: 'POST',
			path: `/wp/v2/global-styles/${globalStylesPostId}`,
			data: {
				id: globalStylesPostId,
				settings: {
					color: {
						palette: {
							theme: [
								{
									name: 'Primary',
									slug: 'primary',
									color: '#e60000',
								},
							],
						},
					},
				},
				styles: {},
			},
		});

		// パレットを変えた後: 本文はそのままで、マーカーの色が変更後の色へ追従している。
		// 色コードを本文に書き込む従来の保存形式では、--vk-highlighter-base 自体が出力されず、
		// このテストは落ちる（追従する形式になっていることの陽性対照を兼ねる）。
		const after = await readMarker();
		expect(after.base.toLowerCase()).toBe('#e60000');
		expect(after.backgroundImage).toContain('linear-gradient');
		expect(after.backgroundImage).not.toBe(before.backgroundImage);
	});
});
