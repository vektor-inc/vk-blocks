import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// Decide that saving / publishing has finished from the editor state, not from a snackbar or
// networkidle (the block editor never reaches idle because of heartbeat etc., or waits a fixed time
// for it). Done once the post is published, not saving, and has no unsaved changes.
// 保存・公開の完了は、スナックバーの表示や networkidle（ブロックエディタは heartbeat 等で
// 到達しない／到達まで固定時間待つことになる）ではなく、エディタの状態で判定する。
// 公開済みで、保存中でなく、未保存の変更も無い状態になったら完了。

// Whether the editor is "published, not saving, and no unsaved changes".
// エディタが「公開済み・保存中でない・未保存の変更なし」かどうか。
const isEditorSettled = (page: any) =>
	page.evaluate(() => {
		const editorStore = window.wp.data.select('core/editor');
		return (
			editorStore.getCurrentPostAttribute('status') === 'publish' &&
			!editorStore.isSavingPost() &&
			!editorStore.isEditedPostDirty()
		);
	});

// Click the top bar button (Publish / Save); if the confirmation panel (Editor publish region)
// appears, click its button too, and wait until done. The panel appears or not depending on the
// pre-publish check setting and the WP version, so click it only when shown. Instead of a
// fixed-time try/catch, keep checking at short intervals until it completes.
// 上部バーのボタン（Publish / Save）を押し、確認パネル（Editor publish リージョン）が
// 出たらそのボタンも押して、完了するまで待つ。確認パネルは事前公開チェックの設定や
// WP のバージョンで出たり出なかったりするため、出たときだけ押す。
// 固定時間待つ try/catch ではなく、完了するまで短い間隔で確認し続ける。
async function clickAndWaitUntilSettled(page: any, label: 'Publish' | 'Save') {
	await page
		.getByRole('region', { name: 'Editor top bar' })
		.getByRole('button', { name: label, exact: true })
		.click();
	const confirmButton = page
		.getByRole('region', { name: 'Editor publish' })
		.getByRole('button', { name: label, exact: true });
	await expect
		.poll(
			async () => {
				if (await isEditorSettled(page)) {
					return true;
				}
				if (await confirmButton.isVisible()) {
					await confirmButton.click();
				}
				return false;
			},
			{ timeout: 30000, intervals: [250, 500, 1000] }
		)
		.toBe(true);
}

// Save a published post. In WP 7.0 the update button of a published post reads "Save".
// 公開済み投稿を保存する。WP 7.0 では公開済み投稿の更新ボタンが「Save」になる。
async function saveEditorPost(page: any) {
	await clickAndWaitUntilSettled(page, 'Save');
}

