import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * 投稿リスト / 投稿リストスライダーブロックの「表示条件」パネルにある
 * タクソノミー（カテゴリー）チェックボックスの操作が、ブロック属性へ
 * 即座に反映されることを確認する回帰テスト。
 *
 * かつて display-condition の state→属性 同期 useEffect が失われたことで、
 * AdvancedCheckboxControl の onChange が古いクロージャの値で属性を上書きし、
 * チェック操作が「1操作遅れて」反映される（チェックが外せない／プレビューに
 * 反映されない）デグレが発生した。本テストはその再発を検知する。
 *
 * テーマ非依存にするため、クリーンな wp-env に必ず存在する既定カテゴリー
 * 「Uncategorized」を対象にする（投稿タイプ post は既定で選択済みのため
 * カテゴリーのチェックボックスが表示される）。
 *
 * @see https://github.com/vektor-inc/vk-blocks-pro/pull/3008#issuecomment-4668810785
 */

// 検証対象のブロック（UI・クエリを共有しているため両方を確認する）
const TARGET_BLOCKS = [
	{ name: 'vk-blocks/post-list', label: '投稿リスト' },
	{ name: 'vk-blocks/post-list-slider', label: '投稿リストスライダー' },
];

test.describe('Post list display condition checkbox', () => {
	for (const block of TARGET_BLOCKS) {
		test(`${block.label}: タクソノミーのチェック操作が属性へ即座に反映される`, async ({
			admin,
			editor,
			page,
		}) => {
			// 新規投稿を作成し、対象ブロックを挿入する
			await admin.createNewPost();
			await editor.insertBlock({ name: block.name });

			// ドキュメント設定サイドバーを開く
			await editor.openDocumentSettingsSidebar();

			// 「表示条件」パネルを開く（initialOpen=false のため明示的に展開する）
			await page
				.getByRole('button', { name: 'Display conditions' })
				.click();

			// 対象ブロックの属性を読み出すヘルパー。
			// 属性は JSON 文字列（ターム ID の配列）で保持されるためパースして返す。
			const readTermAttr = async (attr: string) => {
				const blocks = await editor.getBlocks();
				return JSON.parse(blocks[0].attributes[attr] || '[]');
			};

			// 「Uncategorized」チェックボックスは絞り込み用・除外用の 2 つが
			// この順で描画される（先＝絞り込み / 後＝除外）。
			const filterCheckbox = page
				.getByRole('checkbox', { name: 'Uncategorized' })
				.first();
			const excludeCheckbox = page
				.getByRole('checkbox', { name: 'Uncategorized' })
				.last();

			// --- 絞り込み（isCheckedTerms） ---
			// チェックを入れる → 属性に即座にターム ID が追加される
			await filterCheckbox.click();
			await expect(filterCheckbox).toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('isCheckedTerms')).length)
				.toBeGreaterThan(0);

			// チェックを外す → 属性が即座に空に戻る（「外せない」デグレの検知）
			await filterCheckbox.click();
			await expect(filterCheckbox).not.toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('isCheckedTerms')).length)
				.toBe(0);

			// --- 除外（exclusionTerms） ---
			// チェックを入れる → 除外属性に即座にターム ID が追加される
			await excludeCheckbox.click();
			await expect(excludeCheckbox).toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('exclusionTerms')).length)
				.toBeGreaterThan(0);

			// チェックを外す → 除外属性が即座に空に戻る
			await excludeCheckbox.click();
			await expect(excludeCheckbox).not.toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('exclusionTerms')).length)
				.toBe(0);
		});
	}
});

