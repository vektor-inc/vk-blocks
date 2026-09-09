import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * 1.124.0 までの保存形式で使っていた停止/再生ボタン。
 *
 * ⚠️ deprecated の save は当時の出力で固定する必要があるため、現行の
 * ./pause-button.js を import せず、当時のマークアップをこのファイル内に複製している。
 * ⚠️ A deprecated save must stay frozen at the markup of its era, so the pause
 * button is inlined here instead of importing the current ./pause-button.js.
 *
 * ⚠️ ラベルは `__()` で作り直さず、**保存済みマークアップから読み取った値**を受け取って
 * そのまま出力する。作り直すと、保存した時の訳文と、いま開いている人のロケールの現在の
 * 訳文が食い違った瞬間に保存内容と一致せず、リカバリー警告になる。読み取り方は
 * deprecated/save/index.js の `bakedPauseButtonLabelAttributes` を参照。#3071
 * ⚠️ The labels are NOT rebuilt with `__()`: the values read from the saved markup are passed
 * in and emitted as they are. Rebuilding them stops matching the saved content the moment the
 * translation at save time and the current translation in the reader's locale diverge, which
 * surfaces as a recovery notice. See `bakedPauseButtonLabelAttributes` in
 * deprecated/save/index.js for how they are read. #3071
 *
 * ここが一致しないと、この世代が持つ `isEligible`（旧クラス `swiper-container` の除去）まで
 * 巻き添えで効かなくなる点に注意。
 * Note that a mismatch here also takes down this generation's `isEligible` — the removal of
 * the legacy `swiper-container` class — as collateral damage.
 *
 * @param {Object} props            プロパティ / props.
 * @param {string|undefined} props.ariaLabel  保存済みの aria-label / the saved aria-label.
 * @param {string|undefined} props.labelPause 保存済みの data-label-pause / the saved data-label-pause.
 * @param {string|undefined} props.labelPlay  保存済みの data-label-play / the saved data-label-play.
 * @return {JSX.Element} 停止/再生ボタン要素
 */
const PauseButton = ({ ariaLabel, labelPause, labelPlay }) => {
	return (
		<button
			type="button"
			className="vk_slider_pauseButton swiper-pause-button"
			aria-label={ariaLabel}
			data-label-pause={labelPause}
			data-label-play={labelPlay}
		>
			<svg
				className="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-pause"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				aria-hidden="true"
				focusable="false"
			>
				<rect x="3" y="2" width="4" height="12" rx="1" />
				<rect x="9" y="2" width="4" height="12" rx="1" />
			</svg>
			<svg
				className="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-play"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				aria-hidden="true"
				focusable="false"
			>
				<path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5z" />
			</svg>
		</button>
	);
};

/**
 * 1.124.0 までの保存形式。
 *
 * ルート要素に Swiper v7 以前の旧クラス `swiper-container` を現行クラス `swiper` と
 * 併記していた頃の出力（#3069 で旧クラスを削除する前）。
 *
 * The saved markup used up to 1.124.0, where the root element still carried the
 * pre-v8 legacy class `swiper-container` alongside the current `swiper` class
 * (removed in #3069).
 *
 * @param {Object} props            ブロックのプロパティ
 * @param {Object} props.attributes ブロックの属性
 * @return {JSX.Element} 保存用の要素
 */
export default function save({ attributes }) {
	const {
		pagination,
		blockId,
		width,
		autoPlay,
		autoPlayStop,
		autoPlayDelay,
		pauseButton,
		loop,
		effect,
		speed,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		navigationPosition,
		centeredSlides,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		direction,
		bakedAriaLabel,
		bakedLabelPause,
		bakedLabelPlay,
	} = attributes;

	const sliderData = {
		autoPlay,
		autoPlayStop,
		autoPlayDelay,
		pauseButton,
		pagination,
		width,
		loop,
		effect,
		speed,
		direction,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		centeredSlides,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		blockId,
	};

	let alignClass = '';
	if ('full' === width) {
		alignClass = ' alignfull';
	} else if ('wide' === width) {
		alignClass = ' alignwide';
	}

	// ページネーションの HTML
	// Pagination markup
	let pagination_html = '';
	if (pagination !== 'hide') {
		pagination_html = (
			<div
				className={`swiper-pagination swiper-pagination-${pagination}`}
			></div>
		);
	}

	// ナビゲーションの HTML
	// Navigation (prev / next) markup
	let navigation_next_html = '';
	let navigation_prev_html = '';
	if (navigationPosition !== 'hide') {
		navigation_next_html = (
			<div
				className={`swiper-button-next swiper-button-${navigationPosition}`}
			></div>
		);
		navigation_prev_html = (
			<div
				className={`swiper-button-prev swiper-button-${navigationPosition}`}
			></div>
		);
	}

	const blockProps = useBlockProps.save({
		className: `swiper swiper-container vk_slider vk_slider_${blockId}${alignClass}`,
	});

	const pause_button_html =
		autoPlay && pauseButton ? (
			<PauseButton
				ariaLabel={bakedAriaLabel}
				labelPause={bakedLabelPause}
				labelPlay={bakedLabelPlay}
			/>
		) : (
			''
		);

	return (
		<div {...blockProps} data-vkb-slider={JSON.stringify(sliderData)}>
			<div className={`swiper-wrapper`}>
				<InnerBlocks.Content />
			</div>
			{navigation_next_html}
			{navigation_prev_html}
			{pagination_html}
			{pause_button_html}
		</div>
	);
}
