/**
 * Slider block type
 *
 */
import { ReactComponent as Icon } from './icon.svg';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

import deprecatedHooks from './deprecated/hooks';
import deprecated from './deprecated/save';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: <Icon />,
	edit,
	save,
	deprecated,
};

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

// ズーム用の CSS は generateHeightCss と違い cssSelector を取らない。ズームは
// `.vk_slider_${blockId}` を起点にした固定のセレクタで完結するため、呼び出し側から
// 起点を渡す余地が無い（渡しても使われない）。
// attributes に既定値を置かないのは、未指定で呼ばれた時に黙って空の CSS を返すより、
// その場で落ちて呼び出し側の誤りが分かるほうがよいため（generateHeightCss と同じ形）。
//The zoom CSS, unlike generateHeightCss, takes no cssSelector: it is always anchored on
//`.vk_slider_${blockId}`, so there is nothing for the caller to pass in.
//`attributes` has no default on purpose — being called without it should fail here rather
//than silently return empty CSS (same shape as generateHeightCss).
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

// Add column css for editor.
const vkbwithClientIdClassName = createHigherOrderComponent(
	(BlockListBlock) => {
		return (props) => {
			if ('vk-blocks/slider' === props.name) {
				const heightCss = generateHeightCss(props.attributes, '');
				const zoomCss = generateZoomAnimationCss(props.attributes);
				const cssTag = heightCss + zoomCss;
				return (
					<>
						<BlockListBlock {...props} />
						{(() => {
							if (cssTag) {
								return <style type="text/css">{cssTag}</style>;
							}
						})()}
					</>
				);
			}
			return <BlockListBlock {...props} />;
		};
	},
	'vkbwithClientIdClassName'
);
addFilter(
	'editor.BlockListBlock',
	'vk-blocks/slider',
	vkbwithClientIdClassName
);

/**
 * 	Swiperの設定をフロント側に出力するフィルター。
 *  0.49.8で、jSをfooterに出力するよう構造変更。CSSは継続して出力。
 *
 * @param {*} el
 * @param {*} type
 * @param {*} attributes
 */
const addSwiperConfig = (el, type, attributes) => {
	if ('vk-blocks/slider' === type.name) {
		// 実行中の save 関数そのものをキーにして、その保存形式向けのフックを引く。
		// 添字ではなく参照で引くため、deprecated/save と deprecated/hooks の並び順に依存しない。#3083
		// Look the hook up by the running save function itself instead of by position, so
		// this no longer depends on deprecated/save and deprecated/hooks staying in the
		// same order. #3083
		const DeprecatedHook = deprecatedHooks.get(type.save);

		// 後方互換：保存形式ごとの追加 CSS はフック側が出力する
		// Backward compatibility: the hook emits the extra CSS for that saved format
		if (DeprecatedHook) {
			return <DeprecatedHook el={el} attributes={attributes} />;
		}

		// 最新版。対応付けが無い保存形式もここに来る。
		// ここは旧実装から挙動を変えている（安全側へ）。添字方式で -1 になったのは
		// `deprecated` に存在しない save（＝最新版）だけで、「`deprecated` にはあるが
		// 対応付けが無い」ケースは -1 にならず、範囲外アクセスによる例外か、別世代のフックの
		// 適用になっていた。それをこの経路へ安全に流すようにしている。書き忘れは
		// test/unit/slider-deprecated-hook-map.test.js で検出する方針で、実行時には落とさない
		// （書き忘れで利用者のフロントを壊さないことを優先している）。
		// なお現在はすべての保存形式が Map に載っているため、この経路に入る保存形式は存在しない。
		// （件数は deprecated の追加のたびに変わるため、ここには書かない。対応漏れが無いことは
		// test/unit/slider-deprecated-hook-map.test.js の集合比較で担保している）
		// The current format. A save with no mapping lands here as well.
		// This deliberately differs from the old behaviour, erring on the safe side: the index
		// lookup returned -1 only for a save absent from `deprecated` (i.e. the current one).
		// A save that was in `deprecated` but had no hook did not yield -1 — it either threw on
		// the out-of-range access or was handed another generation's hook. Those cases are now
		// routed here instead. A forgotten mapping is caught by
		// test/unit/slider-deprecated-hook-map.test.js rather than by failing at runtime, so it
		// can never break a visitor's page. As it stands every saved format is in the Map, so
		// nothing actually reaches this branch by way of a missing mapping. (No count is written
		// here — it changes with every deprecation added; that nothing is missing is asserted by
		// the set comparison in test/unit/slider-deprecated-hook-map.test.js.)
		const cssSelector = `.vk_slider_${attributes.blockId},`;
		const heightCss = generateHeightCss(attributes, cssSelector);
		const zoomCss = generateZoomAnimationCss(attributes);
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
	// Slider以外のブロック
	return el;
};
addFilter('blocks.getSaveElement', 'vk-blocks/slider', addSwiperConfig, 11);
