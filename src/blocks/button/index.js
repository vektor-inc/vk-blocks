/**
 * Button block type
 *
 */
import { ReactComponent as Icon } from './icon.svg';
import { title, iconName, url, iconUser } from '@vkblocks/utils/example-data';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import { deprecated } from './deprecated/save/';
import deprecatedHooks from './deprecated/hooks';
import transforms from './transforms';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: <Icon />,
	example: {
		attributes: {
			content: iconName,
			subCaption: title,
			buttonUrl: url,
			buttonTarget: false,
			buttonSize: 'md',
			buttonType: '0',
			buttonEffect: '',
			buttonColor: 'primary',
			buttonTextColorCustom: 'undefined',
			buttonColorCustom: 'undefined',
			buttonAlign: 'left',
			buttonWidthMobile: 0,
			buttonWidthTablet: 0,
			outerGap: null,
			buttonWidth: 0,
			fontAwesomeIconBefore: iconUser,
			fontAwesomeIconAfter: iconUser,
			iconSizeBefore: null,
			iconSizeAfter: null,
		},
	},
	edit,
	save,
	deprecated,
	transforms,
};

/**
 * カラーのCSS値を取得する / Returns a CSS color value.
 * @param {string} value - HEX、rgba、またはパレットスラッグ / A HEX, rgba, or palette slug.
 * @return {string|null} CSS で使用できる色、または null / A CSS color value or null.
 */
const getColorCssValue = (value) => {
	if (value === undefined || value === '' || value === null) {
		return null;
	}
	// HEX カラーの場合
	if (isHexColor(value)) {
		return value;
	}
	// rgba / rgb / hsla / hsl カラーの場合（厳格にバリデーション）
	const cssFuncColorPattern = /^(rgba?|hsla?)\(\s*[\d.%\s,/]+\s*\)$/;
	if (cssFuncColorPattern.test(value)) {
		return value;
	}
	// パレットのスラッグ → sanitize して CSS 変数参照（hover / 枠線で共用）
	// Sanitize palette slugs before embedding them in CSS custom properties.
	const safeSlug = sanitizeSlug(value);
	if (!safeSlug) {
		return null;
	}
	return `var(--wp--preset--color--${safeSlug})`;
};

