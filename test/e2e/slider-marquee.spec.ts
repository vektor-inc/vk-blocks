import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Admin, Editor } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { registerPostCleanup } from './utils/post-cleanup';

/**
 * スライダー：再生方式「等速ループ（マーキー）」（#3053）。
 *
 * - 保存した等速ループのスライダーを開き直してもブロックが無効化されない
 * - 公開画面では Swiper を初期化せず、スライドを複製して流し続ける。停止ボタンで止まる
 * - 「視差効果を減らす」では停止した状態で表示し、再生ボタンで流れ始める
 * - エディタのプレビューモードでも同じマーキーで動き、編集モードに戻すと片付く
 * - 設定パネルでは等速ループに切り替えると専用の項目が出て、使わない項目が隠れる
 *
 * Slider: the "Continuous loop" (marquee) playback mode (#3053).
 *
 * - Reopening a saved marquee slider does not invalidate the block
 * - The front end does not initialize Swiper; it clones the slides and keeps them flowing, and
 *   the pause button stops it
 * - With reduced motion it is shown paused, and the play button starts it
 * - The editor's preview mode runs the same marquee, cleaned up when going back to edit mode
 * - Switching the settings panel to the continuous loop shows its own controls and hides the
 *   ones that do not apply
 */

const SLIDER = 'vk-blocks/slider';

// このスペックで作成した投稿の ID（afterAll で削除する）
// IDs of the posts created by this spec (deleted in afterAll).
const createdPostIds = registerPostCleanup();

/**
 * 等速ループのスライダー（スライド3枚・PC で2枚表示）を挿入する。
 * Inserts a marquee slider (three slides, two per view on PC).
 *
 * @param admin  Admin フィクスチャ / the Admin fixture
 * @param editor Editor フィクスチャ / the Editor fixture
 * @param extra  追加の属性 / extra attributes
 */
const insertMarqueeSlider = async (
	admin: Admin,
	editor: Editor,
	extra: Record<string, unknown> = {}
): Promise<void> => {
	await admin.createNewPost();
	await editor.insertBlock({
		name: SLIDER,
		attributes: {
			playbackMode: 'marquee',
			marqueeSpeed: 120,
			slidesPerViewMobile: 1,
			slidesPerViewTablet: 2,
			slidesPerViewPC: 2,
			pc: 200,
			tablet: 200,
			mobile: 200,
			...extra,
		},
		innerBlocks: [
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
		],
	});
};

/**
 * 公開して投稿 ID を返す。
 * Publishes the post and returns its ID.
 *
 * @param editor Editor フィクスチャ / the Editor fixture
 */
const publish = async (editor: Editor): Promise<number> => {
	const postId = await editor.publishPost();
	expect(postId).not.toBeNull();
	createdPostIds.push(postId as number);
	return postId as number;
};

/**
 * スライドの並びのアニメーションの状態を返す（無ければ null）。
 * Returns the play state of the track's animation (null when there is none).
 *
 * @param page Page フィクスチャ / the Page fixture
 */
const getTrackPlayState = (page: Page): Promise<string | null> =>
	page.evaluate(() => {
		const track = document.querySelector(
			'.vk_slider--marquee > .swiper-wrapper'
		);
		const [animation] = track ? track.getAnimations() : [];
		return animation ? animation.playState : null;
	});

