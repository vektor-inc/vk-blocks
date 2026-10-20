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

// ズーム倍率は数値として扱い、正の有限数でなければ既定値へフォールバックする。
// CSS へ値を埋め込む前に型を確定させるための処理。
// 正常な値（block.json の型は number、UI は 1〜3）では出力文字列は変わらない。
// Zoom scales are treated as numbers; anything that is not a positive finite number
// falls back to the default. This settles the type before the value is embedded into
// CSS. For valid values (block.json types them as number, the UI allows 1–3) the
// generated string is unchanged.
const toZoomScale = (value, fallbackScale) => {
	const numericScale = Number(value);
	return Number.isFinite(numericScale) && numericScale > 0
		? numericScale
		: fallbackScale;
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
		playbackMode,
	} = attributes;

	let css = '';

	// 等速ループ（#3053）では Swiper のアクティブスライドが無くズームが成立しないため、
	// 保存値が残っていても出力しない（通常方式では従来どおり）。
	// In continuous loop mode (#3053) there is no Swiper active slide for the zoom to act
	// on, so nothing is emitted even if the setting is still saved (standard mode is unchanged).
	if (zoomAnimation && playbackMode !== 'marquee') {
		// ズーム用のセレクターは ::before 専用にして、親要素への副作用を防ぐ
		const zoomSelector = `.vk_slider_${blockId}`;

		// CSS に埋め込む倍率は、ここで数値へ確定させたものだけを使う。
		// Only these resolved numbers are embedded into the CSS below.
		const initialScale = toZoomScale(zoomInitialScale, 1);
		const finalScale = toZoomScale(zoomFinalScale, 1.25);

		// 最終倍率（＝ズームの動きそのもの）は「視差効果を減らす」が有効でない環境だけに
		// 適用する。@media で包むのは最終倍率の規則だけで、::before の基本規則
		// （背景画像・初期倍率・transition）は包まない。基本規則ごと包むと「視差効果を
		// 減らす」環境で背景画像が描画されなくなり、初期倍率も効かなくなるため。
		// transition は transform が変化しない限り発火しないので、そのまま残している。#3082
		//
		// ⚠️ この CSS は blocks.getSaveElement 経由で保存マークアップに書き出される
		// （＝保存内容の一部）。ここを変えると保存出力そのものが変わる。ただしリリース済みの
		// 保存形式は例外なく deprecated/hooks 側が CSS を出しており、この関数の出力を
		// 受けるのは現行の保存形式だけなので、この変更で既存投稿の検証は壊れない。
		//
		// Only the final scale — the movement itself — is applied when the visitor has not
		// asked for reduced motion. Just that one rule goes inside the query: the base
		// ::before rule (background image, initial scale, transition) stays outside, because
		// wrapping it would take the background image and the initial scale with it. The
		// transition never fires while the transform never changes, so it is left as is. #3082
		//
		// ⚠️ This CSS is written into the saved markup through blocks.getSaveElement, so it is
		// part of the saved content and changing it changes the saved output. Every already
		// released format gets its CSS from deprecated/hooks instead, and only the current
		// format is served by this function, so no existing post's validation is affected.

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
	transform: scale(${initialScale});
	transition: transform ${(autoPlayDelay + speed + autoPlayDelay * 0.5) / 1000 || 6}s linear;
}

@media (prefers-reduced-motion: no-preference) {
	${zoomSelector} .vk_slider_item.swiper-slide-active::before {
		transform: scale(${finalScale});
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
