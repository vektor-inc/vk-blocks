/**
 * ループOFF×「スライドの枚数」(fraction)ページネーション用に、
 * 「実際のスライド枚数」を分母、「現在表示されている範囲」を分子として
 * 表示するためのテキストを計算する。
 *
 * Swiper (v14.0.6) はループOFF時、fractionページネーションの分母に
 * `snapGrid.length`（スライダーが実際に止まれる位置の数）を使う。
 * 複数枚同時表示だと、この数値は実スライド枚数より少なくなる（#3080）。
 * この計算式自体（Swiper内部）は変更せず、DOM上のテキスト表示だけを
 * この関数の戻り値で上書きする用途。
 *
 * 分子は単一の位置番号ではなく「表示範囲」（開始〜終了）とする。理由:
 * 分母だけを実スライド数に直すと、ループOFF・複数枚表示では実際に止まれる
 * 位置が限られるため、最後まで送っても分子が分母に届かないケースが生じる。
 * 表示範囲形式なら、終了値を総数でクランプすることで、最後の停止で必ず
 * 終了値と総数が一致する（issue #3080 コメントの実機検証で確認済み）。
 *
 * Computes the "showing X–Y of Z" text for the "Number of slides" (fraction)
 * pagination when loop is off. Swiper (v14.0.6) uses `snapGrid.length` (the
 * number of positions the slider can actually stop at) as the denominator
 * when loop is off; with multiple slides per view this is smaller than the
 * real slide count (#3080). This does not change Swiper's own calculation —
 * it only supplies replacement text for the DOM.
 *
 * The numerator is a display range (start–end) rather than a single position
 * number: fixing only the denominator would leave cases where the numerator
 * can never reach the denominator (loop off + multiple slides per view means
 * the slider can't stop at every index), which reads as broken. Clamping the
 * range's end to the total guarantees the last stop always shows end === total
 * (verified against real Swiper 14.0.6 in jsdom across slidesPerGroup / decimal
 * slidesPerView combinations — see issue #3080 decision-record comments).
 *
 * 表示範囲の求め方は `centeredSlides` の有無で切り替える（麗美の実機確認で
 * 見つかった #3080 の回帰・再修正）。
 *
 * - `centeredSlides` が有効なとき: Swiper 自身が computed する
 *   `visibleSlidesIndexes`（実際にビューポート内に見えているスライドの
 *   index一覧、0始まり）の最小値・最大値から求める。`activeIndex` は
 *   centeredSlides 有効時、表示範囲の「先頭」ではなく「中央」になるため、
 *   activeIndex を先頭とみなす式では中央寄せスライダーの表示範囲がずれる
 *   （CodeRabbit のPRレビューで指摘・検証）。
 * - `centeredSlides` が無効（既定・多数派のケース）のとき: `activeIndex` +
 *   `slidesPerView` から式で求める。以前はこの場合も `visibleSlidesIndexes`
 *   を使っていたが、これは「次へ」を送るたびに表示範囲が1ステップ遅れて
 *   止まる」という回帰を引き起こした（麗美の実機確認で発見）。原因は
 *   `visibleSlidesIndexes` が Swiper の幾何学的な重なり判定
 *   （`updateSlidesProgress`）に依存しており、`.vk_slider_item` 側の
 *   padding/box-sizing の組み合わせにより実際に描画されるスライド幅が
 *   Swiper 計算上のスロット幅より広くなる環境で、可視スライドの判定が
 *   ずれる（本来3枚見えているはずが2枚と判定される等）ため。
 *   `activeIndex` + `slidesPerView` の式は実際の描画幅に依存しない純粋な
 *   index計算のため、この幾何学的なズレの影響を受けない
 *   （麗美の実機確認・Playwrightでの再現・検証済み）。
 *
 * The display range calculation branches on whether `centeredSlides` is
 * enabled (#3080 regression found during real-device QA, re-fixed).
 *
 * - When `centeredSlides` is enabled: derive it from the minimum/maximum of
 *   Swiper's own `visibleSlidesIndexes` (the 0-based indexes of slides Swiper
 *   computes as actually visible in the viewport). `activeIndex` is the
 *   *center* of the visible range when centeredSlides is on, not its start,
 *   so a formula that treats it as the start produces an off-by-some-slides
 *   range for centered sliders (found during CodeRabbit's PR review).
 * - When `centeredSlides` is disabled (the default, majority case): derive it
 *   from a `activeIndex` + `slidesPerView` formula instead. This used to use
 *   `visibleSlidesIndexes` here too, but that caused a regression where the
 *   displayed range lagged one step behind while clicking "next" (found
 *   during real-device QA). The cause: `visibleSlidesIndexes` depends on
 *   Swiper's geometric overlap check (`updateSlidesProgress`), which
 *   miscounts visible slides (e.g. reporting 2 visible when 3 should be) in
 *   environments where `.vk_slider_item`'s padding/box-sizing makes the
 *   actually-rendered slide width wider than Swiper's computed slot width.
 *   The `activeIndex` + `slidesPerView` formula is a pure index calculation
 *   that does not depend on actual rendered geometry, so it is unaffected by
 *   this mismatch (verified via real-device QA and a Playwright reproduction).
 *
 * `visibleSlidesIndexes` は Swiper の `watchSlidesProgress: true` を設定した
 * ときだけ更新されるため、centeredSlides 有効時に呼び出す場合は Swiper 設定に
 * このオプションが必要。
 *
 * `visibleSlidesIndexes` is only kept up to date when the Swiper instance is
 * configured with `watchSlidesProgress: true`, so callers using the
 * centeredSlides branch must set that.
 *
 * @since #3080
 * @param {Object}   params
 * @param {number[]} [params.visibleSlidesIndexes] Swiper が計算した、現在ビューポートに
 *                                                 見えているスライドの index 一覧（0始まり、
 *                                                 `watchSlidesProgress: true` 設定時のみ更新
 *                                                 される）。centeredSlides 有効時のみ使う。
 * @param {number}   params.totalSlides            実際のスライド枚数（ループOFFのため複製スライドは含まれない）
 * @param {boolean}  [params.centeredSlides]       centeredSlides 属性。true のときだけ
 *                                                 visibleSlidesIndexes ベースの計算を使う
 * @param {number}   [params.activeIndex]          Swiper の activeIndex（0始まり）。
 *                                                 centeredSlides が無効の時に使う
 * @param {number}   [params.slidesPerView]        一度に表示するスライド数（小数可）。
 *                                                 centeredSlides が無効の時に使う
 * @return {{start: number, end: number, total: number, currentText: string}} 表示用の値
 */
