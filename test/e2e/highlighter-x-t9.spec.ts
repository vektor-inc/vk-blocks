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

	test('x-t9 Highlighter', async ({ admin, editor, page }) => {
		// 新しく投稿を作る
		await admin.createNewPost();

		// 段落ブロックを挿入し、テキスト "1" を入力する
		// （insertBlock 直後は新しい段落ブロックにフォーカスが当たっているため、
		//   そのままキーボード入力できる）
		await editor.insertBlock({ name: 'core/paragraph' });
		await page.keyboard.type('1');

		// 入力したテキストを全選択する
		await page.keyboard.press('ControlOrMeta+a');

		// 以下の 'More' / 'Highlighter' / 'Text Secondary' は英語 UI ロケール前提の
		// アクセシブルネーム。他言語ロケールでは表示文言が変わるため、本テストは
		// 英語 UI 環境での実行を前提とする。
		// ブロックツールバーのリッチテキスト「More」（フォーマット用）メニューを開く
		await page.getByRole('button', { name: 'More', exact: true }).click();

		// メニューから「Highlighter」を選択する
		await page.getByRole('menuitem', { name: 'Highlighter' }).click();

		// 色オプション「Text Secondary」を選択する（x-t9 パレット由来 → rgba(0,0,0,0.5)）
		// カラーパレットのスウォッチは role="option" でレンダリングされ、
		// アクセシブルネームは色名（パレットの name）になる
		await page
			.getByRole('option', { name: 'Text Secondary', exact: true })
			.click();

		// 出力された HTML が期待通り（vk_highlighter span）であることを検証する
		expect(await editor.getEditedPostContent()).toBe(
			`<!-- wp:paragraph -->
<p><span data-color="rgba(0,0,0,0.5)" style="--vk-highlighter-color: rgba(0,0,0,0.5);" class="vk_highlighter">1</span></p>
<!-- /wp:paragraph -->`
		);
	});
});
