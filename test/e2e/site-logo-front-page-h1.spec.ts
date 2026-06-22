/**
 * PR #2962: core/site-logo ブロックに「フロントページのみ h1 として出力する」オプションを追加
 *
 * テスト観点:
 *  - エディタ側: Site Logo Tag Setting パネルおよび Use <h1> tag on the front page トグルが表示される
 *  - フロント側 (ON時): フロントページのコンテンツ内 site-logo の最外殻が <h1> になる
 *  - フロント側 (ON時, 他ページ): 個別ページ単体表示では <div> のまま
 *  - OFF時: フロントページでも <div> のまま
 *  - 中身の <a> <img> は温存される
 *  - 複数 site-logo: 両方 ON ならどちらも h1、片方 OFF なら片方のみ h1
 *
 * 注意:
 *  Twenty Twenty-Five などのテーマでは <header> 内（テンプレートパーツ側）にも
 *  別の site-logo が表示される。本テストでは <main> 内（投稿コンテンツ内）に
 *  限定して検証する。
 */
import path from 'path';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// クリーンアップ用に作成した固定ページの ID を保持
const createdPageIds: number[] = [];
let originalShowOnFront: string = 'posts';
let originalPageOnFront: number | null = null;
// テスト用にアップロードしたサイトロゴ画像の ID と、元のサイトロゴ設定を退避
let uploadedLogoId: number | null = null;
let originalSiteLogo: number = 0;

const SITE_LOGO_ON_BLOCK = '<!-- wp:site-logo {"isFrontPageH1":true} /-->';
const SITE_LOGO_OFF_BLOCK = '<!-- wp:site-logo {"isFrontPageH1":false} /-->';

// REST 経由で固定ページを作成して ID を返す
async function createPage(
	requestUtils: any,
	title: string,
	content: string
): Promise<number> {
	const page = await requestUtils.rest({
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			title,
			status: 'publish',
			content,
		},
	});
	createdPageIds.push(page.id);
	return page.id;
}

