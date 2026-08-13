import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PauseButton } from './pause-button';

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
	let pagination_html = '';
	if (pagination !== 'hide') {
		pagination_html = (
			<div
				className={`swiper-pagination swiper-pagination-${pagination}`}
			></div>
		);
	}

	// ナビゲーションの HTML
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

	// `swiper-container` は Swiper v7 以前の旧クラス名。v8 で `swiper` にリネームされ、
	// 現行の Swiper では参照されないため出力しない（#3069）。
	// 旧クラスを含む保存済みコンテンツは deprecated/save/1.124.0 で救済する。
	// `swiper-container` is the pre-v8 legacy class name (renamed to `swiper` in v8)
	// and is no longer referenced by Swiper, so it is not emitted anymore (#3069).
	// Content saved with the legacy class is handled by deprecated/save/1.124.0.
	const blockProps = useBlockProps.save({
		className: `swiper vk_slider vk_slider_${blockId}${alignClass}`,
	});

	// 停止/再生ボタンの HTML（自動再生が有効かつ表示設定が ON の時のみ出力）。
	// ⚠️ ボタンはスライダーのルート直下に置くこと。view.js が
	// :scope > .swiper-pause-button で直下のみを検索するため、ラッパーで囲むと
	// 停止/再生ボタンと「視差効果を減らす」対応が機能しなくなる
	// （保存出力の変更になるため deprecation も必要になる）。
	// ⚠️ Keep this button a DIRECT CHILD of the slider root: view.js locates it
	// with ':scope > .swiper-pause-button', so wrapping it breaks the pause/play
	// button and the reduced-motion handling (changing the saved markup would
	// also require a block deprecation).
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
