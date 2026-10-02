/* eslint-env jest */
import {
	getActualSlideCountPagination,
	formatActualSlideCountAriaLabel,
	shouldOverrideActualSlideCountPagination,
} from '../../src/blocks/slider/pagination-actual-count';

// #3080: issue のコメントで jsdom + 実際の Swiper 14.0.6 を動かして検証した
// 「分母=実スライド数、分子=表示範囲」の対応表をそのままテストケース化したもの。
//
// 【再修正】非centeredSlides（既定・多数派のケース）の表示範囲は、以前は
// visibleSlidesIndexes（実際にビューポート内に見えているスライドのindex一覧）
// から求めていたが、これは「次へ」を送るたびに表示範囲が1ステップ遅れて止まる」
// という回帰を麗美の実機確認で引き起こした（原因: visibleSlidesIndexes が
// Swiper の幾何学的な重なり判定に依存しており、スライドの描画幅がSwiperの
// 計算スロット幅とズレる環境で可視枚数を誤判定する）。そのため非centeredSlides
// では activeIndex + slidesPerView の式（実際の描画幅に依存しない純粋な
// index計算）に戻した。以下の activeIndex は、各 visibleSlidesIndexes 案の
// 最小値（＝Swiperが実際にその状態で報告する activeIndex）に対応する。
//
// #3080: these test cases mirror the "denominator = actual slide count,
// numerator = visible range" table validated against real Swiper 14.0.6 in
// jsdom (see the issue's decision-record comments).
//
// 【re-fix】The display range for the non-centeredSlides case (the default,
// majority case) used to be derived from visibleSlidesIndexes (the indexes of
// slides actually visible in the viewport), but that caused a regression
// found during real-device QA where the displayed range lagged one step
// behind while clicking "next" (cause: visibleSlidesIndexes depends on
// Swiper's geometric overlap check, which miscounts visible slides in
// environments where the rendered slide width drifts from Swiper's computed
// slot width). So the non-centeredSlides case was reverted to an
// activeIndex + slidesPerView formula (a pure index calculation independent
// of actual rendered geometry). The activeIndex values below correspond to
// the minimum of each original visibleSlidesIndexes case (i.e. the
// activeIndex Swiper actually reports in that state).
describe('getActualSlideCountPagination', () => {
	const cases = [
		{
			name: '6枚 / 3枚表示 / 1つずつ遷移（4停止）',
			totalSlides: 6,
			slidesPerView: 3,
			activeIndexList: [0, 1, 2, 3],
			expected: ['1–3', '2–4', '3–5', '4–6'],
		},
		{
			name: '6枚 / 3枚表示 / 表示アイテム数と同じ遷移（2停止）',
			totalSlides: 6,
			slidesPerView: 3,
			activeIndexList: [0, 3],
			expected: ['1–3', '4–6'],
		},
		{
			name: '7枚 / 3枚表示 / 1つずつ遷移（5停止）',
			totalSlides: 7,
			slidesPerView: 3,
			activeIndexList: [0, 1, 2, 3, 4],
			expected: ['1–3', '2–4', '3–5', '4–6', '5–7'],
		},
		{
			name: '7枚 / 3枚表示 / 表示アイテム数と同じ遷移（3停止、末尾が1つだけ進む）',
			totalSlides: 7,
			slidesPerView: 3,
			// Swiper は末尾に空白を作らないため、最後の1回だけ slidesPerGroup 分
			// ではなく1つだけ進む。表示範囲が直前と一部重複するのは
			// Swiper 標準動作の副産物であり、意図した仕様（issue コメント参照）。
			activeIndexList: [0, 3, 4],
			expected: ['1–3', '4–6', '5–7'],
		},
		{
			name: '5枚 / 2枚表示 / 1つずつ遷移（4停止）',
			totalSlides: 5,
			slidesPerView: 2,
			activeIndexList: [0, 1, 2, 3],
			expected: ['1–2', '2–3', '3–4', '4–5'],
		},
		{
			name: '5枚 / 2枚表示 / 表示アイテム数と同じ遷移（3停止、末尾が1つだけ進む）',
			totalSlides: 5,
			slidesPerView: 2,
			activeIndexList: [0, 2, 3],
			expected: ['1–2', '3–4', '4–5'],
		},
	];

	it.each(cases)(
		'$name: 各停止位置で正しい表示範囲・総数を返す',
		({ totalSlides, slidesPerView, activeIndexList, expected }) => {
			activeIndexList.forEach((activeIndex, i) => {
				const result = getActualSlideCountPagination({
					totalSlides,
					activeIndex,
					slidesPerView,
				});
				expect(result.currentText).toBe(expected[i]);
				expect(result.total).toBe(totalSlides);
			});

			// 最後の停止では、表示範囲の終了値が必ず総数と一致する
			// （「進めないのに数字が届かない」問題が起きないことの担保）。
			const lastActiveIndex = activeIndexList[activeIndexList.length - 1];
			const lastResult = getActualSlideCountPagination({
				totalSlides,
				activeIndex: lastActiveIndex,
				slidesPerView,
			});
			expect(lastResult.end).toBe(totalSlides);
		}
	);

	// #3080 CodeRabbit指摘の回帰テスト: centeredSlides（中央寄せ表示）が有効なとき、
	// activeIndex は表示範囲の「先頭」ではなく「中央」になるため、activeIndexベースの
	// 式では表示範囲がずれる。centeredSlides: true を渡し、visibleSlidesIndexesの
	// 最小・最大から求めれば、開始・中央・末尾のいずれの位置でも正しい範囲になる
	// ことを確認する。検証例: 6枚・slidesPerView:3・centeredSlides有効時
	// （issueのdecision-record・CodeRabbitのレビュー指摘より）。
	//
	// #3080 CodeRabbit feedback regression test: when centeredSlides is enabled,
	// activeIndex is the *center* of the visible range, not its start, so an
	// activeIndex-based formula produces the wrong range. Passing
	// centeredSlides: true and deriving the range from the min/max of
	// visibleSlidesIndexes must produce the correct range at the start, center,
	// and end positions alike. Verification example: 6 slides, slidesPerView: 3,
	// centeredSlides enabled (from the issue's decision-record and CodeRabbit's
	// review).
	describe('centeredSlides（中央寄せ表示）が有効なとき', () => {
		it.each([
			{
				name: '開始位置（centeredSlides、6枚中3枚表示）',
				visibleSlidesIndexes: [0, 1],
				expected: '1–2',
			},
			{
				name: '中央位置（centeredSlides、6枚中3枚表示）',
				visibleSlidesIndexes: [2, 3, 4],
				expected: '3–5',
			},
			{
				name: '末尾位置（centeredSlides、6枚中3枚表示）',
				visibleSlidesIndexes: [4, 5],
				expected: '5–6',
			},
		])('$name', ({ visibleSlidesIndexes, expected }) => {
			const result = getActualSlideCountPagination({
				visibleSlidesIndexes,
				totalSlides: 6,
				centeredSlides: true,
				// centeredSlides: true のときは activeIndex/slidesPerView は
				// 使われないはずであることも、意図的に不正な値を渡して確認する
				// （visibleSlidesIndexes が優先して使われることの担保）。
				activeIndex: 999,
				slidesPerView: 999,
			});
			expect(result.currentText).toBe(expected);
			expect(result.total).toBe(6);
		});
	});

	describe('centeredSlides有効時の防御的な入力の扱い', () => {
		it('配列の順序に関わらず最小値・最大値から範囲を求める', () => {
			const result = getActualSlideCountPagination({
				visibleSlidesIndexes: [4, 2, 3],
				totalSlides: 7,
				centeredSlides: true,
			});
			expect(result.currentText).toBe('3–5');
		});

		it('空配列のときは1枚目にフォールバックする', () => {
			const result = getActualSlideCountPagination({
				visibleSlidesIndexes: [],
				totalSlides: 6,
				centeredSlides: true,
			});
			expect(result.currentText).toBe('1–1');
		});

		it('未定義のときは1枚目にフォールバックする', () => {
			const result = getActualSlideCountPagination({
				visibleSlidesIndexes: undefined,
				totalSlides: 6,
				centeredSlides: true,
			});
			expect(result.currentText).toBe('1–1');
		});

		it('総数を超えるindexが混ざっていても総数でクランプする', () => {
			const result = getActualSlideCountPagination({
				visibleSlidesIndexes: [4, 5, 6, 7],
				totalSlides: 6,
				centeredSlides: true,
			});
			expect(result.end).toBe(6);
			expect(result.total).toBe(6);
		});
	});

	// #3080 回帰テスト（麗美の実機確認で発見）: 非centeredSlidesのときの
	// 防御的な入力の扱い。activeIndex・slidesPerViewが不正な値でも、
	// フォールバックにより範囲計算が破綻しないことを確認する。
	//
	// #3080 regression test (found during real-device QA): defensive input
	// handling for the non-centeredSlides case. Verifies the range calculation
	// does not break even when activeIndex/slidesPerView are invalid.
	describe('centeredSlides無効時の防御的な入力の扱い', () => {
		it('activeIndexが未定義のときは0にフォールバックする', () => {
			const result = getActualSlideCountPagination({
				totalSlides: 6,
				activeIndex: undefined,
				slidesPerView: 3,
			});
			expect(result.currentText).toBe('1–3');
		});

		it('activeIndexが負値・NaNのときは0にフォールバックする', () => {
			expect(
				getActualSlideCountPagination({
					totalSlides: 6,
					activeIndex: -1,
					slidesPerView: 3,
				}).currentText
			).toBe('1–3');
			expect(
				getActualSlideCountPagination({
					totalSlides: 6,
					activeIndex: NaN,
					slidesPerView: 3,
				}).currentText
			).toBe('1–3');
		});

		it('slidesPerViewが未定義・0以下のときは1にフォールバックする', () => {
			expect(
				getActualSlideCountPagination({
					totalSlides: 6,
					activeIndex: 2,
					slidesPerView: undefined,
				}).currentText
			).toBe('3–3');
			expect(
				getActualSlideCountPagination({
					totalSlides: 6,
					activeIndex: 2,
					slidesPerView: 0,
				}).currentText
			).toBe('3–3');
		});

		it('総数を超えるindexになっても総数でクランプする', () => {
			const result = getActualSlideCountPagination({
				totalSlides: 6,
				activeIndex: 5,
				slidesPerView: 3,
			});
			expect(result.end).toBe(6);
			expect(result.total).toBe(6);
		});
	});
});

