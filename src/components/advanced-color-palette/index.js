// @wordpress/block-editor から必要なものをインポート
import {
	ColorPalette,
	getColorObjectByColorValue,
	useSettings,
} from '@wordpress/block-editor';
import { colorSlugToColorCode } from '@vkblocks/utils/color-slug-to-color-code';
import { mergeColors } from '@vkblocks/utils/merge-colors';
// @wordpress/data から必要なものをインポート
import { select } from '@wordpress/data';

export const AdvancedColorPalette = (props) => {
	const { schema, setAttributes, attributes, enableAlpha = true } = props;
	const colorValue = attributes[schema];
	const editorSettings = select('core/block-editor')?.getSettings();

	const defaultColors = [
		...(useSettings('color.palette.default')?.[0] || []),
	];
	const themeColors = [...(useSettings('color.palette.theme')?.[0] || [])];
	const customColors = editorSettings?.colors || [];

	const colors = mergeColors(defaultColors, themeColors, customColors);

	const hexColor = colorSlugToColorCode(colorValue);
	return (
		<ColorPalette
			value={hexColor}
			colors={colors}
			enableAlpha={enableAlpha}
			onChange={(value) => {
				// 色コードを colorSet から探して色データを取得
				// カスタムカラーの場合 undefined が返る
				// パレットのあるカラーの場合 オブジェクトで color / name / slug が返る（ console.dir(ColorValue) ）
				const ColorValue = getColorObjectByColorValue(colors, value);

				if (ColorValue !== undefined) {
					setAttributes({ [schema]: ColorValue.slug });
				} else {
					setAttributes({ [schema]: value });
				}
			}}
		/>
	);
};
