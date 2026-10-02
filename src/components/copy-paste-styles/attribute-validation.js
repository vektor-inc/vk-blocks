/**
 * Generic, kind-based value validators for the "Copy styles" / "Paste
 * styles" common component (src/components/copy-paste-styles/). A block
 * that registers a "Copy styles"/"Paste styles" configuration (see
 * config-registry.js) declares each copyable attribute with a `kind`
 * ('number' | 'choice' | 'color') plus kind-specific options, instead of the
 * common component knowing anything about that block's own attribute names
 * or allowed values.
 *
 * These pure functions contain no dependency on React or @wordpress/data so
 * they can be unit tested with Jest in isolation from the editor.
 *
 * 「スタイルをコピー/貼り付け」共通部品（src/components/copy-paste-styles/）が使う、
 * 種類（kind）ごとの汎用バリデータ。「スタイルをコピー/貼り付け」の設定を登録する
 * ブロック（config-registry.js 参照）は、コピー対象の属性ごとに
 * 'number' | 'choice' | 'color' のいずれかの kind と、kind ごとの追加オプションを
 * 宣言する。共通部品はブロック自身の属性名や許容値そのものを知らない。
 *
 * React・@wordpress/data 等に依存しない純関数のため、Jest でロジックのみを
 * エディタから独立して単体テストできる。
 */
import { isHexColor } from '@vkblocks/utils/is-hex-color';

/**
 * Pattern a color palette slug matches. Kept permissive (letters of either
 * case, digits, underscore, hyphen) because a theme's color palette slug is
 * not limited to sanitizeSlug's kebab-case output (e.g. it may contain
 * uppercase letters or underscores). Narrowing this further would risk
 * discarding a legitimate theme color on paste.
 *
 * カラーパレットのスラッグが満たすパターン。テーマのカラーパレットのスラッグは
 * sanitizeSlug のケバブケース出力に限らない（大文字やアンダースコアを含む場合が
 * ある）ため、意図的に広めに許可している（英大小文字・数字・アンダースコア・
 * ハイフン）。これ以上絞ると、貼り付け時に正当なテーマカラーを誤って捨てる
 * おそれがある。
 *
 * @type {RegExp}
 */
const COLOR_SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Whether a value is a finite number (rejects strings, NaN, Infinity,
 * objects, etc.). Used for the 'number' kind.
 *
 * @param {*} value Value to check.
 * @return {boolean} True when value is a finite number.
 */
export function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Whether a value is one of an explicit allow-list of strings. Used for the
 * 'choice' kind (e.g. a unit SelectControl's options, or a
 * ToggleGroupControl's values).
 *
 * @param {*}        value         Value to check.
 * @param {string[]} allowedValues Allowed values.
 * @return {boolean} True when value is one of allowedValues.
 */
export function isAllowedValue(value, allowedValues = []) {
	return typeof value === 'string' && allowedValues.includes(value);
}

/**
 * Whether a value is an allowed color value: a hex color, a color palette
 * slug, or (when kindOptions.allowInherit is true) the literal 'inherit'.
 * Used for the 'color' kind.
 *
 * @param {*}       value                      Value to check.
 * @param {Object}  [kindOptions]
 * @param {boolean} [kindOptions.allowInherit] Whether 'inherit' is an allowed value for this attribute.
 * @return {boolean} True when the value is allowed.
 */
export function isValidColorValue(value, { allowInherit = false } = {}) {
	if (typeof value !== 'string') {
		return false;
	}
	// 'inherit' itself would also match COLOR_SLUG_PATTERN (letters only), so
	// it is decided explicitly here rather than falling through to the slug
	// check, which would otherwise accept it even when allowInherit is false.
	// 'inherit' は COLOR_SLUG_PATTERN（英字のみ）にもマッチしてしまうため、
	// スラッグ判定に落とさずここで明示的に判定する。そうしないと allowInherit が
	// false のときも 'inherit' を誤って許可してしまう。
	if (value === 'inherit') {
		return allowInherit;
	}
	return isHexColor(value) || COLOR_SLUG_PATTERN.test(value);
}

/**
 * Dispatches to the validator for the given kind. A block opts an attribute
 * out of value validation by explicitly declaring kind: 'any' (no
 * restriction). An unknown or unset kind is instead treated as invalid
 * (always rejected): a config with a missing/misspelled kind is a mistake
 * in that config, and this function must fail closed on it rather than
 * silently letting every value through unvalidated.
 *
 * kind に応じたバリデータへ振り分ける。ブロック側が値の検証をしないと明示するに
 * は、kind に 'any' を指定する（値の制限をしない）。kind が未指定・未知の場合は
 * 逆に invalid（常に拒否）として扱う。kind の書き忘れ・書き間違いは設定側の
 * 誤りであり、この関数は検証をしない側に倒さず、拒否する側に倒す。
 *
 * @param {string} kind          One of 'number' | 'choice' | 'color' | 'any' (anything else is rejected).
 * @param {*}      value         Value to check.
 * @param {Object} [kindOptions] Kind-specific options (see isAllowedValue() / isValidColorValue()).
 * @return {boolean} True when value is allowed for kind.
 */
export function isValueValidForKind(kind, value, kindOptions = {}) {
	switch (kind) {
		case 'number':
			return isFiniteNumber(value);
		case 'choice':
			return isAllowedValue(value, kindOptions.allowedValues);
		case 'color':
			return isValidColorValue(value, kindOptions);
		case 'any':
			return true;
		default:
			return false;
	}
}
