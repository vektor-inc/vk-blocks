/**
 * カラーの名前からカラーコードを取得する関数
 */
// @wordpress/block-editor から必要なものをインポート
import { getColorObjectByAttributeValues } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getEditorColorPalette } from '@vkblocks/utils/editor-color-palette';

export const colorSlugToColorCode = (color) => {
	let colorCode;
	if (color) {
		// inheritの場合はundefinedを返す（パレットに表示されない）
		if (color === 'inherit') {
			return undefined;
		}

		// カラーパレットの色名・スラッグ・カラーコードを取得
		// 標準・テーマ・カスタムの3階層を結合した一覧で引く。
		// `getSettings().colors` は1階層しか持たないため、ここで引けないスラッグが出る。
		// Look the slug up in the merged palette; `getSettings().colors` holds only one
		// origin, which would leave part of the palette unresolvable.
		const colorSet = getEditorColorPalette();

		// titleColor の色コードを colorSet から探して色データを取得
		const ColorValue = getColorObjectByAttributeValues(colorSet, color);

		if (ColorValue.color !== undefined) {
			colorCode = ColorValue.color;
		} else {
			colorCode = color;
		}
	}
	return colorCode;
};
