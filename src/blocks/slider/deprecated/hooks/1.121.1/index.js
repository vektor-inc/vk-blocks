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

const generateZoomAnimationCss = (attributes = {}) => {
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
		// ズーム用のセレクターは ::before 専用にして、親要素への副作用を防ぐ
		const zoomSelector = `.vk_slider_${blockId}`;

		// ズーム遷移にかける秒数。
		// = (表示時間 autoPlayDelay + 切替速度 speed + 余裕として autoPlayDelay の半分) / 1000（ms→秒）。
		// 1スライド表示中にゆっくりズームし切るための尺。0 や NaN になる場合は 6 秒へフォールバック。
		// ※この deprecated フックは旧 index.js の save 出力と一致させる必要があるため式・|| 6 は変更しない。
		const transitionDurationSec =
			(autoPlayDelay + speed + autoPlayDelay * 0.5) / 1000 || 6;

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
	background-image: var(--vk-slider-item-bg-image, inherit);
	will-change: transform;
	transform: scale(${zoomInitialScale !== undefined ? zoomInitialScale : 1});
	transition: transform ${transitionDurationSec}s linear;
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
	const zoomCss = generateZoomAnimationCss(attributes);
	const cssTag = heightCss + zoomCss;

	return (
		<>
			{el}
			{cssTag && <style type="text/css">{cssTag}</style>}
		</>
	);
}