// 親欄の表示条件とチェック解除時のリセットを両ブロックで確認する。
// Verify parent field visibility and reset on deselection for both blocks.
test.describe('Post list keyword and parent filters', () => {
	for (const block of TARGET_BLOCKS) {
		test(`${block.label}: 検索語と親条件を設定できる`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const parentTitle = `Filter parent 3121 ${block.name} ${Date.now()}`;
			const parent = await requestUtils.createPage({
				title: parentTitle,
				status: 'publish',
			});
			const child = await requestUtils.createPage({
				title: 'Needle child 3121',
				status: 'publish',
				parent: parent.id,
			});
			try {
				await admin.createNewPost();
				await editor.insertBlock({ name: block.name });
				await editor.openDocumentSettingsSidebar();
				await page
					.getByRole('button', { name: 'Display conditions' })
					.click();
				const parentControl = page.getByRole('combobox', {
					name: 'Parent',
					exact: true,
				});
				await expect(parentControl).toHaveCount(0);
				const pages = page.getByRole('checkbox', {
					name: 'Pages',
					exact: true,
				});
				const posts = page.getByRole('checkbox', {
					name: 'Posts',
					exact: true,
				});
				await pages.check();
				await expect(parentControl).toHaveCount(0);
				await posts.uncheck();
				await expect(parentControl).toBeVisible();
				await parentControl.fill(parentTitle);
				await page
					.getByRole('option', {
						name: `${parentTitle} (#${parent.id})`,
						exact: true,
					})
					.click();
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes.postParent
					)
					.toBe(parent.id);
				// 親条件の更新を待ち、連続入力によるSSRの問い合わせ回数を数える。
				// Wait for the parent filter update and count SSR requests during consecutive input.
				let renderRequests = 0;
				const countRenderRequests = (request) => {
					if (
						decodeURIComponent(request.url()).includes(
							'/block-renderer/'
						)
					) {
						renderRequests++;
					}
				};
				page.on('request', countRenderRequests);
				const waitForStableRequests = async () => {
					let lastCount = renderRequests;
					let lastChange = Date.now();
					await expect
						.poll(
							() => {
								if (lastCount !== renderRequests) {
									lastCount = renderRequests;
									lastChange = Date.now();
								}
								return Date.now() - lastChange;
							},
							{ timeout: 10000 }
						)
						.toBeGreaterThan(750);
				};
				await waitForStableRequests();
				renderRequests = 0;
				await page
					.getByLabel('Search keyword', { exact: true })
					.pressSequentially('Needle', { delay: 50 });
				await expect.poll(() => renderRequests).toBeGreaterThan(0);
				await waitForStableRequests();
				page.off('request', countRenderRequests);
				expect(renderRequests).toBe(1);
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes
								.searchKeyword
					)
					.toBe('Needle');
				await posts.check();
				await expect(parentControl).toHaveCount(0);
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes.postParent
					)
					.toBe(-1);
				await posts.uncheck();
				await expect(parentControl).toBeVisible();
				// 親を再設定してから、階層型のチェック解除も確認する。
				// Set the parent again and verify deselection of the hierarchical post type.
				await parentControl.fill(parentTitle);
				await page
					.getByRole('option', {
						name: `${parentTitle} (#${parent.id})`,
						exact: true,
					})
					.click();
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes.postParent
					)
					.toBe(parent.id);
				await pages.uncheck();
				await expect(parentControl).toHaveCount(0);
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes.postParent
					)
					.toBe(-1);
			} finally {
				await requestUtils.rest({
					path: `/wp/v2/pages/${child.id}`,
					method: 'DELETE',
					params: { force: true },
				});
				await requestUtils.rest({
					path: `/wp/v2/pages/${parent.id}`,
					method: 'DELETE',
					params: { force: true },
				});
			}
		});
	}
});

