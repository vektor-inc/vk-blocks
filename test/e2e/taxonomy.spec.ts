import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// 公開済み投稿を保存する。WP 7.0 では公開済み投稿の更新ボタンが「Save」になり、
// 押下後に変更確認パネル（Editor publish リージョン）が表示される場合があるため、
// 確定の「Save」が出たら押す（表示されない設定にも対応）。保存完了まで待つ。
async function saveEditorPost(page: any) {
	await page
		.getByRole('region', { name: 'Editor top bar' })
		.getByRole('button', { name: 'Save', exact: true })
		.click();
	try {
		await page
			.getByRole('region', { name: 'Editor publish' })
			.getByRole('button', { name: 'Save', exact: true })
			.click({ timeout: 5000 });
	} catch {
		// 確認パネルが無い場合はそのまま保存完了
	}
	// 固定待機ではなく保存完了の確定的なシグナルを待つ。
	// 保存完了スナックバー（"Saved" 等）の表示とネットワーク静止のいずれかで判定し、
	// 環境によりどちらのシグナルも出ない場合でもテストが止まらないよう .catch() で握りつぶす。
	await page
		.locator('.components-snackbar')
		.first()
		.waitFor({ state: 'visible', timeout: 5000 })
		.catch(() => {});
	await page
		.waitForLoadState('networkidle', { timeout: 4000 })
		.catch(() => {});
}

// 公開完了を確定的シグナルで待つ。固定待機（waitForTimeout）の置き換え。
// 公開成功スナックバーの表示とネットワーク静止のいずれかで判定する。
// post_type_manage（ExUnit の CPT 定義画面）のように core/editor で公開状態を
// 追えない／公開時に画面リロードする画面でも動くよう、saveEditorPost と同じ
// best-effort パターンを用いる（シグナルが出ない環境でも止まらない）。
async function waitForPostPublished(page: any) {
	// 公開成功スナックバーの表示を主シグナルにする（通常 1〜2 秒で出る）。
	await page
		.locator('.components-snackbar')
		.first()
		.waitFor({ state: 'visible', timeout: 8000 })
		.catch(() => {});
	// networkidle はブロックエディタでは到達しない場合があるため短くタイムアウトを
	// 区切る（区切らないとテスト全体のタイムアウトまで待ち続けてしまう）。
	await page
		.waitForLoadState('networkidle', { timeout: 4000 })
		.catch(() => {});
}

// エディタが編集可能になるまで確定的に待ち、ウェルカムガイド等のモーダルが
// 出ていれば閉じる。固定待機（waitForTimeout）の置き換え。
// ※ ブロックエディタは heartbeat 等で networkidle に到達せずハングするため、
//   networkidle ではなく canvas 内のブロック描画完了をシグナルにする。
async function waitForEditorReady(editor: any, page: any) {
	await editor.canvas
		.locator('.is-root-container, .block-editor-default-block-appender')
		.first()
		.waitFor({ state: 'visible', timeout: 30000 });
	const modal = page.locator('.components-modal__frame');
	if (await modal.isVisible().catch(() => false)) {
		await modal
			.getByRole('button', { name: 'Close' })
			.click()
			.catch(() => {});
	}
}

