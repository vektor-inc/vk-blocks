import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { registerPostCleanup } from './utils/post-cleanup';
import {
	waitForSwiperInit,
	getAutoplayRunning,
	waitForAutoplayRunning,
} from './utils/swiper';

/**
 * スライダー / 投稿リストスライダー：prefers-reduced-motion（PRM）と自動再生の関係。
 * issue #3044。
 *
 * 1.122.0（PR #3001）で「PRM: reduce の環境では自動再生を開始しない」仕様が入ったが、
 * 停止/再生ボタンが無いスライダーまで無条件に停止するため、利用者には理由が伝わらず
 * 「自動再生が壊れた」ように見える問題が発生した（VWS フォーラム報告）。
 *
 * 修正後の仕様:
 *  - PRM: no-preference → 従来どおりページロード時に自動再生する
 *  - PRM: reduce + 停止/再生ボタンなし → 自動再生する（1.122.0 より前の挙動に戻す）
 *  - PRM: reduce + 停止/再生ボタンあり → 自動再生を停止し、再生ボタンで再開できる
 *    （再開手段を提示できる場合のみ、モーション削減の配慮として停止する）
 *  - 抑止の判定は属性値ではなく「DOM 上にボタンが存在するか」で行う
 *    （フィルタ等でボタンが除去された場合に再開手段なしで停止しないため）
 */

// このスペックで作成した投稿の ID。afterAll で対象を絞って削除する
// （全削除だと他スペックのデータに影響し得るため、姉妹スペックの慣習に合わせる）
const createdPostIds = registerPostCleanup();

/**
 * スライダーブロック（slider-item 2枚）を挿入して公開し、投稿 ID を返す。
 *
 * @param admin      Admin フィクスチャ
 * @param editor     Editor フィクスチャ
 * @param attributes スライダーブロックに渡す属性
 */
const publishSliderPost = async (
	admin: Admin,
	editor: Editor,
	attributes: Record<string, unknown> = {}
): Promise<number> => {
	await admin.createNewPost();
	await editor.insertBlock({
		name: 'vk-blocks/slider',
		attributes,
		innerBlocks: [
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
		],
	});
	const postId = await editor.publishPost();
	// publishPost() は null を返し得るため、以降の URL 組み立ての前に検証する
	expect(postId).not.toBeNull();
	createdPostIds.push(postId as number);
	return postId as number;
};

/**
 * 投稿リストスライダーブロックを挿入して公開し、投稿 ID を返す。
 * スライドに使う投稿も2件作成する（global-setup が全投稿を削除するため、
 * 実行時点で既存の投稿は無い前提）。
 *
 * @param admin        Admin フィクスチャ
 * @param editor       Editor フィクスチャ
 * @param requestUtils RequestUtils フィクスチャ
 * @param attributes   投稿リストスライダーブロックに渡す属性
 */
const publishPostListSliderPost = async (
	admin: Admin,
	editor: Editor,
	requestUtils: RequestUtils,
	attributes: Record<string, unknown> = {}
): Promise<number> => {
	// スライドに使う投稿を2件作成する。
	// requestUtils.createPost() は型定義が date_gmt を必須にしている（上流の型不備）ため、
	// 既存スペック（table-of-contents-aria.spec.ts）と同様に rest() で直接作成する。
	const seedA = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title: 'PRM slider post A', content: 'A', status: 'publish' },
	});
	createdPostIds.push(seedA.id);
	const seedB = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title: 'PRM slider post B', content: 'B', status: 'publish' },
	});
	createdPostIds.push(seedB.id);

	await admin.createNewPost();
	await editor.insertBlock({
		name: 'vk-blocks/post-list-slider',
		attributes,
	});
	const postId = await editor.publishPost();
	// publishPost() は null を返し得るため、以降の URL 組み立ての前に検証する
	expect(postId).not.toBeNull();
	createdPostIds.push(postId as number);
	return postId as number;
};