const generateInlineCss = (attributes) => {
	const {
		buttonTextColorCustom,
		buttonColorCustom,
		buttonBorderColorCustom,
		buttonHoverBorderColorCustom,
		buttonHoverBgColorCustom,
		buttonHoverTextColorCustom,
		buttonType,
		blockId,
	} = attributes;
	let inlineCss = '';

	// 枠線色が有効なときは塗り／アウトライン側の同色 border を出さない。
	// エディタでは特異性の差で buttonColorCustom 側の border が勝つことがあるため。
	// When a custom border color is active, skip the matching border from fill/outline styles.
	// In the editor, buttonColorCustom border rules can win due to specificity differences.
	const borderColorCssValue = getColorCssValue(buttonBorderColorCustom);
	const hoverBorderColorCssValue = getColorCssValue(
		buttonHoverBorderColorCustom
	);
	const isBorderStyleType =
		buttonType === '0' || buttonType === null || buttonType === '1';
	const hasCustomBorderColor = !!(borderColorCssValue && isBorderStyleType);
	const hasCustomHoverBorderColor = !!(
		hoverBorderColorCssValue && isBorderStyleType
	);

	// カスタムカラーの場合
	if (buttonColorCustom !== undefined && isHexColor(buttonColorCustom)) {
		// 枠線色未設定時のみ、ボタン色と同色の border を出す（後方互換）。
		// Emit a matching border only when no custom border color is set (backward compatibility).
		const colorBorderCss = hasCustomBorderColor
			? ''
			: `\n\t\t\t\tborder: 1px solid ${buttonColorCustom};`;
		// 塗り
		if (buttonType === '0' || buttonType === null) {
			inlineCss += `.vk_button-${blockId} .has-background {
				background-color: ${buttonColorCustom};${colorBorderCss}
			}`;
		}
		// アウトライン
		if (buttonType === '1') {
			inlineCss += `.vk_button-${blockId} .has-text-color.is-style-outline {
				background-color: transparent;${colorBorderCss}
				color: ${buttonColorCustom};
			}
			.vk_button-${blockId} .has-text-color.is-style-outline:hover {
				background-color: ${buttonColorCustom};${colorBorderCss}
				color: #fff;
			}`;
		}
		// テキストのみ
		if (buttonType === '2') {
			inlineCss = `.vk_button-${blockId} .has-text-color.vk_button_link-type-text {
				color: ${buttonColorCustom};
			}`;
		}
	}

	// 文字色がカスタムカラーの場合
	if (
		buttonTextColorCustom !== undefined &&
		isHexColor(buttonTextColorCustom)
	) {
		if (buttonType === '0' || buttonType === null) {
			inlineCss += ` .vk_button-${blockId} .has-text-color {
				color: ${buttonTextColorCustom};
			}`;
		}
	}

	// ホバー時の背景色が設定されている場合
	// WP コアが .has-*-background-color に !important を付与するため
	// !important で上書きする必要がある
	// filter: none でテーマの brightness/saturate フィルタをリセット
	const hoverBgCssValue = getColorCssValue(buttonHoverBgColorCustom);
	if (hoverBgCssValue) {
		inlineCss += ` .vk_button.vk_button-${blockId} .vk_button_link:hover {
			background-color: ${hoverBgCssValue} !important;
			border-color: ${hoverBgCssValue} !important;
			box-shadow: none !important;
			opacity: 1 !important;
			filter: none !important;
		}`;
	}

	// ホバー時のテキスト色が設定されている場合
	const hoverTextCssValue = getColorCssValue(buttonHoverTextColorCustom);
	if (hoverTextCssValue) {
		inlineCss += ` .vk_button.vk_button-${blockId} .vk_button_link:hover {
			color: ${hoverTextCssValue} !important;
		}`;
		inlineCss += ` .vk_button.vk_button-${blockId} .vk_button_link:hover .vk_button_link_txt,
		.vk_button.vk_button-${blockId} .vk_button_link:hover .vk_button_link_subCaption,
		.vk_button.vk_button-${blockId} .vk_button_link:hover .vk_button_link_before,
		.vk_button.vk_button-${blockId} .vk_button_link:hover .vk_button_link_after {
			color: ${hoverTextCssValue} !important;
		}`;
	}

	if (hasCustomBorderColor) {
		// 枠線色は背景色・文字色から独立させる。
		// 通常時は width/style ごと指定する（テーマ側 .btn に border が無い場合でも見えるように）。
		// エディタでは .editor-styles-wrapper .vk_button .has-text-color.is-style-outline
		// （特異性 0,4,0 / border-color:currentColor）が
		// `.vk_button.vk_button-{id} .vk_button_link`（0,3,0）より勝つため、
		// `.editor-styles-wrapper` 付きセレクタを併記する。
		// Keep border color independent from background/text colors.
		// Specify width/style in the default state so borders remain visible even when the theme .btn has none.
		// In the editor, pair selectors with .editor-styles-wrapper to match outline specificity (0,4,0).
		inlineCss += ` .vk_button.vk_button-${blockId} .vk_button_link,
.editor-styles-wrapper .vk_button.vk_button-${blockId} .vk_button_link {
			border: 1px solid ${borderColorCssValue};
		}`;
	}

	// ホバー時の枠線色:
	// - Hover Border Color があればそれを使う
	// - 無ければ通常の Border Color を維持（未設定ならホバー背景色側の border-color に任せる）
	// ホバーは border-color のみ !important（先行する hover 背景色ルールの border-color !important に勝つため）。
	// Hover border color:
	// - Use Hover Border Color when set
	// - Otherwise keep Border Color (or defer to hover background border-color when unset)
	// Use border-color with !important so this rule wins over the hover background rule above.
	const hoverBorderCssValue =
		(hasCustomHoverBorderColor && hoverBorderColorCssValue) ||
		(hasCustomBorderColor && borderColorCssValue) ||
		'';
	if (hoverBorderCssValue) {
		inlineCss += ` .vk_button.vk_button-${blockId} .vk_button_link:hover,
.editor-styles-wrapper .vk_button.vk_button-${blockId} .vk_button_link:hover {
			border-color: ${hoverBorderCssValue} !important;
		}`;
	}

	return inlineCss;
};

