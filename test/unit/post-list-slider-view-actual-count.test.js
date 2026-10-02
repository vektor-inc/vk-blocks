/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// #3080 CodeRabbit指摘の回帰テスト（投稿リストスライダー(Pro)版）。
// 詳細は test/unit/slider-view-actual-count.test.js のコメントを参照。
// 唯一の違いは、aria-label テンプレートの取得元:
// Pro は動的レンダリング（index.php の render_callback）のため、ロケール変更時の
// キャッシュ不整合が起きず、data-vkb-slider-actual-count-label 属性から
// そのまま読める（wp_localize_script 経由の window グローバルは不要）。
//
// #3080 CodeRabbit feedback regression test (Post List Slider (Pro) version).
// See test/unit/slider-view-actual-count.test.js for details. The only
// difference: where the aria-label template comes from. Pro is rendered
// dynamically (index.php's render_callback), so there is no save()-vs-locale
// caching mismatch, and the template can be read directly from the
// data-vkb-slider-actual-count-label attribute (no wp_localize_script global
// needed).
import {
	getActualSlideCountPagination,
	formatActualSlideCountAriaLabel,
} from '../../src/blocks/slider/pagination-actual-count';

/**
 * post-list-slider/view.js を実際に読み込み・実行し、`new Swiper(selector,
 * config)` に渡された config を捕捉する。
 *
 * Loads and executes post-list-slider/view.js for real, capturing the config
 * object passed to `new Swiper(selector, config)`.
 *
 * @param {string} sliderAttributesJson data-vk-post-list-slider に入れる JSON 文字列
 * @param {number} [slideCount]         DOM 上に用意する .swiper-slide の枚数（既定6）。
 *                                      view.js の needsLoopDisable は
 *                                      `:scope > .swiper-wrapper > .swiper-slide`
 *                                      の実際の件数を数えるため、枚数不足シナリオの
 *                                      検証にはこれを減らす必要がある（#3080）。
 * @return {Object} Swiper コンストラクタへ渡された config オブジェクト
 */
function loadViewJsAndCaptureConfig(sliderAttributesJson, slideCount = 6) {
	const slides = new Array(slideCount)
		.fill('<div class="swiper-slide"></div>')
		.join('');
	document.body.innerHTML = `
		<div data-vk-post-list-slider='${sliderAttributesJson}' class="vk_post_list_slider vk_post_list_slider-testblock">
			<div class="swiper-wrapper">
				${slides}
			</div>
			<div class="swiper-pagination"></div>
		</div>
	`;

	let capturedConfig = null;
	global.Swiper = jest.fn(function FakeSwiper(selector, config) {
		capturedConfig = config;
		return {};
	});

	// view.js は document.defaultView.addEventListener('load', ...) で匿名の
	// リスナーを登録する。jest.resetModules() のたびに再実行するとリスナーが
	// 積み上がり、window.dispatchEvent(new Event('load')) で発火すると過去の
	// テスト呼び出しで登録された古いリスナーまで再実行され、new Swiper() が
	// 重複実行されてしまう（CodeRabbit指摘）。window.addEventListener をスパイし、
	// この require() 呼び出しで新規に登録された 'load' リスナーだけを直接
	// 呼び出すことで、古いリスナーを一切トリガーしないようにする。呼び出した
	// リスナー自体も removeEventListener で解除し、window に残さない
	// （CodeRabbit指摘）。
	//
	// view.js registers an anonymous listener via
	// document.defaultView.addEventListener('load', ...). Because it re-runs on
	// every jest.resetModules() + require(), repeated calls accumulate
	// listeners, and dispatching a 'load' event would re-trigger every listener
	// registered by earlier calls too, potentially running new Swiper()
	// redundantly (CodeRabbit feedback). Spy on window.addEventListener and
	// invoke only the 'load' listener freshly registered by this require()
	// call directly, so no stale listener from an earlier call is triggered.
	// Also remove the invoked listener itself via removeEventListener so it
	// does not linger on window (CodeRabbit feedback).
	const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
	jest.resetModules();
	require('../../src/blocks/_pro/post-list-slider/view.js');
	const loadCall = addEventListenerSpy.mock.calls.find(
		([type]) => type === 'load'
	);
	addEventListenerSpy.mockRestore();

	if (loadCall) {
		const [, listener] = loadCall;
		listener();
		window.removeEventListener('load', listener);
	}

	return capturedConfig;
}