// RESTを置き換え、無題・同名と取得中・失敗時の表示をDBに依存せず確認する。
// Mock REST to verify untitled and duplicate titles, loading and failure states without relying on the database.
test.describe('Post list parent candidate states', () => {
	for (const block of TARGET_BLOCKS) {
		test(`${block.label}: 無題と同名の親候補をIDで区別できる`, async ({
			admin,
			editor,
			page,
		}) => {
			const candidates = [
				{ id: 93121, title: { rendered: '' } },
				{ id: 93122, title: { rendered: 'Same title' } },
				{ id: 93123, title: { rendered: 'Same title' } },
			];
			await page.route(
				(url) =>
					decodeURIComponent(url.toString()).includes('/wp/v2/pages'),
				async (route) => {
					await route.fulfill({
						json: candidates,
						headers: { 'X-WP-Total': '3', 'X-WP-TotalPages': '1' },
					});
				}
			);
			await admin.createNewPost();
			await editor.insertBlock({
				name: block.name,
				attributes: { isCheckedPostType: '["page"]' },
			});
			await editor.openDocumentSettingsSidebar();
			await page
				.getByRole('button', { name: 'Display conditions' })
				.click();
			const parent = page.getByRole('combobox', {
				name: 'Parent',
				exact: true,
			});
			await parent.click();
			for (const label of [
				'(no title) (#93121)',
				'Same title (#93122)',
				'Same title (#93123)',
			]) {
				await expect(
					page.getByRole('option', { name: label, exact: true })
				).toBeVisible();
			}
			await page
				.getByRole('option', {
					name: 'Same title (#93123)',
					exact: true,
				})
				.click();
			await expect(parent).toHaveValue('Same title (#93123)');
		});

		test(`${block.label}: 保存済み親の取得中と候補の取得失敗を示しIDを残して解除できる`, async ({
			admin,
			editor,
			page,
		}) => {
			let release;
			const pending = new Promise<void>((resolve) => {
				release = resolve;
			});
			await page.route(
				(url) =>
					decodeURIComponent(url.toString()).includes('/wp/v2/pages'),
				async (route) => {
					await pending;
					await route.fulfill({
						status: 403,
						json: {
							code: 'rest_forbidden',
							message: 'Unavailable',
							data: { status: 403 },
						},
					});
				}
			);
			try {
				await admin.createNewPost();
				await editor.insertBlock({
					name: block.name,
					attributes: {
						isCheckedPostType: '["page"]',
						postParent: 93124,
					},
				});
				await editor.openDocumentSettingsSidebar();
				await page
					.getByRole('button', { name: 'Display conditions' })
					.click();
				const parent = page.getByRole('combobox', {
					name: 'Parent',
					exact: true,
				});
				await expect(parent).toHaveValue('(#93124)');
				await expect(
					page
						.getByRole('status')
						.filter({ hasText: 'Loading parent pages…' })
				).toBeVisible();
				release();
				await expect(
					page
						.getByRole('status')
						.filter({ hasText: 'Unable to load parent pages.' })
				).toBeVisible();
				await expect(parent).toHaveValue('(#93124)');
				expect(
					(await editor.getBlocks())[0].attributes.postParent
				).toBe(93124);
				await parent.fill('');
				await page
					.getByRole('option', {
						name: 'No parent filter',
						exact: true,
					})
					.click();
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes.postParent
					)
					.toBe(-1);
			} finally {
				release();
			}
		});

		test(`${block.label}: 保存済み親だけ取得できないときはエラー文を出さずIDを残す`, async ({
			admin,
			editor,
			page,
		}) => {
			// 候補一覧は空で成功させ、保存済みの親（#93125）の1件取得だけを拒否する。
			// Return an empty candidate list and reject only the fetch of the saved parent (#93125).
			await page.route(
				(url) =>
					decodeURIComponent(url.toString()).includes('/wp/v2/pages'),
				async (route) => {
					if (
						decodeURIComponent(route.request().url()).includes(
							'/wp/v2/pages/93125'
						)
					) {
						await route.fulfill({
							status: 403,
							json: {
								code: 'rest_forbidden',
								message: 'Unavailable',
								data: { status: 403 },
							},
						});
						return;
					}
					await route.fulfill({
						json: [],
						headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '0' },
					});
				}
			);
			await admin.createNewPost();
			await editor.insertBlock({
				name: block.name,
				attributes: {
					isCheckedPostType: '["page"]',
					postParent: 93125,
				},
			});
			await editor.openDocumentSettingsSidebar();
			await page
				.getByRole('button', { name: 'Display conditions' })
				.click();
			const parent = page.getByRole('combobox', {
				name: 'Parent',
				exact: true,
			});

			// 読み込みが終わってもエラー文は出ず、IDの表示と保存値がそのまま残る。
			// After loading, no error message appears and the ID label and saved value remain.
			// 欄の表示時点で読み込み中になるため、表示を待ってから読み込み完了を確かめる。
			// The field starts loading when shown, so wait for it before checking that loading has finished.
			await expect(parent).toBeVisible();
			await expect(
				page
					.getByRole('status')
					.filter({ hasText: 'Loading parent pages…' })
			).toHaveCount(0);
			await expect(
				page
					.getByRole('status')
					.filter({ hasText: 'Unable to load parent pages.' })
			).toHaveCount(0);
			await expect(parent).toHaveValue('(#93125)');
			expect((await editor.getBlocks())[0].attributes.postParent).toBe(
				93125
			);
		});
	}
});