test.describe('スライダー: 等速ループ / slider continuous loop (#3053)', () => {
	test('保存して開き直してもブロックが無効化されない / stays valid after reload', async ({
		admin,
		editor,
		page,
	}) => {
		await insertMarqueeSlider(admin, editor);
		const postId = await publish(editor);

		await admin.editPost(postId);
		await expect(
			editor.canvas.locator('[data-type="vk-blocks/slider"]')
		).toBeVisible();
		// 検証に失敗したブロックには警告（リカバリーボタン）が出る
		// A block that fails validation shows a warning (the recovery button).
		await expect(
			editor.canvas.locator('.block-editor-warning')
		).toHaveCount(0);
		const isValid = await page.evaluate(() => {
			const [block] = window.wp.data
				.select('core/block-editor')
				.getBlocks();
			return block.isValid;
		});
		expect(isValid).toBe(true);
	});

	test('公開画面: Swiper を使わずに流れ、停止ボタンで止まる / flows without Swiper and stops with the button', async ({
		admin,
		editor,
		page,
	}) => {
		await insertMarqueeSlider(admin, editor);
		const postId = await publish(editor);

		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto(`/?p=${postId}`);

		const slider = page.locator('.vk_slider--marquee');
		await expect(slider).toHaveClass(/is-vk-slider-marquee-active/);
		// Swiper は初期化されない
		// Swiper is not initialized.
		await expect(slider).not.toHaveClass(/swiper-initialized/);
		// 複製スライドが足され、読み上げの対象外になっている
		// Clones are added and hidden from assistive technology.
		const clones = slider.locator('[data-vk-slider-marquee-clone]');
		expect(await clones.count()).toBeGreaterThan(0);
		await expect(clones.first()).toHaveAttribute('aria-hidden', 'true');
		// 矢印・ページネーションは出ない
		// No arrows or pagination.
		await expect(slider.locator('.swiper-button-next')).toHaveCount(0);
		await expect(slider.locator('.swiper-pagination')).toHaveCount(0);

		await expect.poll(() => getTrackPlayState(page)).toBe('running');

		// 停止ボタンで止まり、ラベルが「再生」に変わる
		// The pause button stops it and the label switches to "Play".
		const button = slider.locator(':scope > .swiper-pause-button');
		await expect(button).toHaveAttribute('aria-label', 'Pause slideshow');
		await button.click();
		await page.mouse.move(0, 0);
		await expect.poll(() => getTrackPlayState(page)).toBe('paused');
		await expect(button).toHaveAttribute('aria-label', 'Play slideshow');
		await expect(button).toHaveClass(/is-paused/);

		await button.click();
		await page.mouse.move(0, 0);
		await expect.poll(() => getTrackPlayState(page)).toBe('running');
	});

	test('公開画面: 視差効果を減らす設定では止まった状態で始まる / starts paused with reduced motion', async ({
		admin,
		editor,
		page,
	}) => {
		await insertMarqueeSlider(admin, editor);
		const postId = await publish(editor);

		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(`/?p=${postId}`);

		const slider = page.locator('.vk_slider--marquee');
		await expect(slider).toHaveClass(/is-vk-slider-marquee-active/);
		await expect.poll(() => getTrackPlayState(page)).toBe('paused');
		const button = slider.locator(':scope > .swiper-pause-button');
		await expect(button).toHaveClass(/is-paused/);
		await expect(button).toHaveAttribute('aria-label', 'Play slideshow');

		await button.click();
		await page.mouse.move(0, 0);
		await expect.poll(() => getTrackPlayState(page)).toBe('running');
	});

	test('エディタ: プレビューでマーキーが動き、編集モードに戻すと片付く / preview runs the marquee', async ({
		admin,
		editor,
		page,
	}) => {
		// 既定の設定（reducedMotion: reduce）のままだと停止状態で始まるため、動く状態にする
		// The default config (reducedMotion: reduce) would start it paused, so allow motion.
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await insertMarqueeSlider(admin, editor, { editorMode: 'slide' });

		const slider = editor.canvas.locator('[data-type="vk-blocks/slider"]');
		// 複製が足され、並びのアニメーションが流れている（Swiper は使わない）。
		// ルートの目印クラスはエディタの再描画で外れ得るため、ここでは見ない
		// Clones are added and the track's animation is running (no Swiper). The root's
		// marker class can be dropped by editor re-renders, so it is not checked here.
		await expect
			.poll(() =>
				slider.locator('[data-vk-slider-marquee-clone]').count()
			)
			.toBeGreaterThan(0);
		await expect(slider.locator('.swiper-initialized')).toHaveCount(0);
		await expect
			.poll(() =>
				slider
					.locator('.block-editor-block-list__layout')
					.first()
					.evaluate((track) =>
						track.getAnimations().map((a) => a.playState)
					)
			)
			.toEqual(['running']);
		// 停止ボタンもプレビューに出る
		// The pause button also appears in the preview.
		await expect(
			slider.locator(':scope > .swiper-pause-button')
		).toBeVisible();

		// 編集モードへ戻すと複製と目印が消える
		// Going back to edit mode removes the clones and the marker class.
		await page.evaluate(() => {
			const { select, dispatch } = window.wp.data;
			const [block] = select('core/block-editor').getBlocks();
			dispatch('core/block-editor').updateBlockAttributes(
				block.clientId,
				{ editorMode: 'default' }
			);
		});
		await expect(
			slider.locator('[data-vk-slider-marquee-clone]')
		).toHaveCount(0);
	});

	test('設定パネル: 等速ループで専用の項目が出て、使わない項目が隠れる / panel shows marquee controls', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({
			name: SLIDER,
			innerBlocks: [
				{ name: 'vk-blocks/slider-item' },
				{ name: 'vk-blocks/slider-item' },
			],
		});
		await editor.selectBlocks(
			editor.canvas.locator('[data-type="vk-blocks/slider"]')
		);
		await page.getByRole('button', { name: 'Slider Settings' }).click();

		const effect = page.locator('.components-base-control', {
			hasText: 'Effect',
		});
		await expect(effect.first()).toBeVisible();
		await expect(page.getByLabel('Flow speed (px/s)')).toHaveCount(0);

		await page.getByRole('radio', { name: 'Continuous loop' }).click();

		// 等速ループ専用の項目
		// The continuous loop's own controls.
		await expect(
			page.getByRole('spinbutton', { name: 'Flow speed (px/s)' })
		).toHaveValue('60');
		const pauseToggle = page.getByRole('checkbox', {
			name: 'Display pause / play button',
		});
		await expect(pauseToggle).toBeChecked();
		await expect(pauseToggle).toBeDisabled();
		// 通常方式の項目・ズームのパネルは隠れる
		// The standard mode's controls and the zoom panel are hidden.
		await expect(effect).toHaveCount(0);
		await expect(
			page.getByRole('button', {
				name: 'Background Image Zoom Animation',
			})
		).toHaveCount(0);

		// 通常に戻すと元の項目が戻る
		// Switching back to standard restores the controls.
		await page.getByRole('radio', { name: 'Standard' }).click();
		await expect(effect.first()).toBeVisible();
	});
});