// REST 経由で固定ページのコンテンツを更新
async function updatePageContent(
	requestUtils: any,
	id: number,
	content: string
): Promise<void> {
	await requestUtils.rest({
		path: `/wp/v2/pages/${id}`,
		method: 'POST',
		data: { content },
	});
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

test.describe('PR #2962 core/site-logo フロントページ h1 化', () => {
	test.beforeAll(async ({ requestUtils }) => {
		// 元のフロントページ表示設定を退避
		const settings: any = await requestUtils.rest({
			path: '/wp/v2/settings',
			method: 'GET',
		});
		originalShowOnFront = settings.show_on_front ?? 'posts';
		originalPageOnFront = settings.page_on_front ?? null;
		originalSiteLogo = settings.site_logo ?? 0;

		// core/site-logo ブロックはサイトロゴ未設定だとフロント側で空出力になり、
		// .wp-block-site-logo 自体が出力されない。h1 置換の検証にはロゴ画像が必要なため、
		// テスト用画像をアップロードしてサイトロゴに設定する。
		const media: any = await requestUtils.uploadMedia(
			path.join(
				__dirname,
				'..',
				'e2e-tests',
				'assets',
				'10x10_e2e_test_image_z9T8jK.png'
			)
		);
		// media.id が無いと site_logo に undefined を渡してしまうため、
		// アップロード結果を検証してから利用する。
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

		// アップロードしたサイトロゴ画像を削除
		if (uploadedLogoId) {
			try {
				await requestUtils.rest({
					path: `/wp/v2/media/${uploadedLogoId}?force=true`,
					method: 'DELETE',
				});
			} catch {
				// 削除失敗は無視
			}
		}

		// 作成した固定ページを削除
		for (const id of createdPageIds) {
			try {
				await requestUtils.rest({
					path: `/wp/v2/pages/${id}?force=true`,
					method: 'DELETE',
				});
			} catch {
				// 削除失敗は無視
			}
		}
	});

	test('1) エディタ: Site Logo Tag Setting パネルとトグルが表示される', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();

		// core/site-logo ブロックを挿入
		await editor.insertBlock({ name: 'core/site-logo' });

		// 右サイドバー（Settings サイドバー）を開く。閉じている場合はトグルする。
		// 表示言語によってパネル名が変わるため英語/日本語の両方に対応
		// (英: "Site Logo Tag Setting" / 日: "サイトロゴタグ設定")
		const panelNamePattern = /Site Logo Tag Setting|サイトロゴタグ設定/;
		const panelLocator = page.getByRole('button', {
			name: panelNamePattern,
		});
		if (!(await panelLocator.isVisible().catch(() => false))) {
			const sidebarToggle = page.getByRole('button', {
				name: 'Settings',
				exact: true,
			});
			if (await sidebarToggle.isVisible().catch(() => false)) {
				await sidebarToggle.click();
			}
		}

		// Site Logo Tag Setting パネル（PR で追加された VK のパネル）が見える
		// パネルは折りたたまれた状態で挿入される
		const panel = page.getByRole('button', {
			name: panelNamePattern,
		});
		await expect(panel).toBeVisible({ timeout: 15_000 });

		// パネルを開く
		await panel.click();

		// トグル本体を取得（英語/日本語ラベル両対応）
		// (英: "Use <h1> tag on the front page" 等 / 日: "フロントページで h1 として出力" 等)
		// 文言が将来変わる可能性に備えて "h1" "front" "フロント" のいずれかにマッチさせる
		const toggle = page.getByLabel(
			/(<?h1>?.*front|front.*<?h1>?|フロントページ.*h1|h1.*フロントページ)/i
		);
		await expect(toggle).toBeVisible();
		await expect(toggle).not.toBeChecked();

		// ON にしてチェック状態になることを確認
		await toggle.click();
		await expect(toggle).toBeChecked();

		// OFF に戻して状態が反映されることを確認
		await toggle.click();
		await expect(toggle).not.toBeChecked();
	});

	test('2) フロント (ON時): フロントページの本文コンテンツの site-logo が <h1> で出力される', async ({
		requestUtils,
		page,
	}) => {
		const frontId = await createPage(
			requestUtils,
			'PR2962 Front (ON)',
			SITE_LOGO_ON_BLOCK
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');

		// <main> 内に <h1 class="wp-block-site-logo"> が存在する
		const mainH1 = page.locator('main h1.wp-block-site-logo');
		await expect(mainH1).toHaveCount(1);

		// <main> 内に <div class="wp-block-site-logo"> は存在しない
		const mainDiv = page.locator('main div.wp-block-site-logo');
		await expect(mainDiv).toHaveCount(0);

		// h1 の中に <img> が温存されている
		await expect(mainH1.locator('img')).toHaveCount(1);
	});

	test('3) フロント (ON時, 他ページ): 固定ページ単体表示では <div> のまま', async ({
		requestUtils,
		page,
	}) => {
		// 別の固定ページに site-logo (ON) を置く
		const innerId = await createPage(
			requestUtils,
			'PR2962 Inner (ON)',
			SITE_LOGO_ON_BLOCK
		);

		// フロント設定とは別の個別ページに直接アクセス
		// 個別ページ表示時には is_front_page() が false になる
		await page.goto(`/?page_id=${innerId}`);

		// <main> 内に <h1 class="wp-block-site-logo"> は存在しないこと
		const mainH1 = page.locator('main h1.wp-block-site-logo');
		await expect(mainH1).toHaveCount(0);

		// <main> 内に <div class="wp-block-site-logo"> のまま存在すること
		const mainDiv = page.locator('main div.wp-block-site-logo');
		await expect(mainDiv).toHaveCount(1);
	});

	test('4) OFF時: フロントページでも <div> のまま', async ({
		requestUtils,
		page,
	}) => {
		const frontId = await createPage(
			requestUtils,
			'PR2962 Front (OFF)',
			SITE_LOGO_OFF_BLOCK
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');

		const mainH1 = page.locator('main h1.wp-block-site-logo');
		await expect(mainH1).toHaveCount(0);

		const mainDiv = page.locator('main div.wp-block-site-logo');
		await expect(mainDiv).toHaveCount(1);
	});

	test('5) リンク有り (ON時): <h1> の中に <a><img></a> が温存される', async ({
		requestUtils,
		page,
	}) => {
		// isLink:true（コアブロックの既定値）で <a> 付きでレンダリングされる
		const block =
			'<!-- wp:site-logo {"isFrontPageH1":true,"isLink":true} /-->';
		const frontId = await createPage(
			requestUtils,
			'PR2962 Front (Link ON)',
			block
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');

		const mainH1 = page.locator('main h1.wp-block-site-logo');
		await expect(mainH1).toHaveCount(1);

		// h1 > a > img の構造で温存されていること
		await expect(mainH1.locator('a').first()).toBeVisible();
		await expect(mainH1.locator('a img').first()).toBeVisible();
	});

	test('6) リンク無し (ON時): <h1> 直下に <img> が温存される', async ({
		requestUtils,
		page,
	}) => {
		// isLink:false の場合は <a> ラッパが付かず <img> のみ
		const block =
			'<!-- wp:site-logo {"isFrontPageH1":true,"isLink":false} /-->';
		const frontId = await createPage(
			requestUtils,
			'PR2962 Front (No Link)',
			block
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');

		const mainH1 = page.locator('main h1.wp-block-site-logo');
		await expect(mainH1).toHaveCount(1);

		// h1 内に <img> はあり、<a> は無いこと（リンク無し設定）
		await expect(mainH1.locator('img')).toHaveCount(1);
		await expect(mainH1.locator('a')).toHaveCount(0);
	});

	test('7) 複数 site-logo: 両方 ON で 2 つとも <h1>、片方 OFF で混在', async ({
		requestUtils,
		page,
	}) => {
		// 両方 ON
		const bothOn = `${SITE_LOGO_ON_BLOCK}\n${SITE_LOGO_ON_BLOCK}`;
		const frontId = await createPage(
			requestUtils,
			'PR2962 Front (Multi)',
			bothOn
		);
		await setFrontPage(requestUtils, frontId);

		await page.goto('/');
		await expect(page.locator('main h1.wp-block-site-logo')).toHaveCount(2);
		await expect(page.locator('main div.wp-block-site-logo')).toHaveCount(
			0
		);

		// 片方だけ OFF
		const mixed = `${SITE_LOGO_ON_BLOCK}\n${SITE_LOGO_OFF_BLOCK}`;
		await updatePageContent(requestUtils, frontId, mixed);

		await page.goto('/');
		await expect(page.locator('main h1.wp-block-site-logo')).toHaveCount(1);
		await expect(page.locator('main div.wp-block-site-logo')).toHaveCount(
			1
		);
	});
});