describe('formatActualSlideCountAriaLabel', () => {
	it('replaces the %1$s / %2$s / %3$s tokens with the start / end / total values', () => {
		const label = formatActualSlideCountAriaLabel(
			'Showing %1$s to %2$s of %3$s',
			{ start: 1, end: 3, total: 6 }
		);
		expect(label).toBe('Showing 1 to 3 of 6');
	});

	it('returns an empty string when the template is missing', () => {
		expect(
			formatActualSlideCountAriaLabel(undefined, {
				start: 1,
				end: 3,
				total: 6,
			})
		).toBe('');
		expect(
			formatActualSlideCountAriaLabel('', { start: 1, end: 3, total: 6 })
		).toBe('');
	});
});

// #3080: 麗美の実機確認で発見されたバグの再発防止テスト。
// slidesPerView が 1 以下（「1枚ずつ表示」設定）のときは、ループOFFでも
// Swiper 自身の分母が既に実スライド数と一致するため、分母・分子を上書き
// してはいけない（上書きすると "1–1 / 6" のような冗長な範囲表記になる）。
//
// #3080: regression test for a bug found during real-device QA. When
// slidesPerView is 1 or less (the "one slide at a time" setting), Swiper's
// own denominator already matches the real slide count even with loop off,
// so the override must not apply (applying it produced a redundant range
// like "1–1 / 6").
describe('shouldOverrideActualSlideCountPagination', () => {
	it.each([
		{ slidesPerView: 2, expected: true },
		{ slidesPerView: 3, expected: true },
		{ slidesPerView: 1.5, expected: true },
	])(
		'returns true when slidesPerView ($slidesPerView) is greater than 1',
		({ slidesPerView, expected }) => {
			expect(
				shouldOverrideActualSlideCountPagination(slidesPerView)
			).toBe(expected);
		}
	);

	it.each([
		{ slidesPerView: 1 },
		{ slidesPerView: 0.5 },
		{ slidesPerView: 0 },
		{ slidesPerView: -1 },
		{ slidesPerView: undefined },
		{ slidesPerView: NaN },
		{ slidesPerView: 'auto' },
	])(
		'returns false when slidesPerView ($slidesPerView) is 1 or less, invalid, or not a plain number',
		({ slidesPerView }) => {
			expect(
				shouldOverrideActualSlideCountPagination(slidesPerView)
			).toBe(false);
		}
	);
});
