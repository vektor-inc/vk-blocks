/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFormat } from '@wordpress/rich-text';
import { getColorObjectByColorValue } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import hex2rgba from '@vkblocks/utils/hex-to-rgba';
import { colorSlugToColorCode } from '@vkblocks/utils/color-slug-to-color-code';
import { getEditorColorPalette } from '@vkblocks/utils/editor-color-palette';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';

export const name = 'vk-blocks/highlighter';
export const alpha = 0.7;
export const defaultColor = '#fffd6b';

/*
 * The opening of the CSS variable reference saved in the style attribute, for example
 * `--vk-highlighter-base: var(--wp--preset--color--black, #000000);`.
 * style 属性に保存する CSS 変数参照の書き出し。
 */
const COLOR_VAR_PREFIX = 'var(--wp--preset--color--';

// 色が指定されていなかったらデフォルトカラーを指定する
export const setColorIfUndefined = (color) => {
	if (color === undefined) {
		color = defaultColor;
	}
	return color;
};

/**
 * Determine whether the color code itself already carries an alpha channel.
 * 色コード自体に不透明度が含まれているか判定する。
 *
 * Such colors keep the palette's own alpha instead of being multiplied by 0.7 (#1356).
 * 該当する色は 0.7 を掛けず、パレット側の指定をそのまま使う（#1356）。
 *
 * @param {string} color Color code. 色コード。
 * @return {boolean} True when the color carries an alpha channel. 不透明度が含まれていれば true。
 */
