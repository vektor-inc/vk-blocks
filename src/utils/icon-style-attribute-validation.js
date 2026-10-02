/**
 * Shared validators for the Icon block's (vk-blocks/icon) style attributes.
 *
 * These check that a value is one of the choices the block's own UI controls
 * (SelectControl / RangeControl / color palette) can actually produce.
 * isValidSizeUnit()/isFiniteNumber() (via sanitizeSizeUnit()/
 * sanitizeFiniteNumber()) are used in src/blocks/icon/component.js, right
 * before a size/margin value is concatenated into a raw style string, so an
 * unexpected value falls back to a safe default instead of being written
 * out as-is.
 *
 * ICON_SIZE_UNITS and ICON_TYPES (the Icon block's own allowed units/style
 * values) are also reused as-is by src/blocks/icon/copy-styles-config.js's
 * "Copy styles"/"Paste styles" (issue #3205) configuration, so the allowed
 * choices are defined in exactly one place. The color/choice/number value
 * checks that feature needs for clipboard content are generic (not
 * Icon-specific) and live in
 * src/components/copy-paste-styles/attribute-validation.js instead.
 *
 * アイコンブロック（vk-blocks/icon）のスタイル属性を検証する共通ユーティリティ。
 *
 * ブロック自身のUI（SelectControl・RangeControl・カラーパレット）で実際に選べる
 * 値かどうかを確認する。isValidSizeUnit()・isFiniteNumber()（sanitizeSizeUnit()・
 * sanitizeFiniteNumber() 経由）は src/blocks/icon/component.js で、サイズ・余白の
 * 値を生の style 文字列へ連結する直前に検証し、想定外の値なら安全な既定値へ倒す。
 *
 * ICON_SIZE_UNITS・ICON_TYPES（アイコンブロック自身が許可する単位・スタイルの値）は、
 * src/blocks/icon/copy-styles-config.js の「スタイルをコピー/貼り付け」
 * （issue #3205）設定からもそのまま再利用し、許可する値の定義を1か所に保つ。
 * その機能がクリップボードの内容に対して必要とする色・選択肢・数値の検証は
 * アイコン固有ではないため、代わりに
 * src/components/copy-paste-styles/attribute-validation.js に置く。
 */

/**
 * Size/margin units offered by the Icon block's own unit SelectControl
 * (src/blocks/icon/edit.js and src/blocks/icon-outer/edit.js).
 *
 * アイコンブロック自身の単位 SelectControl（src/blocks/icon/edit.js・
 * src/blocks/icon-outer/edit.js）の選択肢。
 *
 * @type {string[]}
 */
export const ICON_SIZE_UNITS = ['px', 'em', 'rem', 'vw'];

/**
 * Values the Icon block's "Style" ToggleGroupControl can set for iconType.
 *
 * アイコンブロックの「Style」ToggleGroupControl が設定できる iconType の値。
 *
 * @type {string[]}
 */
export const ICON_TYPES = ['0', '1', '2'];

/**
 * Whether the value is one of the Icon block's allowed size/margin units.
 *
 * @param {*} value Value to check.
 * @return {boolean} True when value is an allowed unit string.
 */
export function isValidSizeUnit(value) {
	return typeof value === 'string' && ICON_SIZE_UNITS.includes(value);
}

/**
 * Whether the value is a finite number (rejects strings, NaN, Infinity,
 * objects, etc.).
 *
 * @param {*} value Value to check.
 * @return {boolean} True when value is a finite number.
 */
export function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Falls back to a safe default unit when the value is not an allowed size
 * unit. Returns the value unchanged when it is allowed, so this never
 * changes the output for values normally set through the block's own UI.
 *
 * @param {*}      value    Value to check.
 * @param {string} fallback Unit to fall back to (default 'px').
 * @return {string} value when valid, otherwise fallback.
 */
export function sanitizeSizeUnit(value, fallback = 'px') {
	return isValidSizeUnit(value) ? value : fallback;
}

/**
 * Falls back to a safe default number when the value is not a finite
 * number. Returns the value unchanged when it already is one.
 *
 * @param {*}      value    Value to check.
 * @param {number} fallback Number to fall back to.
 * @return {number} value when valid, otherwise fallback.
 */
export function sanitizeFiniteNumber(value, fallback) {
	return isFiniteNumber(value) ? value : fallback;
}
