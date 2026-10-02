import Swiper from 'swiper/bundle';
import { __ } from '@wordpress/i18n';
import {
	getActualSlideCountPagination,
	formatActualSlideCountAriaLabel,
	shouldOverrideActualSlideCountPagination,
	ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS,
	ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS,
} from './pagination-actual-count';
import { getEffectiveLoop, normalizeSlidesPerGroup } from './loop-min-slides';

// スライダーの格納
const swiper = {};

// 監視中の editorRoot を管理
const observedRoots = new Set();

// ループOFF・「スライドの枚数」ページネーション時の aria-label テンプレートを取得する
// （#3080）。トークン(%1$s=開始 %2$s=終了 %3$s=総数)は formatActualSlideCountAriaLabel
// が置換する。__() の呼び出しをモジュール最上位ではなく関数化して都度呼ぶことで、
// 翻訳データの登録前にモジュールが評価された場合でも原文のまま固定されないようにする
// （CodeRabbit指摘）。
// Gets the aria-label template used when the #3080 override applies (loop off +
// fraction pagination) (#3080). formatActualSlideCountAriaLabel replaces the
// %1$s (start) / %2$s (end) / %3$s (total) tokens with the actual values.
// Wrapped in a function and called on each use, rather than calling __() once
// at module top-level, so the string is not frozen to the original (untranslated)
// text if the module is evaluated before translation data is registered
// (CodeRabbit feedback).
const getActualSlideCountAriaLabelTemplate = () =>
	/* translators: %1$s: start slide number, %2$s: end slide number, %3$s: total number of slides */
	__('Showing %1$s to %2$s of %3$s', 'vk-blocks');

