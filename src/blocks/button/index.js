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
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { isHexColor } from '@vkblocks/utils/is-hex-color';

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
			buttonColor: 'primary',
			buttonTextColorCustom: 'undefined',
			buttonColorCustom: 'undefined',
			buttonAlign: 'left',
			fontAwesomeIconBefore: iconUser,
			fontAwesomeIconAfter: iconUser,
		},
	},
	edit,
	save,
	deprecated,
};

const generateInlineCss = (attributes) => {
	const { buttonTextColorCustom, buttonColorCustom, buttonType, blockId } =
		attributes;
	let inlineCss = '';

	// カスタムカラーの場合
	if (buttonColorCustom !== undefined && isHexColor(buttonColorCustom)) {
		// 塗り
		if (buttonType === '0' || buttonType === null) {
			inlineCss += `.vk_button-${blockId} .has-background {
				background-color: ${buttonColorCustom};
				border: 1px solid ${buttonColorCustom};
			}`;
		}
		// アウトライン
		if (buttonType === '1') {
			inlineCss += `.vk_button-${blockId} .has-text-color.is-style-outline {
				background-color: transparent;
				border: 1px solid ${buttonColorCustom};
				color: ${buttonColorCustom};
			}
			.vk_button-${blockId} .has-text-color.is-style-outline:hover {
				background-color: ${buttonColorCustom};
				border: 1px solid ${buttonColorCustom};
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

	return inlineCss;
};

const VKButtonInlineEditorCss = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes } = props;

		if ('vk-blocks/button' === props.name) {
			const cssTag = generateInlineCss(attributes);
			if (cssTag !== '') {
				return (
					<>
						<BlockEdit {...props} />
						<style type="text/css">{cssTag}</style>
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
			if (cssTag !== '') {
				return (
					<>
						{el}
						<style type="text/css">{cssTag}</style>
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
