/**
 * slidesPerGroup を正整数に正規化する。view.js・post-list-slider/view.js の
 * toIntSpg と完全に同一のロジック（小数は切り捨て。例: 2.9 → 2）。
 * edit-slider.js（エディタプレビューの実際のSwiper設定組み立て）からも
 * 共有される（#3080, CodeRabbit指摘）。
 *
 * Normalizes a slidesPerGroup value to a positive integer. Identical to the
 * toIntSpg logic in view.js / post-list-slider/view.js (decimals are
 * floored, e.g. 2.9 → 2). Also shared by edit-slider.js (the editor
 * preview's actual Swiper config assembly) (#3080, CodeRabbit feedback).
 *
 * @param {number|string} value 正規化前の値（通常は slidesPerView の値）.
 * @return {number} 正規化された slidesPerGroup（1以上の整数）。
 */
export const normalizeSlidesPerGroup = (value) => {
	const numericValue = Number(value);
	return Number.isFinite(numericValue)
		? Math.max(1, Math.floor(numericValue))
		: 1;
};

/**
 * Swiper の loopFix と同じロジックで最小必要スライド数を算出する。
 * centeredSlides=true かつ slidesPerView が偶数のとき Swiper は内部で +1 するため
 * 必要枚数が増加する (例: slidesPerView=2 → 内部w=3 → 最小5枚)。
 *
 * @param {number}  spv        slidesPerView
 * @param {number}  spg        slidesPerGroup (must be a positive integer)
 * @param {boolean} isCentered centeredSlides
 * @return {number} minimum slide count required for loop mode
 */
export const getMinSlidesForLoop = (spv, spg, isCentered) => {
	const parsedSpv = Number(spv);
	const normalizedSpv = Math.max(
		1,
		Number.isFinite(parsedSpv) ? parsedSpv : 1
	);
	const parsedSpg = Number(spg);
	const normalizedSpg = Math.max(
		1,
		Number.isFinite(parsedSpg) ? Math.floor(parsedSpg) : 1
	);

	let w = Math.ceil(normalizedSpv);
	if (isCentered && w % 2 === 0) {
		w += 1;
	}
	let y = isCentered
		? Math.max(normalizedSpg, Math.ceil(w / 2))
		: normalizedSpg;
	if (y % normalizedSpg !== 0) {
		y += normalizedSpg - (y % normalizedSpg);
	}
	return w + y;
};

/**
 * view.js の Swiper 設定組み立て（`if (attributes.effect !== 'fade') {...}` の
 * ブロック）が導出する slidesPerView/slidesPerGroup の組（基本 + ブレークポイント）
 * を、属性値から同じ規則で再現する（#3080）。
 *
 * effect が 'fade' の場合、view.js は config.slidesPerView/slidesPerGroup を
 * 一切設定しないため、ループ判定は spv=1, spg=1 の単一ペアで行われる
 * （`config.slidesPerView || 1` 等のフォールバックによる）。
 *
 * edit-slider.js（314行付近）の実際の判定は
 * `attributes.effect && attributes.effect !== 'fade'` であり、effect が
 * 未設定（undefined・空文字）の場合も複数枚表示の設定ブロックに入らず、
 * fade と同じ単一ペア相当の挙動になる。effect の既定値は 'slide' のため
 * 発生条件は限定的だが、呼び出し側と食い違わないよう `!effect` も
 * 単一ペア扱いにする（CodeRabbit指摘）。
 *
 * Reproduces, from raw attribute values, the same slidesPerView/slidesPerGroup
 * pairs (base + breakpoints) that view.js's Swiper config assembly (the
 * `if (attributes.effect !== 'fade') {...}` block) derives (#3080).
 *
 * When effect is 'fade', view.js never sets config.slidesPerView/slidesPerGroup
 * at all, so the loop check falls back to a single spv=1, spg=1 pair (via the
 * `config.slidesPerView || 1` etc. fallback).
 *
 * edit-slider.js's actual condition (around line 314) is
 * `attributes.effect && attributes.effect !== 'fade'`, so when effect is
 * unset (undefined or empty string), it also skips the multi-slide-per-view
 * block and behaves the same as 'fade' (a single pair). effect defaults to
 * 'slide', so this is a narrow edge case, but `!effect` is also treated as
 * the single-pair case here to stay in sync with the caller (CodeRabbit
 * feedback).
 *
 * @param {Object}        params
 * @param {string}        [params.effect]              エフェクト種別
 * @param {number|string} [params.slidesPerView]       基本の slidesPerView（互換用の古い属性）
 * @param {number|string} [params.slidesPerViewMobile] モバイル時の slidesPerView
 * @param {number|string} [params.slidesPerViewTablet] タブレット時の slidesPerView（ブレークポイント）
 * @param {number|string} [params.slidesPerViewPC]     PC時の slidesPerView（ブレークポイント）
 * @param {string}        [params.slidesPerGroup]      'slides-per-view' の時だけ spv と同数を group にする
 * @return {{spv: number, spg: number}[]} spv/spg の組の配列
 */