// 投稿者（edit_pages 権限なし）でも親の候補を読み込めることを、実際のRESTで確認する。
// Verify with the real REST API that authors without edit_pages can load parent candidates.
test.describe('Post list parent filter for authors', () => {
	const AUTHOR_PASSWORD = 'password';

	// テストごとに一意の投稿者を作る。
	// Create a unique author for each test.
	const createAuthor = async (requestUtils, suffix) => {
		const username = `author3121${suffix}`;
		const author = await requestUtils.createUser({
			username,
			email: `${username}@example.com`,
			password: AUTHOR_PASSWORD,
			roles: ['author'],
		});
		return { ...author, username };
	};

	// ブラウザのログインを、作った投稿者に切り替える。
	// Switch the browser login to the created author.
	const loginAs = async (page, username) => {
		await page.context().clearCookies();
		await page.goto('/wp-login.php');
		// ログイン画面の自動フォーカスで入力先がずれないよう、入力値を確かめてから送信する。
		// Confirm the field values before submitting, as the login page autofocus can shift the input target.
		const userLogin = page.locator('#user_login');
		const userPass = page.locator('#user_pass');
		await expect(async () => {
			await userLogin.fill(username);
			await userPass.fill(AUTHOR_PASSWORD);
			await expect(userLogin).toHaveValue(username, { timeout: 500 });
			await expect(userPass).toHaveValue(AUTHOR_PASSWORD, {
				timeout: 500,
			});
		}).toPass();
		await page.getByRole('button', { name: 'Log In' }).click();
		await page.locator('#wpadminbar').waitFor({ state: 'visible' });
	};

	// 後片付け: 先にページを閉じ、削除後の投稿者による設定保存（POST /wp/v2/users/me の 500）を防ぐ。
	// Cleanup: close the page first to prevent the deleted author's preference save (500 on POST /wp/v2/users/me).
	// 作った投稿者とページだけを削除し、投稿者の投稿は管理者へ移す。
	// Delete only the created author and page, reassigning the author's posts to the admin.
	const cleanUp = async (page, requestUtils, author, pageId) => {
		await page.close();
		if (author) {
			const admin = await requestUtils.rest({ path: '/wp/v2/users/me' });
			await requestUtils.rest({
				path: `/wp/v2/users/${author.id}`,
				method: 'DELETE',
				params: { force: true, reassign: admin.id },
			});
		}
		if (pageId) {
			await requestUtils.rest({
				path: `/wp/v2/pages/${pageId}`,
				method: 'DELETE',
				params: { force: true },
			});
		}
	};

	for (const block of TARGET_BLOCKS) {
		test(`${block.label}: 投稿者でも公開済みの親候補を選べる`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const suffix = `${block.name.replace(/\W/g, '')}${Date.now()}`;
			const parentTitle = `Author parent 3121 ${suffix}`;
			let parentPage;
			let author;
			try {
				// 管理者として公開済みの親ページと投稿者を用意し、投稿者でログインする。
				// As the admin, prepare a published parent page and an author, then log in as the author.
				parentPage = await requestUtils.createPage({
					title: parentTitle,
					status: 'publish',
				});
				author = await createAuthor(requestUtils, suffix);
				await loginAs(page, author.username);

				// 投稿者で新規投稿を開き、固定ページだけを対象にしたブロックを入れる。
				// Open a new post as the author and insert the block targeting only pages.
				await admin.createNewPost();
				await editor.insertBlock({
					name: block.name,
					attributes: { isCheckedPostType: '["page"]' },
				});
				await editor.openDocumentSettingsSidebar();
				await page
					.getByRole('button', { name: 'Display conditions' })
					.click();
				const parent = page.getByRole('combobox', {
					name: 'Parent',
					exact: true,
				});

				// 題名で検索すると「{題名} (#ID)」の候補が出て、エラー文は出ない。
				// Searching by title shows the "{title} (#ID)" option without the error message.
				await parent.fill(parentTitle);
				const option = page.getByRole('option', {
					name: `${parentTitle} (#${parentPage.id})`,
					exact: true,
				});
				await expect(option).toBeVisible();
				await expect(
					page
						.getByRole('status')
						.filter({ hasText: 'Unable to load parent pages.' })
				).toHaveCount(0);

				// 候補を選ぶと postParent が親のIDになる。
				// Selecting the option sets postParent to the parent ID.
				await option.click();
				await expect
					.poll(
						async () =>
							(await editor.getBlocks())[0].attributes.postParent
					)
					.toBe(parentPage.id);
			} finally {
				await cleanUp(page, requestUtils, author, parentPage?.id);
			}
		});

		test(`${block.label}: 投稿者が非公開の親を保存済みのブロックを開いてもエラー文を出さない`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const suffix = `p${block.name.replace(/\W/g, '')}${Date.now()}`;
			let privatePage;
			let author;
			try {
				// 管理者として非公開の親ページ（投稿者には読めない）と投稿者を用意し、投稿者でログインする。
				// As the admin, prepare a private parent page (unreadable for authors) and an author, then log in as the author.
				privatePage = await requestUtils.createPage({
					title: `Private parent 3121 ${suffix}`,
					status: 'private',
				});
				author = await createAuthor(requestUtils, suffix);
				await loginAs(page, author.username);

				// 非公開ページを親に設定済みのブロックを投稿者で開く。
				// Open, as the author, a block whose saved parent is the private page.
				await admin.createNewPost();
				await editor.insertBlock({
					name: block.name,
					attributes: {
						isCheckedPostType: '["page"]',
						postParent: privatePage.id,
					},
				});
				await editor.openDocumentSettingsSidebar();
				await page
					.getByRole('button', { name: 'Display conditions' })
					.click();
				const parent = page.getByRole('combobox', {
					name: 'Parent',
					exact: true,
				});

				// 読み込みが終わってもエラー文は出ず、(#ID) の表示と保存値が残る。
				// After loading, no error message appears and the (#ID) label and saved value remain.
				// 欄の表示時点で読み込み中になるため、表示を待ってから読み込み完了を確かめる。
				// The field starts loading when shown, so wait for it before checking that loading has finished.
				await expect(parent).toBeVisible();
				await expect(
					page
						.getByRole('status')
						.filter({ hasText: 'Loading parent pages…' })
				).toHaveCount(0);
				await expect(
					page
						.getByRole('status')
						.filter({ hasText: 'Unable to load parent pages.' })
				).toHaveCount(0);
				await expect(parent).toHaveValue(`(#${privatePage.id})`);
				expect(
					(await editor.getBlocks())[0].attributes.postParent
				).toBe(privatePage.id);
			} finally {
				await cleanUp(page, requestUtils, author, privatePage?.id);
			}
		});
	}
});