const baseAttributes = {
	autoPlay: false,
	autoPlayStop: false,
	autoPlayDelay: 2500,
	pauseButton: false,
	pagination: 'fraction',
	loop: false,
	effect: 'slide',
	speed: 500,
	direction: 'rtl',
	slidesPerViewMobile: 1,
	slidesPerViewTablet: 1,
	slidesPerViewPC: 3,
	slidesPerGroup: 'one-by-one',
	centeredSlides: false,
	blockId: 'testblock',
};

describe('post-list-slider view.js applyActualSlideCountPagination (real implementation)', () => {
	afterEach(() => {
		delete global.Swiper;
		document.body.innerHTML = '';
	});

	it('wires paginationUpdate and watchSlidesProgress when showActualSlideCount is on, pagination is fraction, and loop is off', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		expect(config.watchSlidesProgress).toBe(true);
		expect(typeof config.on.paginationUpdate).toBe('function');
	});

	// #3080 CodeRabbit指摘の回帰テスト: 投稿リストスライダー(Pro)にも、
	// 通常のスライダーブロックと同じ「保存されたloop属性 vs 実効loop状態」の
	// 問題があった。以前はneedsLoopDisable相当の正規化処理自体が存在しな
	// かったため、保存された attributes.loop がそのまま実効loop状態として
	// 扱われていた。今回追加した正規化処理により、スライド枚数不足時にも
	// 分母・分子の上書きが正しく配線されることを確認する（詳細は
	// test/unit/slider-loop-min-slides.test.js・
	// test/unit/slider-view-actual-count.test.js のコメントを参照）。
	//
	// #3080 CodeRabbit feedback regression test: the Post List Slider (Pro)
	// had the same "saved loop attribute vs effective loop state" problem as
	// the regular Slider block. It previously had no needsLoopDisable-equivalent
	// normalization at all, so the saved attributes.loop was treated as the
	// effective loop state as-is. This verifies the newly added normalization
	// correctly wires the denominator/numerator override even when there are
	// too few slides (see the comments in
	// test/unit/slider-loop-min-slides.test.js and
	// test/unit/slider-view-actual-count.test.js for details).
	it('wires paginationUpdate even when the saved loop attribute is true, if there are too few slides for loop mode to actually work', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({
				...baseAttributes,
				loop: true,
				showActualSlideCount: true,
				slidesPerViewMobile: 3,
				slidesPerViewTablet: 3,
				slidesPerViewPC: 3,
				slidesPerGroup: 'one-by-one',
				centeredSlides: false,
			}),
			3 // 3 slides < the 4 required for loop mode with slidesPerView=3
		);
		// needsLoopDisable によって実効loopがfalseに強制されていることの前提確認
		expect(config.loop).toBe(false);
		// このケースでも paginationUpdate は必ず配線される
		expect(config.watchSlidesProgress).toBe(true);
		expect(typeof config.on.paginationUpdate).toBe('function');
	});

	it('does not wire paginationUpdate when the saved loop is true and there are enough slides for loop mode to actually work', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({
				...baseAttributes,
				loop: true,
				showActualSlideCount: true,
				slidesPerViewMobile: 3,
				slidesPerViewTablet: 3,
				slidesPerViewPC: 3,
				slidesPerGroup: 'one-by-one',
				centeredSlides: false,
			}),
			6 // enough slides for loop mode to work with slidesPerView=3
		);
		expect(config.loop).toBe(true);
		expect(config.on).toBeUndefined();
		expect(config.watchSlidesProgress).toBeUndefined();
	});

	// #3080 CodeRabbit指摘の回帰テスト: slidesPerGroup が 'slides-per-view' の
	// ときに使う値（slidesPerViewMobile自身）が小数の場合、view.js の toIntSpg
	// は Math.max(1, Math.floor(n)) で切り捨てる（例: 2.9 → 2）。
	// slidesPerViewMobile=2.9・slidesPerGroup='slides-per-view'・
	// centeredSlides=false のとき、spg=floor(2.9)=2 となり、
	// w=ceil(2.9)=3, y=2 → 最低5枚が必要になる。スライド5枚・4枚の境界で
	// 実効loop状態（config.loop）と、その結果としての
	// paginationUpdate/watchSlidesProgress の配線有無を検証する
	// （src/blocks/slider/loop-min-slides.js の同等テストも参照）。
	//
	// #3080 CodeRabbit feedback regression test: when slidesPerGroup is
	// 'slides-per-view', the value it uses (slidesPerViewMobile itself) can be
	// a decimal. view.js's toIntSpg floors it via
	// Math.max(1, Math.floor(n)) (e.g. 2.9 → 2). With
	// slidesPerViewMobile=2.9, slidesPerGroup='slides-per-view',
	// centeredSlides=false: spg=floor(2.9)=2, so w=ceil(2.9)=3, y=2 → a
	// minimum of 5 slides is required. Verifies the effective loop state
	// (config.loop) and the resulting paginationUpdate/watchSlidesProgress
	// wiring at the 5/4-slide boundary (see the equivalent test in
	// src/blocks/slider/loop-min-slides.js too).
	it('with slidesPerGroup="slides-per-view" and a decimal slidesPerView, floors it like toIntSpg when deciding the effective loop state', () => {
		const sufficientConfig = loadViewJsAndCaptureConfig(
			JSON.stringify({
				...baseAttributes,
				loop: true,
				showActualSlideCount: true,
				slidesPerViewMobile: 2.9,
				slidesPerViewTablet: 0,
				slidesPerViewPC: 0,
				slidesPerGroup: 'slides-per-view',
				centeredSlides: false,
			}),
			5 // exactly the minimum required (w=3, y=2)
		);
		expect(sufficientConfig.loop).toBe(true);
		expect(sufficientConfig.on).toBeUndefined();
		expect(sufficientConfig.watchSlidesProgress).toBeUndefined();

		const insufficientConfig = loadViewJsAndCaptureConfig(
			JSON.stringify({
				...baseAttributes,
				loop: true,
				showActualSlideCount: true,
				slidesPerViewMobile: 2.9,
				slidesPerViewTablet: 0,
				slidesPerViewPC: 0,
				slidesPerGroup: 'slides-per-view',
				centeredSlides: false,
			}),
			4 // one below the minimum required
		);
		expect(insufficientConfig.loop).toBe(false);
		expect(insufficientConfig.watchSlidesProgress).toBe(true);
		expect(typeof insufficientConfig.on.paginationUpdate).toBe('function');
	});

	it('renderFraction emits a screen-reader-text element alongside the visual current/total spans', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		const html = config.pagination.renderFraction(
			'swiper-pagination-current',
			'swiper-pagination-total'
		);
		expect(html).toContain('screen-reader-text');
		// 区切り文字「 / 」専用の要素も出力されること（CodeRabbit指摘）。
		// The dedicated " / " separator element is also emitted (CodeRabbit feedback).
		expect(html).toContain('vk-slider-pagination-separator');
		expect(html).not.toContain('role="text"');
	});

	/**
	 * renderFraction の出力を実際の pagination コンテナに反映し、
	 * paginationUpdate を fake swiperInstance で呼び出した後の DOM 状態を返す。
	 * Pro は aria-label テンプレートを data-vkb-slider-actual-count-label 属性
	 * から読むため、subEl にあらかじめこの属性を設定しておく必要がある。
	 *
	 * Renders renderFraction's output into a real container, calls
	 * paginationUpdate with the given fake swiperInstance, and returns the
	 * resulting DOM state. Pro reads the aria-label template from the
	 * data-vkb-slider-actual-count-label attribute, so the caller must set it
	 * on subEl beforehand.
	 *
	 * @param {Object} config            captured Swiper config
	 * @param {Object} swiperInstance    fake Swiper instance to pass to paginationUpdate
	 * @param {string} ariaLabelTemplate value for data-vkb-slider-actual-count-label
	 * @return {Object} DOM 状態
	 */
	function renderAndUpdate(config, swiperInstance, ariaLabelTemplate) {
		const subEl = document.createElement('div');
		subEl.innerHTML = config.pagination.renderFraction(
			'swiper-pagination-current',
			'swiper-pagination-total'
		);
		if (ariaLabelTemplate) {
			subEl.setAttribute(
				'data-vkb-slider-actual-count-label',
				ariaLabelTemplate
			);
		}
		config.on.paginationUpdate(swiperInstance, subEl);
		const currentEl = subEl.querySelector('.swiper-pagination-current');
		const totalEl = subEl.querySelector('.swiper-pagination-total');
		const separatorEl = subEl.querySelector(
			'.vk-slider-pagination-separator'
		);
		const srTextEl = subEl.querySelector('.vk-slider-pagination-sr-text');
		return {
			currentText: currentEl.textContent,
			totalText: totalEl.textContent,
			currentAriaHidden: currentEl.getAttribute('aria-hidden'),
			totalAriaHidden: totalEl.getAttribute('aria-hidden'),
			separatorAriaHidden: separatorEl
				? separatorEl.getAttribute('aria-hidden')
				: null,
			srText: srTextEl ? srTextEl.textContent : null,
			role: subEl.getAttribute('role'),
			ariaLabel: subEl.getAttribute('aria-label'),
		};
	}

	// #3080 CodeRabbit指摘の回帰テスト（centeredSlides）: 通常表示・
	// centeredSlides双方で共有ヘルパーと一致することを確認する。
	// centeredSlidesという名前のケースには、centeredSlides: true を実際に
	// 渡す（以前はbaseAttributesのcenteredSlides: falseのまま読み込んで
	// おり、テストケース名と実際の設定が一致していなかった。CodeRabbit指摘）。
	//
	// centeredSlides-named cases actually pass centeredSlides: true (previously
	// they were loaded with baseAttributes' centeredSlides: false as-is, so the
	// test case name and the actual setting did not match. CodeRabbit feedback).
	it.each([
		{
			name: '通常表示・先頭',
			visibleSlidesIndexes: [0, 1, 2],
			centeredSlides: false,
			// 非centeredSlidesでのactiveIndexは表示範囲の先頭（最小値）。
			// The activeIndex for non-centeredSlides is the start (minimum) of
			// the visible range.
			activeIndex: 0,
		},
		{
			name: '通常表示・末尾',
			visibleSlidesIndexes: [3, 4, 5],
			centeredSlides: false,
			activeIndex: 3,
		},
		{
			// #3080 CodeRabbit指摘の回帰テスト: activeIndexとvisibleSlidesIndexes
			// が食い違うケース（実機で発生した幾何学的な可視スライド判定のズレを
			// 模したもの）。上の2ケースは activeIndex === min(visibleSlidesIndexes)
			// のため、activeIndexベース・visibleSlidesIndexesベースのどちらの
			// 式でも同じ結果になり、区別できない。ここでは意図的に食い違わせ、
			// 期待値がactiveIndexベースの式（"4–6"）になることを検証する。
			//
			// #3080 CodeRabbit feedback regression test: a case where
			// activeIndex and visibleSlidesIndexes disagree (modeling the
			// geometric visible-slide-detection mismatch found on real
			// devices). The two cases above have activeIndex ===
			// min(visibleSlidesIndexes), so they cannot tell which formula is
			// actually used. This case deliberately disagrees them and
			// verifies the expected result follows the activeIndex-based
			// formula ("4–6").
			name: '通常表示・activeIndexとvisibleSlidesIndexesが食い違う',
			visibleSlidesIndexes: [2, 3],
			centeredSlides: false,
			activeIndex: 3,
		},
		{
			name: 'centeredSlides・開始位置',
			visibleSlidesIndexes: [0, 1],
			centeredSlides: true,
			// centeredSlidesでのactiveIndexは表示範囲の中央付近。
			// The activeIndex for centeredSlides is near the center of the
			// visible range.
			activeIndex: 1,
		},
		{
			name: 'centeredSlides・中央位置',
			visibleSlidesIndexes: [2, 3, 4],
			centeredSlides: true,
			activeIndex: 3,
		},
		{
			name: 'centeredSlides・末尾位置',
			visibleSlidesIndexes: [4, 5],
			centeredSlides: true,
			activeIndex: 5,
		},
	])(
		'$name: matches the shared helper',
		({ visibleSlidesIndexes, centeredSlides, activeIndex }) => {
			const config = loadViewJsAndCaptureConfig(
				JSON.stringify({
					...baseAttributes,
					showActualSlideCount: true,
					centeredSlides,
				})
			);
			const fakeSwiperInstance = {
				// centeredSlides を params に含めないと、view.js の実装が
				// centeredSlides無効時のactiveIndexベースの分岐に入ってしまう
				// （#3080 再修正で追加された分岐）。
				// Without centeredSlides in params, view.js's implementation
				// falls into the non-centeredSlides activeIndex-based branch
				// (added by the #3080 re-fix).
				params: { slidesPerView: 3, centeredSlides },
				activeIndex,
				visibleSlidesIndexes,
				slides: new Array(6).fill(null),
			};
			const result = renderAndUpdate(
				config,
				fakeSwiperInstance,
				'Showing %1$s to %2$s of %3$s'
			);
			// centeredSlides の有無に応じて、共有ヘルパー側も同じ分岐を通す
			// （非centeredSlidesはactiveIndex + slidesPerViewベース、
			// centeredSlidesはvisibleSlidesIndexesベース。#3080 再修正）。
			// Route the shared helper through the same branch depending on
			// centeredSlides (non-centeredSlides uses the activeIndex +
			// slidesPerView formula, centeredSlides uses the
			// visibleSlidesIndexes-based one. #3080 re-fix).
			const expected = getActualSlideCountPagination({
				visibleSlidesIndexes,
				totalSlides: 6,
				centeredSlides,
				activeIndex,
				slidesPerView: 3,
			});
			const expectedAriaLabel = formatActualSlideCountAriaLabel(
				'Showing %1$s to %2$s of %3$s',
				expected
			);
			expect(result.currentText).toBe(expected.currentText);
			expect(result.totalText).toBe(String(expected.total));
			// #3080 CodeRabbit指摘の回帰テスト: current だけでなく total・区切り文字
			// 「 / 」も aria-hidden になっていることを確認する。
			// #3080 CodeRabbit feedback regression test: verify total and the
			// " / " separator get aria-hidden too, not just current.
			expect(result.currentAriaHidden).toBe('true');
			expect(result.totalAriaHidden).toBe('true');
			expect(result.separatorAriaHidden).toBe('true');
			expect(result.srText).toBe(expectedAriaLabel);
			expect(result.role).toBeNull();
			expect(result.ariaLabel).toBeNull();
		}
	);

	// #3080 CodeRabbit指摘の回帰テスト: slidesPerView<=1（1枚ずつ表示）に切り替わった
	// 際、以前設定した aria-hidden・sr-onlyラベルが残らず削除されることを確認する
	// （通常のスライダーブロック側 test/unit/slider-view-actual-count.test.js に
	// 既にある同名テストのPro版）。
	//
	// #3080 CodeRabbit feedback regression test: confirms stale aria-hidden /
	// sr-only label attributes are cleared when slidesPerView drops to 1 or
	// less (e.g. via a responsive breakpoint change) (the Pro counterpart of
	// the same-named test already in
	// test/unit/slider-view-actual-count.test.js for the regular Slider
	// block).
	it('clears stale aria-hidden and screen-reader-text when slidesPerView drops to 1 or less', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		const subEl = document.createElement('div');
		subEl.innerHTML = config.pagination.renderFraction(
			'swiper-pagination-current',
			'swiper-pagination-total'
		);
		subEl.setAttribute(
			'data-vkb-slider-actual-count-label',
			'Showing %1$s to %2$s of %3$s'
		);
		// まず複数枚表示状態で上書きさせ、aria-hidden / sr-only ラベルが付くことを確認
		config.on.paginationUpdate(
			{
				params: { slidesPerView: 3 },
				activeIndex: 0,
				visibleSlidesIndexes: [0, 1, 2],
				slides: new Array(6).fill(null),
			},
			subEl
		);
		expect(
			subEl
				.querySelector('.swiper-pagination-current')
				.getAttribute('aria-hidden')
		).toBe('true');
		expect(
			subEl
				.querySelector('.swiper-pagination-total')
				.getAttribute('aria-hidden')
		).toBe('true');
		expect(
			subEl
				.querySelector('.vk-slider-pagination-separator')
				.getAttribute('aria-hidden')
		).toBe('true');
		expect(
			subEl.querySelector('.vk-slider-pagination-sr-text').textContent
		).not.toBe('');

		// slidesPerView が1以下に変わった状態で再度呼び出す
		config.on.paginationUpdate(
			{
				params: { slidesPerView: 1 },
				activeIndex: 0,
				visibleSlidesIndexes: [0],
				slides: new Array(6).fill(null),
			},
			subEl
		);
		expect(
			subEl
				.querySelector('.swiper-pagination-current')
				.getAttribute('aria-hidden')
		).toBeNull();
		expect(
			subEl
				.querySelector('.swiper-pagination-total')
				.getAttribute('aria-hidden')
		).toBeNull();
		expect(
			subEl
				.querySelector('.vk-slider-pagination-separator')
				.getAttribute('aria-hidden')
		).toBeNull();
		expect(
			subEl.querySelector('.vk-slider-pagination-sr-text').textContent
		).toBe('');
	});

	// #3080 CodeRabbit指摘の回帰テスト: data-vkb-slider-actual-count-label
	// 属性が何らかの理由で空（未設定）の場合、sr-only テキストが空のままに
	// ならず、「開始–終了 / 総数」形式のフォーマット済みテキストにフォール
	// バックすることを確認する。視覚要素（current/total）は引き続き
	// aria-hidden のままであることも合わせて確認する。
	//
	// #3080 CodeRabbit feedback regression test: verifies that when the
	// data-vkb-slider-actual-count-label attribute is empty (not set) for any
	// reason, the sr-only text does not stay empty and instead falls back to
	// a plain "start–end / total" formatted string. Also verifies the visual
	// elements (current/total) remain aria-hidden.
	it('falls back to a plain "start–end / total" sr-only text when data-vkb-slider-actual-count-label is unavailable', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		const fakeSwiperInstance = {
			params: { slidesPerView: 3 },
			activeIndex: 0,
			visibleSlidesIndexes: [0, 1, 2],
			slides: new Array(6).fill(null),
		};
		// ariaLabelTemplate を渡さない（= data-vkb-slider-actual-count-label
		// 属性を設定しない）ことで、属性未取得のケースを再現する。
		// Not passing ariaLabelTemplate (i.e. leaving the
		// data-vkb-slider-actual-count-label attribute unset) reproduces the
		// "attribute unavailable" case.
		const result = renderAndUpdate(config, fakeSwiperInstance);

		expect(result.srText).toBe('1–3 / 6');
		expect(result.currentAriaHidden).toBe('true');
		expect(result.totalAriaHidden).toBe('true');
	});
});