/**
 * PRM の状態をエミュレートしてフロントの投稿ページを開き、
 * Swiper の初期化完了（window.swiper0 生成）まで待つ。
 * view.js は load ハンドラ内で matchMedia を読むため、
 * emulateMedia は必ず goto より前に呼ぶ必要がある（順序をこのヘルパーで固定する）。
 *
 * @param page          Page フィクスチャ
 * @param postId        表示する投稿 ID
 * @param reducedMotion エミュレートする prefers-reduced-motion の値
 */
const visitFrontend = async (
	page: Page,
	postId: number,
	reducedMotion: 'reduce' | 'no-preference'
): Promise<void> => {
	await page.emulateMedia({ reducedMotion });
	await page.goto(`/?p=${postId}`);
	await waitForSwiperInit(page);
};

/**
 * PRM: reduce + 停止/再生ボタンありのスライダーで、
 * 「自動再生が停止し、再生ボタンで再開できる」ことを検証する共通アサーション。
 *
 * @param page Page フィクスチャ
 */
const expectPausedThenResumable = async (page: Page): Promise<void> => {
	// 自動再生が停止しており、ボタンは「停止中（再生アイコン）」表示になっている。
	// 単発の evaluate ではなく状態が変わるまで待つのは、再開側と同じ理由。
	// waitForSwiperInit はインスタンスの生成を見ているだけなので、抑止（autoplay.stop）や
	// 初期化直後の自動再生開始とレースし得る。waitForAutoplayRunning はインスタンス不在を
	// 「停止中」と解釈せず例外にするため、初期化前に偶然通ることもない。
	await waitForAutoplayRunning(page, false);
	const pauseButton = page.locator('.swiper-pause-button');
	await expect(pauseButton).toHaveClass(/is-paused/);

	// 再生ボタンをクリックすると自動再生が開始される
	// （単発の evaluate では状態更新とレースし得るため、状態が変わるまで待つ）
	await pauseButton.click();
	await waitForAutoplayRunning(page, true);
	await expect(pauseButton).not.toHaveClass(/is-paused/);
};

test.describe('Slider autoplay と prefers-reduced-motion (#3044)', () => {
	test('PRM 未設定: ページロード時に自動再生が開始される', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor);

		await visitFrontend(page, postId, 'no-preference');

		expect(await getAutoplayRunning(page)).toBe(true);
	});

	test('PRM: reduce + 停止ボタンなし: 自動再生は従来どおり開始される', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor);

		await visitFrontend(page, postId, 'reduce');

		// 再開手段（停止/再生ボタン）が無いスライダーは停止しない
		expect(await getAutoplayRunning(page)).toBe(true);
	});

	test('PRM: reduce + 停止ボタンあり: 自動再生は停止し、再生ボタンで再開できる', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor, {
			pauseButton: true,
		});

		await visitFrontend(page, postId, 'reduce');

		await expectPausedThenResumable(page);
	});

	test('PRM 未設定 + 停止ボタンあり: 自動再生は開始され、ボタンは再生中表示になる', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor, {
			pauseButton: true,
		});

		await visitFrontend(page, postId, 'no-preference');

		expect(await getAutoplayRunning(page)).toBe(true);
		await expect(page.locator('.swiper-pause-button')).not.toHaveClass(
			/is-paused/
		);
	});

	test('PRM: reduce + ボタン設定 ON だが DOM からボタンが除去された場合: 自動再生は停止しない', async ({
		admin,
		editor,
		page,
	}) => {
		const postId = await publishSliderPost(admin, editor, {
			pauseButton: true,
		});

		// フィルタ等で停止/再生ボタンのマークアップだけが除去されたケースを、
		// レスポンス HTML の書き換えで再現する（スクリプト実行前に反映されるためレースしない）。
		// 置換が実際に行われたかをフラグに記録する（ハンドラ内で throw すると
		// ナビゲーションエラーになるため、後段でアサートする）
		let buttonStripped = false;
		await page.route(
			(url) => url.searchParams.get('p') === String(postId),
			async (route) => {
				const response = await route.fetch();
				const original = await response.text();
				const body = original.replace(
					/<button\b[^>]*swiper-pause-button[\s\S]*?<\/button>/g,
					''
				);
				buttonStripped = body !== original;
				await route.fulfill({ response, body });
			}
		);

		await visitFrontend(page, postId, 'reduce');

		// マークアップの書き換えが空振りしていないこと（ボタンのクラス名等が
		// 変わって正規表現がマッチしなくなった場合、ここで失敗して原因を
		// このテストに局所化する）
		expect(buttonStripped).toBe(true);

		// ボタンが DOM に無いことを確認した上で、抑止されず自動再生されること。
		// 抑止判定が属性値ではなく DOM 上のボタン有無で行われることを固定する回帰テスト
		// （属性判定に書き換えられるとこのテストが失敗する）
		await expect(page.locator('.swiper-pause-button')).toHaveCount(0);
		expect(await getAutoplayRunning(page)).toBe(true);
	});
});