// 固定検索語で件数を絞り、フロントの少数件スライダーを確認する。
// Filter posts with a fixed search term and verify the frontend slider with few results.
test.describe('Post list filtered front end', () => {
	for (const count of [1, 2, 3]) {
		test(`スライダー: ${count}件ではループと操作ボタンを止める`, async ({
			page,
			requestUtils,
		}) => {
			const keyword = `needle3121count${count}`;
			const ids: number[] = [];
			try {
				for (let index = 0; index < count; index++) {
					const post = await requestUtils.createPost({
						title: `${keyword} ${index}`,
						status: 'publish',
					});
					ids.push(post.id);
				}
				const attributes = {
					searchKeyword: keyword,
					selfIgnore: true,
					numberPosts: 6,
					slidesPerView: 3,
					slidesPerViewPC: 3,
					slidesPerViewTablet: 3,
					slidesPerViewMobile: 3,
					loop: true,
					autoPlay: false,
				};
				const host = await requestUtils.createPost({
					title: 'Filtered slider host',
					status: 'publish',
					content: `<!-- wp:vk-blocks/post-list-slider ${JSON.stringify(attributes)} /-->`,
				});
				ids.push(host.id);
				await page.setViewportSize({ width: 1200, height: 900 });
				await page.goto(`/?p=${host.id}`);
				const slider = page.locator('.vk_post_list_slider').first();
				await expect(slider.locator('.swiper-slide')).toHaveCount(
					count
				);
				await expect
					.poll(() =>
						slider.evaluate((element) => {
							const swiper = (
								element as HTMLElement & {
									swiper?: {
										params: { loop: boolean };
										isLocked: boolean;
									};
								}
							).swiper;
							return swiper
								? [swiper.params.loop, swiper.isLocked]
								: null;
						})
					)
					.toEqual([false, true]);
				await expect(
					slider.locator('.swiper-button-next')
				).not.toBeVisible();
				await expect(
					slider.locator('.swiper-button-prev')
				).not.toBeVisible();
				await expect(
					slider.locator('.swiper-pagination')
				).not.toBeVisible();
			} finally {
				for (const id of ids) {
					await requestUtils.rest({
						path: `/wp/v2/posts/${id}`,
						method: 'DELETE',
						params: { force: true },
					});
				}
			}
		});
	}
});

