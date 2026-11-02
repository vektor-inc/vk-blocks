/**
 * Return the color palette the block editor offers, merged into one list.
 * ブロックエディターが提供するカラーパレットを、1つの一覧に結合して返す。
 */

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Return the editor's color palette as a single merged list.
 * エディターのカラーパレットを結合した1つの一覧として返す。
 *
 * `getSettings().colors` cannot be used on its own: WordPress core fills it with
 * `custom ?? theme ?? default` (wp-includes/block-editor.php), so adding a single color
 * in Global Styles drops the whole theme palette from that list. The ColorPalette the user
 * clicks shows all three origins, so looking a picked color up in `colors` alone misses
 * most of the palette.
 * `getSettings().colors` だけでは足りない。WordPress コアはここへ
 * `custom ?? theme ?? default`（wp-includes/block-editor.php）と1階層だけを入れるため、
 * サイト側が Global Styles で独自色を1色でも足すと、テーマパレットの色が一覧から丸ごと
 * 外れる。利用者がクリックする ColorPalette は3階層すべてを表示するので、
 * `colors` だけで引くとパレットの大半を取りこぼす。
 *
 * @return {Array} Merged palette color objects (slug / name / color).
 *                 結合したパレットの色データ（slug / name / color）の配列。
 */
export const getEditorColorPalette = () => {
	const settings = select('core/block-editor')?.getSettings();
	if (!settings) {
		return [];
	}

	const palette = settings.__experimentalFeatures?.color?.palette;
	// `__experimentalFeatures` は実験的なキーのため、取れない場合は `colors` へ退避する。
	// Fall back to `colors` when the experimental key is unavailable.
	if (!palette) {
		return settings.colors || [];
	}

	// 同じスラッグがあるときは後から来た階層で上書きする（custom > theme > default）。
	// WordPress が --wp--preset--color--<スラッグ> に出す値もこの優先順位のため。
	// Later origins win for the same slug, matching the value WordPress emits for the
	// corresponding CSS custom property.
	const colorBySlug = new Map();
	[palette.default, palette.theme, palette.custom].forEach((colors) => {
		(colors || []).forEach((color) => {
			if (color?.slug) {
				colorBySlug.set(color.slug, color);
			}
		});
	});

	// 並び順は ColorPalette の表示順（テーマ → 標準 → カスタム）に合わせる。
	// 色コードから引いたときに、同じ色コードを持つスラッグが複数あればテーマ側を先に拾うため。
	// Keep the ColorPalette display order so a lookup by color value prefers the theme's
	// own slug when several origins share the same color code.
	const merged = [];
	const added = new Set();
	[palette.theme, palette.default, palette.custom].forEach((colors) => {
		(colors || []).forEach((color) => {
			if (!color?.slug || added.has(color.slug)) {
				return;
			}
			added.add(color.slug);
			merged.push(colorBySlug.get(color.slug));
		});
	});

	return merged;
};
