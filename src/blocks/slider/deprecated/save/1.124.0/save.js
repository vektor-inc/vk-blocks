import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * 1.124.0 までの保存形式で使っていた停止/再生ボタン。
 *
 * ⚠️ deprecated の save は当時の出力で固定する必要があるため、現行の
 * ./pause-button.js を import せず、当時のマークアップをこのファイル内に複製している。
 * ⚠️ A deprecated save must stay frozen at the markup of its era, so the pause
 * button is inlined here instead of importing the current ./pause-button.js.
 *
 * @return {JSX.Element} 停止/再生ボタン要素
 */
const PauseButton = () => {
	const labelPause = __( 'Pause slideshow', 'vk-blocks' );
	const labelPlay = __( 'Play slideshow', 'vk-blocks' );

	return (
		<button
			type="button"
			className="vk_slider_pauseButton swiper-pause-button"
			aria-label={labelPause}
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

	const pause_button_html = autoPlay && pauseButton ? <PauseButton /> : '';

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