// Swiper の pagination 更新のたびに、分母(実スライド枚数)・分子(表示範囲)の
// テキストを上書きする（#3080）。計算式自体は pagination-actual-count.js の
// getActualSlideCountPagination と同一。この関数を Swiper の初期設定
// (`on: { paginationUpdate } `) に渡すことで、初回描画からずれなく上書きできる
// （生成後に `.on()` で登録すると、コンストラクタ内で発火する最初の
// paginationUpdate に間に合わない）。
//
// Overrides the fraction pagination's denominator (actual slide count) and
// numerator (visible range) text on every Swiper pagination update (#3080).
// The math mirrors getActualSlideCountPagination in pagination-actual-count.js.
// This is wired via the `on: { paginationUpdate }` Swiper constructor option
// (rather than `.on()` after construction) so it also applies to the very
// first render, which fires synchronously inside the constructor.
const applyActualSlideCountPagination = (swiperInstance, subEl) => {
	// 「1枚ずつ表示」（slidesPerView <= 1）のときは、ループOFFでも Swiper の既定の
	// 分母が既に実スライド数と一致するため上書きしない（従来通り単一数値のまま）。#3080
	// When only one slide is shown at a time (slidesPerView <= 1), Swiper's own
	// denominator already matches the real slide count even with loop off, so we
	// leave its default single-number rendering untouched (#3080).
	if (
		!shouldOverrideActualSlideCountPagination(
			swiperInstance.params.slidesPerView
		)
	) {
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
		const staleTotalEl = subEl.querySelector('.swiper-pagination-total');
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
			`.${ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS}`
		);
		if (staleSeparatorEl) {
			staleSeparatorEl.removeAttribute('aria-hidden');
		}
		const staleSrTextEl = subEl.querySelector(
			`.${ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS}`
		);
		if (staleSrTextEl) {
			staleSrTextEl.textContent = '';
		}
		return;
	}

	const currentEl = subEl.querySelector('.swiper-pagination-current');
	const totalEl = subEl.querySelector('.swiper-pagination-total');
	const separatorEl = subEl.querySelector(
		`.${ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS}`
	);
	// centeredSlides の有無で表示範囲の求め方を切り替える（#3080、麗美の実機確認で
	// 見つかった回帰の再修正）。centeredSlides 有効時は visibleSlidesIndexes
	// （実際にビューポート内に見えているスライドのindex一覧。この一覧は Swiper
	// 設定に watchSlidesProgress: true が入っている時だけ更新される）から求める
	// （activeIndex は範囲の中央になり先頭とみなせないため）。無効時は
	// activeIndex + slidesPerView の式で求める（visibleSlidesIndexes は
	// スライドの描画幅がSwiperの計算スロット幅とズレる環境で可視枚数を
	// 誤判定することがあり、「次へ」を送ると表示が1ステップ遅れる回帰を
	// 引き起こした。詳細は getActualSlideCountPagination のJSDocを参照）。
	// Branches the display-range calculation on centeredSlides (#3080,
	// re-fix of a regression found during real-device QA). When
	// centeredSlides is enabled, derive it from visibleSlidesIndexes (the
	// indexes of slides Swiper computes as actually visible; only kept up to
	// date when the Swiper config has watchSlidesProgress: true) since
	// activeIndex is the center of the range there, not its start. When
	// disabled, derive it from activeIndex + slidesPerView instead —
	// visibleSlidesIndexes can miscount visible slides in environments where
	// the rendered slide width drifts from Swiper's computed slot width,
	// which caused the displayed range to lag one step behind while clicking
	// "next" (see the JSDoc on getActualSlideCountPagination for details).
	const { start, end, total, currentText } = getActualSlideCountPagination({
		visibleSlidesIndexes: swiperInstance.visibleSlidesIndexes,
		totalSlides: swiperInstance.slides ? swiperInstance.slides.length : 0,
		centeredSlides: !!swiperInstance.params.centeredSlides,
		activeIndex: swiperInstance.activeIndex,
		slidesPerView: swiperInstance.params.slidesPerView,
	});

	if (currentEl) {
		currentEl.textContent = currentText;
		// 視覚テキストは aria-hidden にし、下の sr-only 要素のテキストのみを
		// スクリーンリーダーに読ませる（生テキストの二重読み上げを防ぐ）。
		// Hide the visual text from assistive tech and rely solely on the
		// screen-reader-only element set below (avoids reading the raw text twice).
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

	// role="text" は Firefox が未サポートで、WAI-ARIA仕様上も generic 要素
	// （role の無い <div>）への aria-label は無視されうるため、多くの
	// ブラウザ/スクリーンリーダーの組み合わせで効かなかった（CodeRabbit指摘）。
	// 代わりに、視覚要素は aria-hidden のまま維持しつつ、専用の sr-only
	// テキスト要素（screen-reader-text パターン）に整形済みラベルを直接書き込む。
	// role="text" is unsupported in Firefox, and the WAI-ARIA spec allows
	// aria-label on generic elements (a <div> with no role) to be ignored, so
	// this combination was unreliable across many browser/screen-reader
	// pairings (CodeRabbit feedback). Instead, keep the visual elements
	// aria-hidden and write the formatted label directly into a dedicated
	// screen-reader-only text element (the "screen-reader-text" pattern).
	const srTextEl = subEl.querySelector(
		`.${ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS}`
	);
	if (srTextEl) {
		srTextEl.textContent = formatActualSlideCountAriaLabel(
			getActualSlideCountAriaLabelTemplate(),
			{
				start,
				end,
				total,
			}
		);
	}
};

// swiper クラスを削除
const removeSwiperClassName = (targetElement) => {
	if (targetElement) {
		const classNames = targetElement.className.split(' ');
		for (let i = 0; i < classNames.length; i++) {
			if (classNames[i].match(/swiper(\w|-)*/)) {
				// クラスを削除
				targetElement.classList.remove(classNames[i]);
			}
		}
		targetElement.id = targetElement.id.replace(/swiper(\w|-)*/g, '');
		targetElement.style.width = '';
	}
};

