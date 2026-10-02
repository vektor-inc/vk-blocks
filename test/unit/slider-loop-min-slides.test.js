/* eslint-env jest */
import {
	getMinSlidesForLoop,
	getEffectiveLoop,
} from '../../src/blocks/slider/loop-min-slides';

describe('getMinSlidesForLoop', () => {
	it('non-centered: minimum is spv (rounded up) + spg', () => {
		// w = ceil(3) = 3, y = spg = 1 (not centered) → 3 + 1 = 4
		expect(getMinSlidesForLoop(3, 1, false)).toBe(4);
	});

	it('centered + even slidesPerView: Swiper internally adds 1 to w, increasing the minimum', () => {
		// spv=2, centered: w = ceil(2) = 2 → even → w += 1 → w = 3
		// y = max(spg=1, ceil(w/2)=2) = 2
		// total = 3 + 2 = 5
		expect(getMinSlidesForLoop(2, 1, true)).toBe(5);
	});
});

// #3080 Claude Code code-review 指摘の回帰テスト:
// 「保存された loop 属性」ではなく「実際にSwiperがループ動作するかどうか」
// （実効loop状態）を正しく算出できることを確認する。
//
// #3080 Claude Code code-review feedback regression tests: verify this
// correctly computes the *effective* loop state (whether Swiper will
// actually run in loop mode), not just the raw saved `loop` attribute.
describe('getEffectiveLoop', () => {
	it('loop属性がfalseならスライド枚数に関わらず実効loopもfalse', () => {
		expect(
			getEffectiveLoop({
				loop: false,
				slideCount: 100,
				slidesPerViewMobile: 1,
			})
		).toBe(false);
	});

	// issue #3080 のバグ報告そのものの再現シナリオ: loop:true（保存値）・
	// pagination:fraction・slidesPerView:3・slidesPerGroup:1（'slides-per-view'
	// ではないので実質1）・総スライド数3枚。
	// この設定では最低4枚必要（getMinSlidesForLoopのテスト参照）なので、
	// Swiperは実行時にループを強制的に無効化する。保存された loop 属性だけを
	// 見ると true のままだが、実効loop状態は false になるべき。
	//
	// The exact reproduction scenario from the issue #3080 bug report: loop:true
	// (saved value), pagination:fraction, slidesPerView:3, slidesPerGroup:1 (not
	// 'slides-per-view', so effectively 1), 3 total slides. This setup requires
	// at least 4 slides (see the getMinSlidesForLoop test above), so Swiper
	// forces loop off at runtime. The raw saved loop attribute stays true, but
	// the effective loop state must be false.
	it('スライド枚数不足のとき、保存されたloop:trueでも実効loopはfalseになる（issue #3080 再現シナリオ）', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 3,
				effect: 'slide',
				slidesPerViewMobile: 3,
				slidesPerViewTablet: 3,
				slidesPerViewPC: 3,
				slidesPerGroup: 1,
				centeredSlides: false,
			})
		).toBe(false);
	});

	it('スライド枚数が十分なとき、loop:trueなら実効loopもtrue', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 6,
				effect: 'slide',
				slidesPerViewMobile: 3,
				slidesPerViewTablet: 3,
				slidesPerViewPC: 3,
				slidesPerGroup: 1,
				centeredSlides: false,
			})
		).toBe(true);
	});

	it('slidesPerViewMobile未設定・slidesPerViewのみ設定（互換の古い属性）でも判定できる', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 3,
				effect: 'slide',
				slidesPerView: 3,
				slidesPerGroup: 1,
				centeredSlides: false,
			})
		).toBe(false);
	});

	it('slidesPerViewMobile・slidesPerViewともに未設定なら1枚表示扱い（1枚あれば足りる）', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 2,
				effect: 'slide',
				centeredSlides: false,
			})
		).toBe(true);
	});

	// effect が 'fade' のときは view.js が config.slidesPerView/slidesPerGroup を
	// 一切設定しないため、spv=1, spg=1 の単一ペアで判定される。
	// When effect is 'fade', view.js never sets config.slidesPerView/
	// slidesPerGroup, so the check falls back to a single spv=1, spg=1 pair.
	it('effect=fadeのときはslidesPerView系の属性を無視し、1枚ずつ表示として判定する', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 2,
				effect: 'fade',
				slidesPerViewMobile: 5, // fade では無視される
				centeredSlides: false,
			})
		).toBe(true);
	});

	// #3080 CodeRabbit指摘の回帰テスト: edit-slider.js（314行付近）の実際の判定は
	// `attributes.effect && attributes.effect !== 'fade'` であり、effect が
	// 未設定（undefined・空文字）の場合も fade と同様に単一ペア（spv=1, spg=1）
	// 扱いになる。deriveSlidesPerViewGroupPairs（getEffectiveLoop内部）の
	// `!effect || effect === 'fade'` 判定がこの呼び出し側の挙動と一致することを
	// 確認する。
	//
	// #3080 CodeRabbit feedback regression test: edit-slider.js's actual
	// condition (around line 314) is
	// `attributes.effect && attributes.effect !== 'fade'`, so when effect is
	// unset (undefined or empty string), it also falls back to a single pair
	// (spv=1, spg=1), the same as 'fade'. Verifies
	// deriveSlidesPerViewGroupPairs's (inside getEffectiveLoop) `!effect ||
	// effect === 'fade'` check matches this caller behavior.
	it.each([
		{ name: 'undefined', effect: undefined },
		{ name: '空文字', effect: '' },
	])(
		'effectが未設定（$name）のときもslidesPerView系の属性を無視し、1枚ずつ表示として判定する',
		({ effect }) => {
			expect(
				getEffectiveLoop({
					loop: true,
					slideCount: 2,
					effect,
					slidesPerViewMobile: 5, // effect未設定では無視される（fadeと同様）
					centeredSlides: false,
				})
			).toBe(true);
		}
	);

	// ブレークポイントのいずれか1つでも不足していれば、全体としてループを
	// 無効化する（Swiperのインスタンスは1つのため、breakpointごとに
	// ループON/OFFを切り替えられない）。
	//
	// If any single breakpoint would fail the minimum, loop is disabled
	// overall (a single Swiper instance cannot toggle loop per breakpoint).
	it('一部のブレークポイントだけ枚数不足でも、全体として実効loopはfalseになる', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 5,
				effect: 'slide',
				// mobile: 1枚表示 → 最低2枚で足りる
				slidesPerViewMobile: 1,
				// PC: 5枚表示・centered → w=ceil(5)=5（5は奇数のため+1調整は不要でw=5のまま）
				// y = max(1, ceil(5/2)=3) = 3 → 最低8枚必要、5枚では不足
				slidesPerViewPC: 5,
				slidesPerGroup: 1,
				centeredSlides: true,
			})
		).toBe(false);
	});

	// #3080 CodeRabbit指摘の回帰テスト（再修正）: slidesPerGroup が
	// 'slides-per-view' のときに使う値（spv自身）が整数でない（小数の）場合、
	// view.js の toIntSpg は Math.max(1, Math.floor(n)) で小数を切り捨てる
	// （1 にフォールバックするわけではない）。以前このテストは「1に
	// フォールバックする」を正としていたが、それは toIntSpg の実際の挙動と
	// 食い違っており誤りだった（CodeRabbit指摘・再修正）。
	//
	// 検証: slidesPerViewMobile=2.9・slidesPerGroup='slides-per-view'・
	// centeredSlides=false のとき、
	//   - 正しい挙動（spg = floor(2.9) = 2）: w=ceil(2.9)=3, y=2 → 最低5枚
	//   - 誤った挙動（spg が 1 にフォールバック）: w=3, y=1 → 最低4枚
	// スライド4枚・5枚で境界を検証することで、挙動の違いが観測できる。
	//
	// #3080 CodeRabbit feedback regression test (re-fix): when slidesPerGroup
	// is 'slides-per-view', the value it uses (spv itself) can be a
	// non-integer (decimal). view.js's toIntSpg floors decimals via
	// Math.max(1, Math.floor(n)) — it does not fall back to 1. This test used
	// to assert the "falls back to 1" behavior as correct, but that
	// contradicted toIntSpg's actual behavior and was wrong (CodeRabbit
	// feedback, re-fix).
	//
	// Verification: with slidesPerViewMobile=2.9, slidesPerGroup='slides-per-view',
	// centeredSlides=false:
	//   - correct behavior (spg = floor(2.9) = 2): w=ceil(2.9)=3, y=2 → minimum 5
	//   - old/wrong behavior (spg falls back to 1): w=3, y=1 → minimum 4
	// Testing the boundary at 4 and 5 slides makes the difference observable.
	it('slidesPerGroupが"slides-per-view"のときslidesPerViewの小数はview.jsのtoIntSpgと同じくfloorで整数化される', () => {
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 5,
				effect: 'slide',
				slidesPerViewMobile: 2.9,
				slidesPerGroup: 'slides-per-view',
				centeredSlides: false,
			})
		).toBe(true);
		expect(
			getEffectiveLoop({
				loop: true,
				slideCount: 4,
				effect: 'slide',
				slidesPerViewMobile: 2.9,
				slidesPerGroup: 'slides-per-view',
				centeredSlides: false,
			})
		).toBe(false);
	});
});

