/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody } from '@wordpress/components';
import {
	InspectorControls,
	ColorPalette,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
} from '@wordpress/block-editor';
import { select, dispatch } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { colorSlugToColorCode } from '@vkblocks/utils/color-slug-to-color-code';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';

/**
 * External dependencies
 */
import { compareVersions } from 'compare-versions';

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

const convertPresetToCssVar = (value = '') => {
	const matches = value.match(/^var:preset\|([^|]+)\|([^|]+)$/);
	if (matches) {
		return `var(--wp--preset--${matches[1]}--${matches[2]})`;
	}
	return value;
};

const getNumberedListLineHeightLength = (attributes = {}) => {
	const rawLineHeight = attributes?.style?.typography?.lineHeight;
	if (rawLineHeight === undefined || rawLineHeight === null) {
		return '';
	}

	const lineHeight = rawLineHeight.toString().trim();
	if (!lineHeight || lineHeight.toLowerCase() === 'normal') {
		return '';
	}

	let value = lineHeight;
	if (value.startsWith('var:preset|')) {
		value = convertPresetToCssVar(value);
	}

	if (value.toLowerCase().startsWith('calc(')) {
		return value;
	}

	if (value.startsWith('var(')) {
		return `calc( ${value} * 1em )`;
	}

	if (value.endsWith('%')) {
		const numeric = parseFloat(value.slice(0, -1));
		if (!Number.isNaN(numeric)) {
			return `calc( ${(numeric / 100).toString()} * 1em )`;
		}
	}

	const numeric = Number(value);
	if (!Number.isNaN(numeric)) {
		return `calc( ${value} * 1em )`;
	}

	return value;
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
		const { color, className, ordered } = attributes;
		if (!isValidBlockType(name)) {
			return <BlockEdit {...props} />;
		}

		const colorSet = select('core/block-editor').getSettings().colors;

		// 6.2未満かつサポートしているクラス名以外のカラーパレットの時
		if (!isLagerThanWp62() && !isVKColorPaletteManager(colorSet)) {
			return <BlockEdit {...props} />;
		}

		// 順序付きリストでスタイルが「デフォルト」以外の場合の注意書きを表示するかどうか
		const nowClassArray = className ? className.split(' ') : [];
		const hasNonDefaultStyle = nowClassArray.find(
			(item) => item.match(/is-style-/) && !item.match(/is-style-default/)
		);

		const showNotice = ordered && hasNonDefaultStyle;
		const noticeShownRef = useRef(false);

		// 通知での表示
		useEffect(() => {
			if (showNotice && !noticeShownRef.current) {
				// 通知がまだ表示されていない場合のみ作成
				dispatch('core/notices').createNotice(
					'warning',
					__(
						'When this style is selected for ordered lists, the "List Style", "Initial Value", and "Reverse Order" features cannot be used.',
						'vk-blocks'
					),
					{
						id: 'vk-blocks-list-notice',
						isDismissible: true,
						autoDismiss: false,
					}
				);
				noticeShownRef.current = true;
			} else if (!showNotice && noticeShownRef.current) {
				// 条件が変わった時のみ通知を削除
				dispatch('core/notices').removeNotice('vk-blocks-list-notice');
				noticeShownRef.current = false;
			}
		}, [showNotice]);

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

		const colorSet = select('core/block-editor').getSettings().colors;
		let colorValue;
		if (color) {
			const ColorValue =
				getColorObjectByAttributeValues(colorSet, color) || {};
			if (ColorValue.slug !== undefined) {
				const safeSlug = sanitizeSlug(ColorValue.slug);
				colorValue = `var(--wp--preset--color--${safeSlug})`;
			} else if (ColorValue.color) {
				colorValue = ColorValue.color;
			} else {
				colorValue = color;
			}
		}

		const bgStyle = nowClassArray.find((item) =>
			item.match(/is-style-vk-numbered-(circle|square)-mark/)
		);
		const lineHeightLength = getNumberedListLineHeightLength(attributes);
		const cssRules = [];
		const blockSelector = `#block-${clientId}`;

		if (bgStyle && lineHeightLength) {
			cssRules.push(
				`${blockSelector} { --vk-numbered-line-height-length: ${lineHeightLength}; }`
			);
		}

		if (colorValue) {
			if (bgStyle) {
				cssRules.push(`${blockSelector} li::before {
				color: #fff;
				background-color: ${colorValue};
			}`);
			} else {
				cssRules.push(`${blockSelector} li::marker, ${blockSelector} li::before {
				color: ${colorValue};
			}`);
			}
		}

		if (!cssRules.length) {
			return <BlockListBlock {...props} />;
		}

		return (
			<>
				<style>{cssRules.join('\n')}</style>
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
