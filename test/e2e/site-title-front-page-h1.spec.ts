/**
 * PR #3123 (Closes #3122): core/site-title ブロックに
 * 「フロントページのみ h1 として出力する」オプションを追加
 *
 * テスト観点:
 *  - エディタ側: Site Title Tag Setting パネルおよび
 *    Limit <h1> tag to the front page トグルが表示される
 *  - フロント側 (OFF時): フロントページ・投稿・固定ページいずれも <h1> のまま（従来どおり）
 *  - フロント側 (ON時): フロントページの本文コンテンツ内 site-title は <h1> のまま
 *  - フロント側 (ON時, 他ページ): 投稿・固定ページ単体表示では <div> に置換される
 *  - class 等の属性は維持される
 *  - 回帰確認: core/site-logo の「サイトロゴタグ設定」トグルの挙動に影響が無いこと
 *
 * 注意:
 *  Twenty Twenty-Five などのテーマでは <header> 内（テンプレートパーツ側）にも
 *  別の site-title / site-logo が表示される。本テストでは <main> 内（投稿コンテンツ内）に
 *  限定して検証する。
 */
import path from 'path';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// クリーンアップ用に作成したコンテンツの [投稿タイプ, ID] を保持
const createdContent: Array<{ type: 'pages' | 'posts'; id: number }> = [];
let originalShowOnFront: string = 'posts';
let originalPageOnFront: number | null = null;
// 回帰確認（site-logo）用にアップロードした画像の ID と、元のサイトロゴ設定を退避
let uploadedLogoId: number | null = null;
let originalSiteLogo: number = 0;

const SITE_TITLE_ON_BLOCK = '<!-- wp:site-title {"isFrontPageH1":true} /-->';
const SITE_TITLE_OFF_BLOCK = '<!-- wp:site-title /-->';
const SITE_LOGO_ON_BLOCK = '<!-- wp:site-logo {"isFrontPageH1":true} /-->';

// REST 経由でコンテンツ（固定ページ／投稿）を作成して ID を返す
async function createContent(
	requestUtils: any,
	type: 'pages' | 'posts',
	title: string,
	content: string
): Promise<number> {
	const result = await requestUtils.rest({
		path: `/wp/v2/${type}`,
		method: 'POST',
		data: {
			title,
			status: 'publish',
			content,
		},
	});
	createdContent.push({ type, id: result.id });
	return result.id;
}

// フロントページの表示設定を「固定ページ」に切替
async function setFrontPage(requestUtils: any, id: number): Promise<void> {
	await requestUtils.rest({
		path: '/wp/v2/settings',
		method: 'POST',
		data: {
			show_on_front: 'page',
			page_on_front: id,
		},
	});
}

