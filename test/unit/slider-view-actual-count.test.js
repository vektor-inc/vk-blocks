/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// #3080 CodeRabbit指摘の回帰テスト:
// `src/blocks/slider/view.js` の `applyActualSlideCountPagination` は、gulp が
// 直接 minify するビルド制約（ES module import 不可）のため、共有ヘルパー
// `pagination-actual-count.js` と同一のロジックを重複保持している。この重複が
// 将来ズレても検知できるよう、view.js の実装そのものを DOM モック環境で
// 実行し、共有ヘルパーの計算結果と一致することを検証する。
//
// #3080 CodeRabbit feedback regression test: view.js's
// `applyActualSlideCountPagination` duplicates the same logic as the shared
// `pagination-actual-count.js` helper, because view.js is minified directly by
// gulp and cannot use ES module imports. To catch future drift between the two,
// this test executes view.js's real implementation inside a mocked DOM
// environment and asserts its output matches the shared helper's calculation.
import {
	getActualSlideCountPagination,
	formatActualSlideCountAriaLabel,
} from '../../src/blocks/slider/pagination-actual-count';

/**
 * view.js を実際に読み込み・実行し、内部で `new Swiper(selector, config)` に
 * 渡された config を捕捉するためのヘルパー。Swiper 自体はグローバル変数として
 * 参照される（view.js 先頭の global コメント参照）ため、`global.Swiper` を
 * 差し替えるだけで済む。
 *
 * Loads and executes view.js for real, capturing the config object passed to
 * `new Swiper(selector, config)` inside it. Swiper itself is referenced as a
 * bare global in view.js, so it is enough to stub `global.Swiper`.
 *
 * @param {string} sliderAttributesJson data-vkb-slider に入れる JSON 文字列
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
		<div data-vkb-slider='${sliderAttributesJson}' class="vk_slider vk_slider_testblock">
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
	// リスナーを登録する（document.defaultView は jsdom では window と同一）。
	// jest.resetModules() のたびに view.js を再実行するとリスナーが積み上がり、
	// window.dispatchEvent(new Event('load')) で発火すると過去のテスト呼び出しで
	// 登録された古いリスナーまで再実行され、new Swiper() が重複実行されてしまう
	// （CodeRabbit指摘）。window.addEventListener をスパイし、この require() 呼び出しで
	// 新規に登録された 'load' リスナーだけを直接呼び出すことで、古いリスナーを
	// 一切トリガーしないようにする。呼び出したリスナー自体も removeEventListener
	// で解除し、window に残さない（CodeRabbit指摘）。
	//
	// view.js registers an anonymous listener via
	// document.defaultView.addEventListener('load', ...) (document.defaultView is
	// the same object as window in jsdom). Because view.js re-runs on every
	// jest.resetModules() + require(), repeated calls accumulate listeners, and
	// dispatching a 'load' event would re-trigger every listener registered by
	// earlier calls too, potentially running new Swiper() redundantly (CodeRabbit
	// feedback). Spy on window.addEventListener and invoke only the 'load'
	// listener freshly registered by this require() call directly, so no stale
	// listener from an earlier call is ever triggered. Also remove the invoked
	// listener itself via removeEventListener so it does not linger on window
	// (CodeRabbit feedback).
	const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
	jest.resetModules();
	require('../../src/blocks/slider/view.js');
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
	width: '',
	loop: false,
	effect: 'slide',
	speed: 500,
	direction: 'rtl',
	slidesPerViewMobile: 1,
	slidesPerViewTablet: 1,
	slidesPerViewPC: 3,
	slidesPerGroup: 'one-by-one',
	centeredSlides: false,
	zoomAnimation: false,
	blockId: 'testblock',
};

describe('slider view.js applyActualSlideCountPagination (real implementation)', () => {
	afterEach(() => {
		delete global.Swiper;
		delete window.vkBlocksSliderI18n;
		document.body.innerHTML = '';
	});

	it('wires paginationUpdate and watchSlidesProgress when showActualSlideCount is on, pagination is fraction, and loop is off', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		expect(config.watchSlidesProgress).toBe(true);
		expect(typeof config.on.paginationUpdate).toBe('function');
	});

	// #3080 CodeRabbit指摘の回帰テスト: loadViewJsAndCaptureConfig を複数回
	// 呼び出しても、view.js の 'load' リスナーが積み上がって重複実行される
	// ことがないことを確認する。積み上がっていれば、直近の呼び出しで
	// new Swiper() が複数回呼ばれてしまう。
	//
	// ⚠️ 検証方法の注意（CodeRabbit指摘）: ヘルパーは常に「今回requireで新規
	// 登録されたリスナーだけ」を直接呼び出す実装のため、単に
	// toHaveBeenCalledTimes(1) を呼び出し直後に確認するだけでは、
	// removeEventListener による解除を怠っても検知できない（呼び出し自体は
	// 元々1回しか発生しないため）。積み上がりの有無を実際に検証するには、
	// 呼び出し後に window.dispatchEvent(new Event('load')) を発火し、
	// もし古いリスナーが window に残っていれば追加で new Swiper() が
	// 呼ばれてしまうことを確認する必要がある。
	//
	// #3080 CodeRabbit feedback regression test: verify that calling
	// loadViewJsAndCaptureConfig repeatedly does not accumulate view.js's
	// 'load' listeners and cause them to fire redundantly. If listeners
	// accumulated, the most recent call would trigger new Swiper() more than
	// once.
	//
	// ⚠️ Verification note (CodeRabbit feedback): the helper always invokes
	// only the listener freshly registered by this require() call, so merely
	// checking toHaveBeenCalledTimes(1) right after the calls would not catch
	// a missing removeEventListener cleanup (that call count is already 1
	// regardless). To actually verify nothing accumulated, dispatch a real
	// 'load' event afterward and confirm it does not trigger any additional
	// new Swiper() calls, which would happen if a stale listener were still
	// attached to window.
	it('does not accumulate stale window load listeners across repeated calls', () => {
		loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		expect(global.Swiper).toHaveBeenCalledTimes(1);

		// 積み上がったリスナーが無いことを、実際に 'load' イベントを発火して
		// 確認する。もし過去の呼び出し分のリスナーが window に残っていれば、
		// この発火で new Swiper() が追加で呼ばれてしまうはず。
		// Verify no listeners accumulated by actually dispatching a 'load'
		// event. If listeners from earlier calls were still attached to
		// window, this dispatch would trigger additional new Swiper() calls.
		window.dispatchEvent(new window.Event('load'));
		expect(global.Swiper).toHaveBeenCalledTimes(1);
	});

	it('does not wire paginationUpdate when showActualSlideCount is off (the default)', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: false })
		);
		expect(config.on).toBeUndefined();
		expect(config.watchSlidesProgress).toBeUndefined();
	});

	// #3080 Claude Code code-review 指摘の回帰テスト（最重要）: 保存された
	// attributes.loop が true でも、スライド枚数が少なすぎてSwiperのループが
	// 実際には機能しない場合（needsLoopDisableでconfig.loopが強制的にfalseに
	// なるケース）、分母・分子の上書きは正しく配線されなければならない。
	//
	// 再現条件（issueのバグ報告そのもの）: loop:true（保存値）・
	// pagination:fraction・slidesPerView系:3・slidesPerGroup:1・スライド3枚。
	// getMinSlidesForLoop(3,1,false)=4 より、3枚では不足しループは強制OFFに
	// なる。以前の実装は保存された attributes.loop（まだtrue）だけを見て
	// ゲート条件を判定していたため、この場合に on/watchSlidesProgress が
	// 配線されず、issue #3080 が報告した「分母が実スライド数より少ない」
	// 状態がまさに再現してしまっていた。
	//
	// #3080 Claude Code code-review feedback regression test (most important):
	// even when the saved attributes.loop is true, if there are too few slides
	// for Swiper's loop mode to actually work (the case where needsLoopDisable
	// forces config.loop to false), the denominator/numerator override must
	// still be wired.
	//
	// Reproduction (the exact bug report scenario): loop:true (saved value),
	// pagination:fraction, slidesPerView* :3, slidesPerGroup:1, 3 slides.
	// getMinSlidesForLoop(3,1,false)=4, so 3 slides is not enough and loop gets
	// forced off. The previous implementation gated on the saved
	// attributes.loop alone (still true), so on/watchSlidesProgress never got
	// wired in this case, reproducing exactly the "denominator smaller than the
	// real slide count" state issue #3080 reported.
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

	// 対照ケース: 同じ設定でもスライド枚数が十分（4枚以上）なら、ループは
	// そのまま有効になり、この#3080の上書きロジックの適用対象外
	// （pagination !== 'fraction' && !loop の条件で、実効loopがtrueのため
	// 配線されない）になることも確認しておく。
	//
	// Control case: with enough slides (>= 4), loop stays effectively on, so
	// this #3080 override does not apply (the effective loop is true, so the
	// !loop condition is not met and nothing gets wired).
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

	// renderFraction はビジュアル用の current/total span に加え、
	// スクリーンリーダー専用のラベル要素（screen-reader-text パターン）を
	// 出力する必要がある（#3080, CodeRabbit指摘: role="text" + aria-label は
	// Firefox 等で効かないため）。
	//
	// renderFraction must emit a screen-reader-only label element (the
	// screen-reader-text pattern) in addition to the visual current/total
	// spans (#3080, CodeRabbit feedback: role="text" + aria-label does not
	// work in Firefox and elsewhere).
	it('renderFraction emits a screen-reader-text element alongside the visual current/total spans', () => {
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		const html = config.pagination.renderFraction(
			'swiper-pagination-current',
			'swiper-pagination-total'
		);
		expect(html).toContain('swiper-pagination-current');
		expect(html).toContain('swiper-pagination-total');
		expect(html).toContain('screen-reader-text');
		// 区切り文字「 / 」専用の要素も出力されること（CodeRabbit指摘）。
		// The dedicated " / " separator element is also emitted (CodeRabbit feedback).
		expect(html).toContain('vk-slider-pagination-separator');
		expect(html).not.toContain('role="text"');
	});

	/**
	 * renderFraction の出力を実際の pagination コンテナに反映し、
	 * paginationUpdate（applyActualSlideCountPagination の実体）を
	 * 指定の fake swiperInstance で呼び出した後の DOM 状態を返す。
	 *
	 * Renders renderFraction's output into a real pagination container, calls
	 * paginationUpdate (the actual applyActualSlideCountPagination) with the
	 * given fake swiperInstance, and returns the resulting DOM state.
	 *
	 * @param {Object} config         captured Swiper config
	 * @param {Object} swiperInstance fake Swiper instance to pass to paginationUpdate
	 * @return {Object} DOM 状態
	 */
	function renderAndUpdate(config, swiperInstance) {
		const subEl = document.createElement('div');
		subEl.innerHTML = config.pagination.renderFraction(
			'swiper-pagination-current',
			'swiper-pagination-total'
		);
		config.on.paginationUpdate(swiperInstance, subEl);
		const currentEl = subEl.querySelector('.swiper-pagination-current');
		const totalEl = subEl.querySelector('.swiper-pagination-total');
		const srTextEl = subEl.querySelector('.vk-slider-pagination-sr-text');
		return {
			currentText: currentEl.textContent,
			totalText: totalEl.textContent,
			currentAriaHidden: currentEl.getAttribute('aria-hidden'),
			totalAriaHidden: totalEl.getAttribute('aria-hidden'),
			srText: srTextEl ? srTextEl.textContent : null,
			role: subEl.getAttribute('role'),
			ariaLabel: subEl.getAttribute('aria-label'),
		};
	}

	// 通常表示（非centeredSlides、6枚中3枚表示）の各停止位置で、共有ヘルパー
	// getActualSlideCountPagination の計算結果と view.js の実装が一致することを
	// 確認する（#3080）。
	//
	// Verifies view.js's real implementation matches the shared helper
	// getActualSlideCountPagination's calculation at each stop, for ordinary
	// (non-centeredSlides) display (6 slides, 3 per view) (#3080).
	it.each([
		{ visibleSlidesIndexes: [0, 1, 2], activeIndex: 0 },
		{ visibleSlidesIndexes: [1, 2, 3], activeIndex: 1 },
		{ visibleSlidesIndexes: [3, 4, 5], activeIndex: 3 },
		// #3080 CodeRabbit指摘の回帰テスト: activeIndexとvisibleSlidesIndexesが
		// 食い違うケース（実機で発生した幾何学的な可視スライド判定のズレを
		// 模したもの。詳細は pagination-actual-count.js の
		// getActualSlideCountPagination のJSDocを参照）。上の3ケースは
		// すべて activeIndex === min(visibleSlidesIndexes) のため、どちらの
		// 計算式（activeIndexベース・visibleSlidesIndexesベース）を使っても
		// 同じ結果になり、区別できない。このケースでは意図的に
		// activeIndex（3）と visibleSlidesIndexes（[2, 3]、最小値は2）を
		// 食い違わせ、期待値がactiveIndexベースの式（"4–6"）になることを
		// 検証する。visibleSlidesIndexesベースの式に戻ってしまうと
		// "3–4" になり、この回帰を検知できる。
		//
		// #3080 CodeRabbit feedback regression test: a case where activeIndex
		// and visibleSlidesIndexes disagree (modeling the geometric
		// visible-slide-detection mismatch found on real devices; see the
		// JSDoc on getActualSlideCountPagination in
		// pagination-actual-count.js for details). The three cases above all
		// have activeIndex === min(visibleSlidesIndexes), so they cannot tell
		// which formula (activeIndex-based vs visibleSlidesIndexes-based) is
		// actually being used. This case deliberately makes activeIndex (3)
		// and visibleSlidesIndexes ([2, 3], minimum 2) disagree, and verifies
		// the expected result follows the activeIndex-based formula ("4–6").
		// Regressing to the visibleSlidesIndexes-based formula would produce
		// "3–4" instead, catching this regression.
		{ visibleSlidesIndexes: [2, 3], activeIndex: 3 },
	])(
		'matches the shared helper for visibleSlidesIndexes=$visibleSlidesIndexes',
		({ visibleSlidesIndexes, activeIndex }) => {
			window.vkBlocksSliderI18n = {
				actualCountLabel: 'Showing %1$s to %2$s of %3$s',
			};
			const config = loadViewJsAndCaptureConfig(
				JSON.stringify({
					...baseAttributes,
					showActualSlideCount: true,
				})
			);
			const fakeSwiperInstance = {
				params: { slidesPerView: 3 },
				activeIndex,
				visibleSlidesIndexes,
				slides: new Array(6).fill(null),
			};
			const result = renderAndUpdate(config, fakeSwiperInstance);

			// 非centeredSlidesのため、共有ヘルパーもactiveIndex + slidesPerViewの
			// 式で計算する（#3080 再修正。visibleSlidesIndexesは渡さない）。
			// Since this is the non-centeredSlides case, the shared helper also
			// computes via the activeIndex + slidesPerView formula (#3080
			// re-fix; visibleSlidesIndexes is not passed here).
			const expected = getActualSlideCountPagination({
				totalSlides: 6,
				activeIndex,
				slidesPerView: 3,
			});
			const expectedAriaLabel = formatActualSlideCountAriaLabel(
				'Showing %1$s to %2$s of %3$s',
				expected
			);

			expect(result.currentText).toBe(expected.currentText);
			expect(result.totalText).toBe(String(expected.total));
			expect(result.currentAriaHidden).toBe('true');
			expect(result.totalAriaHidden).toBe('true');
			expect(result.srText).toBe(expectedAriaLabel);
			// role="text" は使わない（#3080, CodeRabbit指摘）
			expect(result.role).toBeNull();
			expect(result.ariaLabel).toBeNull();
		}
	);

	// #3080 CodeRabbit指摘の回帰テスト（centeredSlides）: 6枚・3枚表示・
	// centeredSlides有効時の開始・中央・末尾3パターンでも、view.js の実装が
	// 共有ヘルパーと一致することを確認する。
	//
	// #3080 CodeRabbit feedback regression test (centeredSlides): confirms
	// view.js's real implementation matches the shared helper at the start,
	// center, and end positions for 6 slides / 3 per view / centeredSlides on.
	it.each([
		{ name: '開始位置', visibleSlidesIndexes: [0, 1] },
		{ name: '中央位置', visibleSlidesIndexes: [2, 3, 4] },
		{ name: '末尾位置', visibleSlidesIndexes: [4, 5] },
	])(
		'centeredSlides $name: matches the shared helper',
		({ visibleSlidesIndexes }) => {
			window.vkBlocksSliderI18n = {
				actualCountLabel: 'Showing %1$s to %2$s of %3$s',
			};
			const config = loadViewJsAndCaptureConfig(
				JSON.stringify({
					...baseAttributes,
					showActualSlideCount: true,
					centeredSlides: true,
				})
			);
			const fakeSwiperInstance = {
				// centeredSlides: true を含めないと、view.js の実装が
				// centeredSlides無効時のactiveIndexベースの分岐に入ってしまう
				// （#3080 再修正で追加された分岐）。
				// Without centeredSlides: true here, view.js's implementation
				// falls into the non-centeredSlides activeIndex-based branch
				// (added by the #3080 re-fix).
				params: { slidesPerView: 3, centeredSlides: true },
				activeIndex:
					visibleSlidesIndexes[
						Math.floor(visibleSlidesIndexes.length / 2)
					],
				visibleSlidesIndexes,
				slides: new Array(6).fill(null),
			};
			const result = renderAndUpdate(config, fakeSwiperInstance);
			// centeredSlides有効時のため、共有ヘルパーにも centeredSlides: true を
			// 渡してvisibleSlidesIndexesベースの計算をさせる。
			// Since centeredSlides is enabled here, pass centeredSlides: true to
			// the shared helper too, so it uses the visibleSlidesIndexes-based
			// calculation.
			const expected = getActualSlideCountPagination({
				visibleSlidesIndexes,
				totalSlides: 6,
				centeredSlides: true,
			});
			expect(result.currentText).toBe(expected.currentText);
		}
	);

	// #3080 CodeRabbit指摘の回帰テスト: slidesPerView<=1（1枚ずつ表示）に切り替わった
	// 際、以前設定した aria-hidden・sr-onlyラベルが残らず削除されることを確認する。
	//
	// #3080 CodeRabbit feedback regression test: confirms stale aria-hidden / sr-only
	// label attributes are cleared when slidesPerView drops to 1 or less (e.g. via a
	// responsive breakpoint change).
	it('clears stale aria-hidden and screen-reader-text when slidesPerView drops to 1 or less', () => {
		window.vkBlocksSliderI18n = {
			actualCountLabel: 'Showing %1$s to %2$s of %3$s',
		};
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		const subEl = document.createElement('div');
		subEl.innerHTML = config.pagination.renderFraction(
			'swiper-pagination-current',
			'swiper-pagination-total'
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
		// #3080 CodeRabbit指摘の回帰テスト: .swiper-pagination-total 側も
		// current と同じタイミングで aria-hidden が設定されることを確認する
		// （current だけ確認して total を見落とすリグレッションを防ぐ）。
		// #3080 CodeRabbit feedback regression test: verify
		// .swiper-pagination-total also gets aria-hidden at the same time as
		// current (guards against a regression that only checks current and
		// misses total).
		expect(
			subEl
				.querySelector('.swiper-pagination-total')
				.getAttribute('aria-hidden')
		).toBe('true');
		// 区切り文字「 / 」も同様にスクリーンリーダーから隠されることを確認する
		// （CodeRabbit指摘）。
		// Also verify the " / " separator is likewise hidden from assistive
		// tech (CodeRabbit feedback).
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
		// #3080 CodeRabbit指摘の回帰テスト: 1枚表示に戻したとき、
		// .swiper-pagination-total 側の aria-hidden も解除されることを確認する。
		// #3080 CodeRabbit feedback regression test: verify
		// .swiper-pagination-total's aria-hidden is also cleared when
		// reverting to single-slide display.
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

	// #3080 CodeRabbit指摘の回帰テスト: window.vkBlocksSliderI18n.actualCountLabel
	// が何らかの理由（localizeスクリプトのデータ未取得等）で取得できない場合、
	// sr-only テキストが空のままにならず、「開始–終了 / 総数」形式のフォーマット
	// 済みテキストにフォールバックすることを確認する。視覚要素（current/total）
	// は引き続き aria-hidden のままであることも合わせて確認する。
	//
	// #3080 CodeRabbit feedback regression test: verifies that when
	// window.vkBlocksSliderI18n.actualCountLabel cannot be obtained for any
	// reason (e.g. the localized script data was not obtained), the sr-only
	// text does not stay empty and instead falls back to a plain
	// "start–end / total" formatted string. Also verifies the visual elements
	// (current/total) remain aria-hidden.
	it('falls back to a plain "start–end / total" sr-only text when window.vkBlocksSliderI18n is unavailable', () => {
		// afterEach で削除されるため、他のテストの影響を受けず未設定の状態
		// （localizeスクリプトのデータ未取得を想定）で検証できる。
		// afterEach deletes this, so it starts unset here (simulating the
		// localized script data not having been obtained), unaffected by
		// other tests.
		delete window.vkBlocksSliderI18n;
		const config = loadViewJsAndCaptureConfig(
			JSON.stringify({ ...baseAttributes, showActualSlideCount: true })
		);
		const fakeSwiperInstance = {
			params: { slidesPerView: 3 },
			activeIndex: 0,
			visibleSlidesIndexes: [0, 1, 2],
			slides: new Array(6).fill(null),
		};
		const result = renderAndUpdate(config, fakeSwiperInstance);

		expect(result.srText).toBe('1–3 / 6');
		expect(result.currentAriaHidden).toBe('true');
		expect(result.totalAriaHidden).toBe('true');
	});
});
