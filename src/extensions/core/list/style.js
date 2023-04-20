/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { registerBlockStyle } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import {
	InspectorControls,
	ColorPalette,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
} from '@wordpress/block-editor';
import { select } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { colorSlugToColorCode } from '@vkblocks/utils/color-slug-to-color-code';

/**
 * External dependencies
 */
import compareVersions from 'compare-versions';

const isValidBlockType = (name) => {
	const validBlockTypes = ['core/list'];
	return validBlockTypes.includes(name);
};

// WP6.2以上か NOTE: WP6.1以下をサポートしなくなったら削除すること
const isLagerThanWp62 = () => {
	if (
		window.wpVersion !== undefined &&
		window.wpVersion !== null &&
		compareVersions(window.wpVersion, '6.2') < 0
	) {
		return false;
	}
	return true;
};

// サポートしているクラス名かどうか
const isVKColorPaletteManager = (colorSet) => {
	// 設定されているカラーパレットのスラッグ配列
	const colorSetSlugArray = [];
	colorSet.forEach((item) => {
		colorSetSlugArray.push(item.slug);
	});

	const supportColorSlugArray = [
		'black',
		'cyan-bluish-gray',
		'white',
		'pale-pink',
		'vivid-red',
		'luminous-vivid-orange',
		'luminous-vivid-amber',
		'light-green-cyan',
		'pale-cyan-blue',
		'vivid-cyan-blue',
		'vivid-purple',
	];
	if (
		supportColorSlugArray.every(
			(element) => colorSetSlugArray.indexOf(element) !== -1
		)
	) {
		return true;
	}
	return false;
};

export const addAttribute = (settings) => {
	if (isValidBlockType(settings.name)) {
		settings.attributes = {
			...settings.attributes,
			color: {
				type: 'string',
			},
		};
	}
	return settings;
};
addFilter('blocks.registerBlockType', 'vk-blocks/list-style', addAttribute);

export const addBlockControl = createHigherOrderComponent(
	(BlockEdit) => (props) => {
		const { name, attributes, setAttributes } = props;
		const { color, className } = attributes;
		if (!isValidBlockType(name)) {
			return <BlockEdit {...props} />;
		}

		const colorSet = select('core/block-editor').getSettings().colors;

		// 6.2未満かつサポートしているクラス名以外のカラーパレットの時
		if (!isLagerThanWp62() && !isVKColorPaletteManager(colorSet)) {
			return <BlockEdit {...props} />;
		}

		return (
			<>
				<BlockEdit {...props} />
				<InspectorControls>
					<PanelBody
						title={__('List Icon Color', 'vk-blocks')}
						initialOpen={false}
					>
						<ColorPalette
							value={colorSlugToColorCode(color)}
							disableCustomColors={
								isLagerThanWp62() ? false : true
							}
							onChange={(newColor) => {
								// 色コードを colorSet から探して色データを取得
								const ColorValue = getColorObjectByColorValue(
									colorSet,
									newColor
								);

								// 現在のクラス名を配列化
								const nowClassArray =
									className && className.split(' ');

								// 新しいクラス名の配列
								let newClassNameArray = nowClassArray
									? nowClassArray
									: [];

								// 互換処理:設定されていたクラス名vk-has-〇〇-colorを削除する
								if (nowClassArray) {
									newClassNameArray = nowClassArray.filter(
										(item) => {
											return !item.match(
												/vk-has-(.*)-color/
											);
										}
									);
								}

								// 6.2未満の場合
								if (!isLagerThanWp62()) {
									// newColorがあれば新しいクラス名を追加する
									if (newColor !== undefined) {
										// コアのテキストカラーと被らないようにvk-has-〇〇-colorを追加する
										newClassNameArray.push(
											`vk-has-${ColorValue.slug}-color`
										);
									}
								}

								const newClassName =
									newClassNameArray.join(' ');

								setAttributes({
									className: newClassName,
									color: ColorValue?.slug
										? ColorValue?.slug
										: newColor,
								});
							}}
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'addMyCustomBlockControls'
);
addFilter('editor.BlockEdit', 'vk-blocks/list-style', addBlockControl);

/**
 * Override the default block element to include elements styles.
 */
const withElementsStyles = createHigherOrderComponent(
	(BlockListBlock) => (props) => {
		const { name, attributes, clientId } = props;
		const { color, className } = attributes;
		if (!isValidBlockType(name)) {
			return <BlockListBlock {...props} />;
		}

		const nowClassArray = className ? className.split(' ') : [];

		// 以前の形式 vk-has-(.*)-colorで保存されている場合
		const hasDeprecatedClassName = nowClassArray.find((item) =>
			item.match(/vk-has-(.*)-color/)
		);
		if (hasDeprecatedClassName) {
			return <BlockListBlock {...props} />;
		}

		// 6.2未満の場合
		if (!isLagerThanWp62()) {
			return <BlockListBlock {...props} />;
		}

		if (!color) {
			return <BlockListBlock {...props} />;
		}

		const colorSet = select('core/block-editor').getSettings().colors;
		const ColorValue = getColorObjectByAttributeValues(colorSet, color);
		let colorValue;
		if (ColorValue.slug !== undefined) {
			colorValue = `var(--wp--preset--color--${ColorValue.slug})`;
		} else {
			colorValue = color;
		}

		const bgStyle = nowClassArray.find((item) =>
			item.match(/is-style-vk-numbered-(circle|square)-mark/)
		);
		let cssTag = '';
		if (bgStyle) {
			cssTag = `#block-${clientId} li::before {
				color: #fff;
				background-color: ${colorValue};
			}`;
		} else {
			cssTag = `#block-${clientId} li::marker, #block-${clientId} li::before {
				color: ${colorValue};
			}`;
		}

		return (
			<>
				{(() => {
					if (cssTag) {
						return <style>{cssTag}</style>;
					}
				})()}
				<BlockListBlock {...props} />
			</>
		);
	}
);
addFilter(
	'editor.BlockListBlock',
	'vk-blocks/list-style/with-block-controls',
	withElementsStyles
);

registerBlockStyle('core/list', [
	{
		name: 'vk-default',
		label: __('Default', 'vk-blocks'),
		isDefault: true,
	},
	{
		name: 'vk-arrow-mark',
		label: __('Arrow', 'vk-blocks'),
	},
	{
		name: 'vk-triangle-mark',
		label: __('Triangle', 'vk-blocks'),
	},
	{
		name: 'vk-check-mark',
		label: __('Check', 'vk-blocks'),
	},
	{
		name: 'vk-check-square-mark',
		label: __('Check Square', 'vk-blocks'),
	},
	{
		name: 'vk-check-circle-mark',
		label: __('Check Circle', 'vk-blocks'),
	},
	{
		name: 'vk-handpoint-mark',
		label: __('Handpoint', 'vk-blocks'),
	},
	{
		name: 'vk-pencil-mark',
		label: __('Pencil', 'vk-blocks'),
	},
	{
		name: 'vk-smile-mark',
		label: __('Smile', 'vk-blocks'),
	},
	{
		name: 'vk-frown-mark',
		label: __('Frown', 'vk-blocks'),
	},
	{
		name: 'vk-numbered-circle-mark',
		label: __('Numbered Circle', 'vk-blocks'),
	},
	{
		name: 'vk-numbered-square-mark',
		label: __('Numbered Square', 'vk-blocks'),
	},
]);