// Publish the post.
// 投稿を公開する。
async function publishEditorPost(page: any) {
	await clickAndWaitUntilSettled(page, 'Publish');
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

// The event custom post type (event) and taxonomy (event-cat) are registered by the mu-plugin
// (test/e2e/fixtures/mu-plugins/vk-e2e-event-cpt.php) loaded through wp-env `mappings`, instead of
// downloading VK All in One Expansion Unit from wordpress.org, to avoid results that vary with the
// external network (issue #3124). A leftover term (event-term) from a previous run makes "Add
// Category" fail as a duplicate, so delete it through the REST API before and after the test.
// The tag (test-tag) is deleted for the same reason: if it is left over, "Add Tag" in the editor
// takes the duplicate path (POST /wp/v2/tags returns 400) and may not attach to the post.
// イベント用のカスタム投稿タイプ（event）とタクソノミー（event-cat）は、ExUnit を
// wordpress.org から実際にダウンロードして使うのをやめ、wp-env の mappings で入れる
// mu-plugin（test/e2e/fixtures/mu-plugins/vk-e2e-event-cpt.php）が登録する。
// 外部ネットワークに依存して結果が揺らぐ（issue #3124）のを避けるため。
// 前回の実行で作ったターム（event-term）が残っていると「Add Category」で重複エラーに
// なるため、テストの前後で REST API 経由で消しておく。
// タグ（test-tag）も同じ理由で消す。前回の実行で残っていると、エディタでの「Add Tag」が
// 既存タームとの重複（POST /wp/v2/tags が 400）の経路に入り、投稿へ紐づかないことがある。
async function deleteTestTerms(
	requestUtils: any,
	restBase: string,
	search: string
) {
	try {
		const terms = await requestUtils.rest({
			path: `/wp/v2/${restBase}`,
			params: { per_page: 100, search },
		});
		for (const term of terms) {
			await requestUtils.rest({
				method: 'DELETE',
				path: `/wp/v2/${restBase}/${term.id}`,
				params: { force: true },
			});
		}
	} catch {
		// A failure (e.g. the taxonomy is not registered) must not affect the test verdict.
		// タクソノミーが未登録の環境などで失敗しても、テスト本体の判定には影響させない
	}
}

async function deleteAllTestTerms(requestUtils: any) {
	await deleteTestTerms(requestUtils, 'event-cat', 'event-term');
	await deleteTestTerms(requestUtils, 'tags', 'test-tag');
}

test('Taxonomy Block Test', async ({ editor, page, requestUtils }) => {
	// Authentication is already done by the storageState of @wordpress/e2e-test-utils-playwright
	// (the admin login saved in global-setup), so no manual login is needed.
	// 認証は @wordpress/e2e-test-utils-playwright の storageState（global-setup で
	// 管理者ログイン済みの状態を保存）で済んでいるため、手動ログインは不要。

	// Start by deleting terms left over from a previous run.
	// 前回の実行で残ったタームを消してから始める
	await deleteAllTestTerms(requestUtils);

	// Set permalink
	await page.goto('/wp-admin/options-permalink.php');
	await page.getByLabel('Post name').check();
	await page.getByRole('button', { name: 'Save Changes' }).click();

	// Add event category /////////////////////////////////////////////////
	// The mu-plugin registers event-cat on every load, so no retry wait is needed.
	// mu-plugin が毎回の読み込みで event-cat を登録するため、リトライ待ちは不要。
	await page.goto(
		'/wp-admin/edit-tags.php?taxonomy=event-cat&post_type=event'
	);
	await page.getByRole('textbox', { name: 'Name' }).fill('event-term');
	await page.getByRole('button', { name: 'Add Category' }).click();
	// Adding a term is Ajax, so wait until its row appears in the list (it is saved) before moving on.
	// ターム追加は Ajax のため、一覧に行が出る（保存された）まで待ってから次へ進む
	await expect(
		page.locator('#the-list .row-title').filter({ hasText: 'event-term' })
	).toBeVisible();

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
	// The settings sidebar may start closed (a setting closed by a previously run test persists), so
	// open it before looking for the tab. Does nothing if it is already open.
	// 設定サイドバーが閉じた状態で始まることがある（先に流れたテストが閉じた設定が残る）ため、
	// タブを探す前に開いておく。開いていれば何もしない。
	await editor.openDocumentSettingsSidebar();
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
	await publishEditorPost(page);
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
	// Here too, open the sidebar first even if it is closed, then choose the tab.
	// ここでも、サイドバーが閉じていても開いてからタブを選ぶ。
	await editor.openDocumentSettingsSidebar();
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
	// The token appears right after typing, but creating / fetching the tag (term) is asynchronous and
	// is not reflected in the post tags until it completes. Publishing before that publishes without
	// the tag (on a slow environment this made the later post_tag option missing). So wait until the
	// tag ID is in the editor state `tags` before publishing.
	// トークンは入力直後に表示されるが、タグ（ターム）の作成・取得は非同期で、完了するまで
	// 投稿のタグ（tags）に反映されない。完了前に公開すると、タグ無しで公開されてしまう
	// （処理の遅い環境で、後の post_tag の選択肢が出ない原因になる）。
	// そのため、エディタ状態の tags にタグの ID が入るまで待ってから公開する。
	await expect
		.poll(
			() =>
				page.evaluate(
					() =>
						window.wp.data
							.select('core/editor')
							.getEditedPostAttribute('tags')?.length ?? 0
				),
			{ timeout: 15000 }
		)
		.toBeGreaterThan(0);

	// await page.goto('/wp-admin/post.php?post=10&action=edit');

	// 公開する（確定パネルが出た場合のみ押す）。完了後にエディタ状態から投稿 ID を取得する。
	await publishEditorPost(page);
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

	// Cleanup: delete the posts created by this test (a regular post and an event post) completely
	// through the REST API, without the trash. It used to click "select all, trash, empty trash" in
	// the list screens, which took many page loads (close to the default 100 second cap) and also
	// deleted posts created by other tests. The IDs are known, so delete only those two.
	// 後始末: このテストで作った投稿（通常の投稿とイベント投稿）を、ゴミ箱を経由せず
	// REST API で完全に削除する。以前は一覧画面で「全選択→ゴミ箱→ゴミ箱を空にする」を
	// 画面操作していたが、画面遷移が多くテストが長くなる（既定の上限 100 秒に迫る）うえ、
	// 他のテストが作った投稿まで巻き込んで消していた。作った投稿の ID が分かっているので、
	// その 2 件だけを消す。
	await requestUtils.rest({
		method: 'DELETE',
		path: `/wp/v2/posts/${testPostId}`,
		params: { force: true },
	});
	await requestUtils.rest({
		method: 'DELETE',
		path: `/wp/v2/event/${eventPostId}`,
		params: { force: true },
	});

	// Also delete the terms that were created.
	// 作成したタームも消す
	await deleteAllTestTerms(requestUtils);
});
