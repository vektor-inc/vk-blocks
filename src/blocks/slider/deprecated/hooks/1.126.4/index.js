// 1.125.0 から 1.126.4 までの保存形式向けに、追加 CSS（高さ・ズーム）を出力するフック。
//
// スライダーの追加 CSS は `blocks.getSaveElement` 経由で <style> として保存内容に含まれる。
// つまりこの出力もブロック検証の対象で、当時と 1 文字でも変われば検証エラーになる。
// そのため現行の src/blocks/slider/index.js から import せず、当時の実装をここに複製して固定する。
//
// 1.121.1 のフックとの **出力上の** 違いは、ズーム CSS の `.swiper-slide-duplicate-active`
// セレクタの有無だけ。Swiper v14 がループ時の複製スライドにこのクラスを付けなくなったため
// 現行では出力していない。#3069
// （出力に影響しない書き方の違いとして、generateZoomAnimationCss の既定引数を置かない点と、
//   transition 秒数を変数に切り出していない点がある）
//
// ⚠️ 現時点ではこの出力は現行 index.js の出力と完全に一致する。したがって将来 index.js 側の
// 高さ・ズーム CSS を変更する場合は、ここを追従させてはいけない。ここは 1.126.4 の出力の写しであり、
// 変更するとその世代の保存内容が検証エラーになる。
//
// Emits the extra CSS (height / zoom) for the markup saved from 1.125.0 through 1.126.4.
//
// The slider's extra CSS is part of the saved content: it goes through `blocks.getSaveElement`
// and is serialized as a <style> element, so this output is covered by block validation and a
// single changed character invalidates the block. It is therefore duplicated here and frozen
// rather than imported from the current src/blocks/slider/index.js.
//
// The only difference **in output** from the 1.121.1 hook is the `.swiper-slide-duplicate-active`
// selector in the zoom CSS, which the current code no longer emits because Swiper v14 stopped
// putting that class on the duplicated loop slides. #3069
// (Two differences do not affect the output: generateZoomAnimationCss takes no default argument
//  here, and the transition duration is not extracted into a variable.)
//
// ⚠️ This output is currently identical to the one in index.js. If the height or zoom CSS in
// index.js is ever changed, do NOT follow suit here: this is a copy of what 1.126.4 emitted, and
// changing it would invalidate content saved by that generation.
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
		// ズーム用のセレクターは ::before 専用にして、親要素への副作用を防ぐ
		const zoomSelector = `.vk_slider_${blockId}`;

		// transition の秒数 = (表示時間 autoPlayDelay + 切替速度 speed + 余裕として
		// autoPlayDelay の半分) / 1000（ms→秒）。1 スライド表示中にゆっくりズームし切るための尺で、
		// 0 や NaN になる場合は 6 秒へフォールバックする。
		// ⚠️ 当時の出力と一致させる必要があるため、式も `|| 6` も変更しないこと。
		// The transition duration is (autoPlayDelay + speed + half of autoPlayDelay) / 1000, i.e.
		// long enough to finish the zoom while one slide is on screen, falling back to 6 seconds
		// when it works out to 0 or NaN.
		// ⚠️ Neither the formula nor the `|| 6` may be changed: the output has to stay identical
		// to what this generation emitted.
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
	transition: transform ${(autoPlayDelay + speed + autoPlayDelay * 0.5) / 1000 || 6}s linear;
}

${zoomSelector} .vk_slider_item.swiper-slide-active::before {
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