test.describe('PR #3123 core/site-title フロントページ h1 化', () => {
	test.beforeAll(async ({ requestUtils }) => {
		// 元のフロントページ表示設定を退避
		const settings: any = await requestUtils.rest({
			path: '/wp/v2/settings',
			method: 'GET',
		});
		originalShowOnFront = settings.show_on_front ?? 'posts';
		originalPageOnFront = settings.page_on_front ?? null;
		originalSiteLogo = settings.site_logo ?? 0;

		// 回帰確認（site-logo）用に、テスト用画像をアップロードしてサイトロゴに設定する。
		// site-logo はロゴ未設定だと空出力になり、既存の site-logo-front-page-h1.spec.ts と
		// 同じ画像を使い回す。
		const media: any = await requestUtils.uploadMedia(
			path.join(
				__dirname,
				'..',
				'e2e-tests',
				'assets',
				'10x10_e2e_test_image_z9T8jK.png'
			)
		);
		if (!media || typeof media.id === 'undefined') {
			throw new Error(
				`Failed to upload site logo media: ${JSON.stringify(media)}`
			);
		}
		uploadedLogoId = media.id;
		await requestUtils.rest({
			path: '/wp/v2/settings',
			method: 'POST',
			data: { site_logo: media.id },
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		// 元のフロントページ表示設定・サイトロゴ設定に戻す
		await requestUtils.rest({
			path: '/wp/v2/settings',
			method: 'POST',
			data: {
				show_on_front: originalShowOnFront,
				page_on_front: originalPageOnFront,
				site_logo: originalSiteLogo,
			},
		});

		if (uploadedLogoId) {
			try {
				await requestUtils.rest({
					path: `/wp/v2/media/${uploadedLogoId}`,
					params: { force: true },
					method: 'DELETE',
				});
			} catch {
				// 削除失敗は無視
			}
		}

		for (const { type, id } of createdContent) {
			try {
				await requestUtils.rest({
					path: `/wp/v2/${type}/${id}`,
					params: { force: true },
					method: 'DELETE',
				});
			} catch {
				// 削除失敗は無視
			}
		}
	});

	test('1) エディタ: Site Title Tag Setting パネルとトグルが表示される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();

		// core/site-title ブロックを挿入
		await editor.insertBlock({ name: 'core/site-title' });

		// 右サイドバー（Settings サイドバー）を開く。
		// 「閉じていれば開く」ではなく「region 自体が非表示なら開く」で判定する。
		// 理由: 既に開いている状態で Settings ボタンを無条件にクリックすると
		// トグルされて逆に閉じてしまい、パネルが見えないまま誤って FAIL する
		// （実機確認で実際に発生した）。
		const settingsRegion = page.getByRole('region', {
			name: 'Editor settings',
		});
		if (!(await settingsRegion.isVisible().catch(() => false))) {
			const sidebarToggle = page.getByRole('button', {
				name: 'Settings',
				exact: true,
			});
			await sidebarToggle.click();
			await expect(settingsRegion).toBeVisible({ timeout: 10_000 });
		}

		// サイドバーが「投稿」タブ表示になっている場合は「ブロック」タブへ切替える
		// （VK のパネルはブロック個別設定タブにのみ表示されるため）
		// 表示言語によってタブ名が変わるため英語/日本語の両方に対応
		const blockTab = settingsRegion.getByRole('tab', {
			name: /^Block$|^ブロック$/,
		});
		if (await blockTab.isVisible().catch(() => false)) {
			await blockTab.click();
		}

		// Site Title Tag Setting パネル（PR で追加された VK のパネル）が見える
		// 表示言語によってパネル名が変わるため英語/日本語の両方に対応
		const panelNamePattern =
			/Site Title Tag Setting|サイトタイトルタグ設定/;
		const panel = page.getByRole('button', {
			name: panelNamePattern,
		});
		await expect(panel).toBeVisible({ timeout: 15_000 });

		// スクリーンショット撮影のためパネルを開く
		await panel.click();

		// トグル本体を取得（英語/日本語ラベル両対応）
		const toggle = page.getByLabel(
			/(<?h1>?.*front|front.*<?h1>?|フロントページ.*h1|h1.*フロントページ)/i
		);
		await expect(toggle).toBeVisible();
		await expect(toggle).not.toBeChecked();

		// スクリーンショット（インスペクターパネルの実物確認用）
		await page.screenshot({
			path: 'test-results/site-title-inspector-panel.png',
		});

		// ON にしてチェック状態になることを確認
		await toggle.click();
		await expect(toggle).toBeChecked();

		// OFF に戻して状態が反映されることを確認
		await toggle.click();
		await expect(toggle).not.toBeChecked();
	});

	// -----------------------------------------------------------------------
	// 追加修正 (コミット 35618ae4) の確認:
	// core/site-title は level 属性（0=段落, 1〜6=h1〜h6）をツールバーの
	// 見出しレベル切替（コアの HeadingLevelDropdown。ボタンのアクセシブルネームは
	// 「Change level」、各選択肢は role="menuitemradio" で「Heading 1」など）で
	// 変更できる。level が 1 (h1) 以外のときは「Site Title Tag Setting」パネル
	// 自体が InspectorControls から外れて非表示になる仕様のため、
	// パネルの表示/非表示が level と連動すること、トグル状態
	// （isFrontPageH1）が level の往復後も保持されることを確認する。
	// -----------------------------------------------------------------------

	// 右サイドバー（ブロック設定タブ）を開くヘルパー。test 1) と同じロジックを流用。
	// 「閉じていれば開く」判定にする理由も test 1) のコメントと同様。
	async function openBlockSettingsSidebar(page: any) {
		const settingsRegion = page.getByRole('region', {
			name: 'Editor settings',
		});
		if (!(await settingsRegion.isVisible().catch(() => false))) {
			const sidebarToggle = page.getByRole('button', {
				name: 'Settings',
				exact: true,
			});
			await sidebarToggle.click();
			await expect(settingsRegion).toBeVisible({ timeout: 10_000 });
		}

		const blockTab = settingsRegion.getByRole('tab', {
			name: /^Block$|^ブロック$/,
		});
		if (await blockTab.isVisible().catch(() => false)) {
			await blockTab.click();
		}

		return settingsRegion;
	}

	// ツールバーの見出しレベル切替（コアの HeadingLevelDropdown）で level を
	// 変更するヘルパー。表示言語によって文言が変わるため英語/日本語の両方に対応。
	async function setHeadingLevelViaToolbar(page: any, targetLabel: RegExp) {
		const levelDropdown = page.getByRole('button', {
			name: /^Change level$|^レベルを変更$/,
		});
		await expect(levelDropdown).toBeVisible();
		await levelDropdown.click();

		const targetOption = page.getByRole('menuitemradio', {
			name: targetLabel,
		});
		await expect(targetOption).toBeVisible();
		await targetOption.click();
	}

	test('1-2) エディタ: 見出しレベルを h2 に変えるとパネルが非表示になり、h1 に戻すと再表示される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({ name: 'core/site-title' });

		await openBlockSettingsSidebar(page);

		const panelNamePattern =
			/Site Title Tag Setting|サイトタイトルタグ設定/;
		const panel = page.getByRole('button', { name: panelNamePattern });

		// デフォルト（level=1, h1）ではパネルが表示されている
		await expect(panel).toBeVisible({ timeout: 15_000 });

		// ツールバーの見出しレベル切替で h2 へ変更する
		await setHeadingLevelViaToolbar(page, /^Heading 2$|^見出し 2$/);

		// level !== 1 になったのでパネルごと非表示（DOM から外れる）になる
		await expect(panel).toBeHidden();

		// h1 に戻すとパネルが再表示される
		await setHeadingLevelViaToolbar(page, /^Heading 1$|^見出し 1$/);
		await expect(panel).toBeVisible({ timeout: 15_000 });
	});

	test('1-3) エディタ: パネルのトグル ON 状態は見出しレベルを h2⇔h1 と往復させても保持される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({ name: 'core/site-title' });

		await openBlockSettingsSidebar(page);

		const panelNamePattern =
			/Site Title Tag Setting|サイトタイトルタグ設定/;
		const panel = page.getByRole('button', { name: panelNamePattern });
		await expect(panel).toBeVisible({ timeout: 15_000 });

		// パネルを開いてトグルを ON にする
		await panel.click();
		const toggle = page.getByLabel(
			/(<?h1>?.*front|front.*<?h1>?|フロントページ.*h1|h1.*フロントページ)/i
		);
		await expect(toggle).toBeVisible();
		await toggle.click();
		await expect(toggle).toBeChecked();

		// h2 に切り替え → パネルごと非表示になる
		// （isFrontPageH1 の値自体は保持される想定で、表示上パネルが消えるだけ）
		await setHeadingLevelViaToolbar(page, /^Heading 2$|^見出し 2$/);
		await expect(panel).toBeHidden();

		// h1 に戻す → パネルが再表示される（PanelBody は再マウントされ初期状態は閉）
		await setHeadingLevelViaToolbar(page, /^Heading 1$|^見出し 1$/);
		await expect(panel).toBeVisible({ timeout: 15_000 });

		// パネルを再度開いて、トグルが ON のまま保持されていることを確認する
		await panel.click();
		await expect(toggle).toBeChecked();
	});

	test('2) OFF (デフォルト): フロントページ・投稿・固定ページいずれも <h1> のまま', async ({
		requestUtils,
		page,
	}) => {
		const frontId = await createContent(
			requestUtils,
			'pages',
			'PR3123 Front (OFF)',
			SITE_TITLE_OFF_BLOCK
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');
		await expect(page.locator('main h1.wp-block-site-title')).toHaveCount(
			1
		);
		await expect(page.locator('main div.wp-block-site-title')).toHaveCount(
			0
		);

		const postId = await createContent(
			requestUtils,
			'posts',
			'PR3123 Post (OFF)',
			SITE_TITLE_OFF_BLOCK
		);
		await page.goto(`/?p=${postId}`);
		await expect(page.locator('main h1.wp-block-site-title')).toHaveCount(
			1
		);
		await expect(page.locator('main div.wp-block-site-title')).toHaveCount(
			0
		);

		const pageId = await createContent(
			requestUtils,
			'pages',
			'PR3123 Page (OFF)',
			SITE_TITLE_OFF_BLOCK
		);
		await page.goto(`/?page_id=${pageId}`);
		await expect(page.locator('main h1.wp-block-site-title')).toHaveCount(
			1
		);
		await expect(page.locator('main div.wp-block-site-title')).toHaveCount(
			0
		);
	});

	test('3) ON時: フロントページの本文コンテンツの site-title は <h1> のまま', async ({
		requestUtils,
		page,
	}) => {
		const frontId = await createContent(
			requestUtils,
			'pages',
			'PR3123 Front (ON)',
			SITE_TITLE_ON_BLOCK
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');

		const mainH1 = page.locator('main h1.wp-block-site-title');
		await expect(mainH1).toHaveCount(1);
		const mainDiv = page.locator('main div.wp-block-site-title');
		await expect(mainDiv).toHaveCount(0);

		// 中身の <a> リンクが温存されている
		await expect(mainH1.locator('a')).toHaveCount(1);
	});

	test('4) ON時 (他ページ): 投稿・固定ページ単体表示では <div> に置換される（属性は維持）', async ({
		requestUtils,
		page,
	}) => {
		const postId = await createContent(
			requestUtils,
			'posts',
			'PR3123 Post (ON)',
			SITE_TITLE_ON_BLOCK
		);
		await page.goto(`/?p=${postId}`);

		const mainH1Post = page.locator('main h1.wp-block-site-title');
		await expect(mainH1Post).toHaveCount(0);
		const mainDivPost = page.locator('main div.wp-block-site-title');
		await expect(mainDivPost).toHaveCount(1);
		// class 属性（wp-block-site-title）が維持され、中身の <a> も温存されている
		await expect(mainDivPost.locator('a')).toHaveCount(1);

		const pageId = await createContent(
			requestUtils,
			'pages',
			'PR3123 Page (ON)',
			SITE_TITLE_ON_BLOCK
		);
		await page.goto(`/?page_id=${pageId}`);

		const mainH1Page = page.locator('main h1.wp-block-site-title');
		await expect(mainH1Page).toHaveCount(0);
		const mainDivPage = page.locator('main div.wp-block-site-title');
		await expect(mainDivPage).toHaveCount(1);
		await expect(mainDivPage.locator('a')).toHaveCount(1);
	});

	test('5) 回帰確認: core/site-logo のサイトロゴタグ設定トグルの挙動に影響が無いこと', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		// エディタ側: Site Logo Tag Setting パネル・トグルが変わらず表示される
		await admin.createNewPost();
		await editor.insertBlock({ name: 'core/site-logo' });

		const settingsRegion = page.getByRole('region', {
			name: 'Editor settings',
		});
		if (!(await settingsRegion.isVisible().catch(() => false))) {
			const sidebarToggle = page.getByRole('button', {
				name: 'Settings',
				exact: true,
			});
			await sidebarToggle.click();
			await expect(settingsRegion).toBeVisible({ timeout: 10_000 });
		}
		const blockTab = settingsRegion.getByRole('tab', {
			name: /^Block$|^ブロック$/,
		});
		if (await blockTab.isVisible().catch(() => false)) {
			await blockTab.click();
		}

		const panelNamePattern = /Site Logo Tag Setting|サイトロゴタグ設定/;
		const panel = page.getByRole('button', { name: panelNamePattern });
		await expect(panel).toBeVisible({ timeout: 15_000 });

		// フロント側: site-title (ON) と site-logo (ON) を同じページに置き、
		// site-title が <div> に変わっても site-logo は従来どおり front で <h1> になること
		const combined = `${SITE_TITLE_ON_BLOCK}\n${SITE_LOGO_ON_BLOCK}`;
		const frontId = await createContent(
			requestUtils,
			'pages',
			'PR3123 Regression Front (ON)',
			combined
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');
		// site-title は front なので h1 のまま
		await expect(page.locator('main h1.wp-block-site-title')).toHaveCount(
			1
		);
		// site-logo も従来どおり front で h1 になる（今回の変更で無変化のはず）
		await expect(page.locator('main h1.wp-block-site-logo')).toHaveCount(1);
		await expect(page.locator('main div.wp-block-site-logo')).toHaveCount(
			0
		);

		// 非フロントページでは site-title は div、site-logo は従来どおり div のまま
		const innerId = await createContent(
			requestUtils,
			'pages',
			'PR3123 Regression Inner (ON)',
			combined
		);
		await page.goto(`/?page_id=${innerId}`);
		await expect(page.locator('main div.wp-block-site-title')).toHaveCount(
			1
		);
		await expect(page.locator('main div.wp-block-site-logo')).toHaveCount(
			1
		);
		await expect(page.locator('main h1.wp-block-site-logo')).toHaveCount(0);
	});
});