const deriveSlidesPerViewGroupPairs = ({
	effect,
	slidesPerView,
	slidesPerViewMobile,
	slidesPerViewTablet,
	slidesPerViewPC,
	slidesPerGroup,
}) => {
	if (!effect || effect === 'fade') {
		return [{ spv: 1, spg: 1 }];
	}

	// slidesPerGroup が 'slides-per-view' のときは spv と同数を group にするが、
	// view.js の toIntSpg と同じロジック（上の normalizeSlidesPerGroup）で
	// 整数へ正規化してから使う（小数は切り捨て。例: 2.9 → 2）。以前は
	// Number.isInteger() チェックで非整数を1にフォールバックしていたが、
	// これは toIntSpg の実際の挙動と食い違っており誤りだった
	// （CodeRabbit指摘・再修正）。
	// When slidesPerGroup is 'slides-per-view', the group size mirrors spv,
	// but is first normalized to an integer using the same logic as view.js's
	// toIntSpg (normalizeSlidesPerGroup above; decimals are floored, e.g.
	// 2.9 → 2). This used to fall back to 1 for non-integers via a
	// Number.isInteger() check, but that did not match toIntSpg's actual
	// behavior and was wrong (CodeRabbit feedback, re-fix).
	const resolveSpg = (value) =>
		slidesPerGroup === 'slides-per-view'
			? normalizeSlidesPerGroup(value)
			: 1;

	let baseSpv;
	let baseSpg;
	if (slidesPerViewMobile) {
		baseSpv = Number(slidesPerViewMobile);
		baseSpg = resolveSpg(slidesPerViewMobile);
	} else if (slidesPerView) {
		baseSpv = Number(slidesPerView);
		baseSpg = resolveSpg(slidesPerView);
	} else {
		baseSpv = 1;
		baseSpg = 1;
	}

	const pairs = [{ spv: baseSpv || 1, spg: baseSpg || 1 }];
	if (slidesPerViewTablet) {
		pairs.push({
			spv: Number(slidesPerViewTablet),
			spg: resolveSpg(slidesPerViewTablet),
		});
	}
	if (slidesPerViewPC) {
		pairs.push({
			spv: Number(slidesPerViewPC),
			spg: resolveSpg(slidesPerViewPC),
		});
	}
	return pairs;
};

/**
 * 保存された `loop` 属性と現在のスライド枚数・表示設定から、Swiperが実際に
 * ループ動作するかどうかの「実効loop状態」を算出する（#3080）。
 *
 * view.js には、スライド枚数が少なすぎて Swiper のループモードが実際には
 * 機能しない場合に、ランタイムで `config.loop` を強制的に `false` にする
 * ロジックがある（`needsLoopDisable`）。そのため、保存された `attributes.loop`
 * が `true` でも、実際にブラウザで動くループ状態は `false` になっている
 * ケースがある。この関数は view.js のその判定を、Swiperを起動せずに
 * （エディタの Inspector など）再現するためのもの。
 *
 * 保存された `loop` 属性をそのまま「実効loop状態」とみなして判定に使うと、
 * このケースで判定がずれる（Claude Code code-review指摘、issue #3080）。
 *
 * Computes the *effective* loop state — whether Swiper will actually run in
 * loop mode — from the saved `loop` attribute plus the current slide count and
 * display settings (#3080).
 *
 * view.js has logic that forces `config.loop` to `false` at runtime when there
 * are too few slides for Swiper's loop mode to actually work
 * (`needsLoopDisable`). So the saved `attributes.loop` can be `true` while the
 * loop state that actually runs in the browser is `false`. This function
 * reproduces that same determination without spinning up Swiper (e.g. for use
 * in the editor Inspector).
 *
 * Treating the saved `loop` attribute itself as the effective loop state
 * misses this case (found via Claude Code code-review, issue #3080).
 *
 * @param {Object}        params
 * @param {boolean}       params.loop                  保存された loop 属性
 * @param {number}        params.slideCount            実際のスライド枚数（インナーブロック数）
 * @param {string}        [params.effect]              エフェクト種別
 * @param {number|string} [params.slidesPerView]       基本の slidesPerView（互換用の古い属性）
 * @param {number|string} [params.slidesPerViewMobile] モバイル時の slidesPerView
 * @param {number|string} [params.slidesPerViewTablet] タブレット時の slidesPerView（ブレークポイント）
 * @param {number|string} [params.slidesPerViewPC]     PC時の slidesPerView（ブレークポイント）
 * @param {string}        [params.slidesPerGroup]      'slides-per-view' の時だけ spv と同数を group にする
 * @param {boolean}       [params.centeredSlides]      centeredSlides 属性
 * @return {boolean} true なら実際にループ動作する（false なら枚数不足等で強制OFFされる）
 */
export const getEffectiveLoop = ({
	loop,
	slideCount,
	effect,
	slidesPerView,
	slidesPerViewMobile,
	slidesPerViewTablet,
	slidesPerViewPC,
	slidesPerGroup,
	centeredSlides,
}) => {
	// 保存された loop がそもそも false なら、実効状態も false（判定不要）。
	if (!loop) {
		return false;
	}

	const pairs = deriveSlidesPerViewGroupPairs({
		effect,
		slidesPerView,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
	});
	const isCentered = !!centeredSlides;
	const needsLoopDisable = pairs.some(
		({ spv, spg }) =>
			Number(slideCount) < getMinSlidesForLoop(spv, spg, isCentered)
	);
	return !needsLoopDisable;
};
