/**
 * Internal dependencies
 */
/*globals vkBlocksObject */
import { mergeColors } from '@vkblocks/utils/merge-colors';

// AdvancedColorPalette と同等のカラーセットを管理画面でも使う
const defaultColors = vkBlocksObject.colorPalette?.default || [];
const themeColors = vkBlocksObject.colorPalette?.theme || [];
const customColors = vkBlocksObject.colorPalette?.custom || [];

const vkColorPalette = mergeColors(defaultColors, themeColors, customColors);

export { vkColorPalette };