test('Taxonomy Block Test', async ({ editor, page }) => {
	// 認証は @wordpress/e2e-test-utils-playwright の storageState（global-setup で
	// 管理者ログイン済みの状態を保存）で済んでいるため、手動ログインは不要。

	// Install ExUnit /////////////////////////////////////////////////
	await page.goto('/wp-admin/');
	// Check if the modal is visible
	const isPTM = await page
		.locator('#menu-posts-post_type_manage')
		.isVisible();

	// If the modal is visible, click the close button
	if (!isPTM) {
		// WP 6.5+ で Plugins 画面の「Add New」リンクは「Add Plugin」へ改称されたため、
		// リンク名に依存せずプラグイン追加画面（plugin-install.php）へ直接遷移する。
		await page.goto('/wp-admin/plugin-install.php');
		// WP 7.0 では検索欄の placeholder 「Search plugins...」が廃止され、
		// label 由来のアクセシブル名「Search Plugins」を持つ searchbox になっている。
		await page
			.getByRole('searchbox', { name: 'Search Plugins' })
			.fill('vk all in one expansion unit');
		await page
			.getByRole('searchbox', { name: 'Search Plugins' })
			.press('Enter');

		// ExUnit のアクションボタン（Install / Update / Activate のいずれか）。
		// Locator API（自動待機・auto-retry）に統一する。
		const actionButton = page
			.locator(
				'.plugin-card-vk-all-in-one-expansion-unit .plugin-action-buttons .button'
			)
			.first();
		await actionButton.waitFor();

		const buttonText = await actionButton.textContent();

		if (buttonText === 'Install Now') {
			// インストールボタンを待機してクリック
			const installButton = page.locator(
				'a[class="install-now button"][data-slug="vk-all-in-one-expansion-unit"]'
			);
			await installButton.waitFor();
			await installButton.click();
			// Activateボタンが表示されるまで待機
			await page
				.locator(
					'a[class="button activate-now button-primary"][data-slug="vk-all-in-one-expansion-unit"]'
				)
				.waitFor();
		} else if (buttonText === 'Update Now') {
			const updateButton = page.locator(
				'a[class*="update-now button"][data-slug="vk-all-in-one-expansion-unit"]'
			);
			if ((await updateButton.count()) > 0) {
				await updateButton.click();
				// アップデート完了まで待機
				await page
					.locator(
						'a[class*="button activate-now"][data-slug="vk-all-in-one-expansion-unit"]'
					)
					.waitFor();
			}
		}

		// ボタンが disabled かを確認（アンカーの場合 disabled は undefined → 有効化処理へ）
		const isDisabled = await actionButton.evaluate(
			(el: any) => el.disabled
		);

		// If the button is not disabled, click it
		// すでに ExUnit が有効化されていない場合のみ有効化処理を実行
		if (!isDisabled) {
			await page.goto('/wp-admin/plugins.php');
			// Activateボタンをクリックして有効化処理を実行
			await page
				.getByLabel('Activate VK All in One Expansion Unit')
				.click();

			// Activateボタンが消えるまで待機
			await page
				.locator(
					'a[class*="button activate-now"][data-slug="vk-all-in-one-expansion-unit"]'
				)
				.waitFor({ state: 'hidden' });
		}
	}

	// Add Event Post Type /////////////////////////////////////////////////

	await page.goto('/wp-admin/edit.php?post_type=post_type_manage');
	// WP 7.0 では一覧画面の「Add New {投稿タイプ}」ボタンが投稿タイプの add_new ラベル
	// （ここでは「Add Post」）で出力されるため、その名称で取得する。
	await page
		.locator('#wpbody-content')
		.getByRole('link', { name: 'Add Post' })
		.click();
	await page.getByLabel('Add title').fill('Event');
	await page.locator('#veu_post_type_id').fill('event');
	await page.getByText('title', { exact: true }).click();
	await page.getByText('editor', { exact: true }).click();
	await page
		.locator('[id="veu_taxonomy\\[1\\]\\[slug\\]"]')
		.fill('event-cat');
	await page
		.locator('[id="veu_taxonomy\\[1\\]\\[label\\]"]')
		.fill('Event Category');
	// CPT 定義を公開する。post_type_manage はブロックエディタのため、事前公開チェックが
	// 有効だと確認パネルが出る。設定に依存せず公開できるよう、確定ボタンが出たら押す。
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	try {
		await page
			.getByRole('region', { name: 'Editor publish' })
			.getByRole('button', { name: 'Publish', exact: true })
			.click({ timeout: 5000 });
	} catch {
		// 事前公開パネルが無効な場合は最初の Publish で公開完了
	}
	// CPT/タクソノミーの登録が反映される（公開完了）まで待つ
	await waitForPostPublished(page);

	// Set permalink
	await page.goto('/wp-admin/options-permalink.php');
	await page.getByLabel('Post name').check();
	await page.getByRole('button', { name: 'Save Changes' }).click();

	// Add event category /////////////////////////////////////////////////
	// CPT/タクソノミー（event-cat）の登録は ExUnit の init（公開後の後続リクエスト）で
	// 反映されるため、公開直後は edit-tags が「Invalid taxonomy」になることがある。
	// 固定待機ではなく、Name 入力欄が現れる＝登録反映済みになるまで edit-tags を
	// リロードして確定的に待つ（toPass によるリトライ）。
	// フレッシュな専用テスト環境（CI 等のコールド起動）では、ExUnit 有効化〜CPT 公開〜
	// パーマリンク反映〜タクソノミー登録の一連が暖機済み環境より時間を要するため、
	// 登録反映までの待機上限を長めに確保する。
	await expect(async () => {
		await page.goto(
			'/wp-admin/edit-tags.php?taxonomy=event-cat&post_type=event'
		);
		await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible({
			timeout: 2000,
		});
	}).toPass({ timeout: 90000 });
	await page.getByRole('textbox', { name: 'Name' }).fill('event-term');
	// WP 7.0 でカテゴリー系ラベルが「Add New Category」→「Add Category」へ簡略化された。
	await page.getByRole('button', { name: 'Add Category' }).click();

	// Add Event Post /////////////////////////////////////////////////
	await page.goto('/wp-admin/post-new.php?post_type=event');

	// エディタが編集可能になるまで待ち、モーダルが出ていれば閉じる。
	await waitForEditorReady(editor, page);

	// WP 7.0 ではエディタ本文（タイトル含む）が iframe(editor-canvas) 内にあるため
	// editor.canvas 経由で取得する。
	await editor.canvas
		.getByRole('textbox', { name: 'Add title' })
		.fill('Event Post');

	// ブロックを挿入する
	await editor.insertBlock({
		name: 'vk-blocks/taxonomy',
	});

	// サイドパネル（投稿タイプ）を開く
	await page.getByRole('tab', { name: 'Event' }).click();

	// 「Event Category」パネルが閉じていれば開く。
	// ElementHandle（page.$$）ではなく Locator API を使い auto-wait を活かす。
	const eventCategoryPanel = page
		.locator('.components-button.components-panel__body-toggle')
		.filter({ hasText: 'Event Category' })
		.first();
	if ((await eventCategoryPanel.getAttribute('aria-expanded')) === 'false') {
		await eventCategoryPanel.click();
	}

	await page.getByLabel('event-term').check();
	// 公開する。事前公開チェックの有効/無効でパネルの有無が変わるため、確定ボタンが
	// 出た場合のみ押す（設定に依存せず公開できるようにする）。
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	try {
		await page
			.getByRole('region', { name: 'Editor publish' })
			.getByRole('button', { name: 'Publish', exact: true })
			.click({ timeout: 5000 });
	} catch {
		// 事前公開パネルが無効な場合は最初の Publish で公開完了
	}
	// 公開完了を待ち、エディタ状態から公開した投稿の ID を取得する
	await waitForPostPublished(page);
	const eventPostId = await page.evaluate(() =>
		window.wp.data.select('core/editor').getCurrentPostId()
	);
	// getCurrentPostId() は number | string | null を返す。null だと post=null で遷移して
	// しまうため、後続の page.goto で使う前に有効な ID であることを保証する。
	expect(eventPostId).toBeTruthy();

	// 作成したタームをタクソノミーブロックの選択肢へ反映させるため、公開した投稿の
	// 編集画面を改めて開き直す（旧コードの「View Post→管理バーの Edit」往復の代替）。
	await page.goto(`/wp-admin/post.php?post=${eventPostId}&action=edit`);
	// エディタが編集可能になるまで待ち、モーダルが出ていれば閉じる。
	await waitForEditorReady(editor, page);

	// タクソノミーブロックで event-cat を指定（ブロックは iframe canvas 内）
	await editor.canvas
		.getByRole('document', { name: 'Block: Taxonomy' })
		.getByRole('listitem')
		.click();
	await page
		.getByRole('combobox', { name: 'Taxonomy' })
		.selectOption('event-cat');
	await page.getByLabel('Display as dropdown').check();
	// 変更を保存する
	await saveEditorPost(page);

	// タクソノミーブロックが配置された投稿（フロント）を表示する。
	// 旧コードは snackbar の View Post から遷移していたが、CPT 依存でラベルが変わるため
	// 取得済みの投稿 ID で直接遷移する。
	await page.goto(`/?p=${eventPostId}`);

	// Select event-cat in taxonomy block
	await page.selectOption('.vk_taxonomy__input-wrap--select', {
		value: 'event-term',
	});

	// チェック
	// Event Category ページが表示されてるはず
	// h1タグのテキストを取得する
	let h1Text = await page.locator('h1.wp-block-query-title').textContent();
	// expect関数を使用して、h1タグのテキストが「event-category」を含むことを確認する
	expect(h1Text).toContain('event-term');

	// Check post category /////////////////////////////////////////////////

	await page.goto('/wp-admin/post-new.php');
	// エディタが編集可能になるまで待ち、モーダルが出ていれば閉じる。
	await waitForEditorReady(editor, page);
	// タイトルは iframe(editor-canvas) 内
	await editor.canvas
		.getByRole('textbox', { name: 'Add title' })
		.fill('Test Post');
	// ブロックを挿入する
	await editor.insertBlock({
		name: 'vk-blocks/taxonomy',
	});
	await page.getByRole('tab', { name: 'Block' }).click();
	await page
		.getByLabel('Editor settings')
		.getByLabel('Taxonomy')
		.selectOption('category');
	await page.getByLabel('Display as dropdown').check();

	// サイドパネル（投稿タイプ）を開く
	await page.getByRole('tab', { name: 'Post' }).click();

	// await page.getByLabel('Add Tag').click();

	// サイドパネルが閉じている場合があるので、操作したいパネルが閉じていたら開く処理が必要

	// サイドパネルは後から描画されるため、操作対象の「Tags」パネルトグルが
	// 出現するまで確定的に待ち、閉じていれば開く（ElementHandle ではなく Locator API）。
	const tagsPanel = page
		.locator('.components-button.components-panel__body-toggle')
		.filter({ hasText: 'Tags' })
		.first();
	await tagsPanel.waitFor({ state: 'visible', timeout: 15000 });
	if ((await tagsPanel.getAttribute('aria-expanded')) === 'false') {
		await tagsPanel.click();
	}

	// Set tag to post
	await page.getByLabel('Add Tag').fill('test-tag');
	await page.getByLabel('Add Tag').press('Enter');
	// タグトークンが生成される（追加が反映される）まで確定的に待つ。
	await expect(
		page
			.locator('.components-form-token-field__token')
			.filter({ hasText: 'test-tag' })
	).toBeVisible({ timeout: 10000 });

	// await page.goto('/wp-admin/post.php?post=10&action=edit');

	// 公開する（確定パネルが出た場合のみ押す）。完了後にエディタ状態から投稿 ID を取得する。
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	try {
		await page
			.getByRole('region', { name: 'Editor publish' })
			.getByRole('button', { name: 'Publish', exact: true })
			.click({ timeout: 5000 });
	} catch {
		// 事前公開パネルが無効な場合は最初の Publish で公開完了
	}
	await waitForPostPublished(page);
	const testPostId = await page.evaluate(() =>
		window.wp.data.select('core/editor').getCurrentPostId()
	);
	// getCurrentPostId() は number | string | null を返す。null だと不正な URL になるため検証する。
	expect(testPostId).toBeTruthy();
	// Display Post ----------------------------------------------
	await page.goto(`/?p=${testPostId}`);
	// Select category in taxonomy block
	await page.selectOption('.vk_taxonomy__input-wrap--select', {
		value: 'uncategorized',
	});
	// チェック
	// h1タグのテキストを取得する
	h1Text = await page.locator('h1.wp-block-query-title').textContent();
	// expect関数を使用して、h1タグのテキストが「Uncategorized」を含むことを確認する
	expect(h1Text).toContain('Uncategorized');

	// Check Post tag /////////////////////////////////////////////////

	await page.getByRole('link', { name: 'Test Post' }).first().click();
	await page.locator('#wp-admin-bar-edit a').click();

	// Display Post ----------------------------------------------
	// 位置依存の .locator('div').nth(1) ではなく、e2e-utils の selectBlocks で
	// タクソノミーブロックを確実に選択する。
	await editor.selectBlocks(
		editor.canvas.getByRole('document', { name: 'Block: Taxonomy' })
	);
	// 対象を「post_tag」に変更
	await page
		.getByRole('combobox', { name: 'Taxonomy' })
		.selectOption('post_tag');
	await saveEditorPost(page);
	// フロント（単一投稿）へ遷移
	await page.goto(`/?p=${testPostId}`);
	// Select category in taxonomy block
	await page.selectOption('.vk_taxonomy__input-wrap--select', {
		value: 'test-tag',
	});
	// チェック
	// h1タグのテキストを取得する
	h1Text = await page.locator('h1.wp-block-query-title').textContent();
	// expect関数を使用して、h1タグのテキストが「test-tag」を含むことを確認する
	expect(h1Text).toContain('test-tag');

	//////////////////////////////////////////////////////////////////////////////////////////////

	// Delete Test post
	await page.goto('/wp-admin/edit.php?post_type=post');
	await page.locator('#cb-select-all-1').check();
	await page.locator('#bulk-action-selector-top').selectOption('trash');
	await page.locator('#doaction').click();
	await page.goto('/wp-admin/edit.php?post_status=trash&post_type=post');
	await page
		.locator('#post-query-submit + #delete_all')
		.filter({ hasText: 'Empty Trash' })
		.click();

	// Delete all event
	await page.goto('/wp-admin/edit.php?post_type=event');
	await page.locator('#cb-select-all-1').check();
	await page.locator('#bulk-action-selector-top').selectOption('trash');
	await page.locator('#doaction').click();
	await page.goto('/wp-admin/edit.php?post_status=trash&post_type=event');
	await page
		.locator('#post-query-submit + #delete_all')
		.filter({ hasText: 'Empty Trash' })
		.click();

	// 以降の後始末（ターム/CPT 定義/ExUnit の削除）は best-effort。
	// CI はクリーン環境で実行されるため、UI ラベル変更等で失敗してもテスト結果に影響させない。
	try {
		// Delete Event Category
		await page.goto(
			'/wp-admin/edit-tags.php?taxonomy=event-cat&post_type=event'
		);
		page.once('dialog', (dialog) => {
			dialog.accept().catch(() => {});
		});
		await page
			.locator('#the-list .row-title')
			.filter({ hasText: 'event-term' })
			.first()
			.click({ timeout: 5000 });
		await page
			.getByRole('link', { name: 'Delete' })
			.click({ timeout: 5000 });
	} catch {
		// 後始末失敗は無視
	}

	try {
		// Delete all post_type_manage
		await page.goto('/wp-admin/edit.php?post_type=post_type_manage');
		await page.locator('#cb-select-all-1').check();
		await page.locator('#bulk-action-selector-top').selectOption('trash');
		await page.locator('#doaction').click();
		await page.goto(
			'/wp-admin/edit.php?post_status=trash&post_type=post_type_manage'
		);
		await page
			.locator('#post-query-submit + #delete_all')
			.filter({ hasText: 'Empty Trash' })
			.click();
	} catch {
		// 後始末失敗は無視
	}

	// Delete ExUnit（best-effort）
	try {
		const isExUnitActive = await page
			.locator('#wp-admin-bar-veu_adminlink')
			.isVisible();
		if (isExUnitActive) {
			await page.goto('/wp-admin/plugins.php');
			page.once('dialog', (dialog) => {
				dialog.accept().catch(() => {});
			});
			await page
				.getByLabel('Deactivate VK All in One Expansion Unit')
				.click({ timeout: 5000 });
		}
	} catch {
		// 後始末失敗は無視
	}
});