// スライダーブロック単体の処理
const LaunchSwiper = (slider) => {
	// 値を取得して配列に格納
	const attributes = JSON.parse(slider.getAttribute('data-vkb-slider'));
	// Backward compatibility: handle typo in old attribute name.
	if (
		attributes.zoomFinalScale === undefined &&
		attributes.zoomFinalScal !== undefined
	) {
		attributes.zoomFinalScale = attributes.zoomFinalScal;
	}

	// スライダーの ID を取得
	if (attributes && (attributes.blockId || attributes.clientId)) {
		// 対象の ID を取得
		let sliderId = '';
		if (attributes.blockId !== undefined) {
			sliderId = attributes.blockId;
		} else if (attributes.clientId !== undefined) {
			// 1.36.0 より古い状態で保存されてる場合の互換処理
			sliderId = attributes.clientId;
		}

		// 編集モードに応じた処理を実行
		if (attributes.editorMode && attributes.editorMode === 'slide') {
			if (!swiper[sliderId]) {
				// swiper クラスを追加
				const newSwiperDiv = slider.querySelector(
					'.block-editor-inner-blocks'
				);
				if (newSwiperDiv) {
					newSwiperDiv.classList.add('swiper');
				}

				// swiper-wrapper クラスを追加
				const newSwiperWrapper = slider.querySelector(
					'.block-editor-block-list__layout'
				);
				if (newSwiperWrapper) {
					newSwiperWrapper.classList.add('swiper-wrapper');
				}

				// スライダーアイテムのクラス処理
				const newSwiperSlide =
					slider.querySelectorAll('.vk_slider_item');
				if (newSwiperSlide.length > 0) {
					newSwiperSlide.forEach((slide) => {
						slide.classList.add('swiper-slide'); // swiper-slide クラスを追加
						slide.classList.remove('is-highlighted'); // 誤動作防止の為 is-highlighted クラスを削除
					});
				}

				const swiperButtonPrev = slider.querySelector(
					'.swiper-button-prev'
				);
				if (swiperButtonPrev) {
					swiperButtonPrev.style.display = '';
				}
				const swiperButtonNext = slider.querySelector(
					'.swiper-button-next'
				);
				if (swiperButtonNext) {
					swiperButtonNext.style.display = '';
				}
				const swiperPagination =
					slider.querySelector('.swiper-pagination');
				if (swiperPagination) {
					swiperPagination.style.display = '';
				}

				// Sloder の設定を作成
				const SwiperSetting = {};

				// ループの設定
				if (attributes.loop) {
					SwiperSetting.loop = attributes.loop;
				}

				// エフェクトの設定
				if (attributes.effect) {
					SwiperSetting.effect = attributes.effect;
				}

				// ナビゲーションの設定
				SwiperSetting.navigation = {
					nextEl: slider.querySelector('.swiper-button-next'),
					prevEl: slider.querySelector('.swiper-button-prev'),
				};

				// ページネーションの設定
				if (attributes.pagination && attributes.pagination !== 'hide') {
					SwiperSetting.pagination = {
						el: slider.querySelector('.swiper-pagination'),
						clickable: true,
						type: `${attributes.pagination}`,
						renderFraction(currentClass, totalClass) {
							return (
								'<span class="' +
								currentClass +
								'"></span>' +
								// 区切り文字「 / 」も専用の要素にしておく（#3080）。詳細は
								// ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS のJSDocを参照
								// （CodeRabbit指摘）。
								// The " / " separator also gets its own element (#3080).
								// See the JSDoc on ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS for
								// details (CodeRabbit feedback).
								'<span class="' +
								ACTUAL_SLIDE_COUNT_SEPARATOR_CLASS +
								'"> / </span>' +
								'<span class="' +
								totalClass +
								'"></span>' +
								// スクリーンリーダー専用の読み上げテキスト要素（#3080）。
								// role="text" + aria-label がFirefox等で効かない問題への
								// 対応として screen-reader-text パターンに変更した
								// （CodeRabbit指摘。詳細は ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS
								// のJSDocを参照）。中身は applyActualSlideCountPagination が
								// 上書きするので、既定は空。
								// Screen-reader-only label element (#3080). Switched to the
								// screen-reader-text pattern because role="text" + aria-label
								// did not work in Firefox and elsewhere (CodeRabbit feedback;
								// see the JSDoc on ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS for
								// details). Its content is populated by
								// applyActualSlideCountPagination, so it starts empty.
								'<span class="screen-reader-text ' +
								ACTUAL_SLIDE_COUNT_SR_TEXT_CLASS +
								'"></span>'
							);
						},
					};
				}

				// 複数枚表示の設定
				if (attributes.effect && attributes.effect !== 'fade') {
					// slidesPerGroup が 'slides-per-view' のときだけ、spv の値を
					// group にも使う。loop-min-slides.js の normalizeSlidesPerGroup
					// （view.js の toIntSpg と同一ロジック。小数は切り捨て。例:
					// 2.9 → 2）を再利用し、view.js・loop-min-slides.js との実装の
					// ズレを防ぐ。以前はこの正規化を独自に Number.isInteger()
					// チェック+1フォールバックで行っており、toIntSpg の実際の
					// 挙動と食い違っていた（CodeRabbit指摘・再修正）。
					// Only when slidesPerGroup is 'slides-per-view' does the
					// group size mirror spv. Reuses normalizeSlidesPerGroup from
					// loop-min-slides.js (identical logic to view.js's toIntSpg;
					// decimals are floored, e.g. 2.9 → 2) so this stays in sync
					// with view.js and loop-min-slides.js instead of drifting.
					// This used to be normalized independently via a
					// Number.isInteger() check + fallback to 1, which did not
					// match toIntSpg's actual behavior (CodeRabbit feedback,
					// re-fix).
					const resolveSpg = (value) =>
						attributes.slidesPerGroup === 'slides-per-view'
							? normalizeSlidesPerGroup(value)
							: 1;

					if (attributes.slidesPerViewMobile) {
						SwiperSetting.slidesPerView =
							attributes.slidesPerViewMobile;
						SwiperSetting.slidesPerGroup = resolveSpg(
							attributes.slidesPerViewMobile
						);
					} else if (attributes.slidesPerView) {
						SwiperSetting.slidesPerView = attributes.slidesPerView;
						SwiperSetting.slidesPerGroup = resolveSpg(
							attributes.slidesPerView
						);
					} else {
						SwiperSetting.slidesPerView = 1;
						SwiperSetting.slidesPerGroup = 1;
					}
					if (
						attributes.slidesPerViewTablet ||
						attributes.slidesPerViewPC
					) {
						// Responsive breakpoints
						SwiperSetting.breakpoints = {};
						if (attributes.slidesPerViewTablet) {
							SwiperSetting.breakpoints[576] = {
								slidesPerView: attributes.slidesPerViewTablet,
								slidesPerGroup: resolveSpg(
									attributes.slidesPerViewTablet
								),
							};
						}
						if (attributes.slidesPerViewPC) {
							SwiperSetting.breakpoints[992] = {
								slidesPerView: attributes.slidesPerViewPC,
								slidesPerGroup: resolveSpg(
									attributes.slidesPerViewPC
								),
							};
						}
					}

					if (attributes.centeredSlides) {
						SwiperSetting.centeredSlides =
							attributes.centeredSlides;
					}

					SwiperSetting.slideActiveClass = 'is-selected';
				}

				// 「実際のスライド数で表示」の配線判定に使う実効loop状態（#3080）。
				// 保存された attributes.loop ではなく、view.js の needsLoopDisable
				// と同じ計算で、スライド枚数不足時の強制OFFを反映した値を使う
				// （src/blocks/slider/edit.js・index.php の同じ対応を参照）。
				// slideCount は上で実際に数えた .vk_slider_item の件数
				// （newSwiperSlide.length）を使う。エディタプレビューはインナー
				// ブロックが実DOMとして存在するため、投稿リストスライダー(Pro)の
				// edit.js（numberPosts属性で近似するしかない）と違い、正確な
				// スライド枚数をここで直接数えられる（CodeRabbit指摘）。
				// The effective loop state used to gate the "Show actual slide
				// count" wiring (#3080). Uses the same calculation as view.js's
				// needsLoopDisable, reflecting the forced-off state when there
				// are too few slides (see the same treatment in
				// src/blocks/slider/edit.js and index.php), rather than the
				// saved attributes.loop. slideCount uses the actual
				// .vk_slider_item count counted above (newSwiperSlide.length):
				// unlike the Post List Slider (Pro)'s edit.js (which can only
				// approximate via the numberPosts attribute), this editor
				// preview has the inner blocks as real DOM elements, so the
				// exact slide count can be counted directly here (CodeRabbit
				// feedback).
				const effectiveLoop = getEffectiveLoop({
					loop: attributes.loop,
					slideCount: newSwiperSlide.length,
					effect: attributes.effect,
					slidesPerView: attributes.slidesPerView,
					slidesPerViewMobile: attributes.slidesPerViewMobile,
					slidesPerViewTablet: attributes.slidesPerViewTablet,
					slidesPerViewPC: attributes.slidesPerViewPC,
					slidesPerGroup: attributes.slidesPerGroup,
					centeredSlides: attributes.centeredSlides,
				});

				// ループOFF（実効状態）・「スライドの枚数」ページネーションの
				// ときだけ、分母・分子のテキストを上書きする（#3080）。
				// Only override the fraction pagination text when loop is off
				// (effective) and the pagination type is "Number of slides"
				// (#3080).
				if (
					attributes.showActualSlideCount &&
					attributes.pagination === 'fraction' &&
					!effectiveLoop
				) {
					// SwiperSetting.on を上書きではなく既存のハンドラとマージする
					// （将来、他の箇所が SwiperSetting.on に別のハンドラを追加した
					// 場合にそれを消してしまわないため。CodeRabbit指摘）。
					// view.js・post-list-slider/view.js と同じ形に揃えた。
					// Merge into any existing SwiperSetting.on rather than
					// overwriting it (so a future handler set elsewhere on
					// SwiperSetting.on is not clobbered here. CodeRabbit
					// feedback). Aligned with the same form used in view.js and
					// post-list-slider/view.js.
					SwiperSetting.on = {
						...(SwiperSetting.on || {}),
						paginationUpdate: applyActualSlideCountPagination,
					};
					// visibleSlidesIndexes（実際にビューポート内に見えているスライドの
					// index一覧）を Swiper に計算させるために必須（#3080, CodeRabbit指摘）。
					// これが無いと centeredSlides 有効時の表示範囲がずれる。
					// Required so Swiper computes visibleSlidesIndexes (the indexes of
					// slides actually visible in the viewport) (#3080, CodeRabbit
					// feedback). Without it, the display range is wrong when
					// centeredSlides is enabled.
					SwiperSetting.watchSlidesProgress = true;
				}

				swiper[sliderId] = new Swiper(
					slider.querySelector(
						'div > div > div.block-editor-inner-blocks'
					),
					SwiperSetting
				);
			} else if (swiper[sliderId]) {
				// 既存の Swiper インスタンスがある場合は、スライド要素が変わっている可能性があるため更新
				swiper[sliderId].update();
			}
		} else {
			// 不要な swiper クラスを削除
			const newSwiperDiv = slider.querySelector(
				'.block-editor-inner-blocks'
			);
			if (newSwiperDiv) {
				removeSwiperClassName(newSwiperDiv);
			}

			// 不要な swiper-wrapper クラスを削除
			const newSwiperWrapper = slider.querySelector(
				'.block-editor-block-list__layout'
			);
			if (newSwiperWrapper) {
				removeSwiperClassName(newSwiperWrapper);
			}

			// 不要な swiper-slide クラスを削除
			const newSwiperSlide = slider.querySelectorAll('.vk_slider_item');
			if (newSwiperSlide.length > 0) {
				newSwiperSlide.forEach((slide) => {
					slide.classList.remove('is-selected');
					slide.classList.remove('is-highlighted');
					removeSwiperClassName(slide);
				});
				newSwiperSlide[0].classList.add('is-selected');
			}

			// ナビゲーションの非表示
			const swiperButtonPrev = slider.querySelector(
				'.swiper-button-prev'
			);
			if (swiperButtonPrev) {
				swiperButtonPrev.style.display = 'none';
			}
			const swiperButtonNext = slider.querySelector(
				'.swiper-button-next'
			);
			if (swiperButtonNext) {
				swiperButtonNext.style.display = 'none';
			}

			// ページネーションの非表示
			const swiperPagination = slider.querySelector('.swiper-pagination');
			if (swiperPagination) {
				swiperPagination.style.display = 'none';
			}

			if (swiper[sliderId]) {
				swiper[sliderId].destroy();
				swiper[sliderId] = null;
			}
		}
	}
};

