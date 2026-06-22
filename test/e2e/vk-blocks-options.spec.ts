/**
 * VK Blocks オプション設定ページ（options-general.php?page=vk_blocks_options）の e2e テスト。
 *
 * 旧 jest-puppeteer テスト（test/e2e-tests/specs/vk_blocks_options.test.js）からの移行版。
 *
 * 注意:
 * - 「Test Balloon Setting」はメディアアップロード（吹き出しアイコン画像）に依存する。
 *   テスト画像 test/e2e-tests/assets/10x10_e2e_test_image_z9T8jK.png を WordPress の
 *   メディアフレーム経由でアップロードするため、メディアライブラリの権限・動作に依存する。
 * - 各テストはライセンスキーやオプション値を変更するため、beforeEach でオプションページに
 *   遷移して独立性を保つ。ただし保存系テストは DB に値を永続化する点に留意（下記レポート参照）。
 */

/**
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

test.describe('Options', () => {
	// 一部のテストで作成する一時ファイルのパス（afterEach で確実に削除するため保持する）
	let tmpFileName: string | undefined;

	// 各テストの前に VK Blocks オプション設定ページへ遷移する
	test.beforeEach(async ({ admin }) => {
		tmpFileName = undefined;
		await admin.visitAdminPage(
			'options-general.php',
			'page=vk_blocks_options'
		);
	});

	test.afterEach(() => {
		// setInputFiles 用に作成した一時ファイルを削除する
		if (tmpFileName) {
			fs.rmSync(tmpFileName, { force: true });
			tmpFileName = undefined;
		}
	});

	test('Test License Key Space', async ({ page }) => {
		// 前後（全角スペース含む）にスペースを付けた文字列を入力する
		// fill() は既存の値をクリアしてから入力するため、全選択操作は不要
		const licenseKey = page.locator('#vk-blocks-pro-license-key');
		await licenseKey.fill(' test-license-key　');

		// フォーカスを外す（blur）ことで前後のスペースがトリムされる
		await licenseKey.blur();

		// トリムされて 'test-license-key' になっているか確認する
		await expect(licenseKey).toHaveValue('test-license-key');
	});

	test('Test License key', async ({ page }) => {
		// ライセンスキーを入力する
		// React の制御コンポーネント（TextControl）では fill() だと onChange が
		// 発火せず保存ボタンが有効化されないため、pressSequentially でキー入力する
		// 前回実行時の値が DB に残っている可能性があるので一度クリアしてから入力する
		const licenseKey = page.locator('#vk-blocks-pro-license-key');
		await licenseKey.click();
		await licenseKey.fill('');
		await licenseKey.pressSequentially('test-license-key');

		// 保存ボタンが有効化されるのを待ってから押す
		// ライセンスキー保存時は SaveButton 側で reloadFlag により location.reload() が
		// 走るため、テスト側からの reload() は行わず、自動リロード完了を待つ
		const saveButton = page.getByRole('button', { name: 'Save setting' });
		await expect(saveButton).toBeEnabled();
		// 保存時にライセンス処理が同一 URL（オプションページ）へ location.reload() するため、
		// 非推奨の waitForNavigation ではなく waitForURL でそのリロード完了を待つ。
		// リロード先は VK Blocks オプションページ（options-general.php?page=vk_blocks_options）に
		// 限定する。`/options-general\.php/` だけだと他の設定ページにもマッチしてしまうため、
		// page クエリまで含めて照合しリロード先を厳密に検証する。
		await Promise.all([
			page.waitForURL(/options-general\.php\?page=vk_blocks_options/, {
				waitUntil: 'load',
			}),
			saveButton.click(),
		]);

		// 保存した値が永続化されているか確認する
		await expect(page.locator('#vk-blocks-pro-license-key')).toHaveValue(
			'test-license-key'
		);
	});

	test('Test Balloon Width Setting', async ({ page }) => {
		// 吹き出しの枠線幅を 2px に変更する
		await page.selectOption(
			'select[name="vk_blocks_options[balloon_border_width]"]',
			'2'
		);

		// 保存ボタンが有効化されるのを待ってから押す（selectOption 後の有効化待ちで flaky を防ぐ）
		const saveButton = page.getByRole('button', { name: 'Save setting' });
		await expect(saveButton).toBeEnabled();
		await saveButton.click();

		// 保存処理を待ってからページを読み込み直す
		await page.waitForLoadState('load');
		await page.reload();
		await page.waitForLoadState('load');

		// 保存した値（2）が反映されているか確認する
		await expect(
			page.locator('#balloon-border-width-selector')
		).toHaveValue('2');
	});

	test('Test Balloon Setting', async ({ page }) => {
		// このテストは 2 番目（index=1）の吹き出しアイコン項目を対象にするため、
		// 少なくとも 2 項目が存在する状態を保証する。
		// 保存済みオプションの balloon_meta_lists が空の場合は項目が存在しないため、
		// 「Added balloon image setting」ボタンで必要数まで項目を追加する。
		const balloonItems = page.locator('ul.balloonIconList > li');
		const addButton = page.getByRole('button', {
			name: 'Added balloon image setting',
		});
		// クリックしても項目が増えない場合に無限ループしないよう、最大試行回数で打ち切る。
		const MAX_ADD_ATTEMPTS = 5;
		let addAttempts = 0;
		while ((await balloonItems.count()) < 2) {
			if (addAttempts >= MAX_ADD_ATTEMPTS) {
				throw new Error(
					`balloonIconList の項目を 2 件に増やせませんでした（${MAX_ADD_ATTEMPTS} 回試行）。"Added balloon image setting" ボタン（addButton）の動作を確認してください。`
				);
			}
			const prevCount = await balloonItems.count();
			await addButton.click();
			// クリック後の DOM 反映（li の追加）を確定的に待ってから再評価する。
			// 即座に count() すると更新前を読みうるため flaky になる。
			await expect(balloonItems).toHaveCount(prevCount + 1, {
				timeout: 5000,
			});
			addAttempts++;
		}

		// 吹き出しアイコンリストの 2 番目（index=1）の項目を対象にする
		const balloonItem = balloonItems.nth(1);

		// 前回実行時に画像が DB に保存されていると「Select」ボタン（.button-select）が
		// 画像クリア用の「Delete」ボタン（.button-delete）に置き換わっているため、
		// まず画像クリアボタンを押して未設定状態にリセットする
		// （項目自体を削除する .delete-item-button とは別物なのでクラスで明示的に指定する）
		const clearImageButton = balloonItem.locator('.button-delete');
		if (await clearImageButton.isVisible()) {
			await clearImageButton.click();
		}

		// 「Select」ボタンを押してメディアフレームを開く
		const selectButton = balloonItem.locator('.button-select');
		await expect(selectButton).toBeVisible();
		await selectButton.click();
		await page.locator('.media-frame').waitFor();

		// テスト画像を一意なファイル名でテンポラリにコピーしてアップロードする
		// （アップロード後の URL に含まれるファイル名で検証するため一意にする）
		const testImagePath = path.join(
			__dirname,
			'../e2e-tests/assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const filename = uuid();
		tmpFileName = path.join(os.tmpdir(), filename + '.png');
		fs.copyFileSync(testImagePath, tmpFileName);

		// メディアフレーム内の file input にファイルをセットする
		await page
			.locator('.media-frame input[type="file"]')
			.setInputFiles(tmpFileName);

		// メディアフレームのツールバーの選択ボタンを押す
		await page.locator('.media-frame-toolbar button.media-button').click();

		// 画像が選択され保存ボタンが有効化されるのを待ってから押す
		const saveButton1 = page.getByRole('button', {
			name: 'Save setting',
		});
		await expect(saveButton1).toBeEnabled();
		await saveButton1.click();
		await page.waitForLoadState('load');
		await page.reload();
		await page.waitForLoadState('load');

		// ホームの URL を取得する（/wp-admin より前の部分）。
		// '/wp-admin' が見つからない場合は空文字になってしまうため、その場合は origin にフォールバックする。
		const url = page.url();
		const adminIndex = url.indexOf('/wp-admin');
		const homeUrl =
			adminIndex !== -1
				? url.substring(0, adminIndex)
				: new URL(url).origin;

		// アップロードした画像の URL が src に設定されているか確認する。
		// 年/月ディレクトリは WordPress サーバー側のタイムゾーンで決まり、テスト実行側と
		// 一致しない場合があるため、日時から組み立てず \d{4}/\d{2} で照合する。
		await expect(
			page.locator('#balloonIconList_iconFrame_src_1')
		).toHaveAttribute(
			'src',
			new RegExp(
				`${escapeRegExp(
					homeUrl
				)}/wp-content/uploads/\\d{4}/\\d{2}/${escapeRegExp(
					filename
				)}\\.png$`
			)
		);

		// アイコンのタイトルを入力する（React の制御コンポーネントなのでキー入力する）
		// 前回実行時の値が残っている可能性があるので一度クリアしてから入力する
		const iconTitle = page.locator('#icon_title_1');
		await iconTitle.click();
		await iconTitle.fill('');
		await iconTitle.pressSequentially('test-name');

		// 保存ボタンが有効化されるのを待ってから押す
		const saveButton2 = page.getByRole('button', {
			name: 'Save setting',
		});
		await expect(saveButton2).toBeEnabled();
		await saveButton2.click();
		await page.waitForLoadState('load');
		await page.reload();
		await page.waitForLoadState('load');

		// 保存したアイコンタイトルが反映されているか確認する
		await expect(page.locator('#icon_title_1')).toHaveValue('test-name');
	});

	test('Test Common Margin Setting', async ({ page }) => {
		// 共通マージン（sm の pc 値）を 1 に変更する
		// React の制御コンポーネントなので fill() ではなくキー入力で onChange を発火させる
		const marginInput = page.locator(
			'input[name="vk_blocks_options[margin_size][sm][pc]"]'
		);
		await marginInput.click();
		await marginInput.fill('');
		await marginInput.pressSequentially('1');

		// 保存ボタンが有効化されるのを待ってから押す
		const saveButton = page.getByRole('button', { name: 'Save setting' });
		await expect(saveButton).toBeEnabled();
		await saveButton.click();
		await page.waitForLoadState('load');
		await page.reload();
		await page.waitForLoadState('load');

		// 保存した値（1）が反映されているか確認する
		await expect(
			page.locator('input[name="vk_blocks_options[margin_size][sm][pc]"]')
		).toHaveValue('1');
	});

	test('Test Load Separate Setting', async ({ page }) => {
		// CSS の分割読み込みオプションを ON にする。
		// click() だと前回実行時の状態によってトグルされてしまうため、
		// 冪等な check() で常に ON にしてから保存・検証する。
		const loadSeparate = page.locator(
			'input[name="vk_blocks_options[load_separate_option]"]'
		);
		await loadSeparate.check();

		// 保存ボタンを押す。既に ON 済み（前回実行の状態が残存）だと変更が無く
		// Save ボタンが無効のままになるため、有効な場合のみ押下して再読み込みする。
		const saveButton = page.getByRole('button', { name: 'Save setting' });
		if (await saveButton.isEnabled()) {
			await saveButton.click();
			await page.waitForLoadState('load');
			await page.reload();
			await page.waitForLoadState('load');
		}

		// 設定が ON（チェック済み）で反映されていることを確認する
		await expect(loadSeparate).toBeChecked();
	});

	test('FAQ Block Setting', async ({ page }) => {
		// FAQ ブロックのアコーディオン初期状態を open に変更する
		await page.selectOption(
			'select[name="vk_blocks_options[new_faq_accordion]"]',
			'open'
		);

		// 保存ボタンが有効化されるのを待ってから押す（selectOption 後の有効化待ちで flaky を防ぐ）
		const saveButton = page.getByRole('button', { name: 'Save setting' });
		await expect(saveButton).toBeEnabled();
		await saveButton.click();
		await page.waitForLoadState('load');
		await page.reload();
		await page.waitForLoadState('load');

		// 保存した値（open）が反映されているか確認する
		await expect(
			page.locator('select[name="vk_blocks_options[new_faq_accordion]"]')
		).toHaveValue('open');
	});

	test('Custom Format Setting', async ({ page }) => {
		// カスタムフォーマットのタイトルを入力する
		// React の制御コンポーネントなので fill() ではなくキー入力で onChange を発火させる
		// 前回実行時の値が DB に残っている可能性があるので一度クリアしてから入力する
		const formatTitle = page.locator('#vk_blocks_custom_format_0_title');
		await formatTitle.click();
		await formatTitle.fill('');
		await formatTitle.pressSequentially('Test Custom Format');

		// 保存ボタンが有効化されるのを待ってから押す
		const saveButton = page.getByRole('button', { name: 'Save setting' });
		await expect(saveButton).toBeEnabled();
		await saveButton.click();
		await page.waitForLoadState('load');
		await page.reload();
		await page.waitForLoadState('load');

		// 保存したカスタムフォーマットのタイトルが反映されているか確認する
		// 入力時と同じロケータ（formatTitle）で検証して対象 DOM を一致させる。
		await expect(formatTitle).toHaveValue('Test Custom Format');
	});
});
