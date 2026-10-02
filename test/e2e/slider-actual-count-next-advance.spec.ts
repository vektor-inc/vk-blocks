import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import { saveDraftThenPublishViaRest } from './utils/publish';
import { registerPostCleanup } from './utils/post-cleanup';
import { waitForSwiperInit } from './utils/swiper';

/**
 * #3080: 麗美の2回目の実機確認で見つかった回帰の再発防止テスト。
 *
 * ループOFF・PC3枚表示・6枚・ページネーション「スライドの枚数」・
 * トグルON（PR本文の確認手順Bと同一設定）で「次へ」を最後まで送ると、
 * 表示範囲が "1–3" → "2–4" → "3–5" → "4–6" の順に正しく進むことを確認する。
 *
 * 【背景】centeredSlides対応のため、表示範囲の計算を activeIndex ベースから
 * Swiperの `visibleSlidesIndexes`（実際にビューポート内に見えているスライド
 * のindex一覧、`watchSlidesProgress: true` で更新される）ベースに切り替えた
 * ところ、次へを送るたびに表示範囲が1ステップ遅れて止まる回帰が生じた
 * （麗美の実機確認で発見。以前はこのケースをPASS判定していた）。
 *
 * 原因は `visibleSlidesIndexes` が Swiper の幾何学的な重なり判定
 * （`updateSlidesProgress`）に依存しており、スライド側の padding/box-sizing
 * の組み合わせにより実際に描画されるスライド幅がSwiperの計算スロット幅より
 * 広くなる環境で、可視スライドの判定がずれる（本来3枚見えているはずが2枚と
 * 判定される等）ため。修正では、centeredSlides が無効（既定・多数派の
 * ケース）のときは、実際の描画幅に依存しない純粋な index計算である
 * activeIndex + slidesPerView の式に戻し、centeredSlides 有効時のみ
 * visibleSlidesIndexes ベースの計算を使うようにした
 * （src/blocks/slider/pagination-actual-count.js の
 * getActualSlideCountPagination を参照）。
 *
 * #3080: regression test for a bug found during 麗美's second real-device QA
 * pass.
 *
 * With loop off, PC 3-per-view, 6 slides, "Number of slides" pagination, and
 * the toggle on (the same configuration as the PR description's verification
 * step B), clicking "next" all the way to the end must advance the displayed
 * range as "1–3" → "2–4" → "3–5" → "4–6", in that order.
 *
 * Background: switching the display-range calculation from an
 * activeIndex-based formula to one based on Swiper's `visibleSlidesIndexes`
 * (the indexes of slides actually visible in the viewport, kept up to date
 * via `watchSlidesProgress: true`) — done to support centeredSlides — caused
 * a regression where the displayed range lagged one step behind while
 * clicking "next" (found during real-device QA; this case previously
 * passed).
 *
 * The cause: `visibleSlidesIndexes` depends on Swiper's geometric overlap
 * check (`updateSlidesProgress`), which miscounts visible slides (e.g.
 * reporting 2 visible when 3 should be) in environments where a slide's
 * padding/box-sizing makes the actually-rendered slide width wider than
 * Swiper's computed slot width. The fix reverts to the activeIndex +
 * slidesPerView formula (a pure index calculation independent of actual
 * rendered geometry) when centeredSlides is disabled (the default, majority
 * case), and only uses the visibleSlidesIndexes-based calculation when
 * centeredSlides is enabled (see getActualSlideCountPagination in
 * src/blocks/slider/pagination-actual-count.js).
 */

const createdPostIds = registerPostCleanup();

test.describe('#3080: 「次へ」で「実際のスライド数で表示」の表示範囲が正しく進む', () => {
	test('ループOFF・3枚表示・6枚: 1–3 → 2–4 → 3–5 → 4–6 の順に進み、最後でnextが無効化される', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({
			name: 'vk-blocks/slider',
			attributes: {
				loop: false,
				pagination: 'fraction',
				slidesPerViewPC: 3,
				slidesPerViewTablet: 3,
				slidesPerViewMobile: 3,
				slidesPerGroup: 'one-by-one',
				showActualSlideCount: true,
			},
			innerBlocks: Array.from({ length: 6 }, () => ({
				name: 'vk-blocks/slider-item',
			})),
		});
		const postId = await saveDraftThenPublishViaRest(
			page,
			requestUtils,
			createdPostIds
		);

		// PC幅（3枚表示のブレークポイント）で確認する。
		await page.setViewportSize({ width: 1200, height: 900 });
		await page.goto(`/?p=${postId}`);
		await page
			.locator('.vk_slider .swiper-pagination-fraction')
			.first()
			.waitFor();
		await waitForSwiperInit(page);

		const current = page.locator('.vk_slider .swiper-pagination-current');
		const nextButton = page.locator('.vk_slider .swiper-button-next');

		await expect(current).toHaveText('1–3');

		for (const expected of ['2–4', '3–5', '4–6']) {
			await nextButton.click();
			// この回帰は3秒待っても解消しなかった（麗美の実機確認より）ため、
			// 単純な描画待ちのタイミング差ではないことを踏まえつつ、
			// toHaveText の自動リトライで確実に確認する。
			// This regression did not resolve even after a 3-second wait (per
			// real-device QA), so it is not a simple rendering-timing issue —
			// but we still rely on toHaveText's auto-retry to assert reliably.
			await expect(current).toHaveText(expected);
		}

		await expect(nextButton).toHaveClass(/swiper-button-disabled/);
	});
});