export const hasAlphaInColorCode = (color) => {
	if (typeof color !== 'string') {
		return false;
	}
	const colorCode = color.trim();
	// Match rgba() / hsla() and the 4 / 8 digit hex forms that carry alpha.
	// rgba() / hsla() と、不透明度を持つ 4桁・8桁の色コードを対象にする。
	return (
		/^(?:rgba|hsla)\(/i.test(colorCode) ||
		/^#(?:[0-9a-f]{4}|[0-9a-f]{8})$/i.test(colorCode)
	);
};

/**
 * Return the palette color object when the given color is registered in the palette.
 * 選んだ色がカラーパレットに登録された色なら、その色データを返す。
 *
 * @param {string} color Color code. 色コード。
 * @return {Object|undefined} Palette color object (slug / name / color), or undefined.
 *                            パレットの色データ（slug / name / color）。該当しなければ undefined。
 */
const getPaletteColorObject = (color) => {
	const colorSet = getEditorColorPalette();
	if (!colorSet.length) {
		return undefined;
	}
	return getColorObjectByColorValue(colorSet, color);
};

/**
 * Build the data / style attribute values stored in the post content.
 * 記事本文に保存する data 属性・style 属性の値を組み立てる。
 *
 * @param {string} color Color code picked from the palette or the color picker.
 *                       カラーパレットまたはカラーピッカーで選ばれた色コード。
 * @return {{data: string, style: string}} Attribute values. data 属性と style 属性の値。
 */
export const buildHighlighterAttributes = (color) => {
	color = setColorIfUndefined(color);

	// Palette colors are stored as a slug and resolved through a CSS variable,
	// so the marker follows later changes to the palette color.
	// パレットに登録された色はスラッグで保存し、表示は CSS 変数で解決する
	// （後からパレット側の色を変えたときに追従させるため）。
	const paletteColor = getPaletteColorObject(color);
	/*
	 * Core emits `--wp--preset--color--*` using `_wp_to_kebab_case()` (a port of lodash's
	 * kebabCase), so the variable name has to go through the same normalization or it will
	 * not resolve and the marker silently stops following the palette. `data-color` keeps
	 * the raw slug, because the palette list is keyed by the raw slug.
	 * コアは `_wp_to_kebab_case()`（lodash の kebabCase の移植）で正規化した名前で
	 * `--wp--preset--color--*` を出すため、CSS 変数名も同じ正規化を通す。通さないと変数が
	 * 解決されず、追従が静かに効かなくなる。`data-color` には正規化前のスラッグを入れる
	 * （パレットの一覧が持つのは正規化前のスラッグのため）。
	 */
	const safeSlug = paletteColor?.slug ? sanitizeSlug(paletteColor.slug) : '';
	if (safeSlug) {
		// The color code picked at that time is kept as a fallback so the marker does not
		// disappear when the palette color is deleted.
		// パレットから色が削除されてもマーカーが消えないよう、選んだ時の色コードを予備の値として添える。
		const colorReference = `${COLOR_VAR_PREFIX}${safeSlug}, ${paletteColor.color})`;

		/*
		 * The two CSS variables have different roles: --vk-highlighter-color holds the final
		 * color with 0.7 already applied, while --vk-highlighter-base holds the base color
		 * before 0.7 is applied (src/utils/common.scss applies it). Swapping them makes 0.7
		 * apply twice to existing markers, so never reinterpret one without the other.
		 * 2つの CSS 変数は役割が違う。--vk-highlighter-color は 0.7 を適用済みの最終色、
		 * --vk-highlighter-base は 0.7 を掛ける前のベース色（0.7 は src/utils/common.scss 側で掛ける）。
		 * 入れ替えると既存のマーカーに 0.7 が二重に掛かって薄くなるため、片方だけ読み替えないこと。
		 */
		const customProperty = hasAlphaInColorCode(paletteColor.color)
			? '--vk-highlighter-color'
			: '--vk-highlighter-base';

		return {
			data: paletteColor.slug,
			style: `${customProperty}: ${colorReference};`,
		};
	}

	// Colors that are not in the palette (picked directly) keep the previous color code form.
	// hex2rgba() returns null for 8 digit hex and the like, so fall back to the picked color.
	// パレットに無い色（カラーピッカーで直接指定した色）は従来どおり色コードで保存する。
	// hex2rgba() は 8桁の色コードなどで null を返すため、その場合は選んだ色をそのまま使う。
	return {
		data: color,
		style: `--vk-highlighter-color: ${hex2rgba(color, alpha) || color};`,
	};
};

/**
 * Pull the fallback color code out of the saved style attribute.
 * 保存済みの style 属性から予備の色コードを取り出す。
 *
 * @param {string} style The format's style attribute. 書式の style 属性。
 * @return {string|undefined} The fallback color code, or undefined. 予備の色コード。無ければ undefined。
 */
export const getFallbackColorFromStyle = (style) => {
	if (typeof style !== 'string') {
		return undefined;
	}

	const head = style.indexOf(COLOR_VAR_PREFIX);
	if (head === -1) {
		return undefined;
	}

	/*
	 * Scan for the matching `)` while counting nesting, instead of matching with a regular
	 * expression. A lazy quantifier followed by `\s*` backtracks exponentially on input that
	 * never matches, so a crafted style attribute could freeze the editor of whoever opens the
	 * post. This scan visits every character once.
	 * 正規表現ではなく、括弧の入れ子を数えながら対応する `)` を探す。最短一致の後ろに
	 * `\s*` が続く形は、一致しない入力で探索が指数的に膨らむため、細工した style 属性を
	 * 仕込まれると、その記事を開いた人のエディターが止まる。この走査は各文字を一度しか見ない。
	 */
	let depth = 1;
	let comma = -1;
	for (let i = head + COLOR_VAR_PREFIX.length; i < style.length; i++) {
		const character = style[i];
		if (character === '(') {
			depth++;
		} else if (character === ')') {
			depth--;
			if (depth === 0) {
				// The fallback value is what sits between the separating comma and this `)`.
				// 予備の値は、区切りのカンマとこの `)` の間にある。
				return comma === -1
					? undefined
					: style.slice(comma + 1, i).trim() || undefined;
			}
		} else if (character === ',' && depth === 1 && comma === -1) {
			// The first comma directly inside `var()` separates the slug from the fallback value.
			// `var()` の直下の最初のカンマが、スラッグと予備の値の区切り。
			comma = i;
		}
	}

	// Unclosed `var(` means the declaration is broken, so there is no usable fallback value.
	// `var(` が閉じていなければ宣言が壊れているので、使える予備の値は無い。
	return undefined;
};

/**
 * Return the color code the editor UI (toolbar swatch / color palette) should show.
 * 編集 UI（ツールバーの色見本・カラー選択）が表示すべき色コードを返す。
 *
 * When the slug cannot be resolved — the palette color was deleted, or the site switched to
 * a theme with different slugs — the fallback color code saved in the style attribute is
 * used, so the swatch, the selected state and the post content always show the same color.
 * スラッグが引けない場合（パレットから色が削除された、別のテーマに乗り換えてスラッグが
 * 変わった等）は、style 属性に保存した予備の色コードを使う。色見本・選択状態・記事本文の
 * 3つが常に同じ色になるようにするため。
 *
 * @param {Object} attributes The format's attributes (data / style). 書式の属性（data / style）。
 * @return {string|undefined} Color code, or undefined when no color is set. 色コード。未設定なら undefined。
 */
export const getHighlighterColorCode = (attributes) => {
	const data = attributes?.data;
	if (!data) {
		return undefined;
	}

	// 色コードがそのまま保存されている場合は、解決を通しても同じ値が返る
	// A saved color code comes back unchanged from the slug lookup.
	const resolved = colorSlugToColorCode(data);
	if (resolved && resolved !== data) {
		return resolved;
	}

	return getFallbackColorFromStyle(attributes?.style) || resolved || data;
};

//ハイライトカラーが選択されたら
export const highlighterOnApply = ({ color, value, onChange }) => {
	const { data, style } = buildHighlighterAttributes(color);

	onChange(
		applyFormat(value, {
			type: name,
			attributes: {
				data,
				style,
			},
		})
	);
};

export const highlighColor = {
	title: __('Highlighter', 'vk-blocks'),
	tagName: 'span',
	className: 'vk_highlighter',
	attributes: {
		data: 'data-color',
		style: 'style',
	},
};