// #3080 CodeRabbit指摘の回帰テスト: エディタプレビューの実際のSwiper起動
// （edit-slider.js の LaunchSwiperAll）でも、slidesPerGroup が
// 'slides-per-view' のとき、小数の slidesPerViewMobile が view.js の
// toIntSpg と同じロジック（loop-min-slides.js の normalizeSlidesPerGroup
// 経由）で floor 整数化されて Swiper に渡ることを、実際にモジュールを
// 実行して検証する（上のテスト群は getEffectiveLoop・getMinSlidesForLoop
// という純粋関数のみを検証しており、edit-slider.js 側の実際の配線までは
// カバーしていなかったため）。
//
// #3080 CodeRabbit feedback regression test: verifies, by actually running
// the module, that the editor preview's real Swiper launch
// (edit-slider.js's LaunchSwiperAll) also floors a decimal
// slidesPerViewMobile into an integer slidesPerGroup — via
// normalizeSlidesPerGroup in loop-min-slides.js, the same logic as view.js's
// toIntSpg — when slidesPerGroup is 'slides-per-view'. (The tests above only
// exercise the pure functions getEffectiveLoop/getMinSlidesForLoop, not
// edit-slider.js's actual wiring.)
describe('LaunchSwiperAll (real execution, edit-slider.js)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		jest.resetModules();
	});

	it('floors a decimal slidesPerViewMobile into slidesPerGroup, like view.js\'s toIntSpg, when slidesPerGroup is "slides-per-view"', () => {
		const attributes = {
			editorMode: 'slide',
			blockId: 'testblock',
			effect: 'slide',
			slidesPerViewMobile: 2.9,
			slidesPerGroup: 'slides-per-view',
		};
		document.body.innerHTML = `
			<div class="vk_slider" data-vkb-slider='${JSON.stringify(attributes)}'>
				<div>
					<div>
						<div class="block-editor-inner-blocks">
							<div class="block-editor-block-list__layout">
								<div class="vk_slider_item"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		let capturedConfig = null;
		// resetModules() を doMock() より前に呼ぶ（CodeRabbit指摘: 順序が
		// 分かりにくいため）。doMock() 自体はモジュールキャッシュの状態に
		// 関わらずモック登録を行うため、動作自体はどちらの順序でも変わらない。
		// resetModules() is called before doMock() (CodeRabbit feedback: the
		// previous order was confusing). doMock() registers the mock
		// regardless of the module cache state, so the actual behavior is the
		// same either way.
		jest.resetModules();
		jest.doMock('swiper/bundle', () =>
			jest.fn(function FakeSwiper(el, config) {
				capturedConfig = config;
				return {};
			})
		);

		// eslint-disable-next-line global-require
		const {
			LaunchSwiperAll,
		} = require('../../src/blocks/slider/edit-slider.js');
		LaunchSwiperAll(document.body);

		expect(capturedConfig).not.toBeNull();
		expect(capturedConfig.slidesPerView).toBe(2.9);
		expect(capturedConfig.slidesPerGroup).toBe(2);
	});
});