test.describe('Post list slider autoplay と prefers-reduced-motion (#3044)', () => {
	test('PRM 未設定: ページロード時に自動再生が開始される', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			requestUtils
		);

		await visitFrontend(page, postId, 'no-preference');

		expect(await getAutoplayRunning(page)).toBe(true);
	});

	test('PRM: reduce + 停止ボタンなし: 自動再生は従来どおり開始される', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			requestUtils
		);

		await visitFrontend(page, postId, 'reduce');

		// 再開手段（停止/再生ボタン）が無いスライダーは停止しない
		expect(await getAutoplayRunning(page)).toBe(true);
	});

	test('PRM: reduce + 停止ボタンあり: 自動再生は停止し、再生ボタンで再開できる', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			requestUtils,
			{ pauseButton: true }
		);

		await visitFrontend(page, postId, 'reduce');

		await expectPausedThenResumable(page);
	});

	test('PRM 未設定 + 停止ボタンあり: 自動再生は開始され、ボタンは再生中表示になる', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			requestUtils,
			{ pauseButton: true }
		);

		await visitFrontend(page, postId, 'no-preference');

		expect(await getAutoplayRunning(page)).toBe(true);
		await expect(page.locator('.swiper-pause-button')).not.toHaveClass(
			/is-paused/
		);
	});

	test('PRM: reduce + ボタン設定 ON だが DOM からボタンが除去された場合: 自動再生は停止しない', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			requestUtils,
			{ pauseButton: true }
		);

		// フィルタ等で停止/再生ボタンのマークアップだけが除去されたケースを、
		// レスポンス HTML の書き換えで再現する（スクリプト実行前に反映されるためレースしない）。
		// 置換が実際に行われたかをフラグに記録する（ハンドラ内で throw すると
		// ナビゲーションエラーになるため、後段でアサートする）
		let buttonStripped = false;
		await page.route(
			(url) => url.searchParams.get('p') === String(postId),
			async (route) => {
				const response = await route.fetch();
				const original = await response.text();
				const body = original.replace(
					/<button\b[^>]*swiper-pause-button[\s\S]*?<\/button>/g,
					''
				);
				buttonStripped = body !== original;
				await route.fulfill({ response, body });
			}
		);

		await visitFrontend(page, postId, 'reduce');

		// マークアップの書き換えが空振りしていないこと（ボタンのクラス名等が
		// 変わって正規表現がマッチしなくなった場合、ここで失敗して原因を
		// このテストに局所化する）
		expect(buttonStripped).toBe(true);

		// ボタンが DOM に無いことを確認した上で、抑止されず自動再生されること。
		// 抑止判定が属性値ではなく DOM 上のボタン有無で行われることを固定する回帰テスト
		// （属性判定に書き換えられるとこのテストが失敗する）
		await expect(page.locator('.swiper-pause-button')).toHaveCount(0);
		expect(await getAutoplayRunning(page)).toBe(true);
	});
});