export const getActualSlideCountPagination = ({
	visibleSlidesIndexes,
	totalSlides,
	centeredSlides,
	activeIndex,
	slidesPerView,
}) => {
	// 実スライド枚数。不正値は 0 に丸める。
	const total = Math.max(0, Math.floor(Number(totalSlides) || 0));

	let minIndex;
	let maxIndex;

	if (centeredSlides) {
		// 有限数だけを残す（Swiper が未計算・空配列を渡してきた場合の安全策）。
		// Keep only finite numbers (defensive against Swiper passing an empty
		// or not-yet-computed array).
		const indexes = Array.isArray(visibleSlidesIndexes)
			? visibleSlidesIndexes.filter((index) => Number.isFinite(index))
			: [];
		// 空配列のときは index 0（1枚目）にフォールバックする。
		// Falls back to index 0 (the first slide) when the array is empty.
		minIndex = indexes.length ? Math.min(...indexes) : 0;
		maxIndex = indexes.length ? Math.max(...indexes) : 0;
	} else {
		// activeIndex が不正（undefined・NaN・負値）なら 0 にフォールバックする。
		// Falls back to 0 when activeIndex is invalid (undefined, NaN, negative).
		const numericActiveIndex = Number(activeIndex);
		const idx = Number.isFinite(numericActiveIndex)
			? Math.max(0, Math.floor(numericActiveIndex))
			: 0;
		// slidesPerView が不正（undefined・NaN・0以下）なら 1 にフォールバックする。
		// Falls back to 1 when slidesPerView is invalid (undefined, NaN, 0 or less).
		const numericSpv = Number(slidesPerView);
		const spv = numericSpv > 0 ? numericSpv : 1;
		minIndex = idx;
		maxIndex = idx + Math.ceil(spv) - 1;
	}

	// 開始・終了 = 表示範囲の最小・最大index + 1（1始まりのスライド番号に変換）。
	const start = Math.min(total, Math.max(1, minIndex + 1));
	const end = Math.min(total, Math.max(1, maxIndex + 1));

	return {
		start,
		end,
		total,
		// en dash（–）で範囲を表す。開始と終了が同じ場合も範囲表記のまま統一する
		// （例: 最後の停止で "6–6"。単一の "6" に短縮しない）。
		currentText: `${start}–${end}`,
	};
};

/**
 * 分母・分子の上書き（#3080）を適用すべきかどうかを判定する。
 *
 * ループOFF時、Swiper の fraction ページネーションの分母が実スライド数より少なくなる
 * 不具合は「1度に複数枚表示している（slidesPerView > 1）」場合にのみ発生する。
 * slidesPerView が 1 以下（＝「1枚ずつ表示」設定）のときは、ループOFFでも1スライドごとに
 * 停止位置ができるため Swiper の既定の分母は既に実スライド数と一致しており、上書きの必要が
 * ない。この場合に無条件で上書きすると、開始=終了の冗長な範囲表記（例: "1–1 / 6"）に
 * なってしまう（issue #3080 の麗美による実機確認で発見）。
 *
 * Determines whether the denominator/numerator override (#3080) should be applied.
 * The bug where Swiper's fraction pagination denominator undercounts the real slide
 * count (loop off) only happens when multiple slides are shown at once
 * (slidesPerView > 1). When slidesPerView is 1 or less (the "one slide at a time"
 * setting), every slide is its own stop even with loop off, so Swiper's own
 * denominator already matches the real slide count and no override is needed.
 * Applying the override unconditionally in that case produced a redundant
 * start === end range (e.g. "1–1 / 6"), found during real-device QA for #3080.
 *
 * @since #3080
 * @param {number} slidesPerView 一度に表示するスライド数（小数可）
 * @return {boolean} true なら上書きを適用する（slidesPerView が 1 より大きい場合）
 */