// スライダーブロック全体の処理
export const LaunchSwiperAll = (editorRoot) => {
	const sliders = editorRoot.querySelectorAll('.vk_slider');
	if (sliders.length > 0) {
		sliders.forEach((slider) => {
			LaunchSwiper(slider);
		});
	}
};

// スライダーの監視
export const SliderObserver = (editorRoot) => {
	// 既に監視中の場合はスキップ
	if (observedRoots.has(editorRoot)) {
		return;
	}

	// このルートを監視中として記録
	observedRoots.add(editorRoot);

	const config = { childList: true, subtree: true, attributes: true };

	const callback = (mutationsList) => {
		// Use traditional 'for loops' for IE 11
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
				if (mutation.addedNodes.length > 0) {
					mutation.addedNodes.forEach((addedNode) => {
						if (
							addedNode.classList &&
							addedNode.classList.contains('vk_slider')
						) {
							LaunchSwiper(addedNode);
						} else if (
							addedNode.classList &&
							addedNode.classList.contains('vk_slider_item')
						) {
							const parentSlider =
								addedNode.closest('.vk_slider');
							LaunchSwiper(parentSlider);
						}
					});
				}
			} else if (mutation.type === 'attributes') {
				if (
					mutation.target.classList.contains('vk_slider') &&
					mutation.attributeName === 'data-vkb-slider'
				) {
					LaunchSwiper(mutation.target);
				}
			}
		}
	};

	const observer = new MutationObserver(callback);
	observer.observe(editorRoot, config);
};

const editorRootLaunch = (editorRoot) => {
	LaunchSwiperAll(editorRoot);

	// editorRoot ごとに1回だけ Observer をセットアップ

	if (!editorRoot.dataset.vkSliderObserverInitialized) {
		SliderObserver(editorRoot);

		editorRoot.dataset.vkSliderObserverInitialized = 'true';
	}
};

export const editSliderLaunch = () => {
	const iframe = document.querySelector(
		'.block-editor-iframe__container iframe'
	);
	const iframeDoc = iframe?.contentWindow?.document;
	const editorRoot =
		iframeDoc?.querySelector('.block-editor-block-list__layout') ||
		document.querySelector('.block-editor-block-list__layout');

	if (editorRoot) {
		editorRootLaunch(editorRoot);
	}

	const siteIframe = document.querySelector('#site-editor iframe');
	const siteEditorRoot =
		siteIframe?.contentWindow?.document.querySelector('.is-root-container');

	if (siteEditorRoot) {
		editorRootLaunch(siteEditorRoot);
	}
};