const generateInlineGapCss = (attributes, isSave) => {
	const {
		buttonWidthMobile,
		buttonWidthTablet,
		buttonWidth,
		outerGap,
		blockId,
	} = attributes;
	let inlineCss = '';
	const propaty = isSave
		? '.vk_button'
		: '.vk_buttons .vk_buttons_col .block-editor-block-list__layout .vk_button';

	// 親ブロックのギャップを反映
	if (outerGap) {
		if (buttonWidthMobile) {
			inlineCss += `@media (max-width: 575.98px) {
				${propaty}.vk_button-${blockId} {
					width: calc(${buttonWidthMobile}% - calc(${outerGap} - calc(${outerGap} / (100 / ${buttonWidthMobile}))) - 1px);
				}
			}`;
		}
		if (buttonWidthTablet) {
			inlineCss += `@media(min-width: 576px) and (max-width: 991.98px) {
				${propaty}.vk_button-${blockId} {
					width: calc(${buttonWidthTablet}% - calc(${outerGap} - calc(${outerGap} / (100 / ${buttonWidthTablet}))) - 1px);
				}
			}`;
		}
		if (buttonWidth) {
			inlineCss += `@media (min-width: 992px) {
					${propaty}.vk_button-${blockId} {
					width: calc(${buttonWidth}% - calc(${outerGap} - calc(${outerGap} / (100 / ${buttonWidth}))) - 1px );
				}
			}`;
		}
	}

	return inlineCss;
};

const VKButtonInlineEditorCss = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes } = props;

		if ('vk-blocks/button' === props.name) {
			const cssTag = generateInlineCss(attributes);
			const cssEditor = generateInlineGapCss(attributes, false);
			if (cssTag !== '' || cssEditor !== '') {
				return (
					<>
						<BlockEdit {...props} />
						<style type="text/css">
							{cssTag} {cssEditor}
						</style>
					</>
				);
			}
			return <BlockEdit {...props} />;
		}
		return <BlockEdit {...props} />;
	};
}, 'VKButtonInlineEditorCss');
addFilter('editor.BlockEdit', 'vk-blocks/button', VKButtonInlineEditorCss);

const VKButtonInlineCss = (el, type, attributes) => {
	if ('vk-blocks/button' === type.name) {
		//現在実行されている deprecated内の save関数のindexを取得
		const deprecatedFuncIndex = deprecated.findIndex(
			(item) => item.save === type.save
		);

		// 最新版
		if (-1 === deprecatedFuncIndex) {
			// NOTE: useBlockProps + style要素を挿入する場合、useBlockPropsを使った要素が最初（上）にこないと、
			// カスタムクラスを追加する処理が失敗する[
			const cssTag = generateInlineCss(attributes);
			const cssEditor = generateInlineGapCss(attributes, true);
			if (cssTag !== '' || cssEditor !== '') {
				return (
					<>
						{el}
						<style type="text/css">
							{cssTag} {cssEditor}
						</style>
					</>
				);
			}
			return el;

			//後方互換
		}
		const DeprecatedHook = deprecatedHooks[deprecatedFuncIndex];
		return <DeprecatedHook el={el} attributes={attributes} />;
	}
	return el;
};
addFilter('blocks.getSaveElement', 'vk-blocks/button', VKButtonInlineCss, 11);