export const shouldOverrideActualSlideCountPagination = (slidesPerView) =>
	Number(slidesPerView) > 1;

/**
 * スクリーンリーダー専用の読み上げテキスト要素に付与するクラス名（#3080）。
 *
 * 以前は fraction ページネーションのコンテナ自体に `role="text"` +
 * `aria-label` を設定していたが、`role="text"` は Firefox が未サポートで、
 * WAI-ARIA仕様上も generic 要素（`role` を持たない `<div>`）への `aria-label`
 * は無視されうるため、多くのブラウザ/スクリーンリーダーの組み合わせで
 * 効かず、要素内の生テキスト（視覚表示用の current/total）がそのまま
 * 読み上げられてしまう可能性があった（CodeRabbitレビューで指摘）。
 * 代わりに、視覚要素は `aria-hidden` のまま維持しつつ、この class を持つ
 * 専用のテキスト要素（`screen-reader-text` と併用し、視覚的には隠す）に
 * 整形済みラベルを直接入れる、いわゆる "screen-reader-text" パターンに
 * 変更した。
 *
 * The class applied to the screen-reader-only label element (#3080).
 * Previously, `role="text"` + `aria-label` were set on the fraction
 * pagination container itself, but Firefox does not support `role="text"`,
 * and the WAI-ARIA spec allows `aria-label` on generic elements (a `<div>`
 * with no role) to be ignored, so this combination was unreliable across
 * many browser/screen-reader pairings — falling back to reading the raw
 * visual text (the current/total numbers) instead (found via CodeRabbit
 * review). Replaced with the standard "screen-reader-text" pattern instead:
 * the visual elements stay `aria-hidden`, and the formatted label is written
 * directly into a dedicated text element carrying this class (paired with
 * `screen-reader-text` to hide it visually).
 *
 * @since #3080
 * @type {string}
 */
export const ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS = 'vk-slider-pagination-sr-text';

/**
 * 分母・分子の間の区切り文字「 / 」に付与するクラス名（#3080）。
 *
 * この区切り文字は current/total とは別に、専用の要素として出力する。
 * 複数枚表示時（分母・分子を上書きする時）だけ `aria-hidden` を付与し、
 * スクリーンリーダーが sr-only ラベルに加えてこの区切り文字まで読み上げて
 * しまわないようにする（CodeRabbitレビューで指摘）。1枚表示時（Swiper既定の
 * 単一数値表示）では `aria-hidden` を付けない。
 *
 * The class applied to the " / " separator between the denominator and
 * numerator (#3080). This separator is emitted as its own element, separate
 * from current/total. `aria-hidden` is added to it only when overriding for
 * multi-slide display, so screen readers do not announce this separator in
 * addition to the sr-only label (found via CodeRabbit review). It is left
 * without `aria-hidden` for single-slide display (Swiper's default
 * single-number rendering).
 *
 * @since #3080
 * @type {string}
 */
export const ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS =
	'vk-slider-pagination-separator';

/**
 * aria-label 用テンプレート文字列（`%1$s`=開始, `%2$s`=終了, `%3$s`=総数 のトークンを含む）を、
 * 実際の値で置換する。
 *
 * スクリーンリーダー向けに、視覚表示の生テキスト（例: "1–3 / 6"）をそのまま読み上げると
 * 意味が伝わらないため、別途この関数で自然文のラベルを組み立てる。
 *
 * Replaces the `%1$s` (start) / `%2$s` (end) / `%3$s` (total) tokens in an
 * aria-label template with the actual values. Reading the raw visual text
 * (e.g. "1–3 / 6") aloud does not convey its meaning, so a natural-language
 * label is assembled separately for screen readers.
 *
 * @param {string} template     テンプレート文字列（翻訳済み、トークンを含む）
 * @param {Object} values
 * @param {number} values.start 表示範囲の開始番号
 * @param {number} values.end   表示範囲の終了番号
 * @param {number} values.total 総スライド枚数
 * @return {string} トークンを実際の値に置換したラベル文字列（テンプレートが空の場合は空文字）
 */
export const formatActualSlideCountAriaLabel = (
	template,
	{ start, end, total }
) => {
	if (!template) {
		return '';
	}
	// replaceAll を使う。同じトークンが翻訳文に複数回登場する将来のケースでも、
	// 最初の1件だけでなく全件を置換する（CodeRabbit指摘）。
	// Uses replaceAll so that if a translated template ever repeats the same
	// token more than once, every occurrence is replaced, not just the first
	// (CodeRabbit feedback).
	return template
		.replaceAll('%1$s', String(start))
		.replaceAll('%2$s', String(end))
		.replaceAll('%3$s', String(total));
};
