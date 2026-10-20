/* global Swiper, vkBlocksSliderMarquee */
document.defaultView.addEventListener('load', function () {
	// //data-vkb-slider属性のNodeを取得
	let sliderNodeList = document.querySelectorAll('[data-vkb-slider]');
	// 配列に変換。
	sliderNodeList = Array.from(sliderNodeList);

	// OS の「視差効果を減らす」設定が有効かどうかを判定する。
	// 停止判定のポリシーは Swiper 初期化直後の抑止ブロックのコメントを参照（#3044）。
	// Detect whether the OS-level "reduce motion" setting is enabled.
	// See the suppression block right after Swiper initialization for the policy (#3044).
	const prefersReducedMotion =
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// 停止/再生ボタンの初期化。クリックで自動再生の停止・再生を切り替える。
	//
	// ⚠️ 同期注意: この setupPauseButton は
	// src/blocks/_pro/post-list-slider/view.js と同一ロジックを重複保持している。
	// view.js は gulp で直接 minify されるため ES module import が使えず共通化できない。
	// 変更時は必ず両ファイルを同期すること。
	//
	// アクセシビリティ: ボタンの状態は aria-label（停止中/再生中で文言を切り替え）で示す。
	// pause/play はトグル状態ではなく「次に実行する操作」を表すアクションボタンのため、
	// aria-pressed は使わず aria-label を唯一の状態インジケーターとする（重複回避）。
	// updateState 内で aria-label と is-paused クラスの更新を必ず維持すること。
	//
	// data-label-* が付いていなかった場合に使う最終フォールバック。ラベルは通常 PHP の
	// render_block フィルタ（inc/vk-blocks/view/slider-pause-button-label.php）が
	// サイトのロケールで付与するため、ここが使われるのはフィルタを通らない経路に限られる。
	// 未翻訳でも無名ボタンよりはましなので、英語の原文を保持する。
	// Last-resort fallback used when data-label-* is missing. The labels are normally
	// applied in the site's locale by the render_block filter in
	// inc/vk-blocks/view/slider-pause-button-label.php, so this only kicks in on paths
	// that bypass that filter. An untranslated label still beats an unlabeled button.
	const FALLBACK_LABEL_PAUSE = 'Pause slideshow';
	const FALLBACK_LABEL_PLAY = 'Play slideshow';

	const setupPauseButton = (pauseButton, swiperInstance) => {
		// ボタンが無い、または autoplay モジュールが無い場合は何もしない（防御的チェック）
		// Do nothing when there is no button or no autoplay module (defensive check).
		if (!pauseButton || !swiperInstance || !swiperInstance.autoplay) {
			return;
		}

		// 再生中／停止中それぞれの aria-label（PHP が描画時に data 属性へ付与する）
		const rawLabelPause = pauseButton.getAttribute('data-label-pause');
		const rawLabelPlay = pauseButton.getAttribute('data-label-play');

		// data-label-* の欠落は本来起きない想定なので、原因を追えるよう初期化時に一度だけ
		// 警告する（ラベルは静的値なので、updateState 内で出すと自動再生のたびに
		// ログが氾濫してしまう）。警告は検知手段であり、動作はフォールバックで継続する。
		if (!rawLabelPause || !rawLabelPlay) {
			// eslint-disable-next-line no-console
			console.warn(
				'vk-blocks slider: pause button is missing data-label attributes; falling back to the untranslated labels.',
				{
					element: pauseButton,
					labelPause: rawLabelPause,
					labelPlay: rawLabelPlay,
				}
			);
		}

		// 欠落時もボタンが無名にならないようフォールバックを噛ませる。
		// Fall back so the button never ends up without an accessible name.
		const labelPause = rawLabelPause || FALLBACK_LABEL_PAUSE;
		const labelPlay = rawLabelPlay || FALLBACK_LABEL_PLAY;

		// 現在の再生状態に合わせてボタンの見た目とラベルを更新する
		const updateState = () => {
			const running = !!swiperInstance.autoplay.running;
			// 停止中は is-paused クラスで再生アイコンを表示する
			pauseButton.classList.toggle('is-paused', !running);
			// aria-label を現在の操作（停止中なら「再生」、再生中なら「停止」）に合わせる。
			// data-label-* の有無で分岐せず常に更新する（分岐すると欠落時に状態と
			// 読み上げが食い違ったまま固定されてしまうため）。
			// Always update, without gating on the presence of data-label-*: gating would
			// freeze the announced label out of sync with the actual state.
			pauseButton.setAttribute(
				'aria-label',
				running ? labelPause : labelPlay
			);
		};

		// クリックで再生／停止をトグルする
		// destroy 後に解除できるよう名前付き関数にする。破棄済みで autoplay が
		// 失われている場合は何もしない（例外防止）。
		const onPauseButtonClick = () => {
			if (!swiperInstance.autoplay) {
				return;
			}
			if (swiperInstance.autoplay.running) {
				swiperInstance.autoplay.stop();
			} else {
				swiperInstance.autoplay.start();
			}
			updateState();
		};
		pauseButton.addEventListener('click', onPauseButtonClick);

		// Swiper 側の自動再生イベントとも状態を同期する
		swiperInstance.on('autoplayStart', updateState);
		swiperInstance.on('autoplayStop', updateState);

		// スライダー破棄・再生成時にリスナーが残らないよう解除する（メモリリーク防止）
		swiperInstance.on('destroy', function () {
			swiperInstance.off('autoplayStart', updateState);
			swiperInstance.off('autoplayStop', updateState);
			pauseButton.removeEventListener('click', onPauseButtonClick);
		});

		// 初期状態を反映
		updateState();
	};

	// ズーム倍率は数値として扱い、正の有限数でなければ既定値へフォールバックする。
	// CSS へ値を埋め込む前に型を確定させるための処理。
	// ※ view.js は gulp で直接 minify されるため import が使えず、この関数は
	//   同ファイル内のローカル関数として持つ（他ファイルとは共通化しない）。
	// Zoom scales are treated as numbers; anything that is not a positive finite
	// number falls back to the default. This settles the type before the value is
	// embedded into CSS.
	// Note: view.js is minified directly by gulp and cannot use imports, so this
	// helper is kept local to this file.
	const toZoomScale = (value, fallbackScale) => {
		const numericScale = Number(value);
		return Number.isFinite(numericScale) && numericScale > 0
			? numericScale
			: fallbackScale;
	};

	// ループOFF・「スライドの枚数」ページネーション時、Swiper の pagination 更新の
	// たびに、分母(実スライド枚数)・分子(表示範囲)のテキストを上書きする（#3080）。
	//
	// ⚠️ 同期注意: この計算式は src/blocks/slider/pagination-actual-count.js の
	// getActualSlideCountPagination・shouldOverrideActualSlideCountPagination、および
	// src/blocks/_pro/post-list-slider/view.js の同名処理と完全に同一に保つこと。
	// view.js は gulp で直接 minify されるため ES module import が使えず、
	// pagination-actual-count.js を直接 import できない（やむなく重複させている）。
	// aria-label のテンプレート文字列（%1$s=開始 %2$s=終了 %3$s=総数 のトークンを含む）は、
	// save() が決定的関数である必要があるため保存HTMLには埋め込まれておらず（#3080,
	// CodeRabbit指摘。ロケール変更時のブロック検証エラーを防ぐため）、代わりに
	// wp_localize_script() 経由で window.vkBlocksSliderI18n.actualCountLabel として
	// 渡される（vk_blocks_localize_slider_actual_count_label() を参照）。
	// slidesPerView <= 1（1枚ずつ表示）のときは上書きしない（詳細は関数内の分岐
	// コメントを参照、#3080）。表示範囲の求め方は centeredSlides の有無で分岐する。
	// centeredSlides 有効時は Swiper の visibleSlidesIndexes（要
	// watchSlidesProgress: true）の最小・最大値から求める（activeIndex は範囲の
	// 中央になり先頭とみなせないため）。centeredSlides 無効時（既定・多数派）は
	// activeIndex + slidesPerView の式で求める（visibleSlidesIndexes を使うと
	// 「次へ」送信のたびに表示範囲が1ステップ遅れる回帰があったため、麗美の実機
	// 確認で発見・修正済み、#3080）。分岐の詳細は関数内のコメントを参照。
	//
	// Overrides the fraction pagination's denominator (actual slide count) and
	// numerator (visible range) text on every Swiper pagination update, only
	// when loop is off, the pagination type is "Number of slides", and more
	// than one slide is shown at a time (#3080).
	//
	// ⚠️ Sync note: keep this calculation identical to
	// getActualSlideCountPagination / shouldOverrideActualSlideCountPagination in
	// pagination-actual-count.js, and to the duplicate of this same block in
	// src/blocks/_pro/post-list-slider/view.js. view.js is minified directly by
	// gulp and cannot use ES module imports, so pagination-actual-count.js cannot
	// be imported here (hence the duplication). The aria-label template
	// (containing %1$s/%2$s/%3$s tokens for start/end/total) is intentionally NOT
	// embedded in the saved HTML, since save() must be a deterministic function
	// (#3080, CodeRabbit feedback — this prevents a block-validation error if the
	// site's language setting changes later). It is instead passed via
	// wp_localize_script() as window.vkBlocksSliderI18n.actualCountLabel (see
	// vk_blocks_localize_slider_actual_count_label()). See the branch comment
	// inside the function for the slidesPerView <= 1 ("one slide at a time")
	// bailout. How the display range is derived branches on centeredSlides:
	// when it's enabled, the range comes from the min/max of Swiper's
	// visibleSlidesIndexes (requires watchSlidesProgress: true), since
	// activeIndex is the center of the range there, not its start; when it's
	// disabled (the default, majority case), the range comes from
	// activeIndex + slidesPerView instead, because using visibleSlidesIndexes
	// there caused a regression where the displayed range lagged one step
	// behind on every "next" click (found during real-device QA, #3080). See
	// the branch comment inside the function for details.
	const applyActualSlideCountPagination = (swiperInstance, subEl) => {
		const spvRaw = Number(swiperInstance.params.slidesPerView);
		const spv = spvRaw > 0 ? spvRaw : 1;

		// 「1枚ずつ表示」（slidesPerView <= 1）のときは、ループOFFでも Swiper の既定の
		// 分母が既に実スライド数と一致するため上書きしない（従来通り単一数値のまま）。#3080
		// When only one slide is shown at a time (slidesPerView <= 1), Swiper's own
		// denominator already matches the real slide count even with loop off, so we
		// leave its default single-number rendering untouched (#3080).
		if (spv <= 1) {
			// レスポンシブのブレークポイント変更で slidesPerView が複数枚→1枚以下に
			// 変わった場合、以前にこのハンドラが設定した aria-hidden・sr-onlyラベルが
			// 残ったままだと、見た目は単一数値表示に戻ったのにスクリーンリーダーが古い
			// 表示範囲を読み続けてしまう。ここで削除して既定状態に戻す（#3080, CodeRabbit指摘）。
			// If a responsive breakpoint change drops slidesPerView from more than one
			// slide back to one (or fewer), leaving the aria-hidden / sr-only label
			// this handler previously set would make assistive tech keep announcing the
			// stale visible-range label even though the visual display has reverted to a
			// single number. Remove them here to restore the default state (#3080,
			// CodeRabbit feedback).
			const staleCurrentEl = subEl.querySelector(
				'.swiper-pagination-current'
			);
			const staleTotalEl = subEl.querySelector(
				'.swiper-pagination-total'
			);
			if (staleCurrentEl) {
				staleCurrentEl.removeAttribute('aria-hidden');
			}
			if (staleTotalEl) {
				staleTotalEl.removeAttribute('aria-hidden');
			}
			// 区切り文字「 / 」の aria-hidden も、current/total と同じタイミングで
			// 解除する（CodeRabbit指摘: 単一数値表示に戻ったのに区切り文字だけ
			// 隠れたままにならないようにする）。
			// Also clear the aria-hidden on the " / " separator, in sync with
			// current/total (CodeRabbit feedback: prevents the separator from
			// staying hidden after reverting to the single-number display).
			const staleSeparatorEl = subEl.querySelector(
				'.vk-slider-pagination-separator'
			);
			if (staleSeparatorEl) {
				staleSeparatorEl.removeAttribute('aria-hidden');
			}
			const staleSrTextEl = subEl.querySelector(
				'.vk-slider-pagination-sr-text'
			);
			if (staleSrTextEl) {
				staleSrTextEl.textContent = '';
			}
			return;
		}

		const currentEl = subEl.querySelector('.swiper-pagination-current');
		const totalEl = subEl.querySelector('.swiper-pagination-total');
		const separatorEl = subEl.querySelector(
			'.vk-slider-pagination-separator'
		);

		const total = Math.max(
			0,
			Math.floor(
				Number(
					swiperInstance.slides ? swiperInstance.slides.length : 0
				) || 0
			)
		);
		// centeredSlides の有無で表示範囲の求め方を切り替える（#3080、麗美の実機確認で
		// 見つかった回帰の再修正。詳細は pagination-actual-count.js の
		// getActualSlideCountPagination のJSDocを参照）。
		//
		// centeredSlides 有効時: visibleSlidesIndexes（実際にビューポート内に見えて
		// いるスライドのindex一覧。Swiper設定に watchSlidesProgress: true が入って
		// いる時だけ更新される）の最小・最大から求める。activeIndex は範囲の中央に
		// なり先頭とみなせないため。
		//
		// centeredSlides 無効時（既定・多数派のケース）: activeIndex + slidesPerView
		// の式で求める。以前はこの場合も visibleSlidesIndexes を使っていたが、
		// これは「次へ」を送るたびに表示範囲が1ステップ遅れて止まる」という回帰を
		// 引き起こした（麗美の実機確認で発見）。visibleSlidesIndexes は Swiper の
		// 幾何学的な重なり判定（updateSlidesProgress）に依存しており、
		// .vk_slider_item 側の padding/box-sizing の組み合わせにより実際に描画
		// されるスライド幅が Swiper 計算上のスロット幅より広くなる環境で、
		// 可視スライドの判定がずれる（本来3枚見えているはずが2枚と判定される等）
		// ため。activeIndex + slidesPerView の式は実際の描画幅に依存しない純粋な
		// index計算のため、この幾何学的なズレの影響を受けない。
		//
		// Branches the display-range calculation on centeredSlides (#3080,
		// re-fix of a regression found during real-device QA. See the JSDoc on
		// getActualSlideCountPagination in pagination-actual-count.js for
		// details).
		//
		// When centeredSlides is enabled: derive it from the min/max of
		// visibleSlidesIndexes (the indexes of slides Swiper computes as
		// actually visible; only kept up to date when the Swiper config has
		// watchSlidesProgress: true), since activeIndex is the center of the
		// range there, not its start.
		//
		// When centeredSlides is disabled (the default, majority case): derive
		// it from activeIndex + slidesPerView instead. This used to use
		// visibleSlidesIndexes here too, but that caused a regression where the
		// displayed range lagged one step behind while clicking "next" (found
		// during real-device QA). visibleSlidesIndexes depends on Swiper's
		// geometric overlap check (updateSlidesProgress), which miscounts
		// visible slides (e.g. reporting 2 visible when 3 should be) in
		// environments where .vk_slider_item's padding/box-sizing makes the
		// actually-rendered slide width wider than Swiper's computed slot
		// width. The activeIndex + slidesPerView formula is a pure index
		// calculation that does not depend on actual rendered geometry, so it
		// is unaffected by this mismatch.
		let minVisibleIndex;
		let maxVisibleIndex;
		// applyActualSlideCountPagination はローカル関数（moduleスコープ）として
		// 一度だけ定義され、各スライダーの attributes（for ループのブロック内で
		// スコープされる const）を閉じ込められないため、centeredSlides の判定は
		// attributes ではなく swiperInstance.params から読む。
		// applyActualSlideCountPagination is defined once as a local (module-scope)
		// function and cannot close over each slider's attributes (a const scoped
		// inside the for loop's block), so the centeredSlides check reads from
		// swiperInstance.params instead of attributes.
		if (swiperInstance.params.centeredSlides) {
			const visibleSlidesIndexes = Array.isArray(
				swiperInstance.visibleSlidesIndexes
			)
				? swiperInstance.visibleSlidesIndexes.filter((index) =>
						Number.isFinite(index)
					)
				: [];
			minVisibleIndex = visibleSlidesIndexes.length
				? Math.min(...visibleSlidesIndexes)
				: 0;
			maxVisibleIndex = visibleSlidesIndexes.length
				? Math.max(...visibleSlidesIndexes)
				: 0;
		} else {
			const numericActiveIndex = Number(swiperInstance.activeIndex);
			const idx = Number.isFinite(numericActiveIndex)
				? Math.max(0, Math.floor(numericActiveIndex))
				: 0;
			minVisibleIndex = idx;
			maxVisibleIndex = idx + Math.ceil(spv) - 1;
		}
		const start = Math.min(total, Math.max(1, minVisibleIndex + 1));
		const end = Math.min(total, Math.max(1, maxVisibleIndex + 1));

		if (currentEl) {
			currentEl.textContent = `${start}–${end}`;
			// 視覚テキストは aria-hidden にし、下の sr-only 要素のテキストのみを
			// スクリーンリーダーに読ませる（生テキストの二重読み上げを防ぐ）。
			// Hide the visual text from assistive tech; only the screen-reader-only
			// element set below is announced (avoids reading the raw text twice).
			currentEl.setAttribute('aria-hidden', 'true');
		}
		if (totalEl) {
			totalEl.textContent = `${total}`;
			totalEl.setAttribute('aria-hidden', 'true');
		}
		if (separatorEl) {
			// current/total と同様、区切り文字「 / 」もスクリーンリーダーから隠す。
			// 隠さないと、sr-only ラベルに加えてこの区切り文字も読み上げられて
			// しまう（CodeRabbit指摘）。
			// Hide the " / " separator from assistive tech too, just like
			// current/total. Without this, screen readers could announce this
			// separator in addition to the sr-only label (CodeRabbit feedback).
			separatorEl.setAttribute('aria-hidden', 'true');
		}

		// aria-label のテンプレート文字列は wp_localize_script() 経由で渡される
		// window.vkBlocksSliderI18n.actualCountLabel から取得する。save() の出力
		// には含まれない（決定的関数にするため、#3080, CodeRabbit指摘）。
		// The aria-label template comes from window.vkBlocksSliderI18n.actualCountLabel,
		// passed via wp_localize_script(). It is not part of save()'s output (kept
		// out to preserve save() as a deterministic function, #3080, CodeRabbit
		// feedback).
		const ariaLabelTemplate =
			(window.vkBlocksSliderI18n &&
				window.vkBlocksSliderI18n.actualCountLabel) ||
			'';
		// role="text" は Firefox が未サポートで、WAI-ARIA仕様上も generic 要素
		// （role の無い <div>）への aria-label は無視されうるため、多くの
		// ブラウザ/スクリーンリーダーの組み合わせで効かなかった（CodeRabbit指摘）。
		// 代わりに、視覚要素は aria-hidden のまま維持しつつ、専用の sr-only
		// テキスト要素（screen-reader-text パターン）に整形済みラベルを書き込む。
		// role="text" is unsupported in Firefox, and the WAI-ARIA spec allows
		// aria-label on generic elements (a <div> with no role) to be ignored,
		// so this combination was unreliable across many browser/screen-reader
		// pairings (CodeRabbit feedback). Instead, keep the visual elements
		// aria-hidden and write the formatted label into a dedicated
		// screen-reader-only text element (the "screen-reader-text" pattern).
		const srTextEl = subEl.querySelector('.vk-slider-pagination-sr-text');
		if (srTextEl) {
			// window.vkBlocksSliderI18n.actualCountLabel が何らかの理由
			// （localizeスクリプトのデータ未取得等）で空の場合、テンプレート
			// を使わず「開始–終了 / 総数」形式のフォーマット済みテキストに
			// フォールバックする。スクリーンリーダー向けラベルが完全に
			// 空になってしまうのを防ぐ（CodeRabbit指摘）。
			// If window.vkBlocksSliderI18n.actualCountLabel is empty for any
			// reason (e.g. the localized script data was not obtained), fall
			// back to a plain "start–end / total" formatted string instead of
			// leaving the screen-reader label empty (CodeRabbit feedback).
			srTextEl.textContent = ariaLabelTemplate
				? ariaLabelTemplate
						.replaceAll('%1$s', String(start))
						.replaceAll('%2$s', String(end))
						.replaceAll('%3$s', String(total))
				: `${start}–${end} / ${total}`;
		}
	};

	// ズームアニメーション用のCSS生成関数
	const generateZoomAnimationCss = (attributes, sliderId) => {
		const {
			zoomAnimation,
			zoomInitialScale,
			zoomFinalScale,
			autoPlayDelay,
			speed,
		} = attributes;

		let css = '';

		if (zoomAnimation) {
			// ズーム用のセレクターは ::before 専用にして、親要素への副作用を防ぐ
			const zoomSelector = `.vk_slider_${sliderId}`;

			// CSS に埋め込む倍率は、ここで数値へ確定させたものだけを使う。
			// Only these resolved numbers are embedded into the CSS below.
			const initialScale = toZoomScale(zoomInitialScale, 1);
			const finalScale = toZoomScale(zoomFinalScale, 1.25);

			// 最終倍率（＝ズームの動きそのもの）は「視差効果を減らす」が有効でない環境
			// だけに適用する。包むのは最終倍率の規則だけで、::before の基本規則
			// （背景画像・初期倍率・transition）は包まない（包むと背景画像ごと
			// 消えてしまうため）。#3082
			//
			// さらに reduce 側では初期倍率を !important で上書きする。ズーム CSS は
			// index.js の blocks.getSaveElement 経由で保存マークアップにも書き出されて
			// おり、本文中の <style> は後から <head> に挿入するこの <style> より
			// 後勝ちで優先される。そのため、この変更より前に保存された投稿には
			// @media で包まれていない最終倍率が残り続ける。!important を付けることで、
			// 再保存されていない既存投稿でも初期倍率のまま静止させる。
			// `.swiper-slide-duplicate-active` は 1.124.0 までの保存内容に含まれる
			// 旧セレクター。Swiper 9 以降（本ファイル時点では 14 系）はループで複製
			// スライドを作らないため、このクラスは DOM に一切付かない。付かない以上、
			// 旧投稿の本文にある同セレクターの規則も当たっておらず、**打ち消す対象は
			// 実在しない**（旧投稿を救っているのは上の `.swiper-slide-active` の方）。
			// ここに併記しているのは、Swiper を複製スライドを作る旧版へ差し替える等で
			// このクラスが復活した場合の保険。消しても現状の動作は変わらない。
			//
			// Only the final scale — the movement itself — is applied when the visitor has
			// not asked for reduced motion; the base ::before rule (background image,
			// initial scale, transition) stays outside the query, or the background image
			// would disappear along with it. #3082
			//
			// The reduce branch additionally re-asserts the initial scale with !important.
			// The zoom CSS is also baked into the saved markup (see blocks.getSaveElement in
			// index.js), and a <style> inside the post content wins over this one appended
			// to <head>, so posts saved before this change still carry an unguarded final
			// scale. !important keeps those existing posts at the initial scale without
			// requiring a re-save. `.swiper-slide-duplicate-active` is the legacy selector
			// present in content saved up to 1.124.0. Swiper stopped creating duplicate
			// slides for loops in v9 (this file ships against 14.x), so that class never
			// appears in the DOM — which also means the matching rule in those older posts
			// never applies, and there is nothing here to neutralize (older posts are
			// rescued by the `.swiper-slide-active` selector above). It is kept purely as
			// insurance in case Swiper is swapped back to a version that duplicates slides;
			// removing it changes nothing today.

			css += `
${zoomSelector} .vk_slider_item::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-size: cover;
	background-position: center;
	background-image: var(--vk-slider-item-bg-image, inherit);
	will-change: transform;
	transform: scale(${initialScale});
	transition: transform ${(autoPlayDelay + speed + autoPlayDelay * 0.5) / 1000 || 6}s linear;
	z-index: -1;
}

@media (prefers-reduced-motion: no-preference) {
	${zoomSelector} .vk_slider_item.swiper-slide-active::before {
		transform: scale(${finalScale});
	}
}

@media (prefers-reduced-motion: reduce) {
	${zoomSelector} .vk_slider_item.swiper-slide-active::before,
	${zoomSelector} .vk_slider_item.swiper-slide-duplicate-active::before {
		transform: scale(${initialScale}) !important;
	}
}

${zoomSelector} .vk_slider_item.swiper-slide-prev::before,
${zoomSelector} .vk_slider_item.swiper-slide-next::before {
	transform: scale(${initialScale});
}
`;
		}

		return css;
	};

	// ズームアニメーション用のスタイルを動的に追加
	const addZoomAnimationStyles = (attributes, sliderId) => {
		if (attributes.zoomAnimation) {
			const css = generateZoomAnimationCss(attributes, sliderId);
			if (css) {
				const styleElement = document.createElement('style');
				styleElement.type = 'text/css';
				styleElement.innerHTML = css;
				document.head.appendChild(styleElement);
			}
		}
	};

	if (sliderNodeList) {
		for (const index in sliderNodeList) {
			const sliderNode = sliderNodeList[index];
			const attributes = JSON.parse(
				sliderNode.getAttribute('data-vkb-slider')
			);
			// Backward compatibility: handle typo in old attribute name.
			if (
				attributes.zoomFinalScale === undefined &&
				attributes.zoomFinalScal !== undefined
			) {
				attributes.zoomFinalScale = attributes.zoomFinalScal;
			}

			// 等速ループ（#3053）は Swiper を初期化せず、共通のマーキー処理に任せる。
			// スライドを複製して常にループを成立させるため、loop-min-slides の自動無効化も、
			// Swiper のアクティブスライドを前提にしたズーム用 CSS も適用しない。
			// vkBlocksSliderMarquee は gulp でこのファイルの前に連結される marquee.js が定義する
			// （gulpfile.js の helper-js を参照）。
			// The continuous loop (#3053) does not initialize Swiper; the shared marquee
			// logic takes over. Since cloning the slides always keeps the loop going, neither
			// the loop-min-slides auto-disable nor the zoom CSS (which relies on Swiper's active
			// slide) is applied. vkBlocksSliderMarquee is defined by marquee.js, which gulp
			// concatenates in front of this file (see helper-js in gulpfile.js).
			if (
				typeof vkBlocksSliderMarquee !== 'undefined' &&
				vkBlocksSliderMarquee.isMarqueeMode(attributes)
			) {
				vkBlocksSliderMarquee.setup({
					root: sliderNode,
					track: sliderNode.querySelector(':scope > .swiper-wrapper'),
					speed: attributes.marqueeSpeed,
					direction: attributes.direction,
					pauseButton: sliderNode.querySelector(
						':scope > .swiper-pause-button'
					),
					prefersReducedMotion,
				});
				continue;
			}

			if (!sliderNode.classList.contains('swiper')) {
				sliderNode.classList.add('swiper');
			}
			let sliderId = '';
			if (attributes.blockId !== undefined) {
				sliderId = attributes.blockId;
			} else if (attributes.clientId !== undefined) {
				// 1.36.0 より古い状態で保存されてる場合の互換処理
				sliderId = attributes.clientId;
			}

			// ズームアニメーション用のスタイルを追加
			addZoomAnimationStyles(attributes, sliderId);

			// Swiper設定オブジェクトを組み立て
			const config = {
				autoplay: attributes.autoPlay
					? {
							delay: Number(attributes.autoPlayDelay) ?? 2500,
							disableOnInteraction: !!attributes.autoPlayStop,
							stopOnLastSlide: !attributes.loop,
							// direction='ltr'時はreverseDirection=trueで左→右、'rtl'時はfalseで右→左
							reverseDirection: attributes.direction === 'ltr',
						}
					: false,
				pagination:
					attributes.pagination !== 'hide'
						? {
								el: '.swiper-pagination',
								clickable: true,
								type: attributes.pagination,
								renderFraction(currentClass, totalClass) {
									return (
										'<span class="' +
										currentClass +
										'"></span>' +
										// 区切り文字「 / 」も専用の要素にしておく（#3080）。
										// 複数枚表示時（分母・分子を上書きする時）だけ
										// applyActualSlideCountPagination が aria-hidden を
										// 付与し、スクリーンリーダーが sr-only ラベルに加えて
										// この区切り文字まで読み上げないようにする
										// （CodeRabbit指摘）。1枚表示時は aria-hidden を
										// 付けない（付ける対象が無い＝Swiper既定のまま）。
										// The " / " separator also gets its own element
										// (#3080). applyActualSlideCountPagination adds
										// aria-hidden to it only when overriding for
										// multi-slide display, so screen readers do not
										// announce this separator in addition to the
										// sr-only label (CodeRabbit feedback). It is left
										// alone (no aria-hidden) for single-slide display.
										'<span class="vk-slider-pagination-separator"> / </span>' +
										'<span class="' +
										totalClass +
										'"></span>' +
										// スクリーンリーダー専用の読み上げテキスト要素（#3080）。
										// role="text" + aria-label がFirefox等で効かない問題への
										// 対応として screen-reader-text パターンに変更した
										// （CodeRabbit指摘）。中身は applyActualSlideCountPagination
										// が上書きするので、既定は空。
										// Screen-reader-only label element (#3080). Switched to
										// the screen-reader-text pattern because role="text" +
										// aria-label did not work in Firefox and elsewhere
										// (CodeRabbit feedback). Its content is populated by
										// applyActualSlideCountPagination, so it starts empty.
										'<span class="screen-reader-text vk-slider-pagination-sr-text"></span>'
									);
								},
							}
						: false,
				speed: Number(attributes.speed) || 300,
				loop: !!attributes.loop,
				effect: attributes.effect || 'slide',
				navigation: {
					nextEl: '.swiper-button-next',
					prevEl: '.swiper-button-prev',
				},
			};

			if (attributes.effect !== 'fade') {
				if (attributes.slidesPerViewMobile) {
					config.slidesPerView = Number(
						attributes.slidesPerViewMobile
					);
					config.slidesPerGroup =
						attributes.slidesPerGroup === 'slides-per-view'
							? Number(attributes.slidesPerViewMobile)
							: 1;
				} else if (attributes.slidesPerView) {
					config.slidesPerView = Number(attributes.slidesPerView);
					config.slidesPerGroup =
						attributes.slidesPerGroup === 'slides-per-view'
							? Number(attributes.slidesPerView)
							: 1;
				} else {
					config.slidesPerView = 1;
					config.slidesPerGroup = 1;
				}
				if (
					attributes.slidesPerViewTablet ||
					attributes.slidesPerViewPC
				) {
					config.breakpoints = {};
					if (attributes.slidesPerViewTablet) {
						config.breakpoints[576] = {
							slidesPerView: Number(
								attributes.slidesPerViewTablet
							),
							slidesPerGroup:
								attributes.slidesPerGroup === 'slides-per-view'
									? Number(attributes.slidesPerViewTablet)
									: 1,
						};
					}
					if (attributes.slidesPerViewPC) {
						config.breakpoints[992] = {
							slidesPerView: Number(attributes.slidesPerViewPC),
							slidesPerGroup:
								attributes.slidesPerGroup === 'slides-per-view'
									? Number(attributes.slidesPerViewPC)
									: 1,
						};
					}
				}
				if (attributes.centeredSlides) {
					config.centeredSlides = !!attributes.centeredSlides;
				}
			}

			// slidesPerGroup を正整数に正規化する（Swiper に渡す値とループ判定を一致させる）。
			const toIntSpg = (v) => {
				const n = Number(v);
				return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
			};
			if (config.slidesPerGroup !== undefined) {
				config.slidesPerGroup = toIntSpg(config.slidesPerGroup);
			}
			if (config.breakpoints) {
				Object.keys(config.breakpoints).forEach((bp) => {
					const spg = config.breakpoints[bp].slidesPerGroup;
					if (spg !== undefined) {
						config.breakpoints[bp].slidesPerGroup = toIntSpg(spg);
					}
				});
			}

			// ループモードに必要なスライド数が不足する場合は自動的に無効化する。
			// Swiper の loopFix は centeredSlides=true かつ slidesPerView が偶数のとき
			// 内部的に slidesPerView を +1 するため、必要最小スライド数が増加する。
			// 例: slidesPerView=2, centeredSlides=true → 最小5枚必要、4枚では破綻する。
			if (config.loop) {
				const slideCount = sliderNode.querySelectorAll(
					':scope > .swiper-wrapper > .swiper-slide'
				).length;
				const centeredSlides = !!config.centeredSlides;

				// 全ブレークポイントを含む設定ペアを収集
				const configPairs = [
					{
						spv: config.slidesPerView || 1,
						spg: config.slidesPerGroup || 1,
					},
				];
				if (config.breakpoints) {
					Object.values(config.breakpoints).forEach(
						({ slidesPerView, slidesPerGroup }) => {
							if (slidesPerView) {
								configPairs.push({
									spv: slidesPerView,
									spg: slidesPerGroup || 1,
								});
							}
						}
					);
				}

				// Swiper の loopFix と同じロジックで最小必要枚数を計算。
				// このロジックは loop-min-slides.js の getMinSlidesForLoop と同一。
				// view.js は gulp で直接 minify されるため ES module import が使えず、
				// やむなく重複させている。変更時は両方を同期すること。
				const needsLoopDisable = configPairs.some(({ spv, spg }) => {
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
					if (centeredSlides && w % 2 === 0) {
						w += 1;
					}
					let y = centeredSlides
						? Math.max(normalizedSpg, Math.ceil(w / 2))
						: normalizedSpg;
					if (y % normalizedSpg !== 0) {
						y += normalizedSpg - (y % normalizedSpg);
					}
					return slideCount < w + y;
				});

				if (needsLoopDisable) {
					config.loop = false;
					if (config.autoplay && config.autoplay !== false) {
						config.autoplay.stopOnLastSlide = true;
					}
				}
			}

			// ループOFF・「スライドの枚数」ページネーションのときだけ、
			// 分母・分子のテキストを上書きする（#3080）。`on` は Swiper の
			// コンストラクタに渡すことで、生成直後に発火する最初の
			// paginationUpdate にも適用させる（生成後の `.on()` 登録では
			// 初回分に間に合わない）。
			//
			// ⚠️ ここで見るのは保存された attributes.loop ではなく config.loop
			// （上の needsLoopDisable による強制OFFを反映した「実効loop状態」）。
			// スライド枚数が少なすぎてSwiperのループが実際には機能しない場合、
			// attributes.loop は true のままでも config.loop は上でfalseに
			// 強制されている。ここで attributes.loop を見てしまうと、この
			// ケースで条件が成立せず on/watchSlidesProgress が配線されないまま
			// になり、issue #3080 が報告した「分母が実スライド数より少ない」
			// 状態がまさに再現してしまう（Claude Code code-review指摘）。
			// Only override the fraction pagination text when loop is off and
			// the pagination type is "Number of slides" (#3080). Passed via
			// the constructor's `on` option (rather than `.on()` afterwards)
			// so it also applies to the very first paginationUpdate, which
			// fires synchronously during construction.
			//
			// ⚠️ Checked here is config.loop (the effective loop state after
			// the needsLoopDisable override above), not the saved
			// attributes.loop. When there are too few slides for Swiper's loop
			// mode to actually work, attributes.loop can still be true while
			// config.loop has just been forced to false above. Checking
			// attributes.loop instead would leave this condition unmet and
			// on/watchSlidesProgress never wired in that case, reproducing
			// exactly the "denominator smaller than the real slide count" bug
			// issue #3080 reported (found via Claude Code code-review).
			if (
				attributes.showActualSlideCount &&
				attributes.pagination === 'fraction' &&
				!config.loop
			) {
				// config.on を上書きではなく既存のハンドラとマージする
				// （将来、他の箇所が config.on に別のハンドラを追加した場合に
				// それを消してしまわないため。CodeRabbit指摘）。現状 config.on
				// はここでしか設定されていないが、防御的にこの形にしておく。
				// Merge into any existing config.on rather than overwriting it
				// (so a future handler set elsewhere on config.on is not
				// clobbered here. CodeRabbit feedback). config.on is not set
				// anywhere else today, but this is defensive for the future.
				config.on = {
					...(config.on || {}),
					paginationUpdate: applyActualSlideCountPagination,
				};
				// visibleSlidesIndexes（実際にビューポート内に見えているスライドの
				// index一覧）を Swiper に計算させるために必須（#3080, CodeRabbit指摘）。
				// これが無いと centeredSlides 有効時の表示範囲がずれる。
				// Required so Swiper computes visibleSlidesIndexes (the indexes of
				// slides actually visible in the viewport) (#3080, CodeRabbit
				// feedback). Without it, the display range is wrong when
				// centeredSlides is enabled.
				config.watchSlidesProgress = true;
			}

			// Swiperインスタンスをwindow変数に格納
			window[`swiper${index}`] = new Swiper(
				`.vk_slider_${sliderId}`,
				config
			);
			const swiperInstance = window[`swiper${index}`];

			// 停止/再生ボタンをスライダー直下から一度だけ取得し、
			// PRM 抑止と配線の両方で同じ要素を使う（基準の不一致を構造的に防ぐ）。
			// ボタンはスライダー直下にのみ出力されるため :scope > で直下だけを見る。
			// 子孫検索だとスライド内にネストされた別スライダーのボタンに誤マッチする。
			// Query the pause/play button once from the slider's direct children and
			// use the same element for both the reduced-motion suppression and the
			// wiring, so the two criteria cannot drift apart. ':scope >' avoids
			// matching a nested slider's button inside a slide.
			const pauseButton = sliderNode.querySelector(
				':scope > .swiper-pause-button'
			);

			// ⚠️ 同期注意: この「視差効果を減らす」対応ブロックは
			// src/blocks/_pro/post-list-slider/view.js と同一ロジックを重複保持している。
			// 変更時は必ず両ファイルを同期すること。
			// ⚠️ Sync note: this reduced-motion block is duplicated in
			// src/blocks/_pro/post-list-slider/view.js. Keep both files in sync.
			//
			// 「視差効果を減らす」設定時は初期化直後に自動再生を停止する。
			// ただし停止/再生ボタンが DOM に存在するスライダーに限定する（#3044）。
			// ボタンが無いスライダーまで停止すると、利用者に停止の理由が伝わらず
			// 再開手段も無いため「自動再生が壊れた」ように見えてしまう。
			// 属性値ではなく DOM 上のボタン有無で判定するのは、フィルタ等でボタンが
			// 除去された場合でも「再開手段なしで停止」に陥らないようにするため。
			// （autoplay モジュール自体は初期化しておき、停止/再生ボタンで再開できるようにする）
			// Under reduced motion, stop autoplay right after initialization — but only
			// when a pause/play button exists in the DOM (#3044): a stopped slider
			// without a resume control just looks broken. Checking the DOM instead of
			// the serialized attribute keeps this safe even if a filter strips the
			// button. The autoplay module stays initialized so the button can restart it.
			if (
				prefersReducedMotion &&
				pauseButton &&
				swiperInstance?.autoplay &&
				swiperInstance.autoplay.running
			) {
				swiperInstance.autoplay.stop();
			}

			// 停止/再生ボタンの配線。ボタンの有無は上と同じ pauseButton（DOM の実態）で
			// 判定しつつ、自動再生を無効にした作者の意図を尊重して attributes.autoPlay で
			// ゲートする。バンドル版 Swiper は autoplay:false でも autoplay オブジェクトを
			// 生成し、start() も enabled を確認しないため、このゲートが無いと注入された
			// ボタンのクリックで無効化済みの自動再生が開始されてしまう。
			// Wire the pause/play button. Button presence is decided by the same
			// pauseButton element as above (DOM reality), while gating on
			// attributes.autoPlay honors the author's autoplay-off intent: the bundled
			// Swiper creates the autoplay object even with autoplay:false and start()
			// does not check 'enabled', so without this gate a click on an injected
			// button would start autoplay the author disabled.
			if (attributes.autoPlay) {
				setupPauseButton(pauseButton, swiperInstance);
			}

			// ページネーションがOFFの時非表示
			if (
				attributes.pagination === 'hide' &&
				swiperInstance?.pagination
			) {
				swiperInstance.pagination.destroy();
			}
		}
	}
});
