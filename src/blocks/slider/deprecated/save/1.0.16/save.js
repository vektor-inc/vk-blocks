import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save({ attributes }) {
	const {
		pagination,
		clientId,
		width,
		autoPlay,
		autoPlayDelay,
		loop,
		effect,
		speed,
	} = attributes;
	let alignClass;

	const sliderData = {
		autoPlay,
		autoPlayDelay,
		pagination,
		clientId,
		width,
		loop,
		effect,
		speed,
	};

	if ('full' === width) {
		alignClass = 'vk_width-full';
	} else if ('wide' === width) {
		alignClass = 'vk_width-wide';
	} else {
		alignClass = 'vk_width';
	}

	const blockProps = useBlockProps.save({
		className: `swiper-container vk_slider vk_slider_${clientId} ${alignClass}`,
	});

	return (
		<div {...blockProps} data-vkb-slider={JSON.stringify(sliderData)}>
			<div className={`swiper-wrapper`}>
				<InnerBlocks.Content />
			</div>
			<div className="swiper-button-next"></div>
			<div className="swiper-button-prev"></div>
			{pagination && <div className="swiper-pagination"></div>}
		</div>
	);
}
