const generateHeightCss = (attributes, cssSelector = '') => {
	const { blockId, mobile, tablet, pc, unit } = attributes;
	let css = '';
	if (unit !== undefined && unit !== null) {
		if (mobile !== undefined && mobile !== null && !isNaN(mobile)) {
			css += `@media (max-width: 575.98px) {
				${cssSelector}
				.vk_slider_${blockId} .vk_slider_item{
					height:${mobile}${unit}!important;
				}
			}`;
		}
		if (tablet !== undefined && tablet !== null && !isNaN(tablet)) {
			css += `@media (min-width: 576px) and (max-width: 991.98px) {
				${cssSelector}
				.vk_slider_${blockId} .vk_slider_item{
					height:${tablet}${unit}!important;
				}
			}`;
		}
		if (pc !== undefined && pc !== null && !isNaN(pc)) {
			css += `@media (min-width: 992px) {
				${cssSelector}
				.vk_slider_${blockId} .vk_slider_item{
					height:${pc}${unit}!important;
				}
			}`;
		}
	}

	return css;
};

const generateZoomAnimationCss = (attributes) => {
	const {
		blockId,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		autoPlayDelay,
		speed,
	} = attributes;

	let css = '';

	if (zoomAnimation) {
		const zoomSelector = `.vk_slider_${blockId}`;

		css += `
			${zoomSelector} .vk_slider_item {
				position: relative;
				overflow: hidden;
			}
			
			${zoomSelector} .vk_slider_item::before {
				content: "";
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background-size: cover;
				background-position: center;
				background-image: inherit;
				will-change: transform;
				transform: scale(${zoomInitialScale !== undefined ? zoomInitialScale : 1});
				transition: transform ${(autoPlayDelay + speed + autoPlayDelay * 0.5) / 1000 || 6}s linear;
			}
			
			${zoomSelector} .vk_slider_item.swiper-slide-active::before,
			${zoomSelector} .vk_slider_item.swiper-slide-duplicate-active::before {
				transform: scale(${zoomFinalScale !== undefined ? zoomFinalScale : 1.25});
			}
			
			${zoomSelector} .vk_slider_item.swiper-slide-prev::before,
			${zoomSelector} .vk_slider_item.swiper-slide-next::before {
				transform: scale(${zoomInitialScale !== undefined ? zoomInitialScale : 1});
			}
		`;
	}

	return css;
};

export default function SliderHook({ el, attributes }) {
	const cssSelector = `.vk_slider_${attributes.blockId},`;
	const heightCss = generateHeightCss(attributes, cssSelector);
	const zoomCss = generateZoomAnimationCss(attributes, cssSelector);
	const cssTag = heightCss + zoomCss;

	return (
		<>
			{el}
			{(() => {
				if (cssTag) {
					return <style type="text/css">{cssTag}</style>;
				}
			})()}
		</>
	);
}
