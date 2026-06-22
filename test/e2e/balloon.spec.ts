/**
 * 吹き出し（Balloon）ブロックの E2E テスト
 *
 * 旧 jest-puppeteer テスト（test/e2e-tests/specs/balloon.test.js）を
 * Playwright（@wordpress/e2e-test-utils-playwright）へ移植したもの。
 *
 * 【重要 / 環境依存の注意】
 *  - このテストはメディアのアップロードが正常に動作する環境であることが前提。
 *    メディアフレームの file input への setInputFiles が失敗する環境では通らない。
 *  - 最終アサーションはアップロード先 URL（年/月のディレクトリ + uuid ファイル名）が
 *    動的に変わるため、旧テストと同様に正規表現（toMatch）で検証する。
 *
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { escapeRegExp } from '../utils';

test.describe('Balloon', () => {
	// 各テストで作成する一時ファイルのパス（afterEach で確実に削除するため保持する）
	let tmpFileName: string | undefined;

	test.beforeEach(async ({ admin }) => {
		// それぞれのテストの前に新しい投稿を作成する
		tmpFileName = undefined;
		await admin.createNewPost();
	});

	test.afterEach(() => {
		// setInputFiles 用に作成した一時ファイルを削除する。
		// 削除に失敗してもテスト本体の結果に影響させたくないため、エラーは握りつぶし、
		// finally で必ず状態をクリアする。
		if (tmpFileName) {
			try {
				fs.rmSync(tmpFileName, { force: true });
			} catch (e) {
				// 一時ファイルの削除失敗はテスト結果に影響させない（ログのみ）
				// eslint-disable-next-line no-console
				console.warn(
					`一時ファイルの削除に失敗しました: ${tmpFileName}`,
					e
				);
			} finally {
				tmpFileName = undefined;
			}
		}
	});

	// 吹き出しブロック
	test('insertBlock Balloon', async ({ editor, page }) => {
		// ブロックを挿入する（block.json の title は "Ballon" [sic] だが
		// 正規のブロック名 vk-blocks/balloon を使う）
		await editor.insertBlock({ name: 'vk-blocks/balloon' });

		// アイコン画像のアップロードボタン（MediaUpload の Button、img alt="Upload image"）を
		// 押してメディアフレームを開く
		await editor.canvas
			.getByRole('button', { name: 'Upload image' })
			.click();
		await page.waitForSelector('.media-frame');

		/**
		 * 画像をアップロード
		 * 旧テスト同様、テスト画像を一時ファイルへ uuid 名でコピーしてから
		 * メディアフレームの file input へ setInputFiles する。
		 * アップロードされる画像の URL に uuid ファイル名が使われるため、
		 * 後段の正規表現アサーションでその名前を利用する。
		 */
		const testImagePath = path.join(
			__dirname,
			'..',
			'e2e-tests',
			'assets',
			'10x10_e2e_test_image_z9T8jK.png'
		);
		const filename = uuid();
		tmpFileName = path.join(os.tmpdir(), filename + '.png');
		fs.copyFileSync(testImagePath, tmpFileName);

		const fileInput = page.locator('.media-frame input[type="file"]');
		await fileInput.setInputFiles(tmpFileName);

		// メディアフレームの「選択（Select）」ボタンを押して画像を確定する
		await page.click('.media-frame-toolbar button.media-button');

		// アイコン名をタイプ
		await editor.canvas.locator('.vk_balloon_icon_name').click();
		await page.keyboard.type('Icon Name');

		// 吹き出しコンテンツをタイプ
		await editor.canvas
			.locator('.vk_balloon_content .wp-block-paragraph')
			.click();
		await page.keyboard.type('VK Balloon Content');

		// アイコン名をクリックしてサイドバーのパネルを Balloon ブロックに切り替える
		await editor.canvas.locator('.vk_balloon_icon_name').click();

		// 設定（Settings）サイドバーを開く
		await editor.openDocumentSettingsSidebar();

		// Position を Right に変更
		// ToggleGroupControlOption は role="radio"（aria-label）で描画されるため radio で取得する
		await page.getByRole('radio', { name: 'Right' }).click();

		// Type を Thinking に変更
		await page.getByRole('radio', { name: 'Thinking' }).click();

		// Image Style を Rounded に変更
		await page.getByRole('radio', { name: 'Rounded' }).click();

		// Border を追加（「Add border to balloon」ラベルのトグル）
		await page
			.locator('label', { hasText: 'Add border to balloon' })
			.click();

		// Border color をカスタムカラーに変更（Custom color picker を開く）
		// 現行の AdvancedColorPalette ではプリセットパレットの「Color: 〜」ボタンが
		// 存在しないため、直接カスタムカラーピッカーを開いて HEX を指定する
		// 枠線色（Border color）と背景色（Background color）で同名ボタンが 2 つあるため、
		// 先に現れる枠線色側（最初の要素）を対象にする
		await page
			.getByRole('button', { name: 'Custom color picker' })
			.first()
			.click();

		// 現行のカラーピッカーは初期表示が Hex フォーマットで、HEX 入力欄が
		// 直接表示されるため「Show detailed inputs」ボタンの操作は不要。
		// HEX 入力欄に 0782f6 を入力する（先頭の # は WordPress のカラーピッカーが自動付与するため不要）
		const colorInput = page.locator(
			'.components-popover__content .components-input-control .components-input-control__input'
		);
		// React の制御コンポーネントは fill() だと onChange が発火しないため、
		// クリック→クリア→キー入力（pressSequentially 相当）で実値を反映させる
		await colorInput.click();
		await colorInput.fill('');
		await page.keyboard.type('0782f6');

		// ホーム URL を取得する（/wp-admin より前を切り出す）
		const url = page.url();
		const homeUrl = url.substring(0, url.indexOf('/wp-admin'));

		// 動的に埋め込む homeUrl / filename は正規表現メタ文字（"." など）を含み得るため、
		// 正規表現に入れる前にエスケープする。アップロード先の年/月ディレクトリは
		// WordPress サーバー側のタイムゾーンで決まりテスト実行側と一致しない場合があるため、
		// 日時から組み立てず \d{4}/\d{2} で照合する。
		const homeUrlRe = escapeRegExp(homeUrl);
		const filenameRe = escapeRegExp(filename);

		// filename は設定する画像のファイル名（uuid）
		const regexBefore = new RegExp(
			`<!-- wp:vk-blocks/balloon {\\"balloonType\\":\\"type-think\\",\\"balloonBorder\\":true,\\"balloonBorderColor\\":\\"#0782f6\\",\\"balloonAlign\\":\\"position-right\\",\\"IconImage\\":\\"${homeUrlRe}/wp-content/uploads/\\d{4}/\\d{2}/${filenameRe}.png\\",\\"balloonImageType\\":\\"rounded\\"} -->
<div class=\\"wp-block-vk-blocks-balloon vk_balloon vk_balloon-position-right vk_balloon-type-think vk_balloon-animation-none\\"><div class=\\"vk_balloon_icon\\"><figure><img class=\\"vk_balloon_icon_image vk_balloon_icon_image-type-rounded  has-text-color\\" style=\\"border-color:#0782f6\\" src=\\"${homeUrlRe}/wp-content/uploads/\\d{4}/\\d{2}/${filenameRe}.png\\" alt=\\"\\"/><figcaption class=\\"vk_balloon_icon_name\\">Icon Name</figcaption></figure></div><div class=\\"vk_balloon_content_outer\\"><div class=\\"vk_balloon_content  vk_balloon_content-border-true has-text-color\\" style=\\"border-color:#0782f6\\"><span class=\\"vk_balloon_content_before  has-text-color\\"></span><span class=\\"vk_balloon_content_after  has-text-color\\" style=\\"border-color:transparent #0782f6 transparent transparent\\"></span><!-- wp:paragraph -->
<p>VK Balloon Content</p>
<!-- /wp:paragraph --></div></div></div>
<!-- /wp:vk-blocks/balloon -->`
		);

		// シリアライズされた投稿内容が期待する正規表現にマッチすることを検証
		expect(await editor.getEditedPostContent()).toMatch(regexBefore);
	});
});