// 保存済みブロックを開いただけで新属性が編集扱いにならないことを確認する。
// Verify that opening a saved block does not mark the new attributes as edited.
test.describe('Post list existing blocks', () => {
	for (const block of TARGET_BLOCKS) {
		test(`${block.label}: 既存ブロックを開いても変更扱いにならない`, async ({
			page,
			requestUtils,
		}) => {
			const post = await requestUtils.createPost({
				title: 'Existing filter block',
				status: 'publish',
				content: `<!-- wp:${block.name} ${JSON.stringify({ isCheckedPostType: '["post","page"]', ...(block.name === 'vk-blocks/post-list-slider' ? { blockId: 'existing-filter-slider-3121' } : {}) })} /-->`,
			});
			try {
				// プレビューの応答を待ち、固定時間待ちによる早すぎる判定を避ける。
				// Wait for the preview response to avoid premature assertions caused by fixed delays.
				const previewResponse = page.waitForResponse(
					(response) =>
						decodeURIComponent(response.url()).includes(
							'/block-renderer/'
						) && response.ok()
				);
				await page.goto(
					`/wp-admin/post.php?post=${post.id}&action=edit`
				);
				await page.waitForFunction(
					() =>
						window.wp?.data.select('core/block-editor').getBlocks()
							.length > 0
				);
				await previewResponse;
				await expect
					.poll(() =>
						page.evaluate(() =>
							window.wp.data
								.select('core/editor')
								.isEditedPostDirty()
						)
					)
					.toBe(false);
			} finally {
				await requestUtils.rest({
					path: `/wp/v2/posts/${post.id}`,
					method: 'DELETE',
					params: { force: true },
				});
			}
		});
	}
});
