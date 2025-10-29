import { __ } from '@wordpress/i18n';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	getGradientSlugByValue,
	getColorObjectByColorValue,
	useSettings,
	useSetting, // 6.4 互換
} from '@wordpress/block-editor';
import { colorSlugToColorCode } from '@vkblocks/utils/color-slug-to-color-code';
import { gradientSlugToGradientCode } from '@vkblocks/utils/gradient-slug-to-gradient-code';
import { select } from '@wordpress/data';

export const AdvancedColorGradientControl = (props) => {
	const {
		colorSchema,
		gradientSchema,
		setAttributes,
		attributes,
		enableAlpha = true,
	} = props;
	const hexColorValue = colorSlugToColorCode(attributes[colorSchema]);
	const gradientValue = gradientSlugToGradientCode(
		attributes[gradientSchema]
	);

	let defaultGradients;
	let themeGradients;
	let defaultColors;
	let themeColors;

	if (typeof useSettings === 'function') {
		defaultGradients = [
			...(useSettings('color.gradients.default')?.[0] || []),
		];
		themeGradients = [...(useSettings('color.gradients.theme')?.[0] || [])];
		defaultColors = [...(useSettings('color.palette.default')?.[0] || [])];
		themeColors = [...(useSettings('color.palette.theme')?.[0] || [])];
	} else if (typeof useSetting === 'function') {
		// 6.4 互換
		defaultGradients = [
			...(useSetting('color.gradients.default')?.[0] || []),
		];
		themeGradients = [...(useSetting('color.gradients.theme')?.[0] || [])];
		defaultColors = [...(useSetting('color.palette.default')?.[0] || [])];
		themeColors = [...(useSetting('color.palette.theme')?.[0] || [])];
	}

	// Editor settings を一度だけ取得
	const editorSettings = select('core/block-editor')?.getSettings();

	const gradientsArray = [];
	if (themeGradients?.length > 0) {
		gradientsArray.push({
			name: __('Theme', 'vk-blocks'),
			gradients: themeGradients,
		});
	}
	if (defaultGradients?.length > 0) {
		gradientsArray.push({
			name: __('Default', 'vk-blocks'),
			gradients: defaultGradients,
		});
	}

	// useSettings で取得したカラー（テーマカラー + 無料版カラー）を配列に追加
	const colorsArray = [];
	if (themeColors?.length > 0) {
		colorsArray.push(...themeColors);
	}
	if (defaultColors?.length > 0) {
		colorsArray.push(...defaultColors);
	}

	// ユーザーが新たに追加したカスタムカラーを追加
	const customColors = editorSettings?.colors || [];
	if (customColors.length > 0) {
		// 既に colorsArray に含まれているものを除外する
		customColors.forEach((customColor) => {
			const exists = colorsArray.some((c) => c.slug === customColor.slug);
			if (!exists) {
				colorsArray.push(customColor);
			}
		});
	}

	return (
		<ColorGradientControl
			gradients={gradientsArray}
			colors={colorsArray}
			colorValue={hexColorValue}
			gradientValue={gradientValue ?? undefined}
			onColorChange={(value) => {
				// カラーパレットの色名・スラッグ・カラーコードを取得
				const colorSet = editorSettings?.colors;

				// 色コードを colorSet から探して色データを取得
				// カスタムカラーの場合 undefined が返る
				// パレットのあるカラーの場合 オブジェクトで color / name / slug が返る（ console.dir(ColorValue) ）
				const ColorValue = getColorObjectByColorValue(colorSet, value);

				if (ColorValue !== undefined) {
					setAttributes({ [colorSchema]: ColorValue.slug });
				} else {
					setAttributes({ [colorSchema]: value });
				}
			}}
			onGradientChange={(value) => {
				const gradientSet = editorSettings?.gradients;

				const _gradientValue = getGradientSlugByValue(
					gradientSet,
					value
				);

				if (_gradientValue !== undefined) {
					setAttributes({ [gradientSchema]: _gradientValue });
				} else {
					setAttributes({ [gradientSchema]: value });
				}
			}}
			enableAlpha={enableAlpha}
		/>
	);
};
