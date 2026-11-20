/**
 * 「文字の上下を詰める」で付け外しするクラス名の操作
 *
 * 新しい属性は作らず、ON/OFF はブロックの追加 CSS クラス（className）に
 * TRIM_CLASS が含まれるかどうかで決める。
 */

// ON のときにブロックへ付けるクラス
export const TRIM_CLASS = 'is-vk-trim-both';

/**
 * className を空白で区切った配列にする。
 *
 * @param {string|undefined} className ブロックの追加 CSS クラス
 * @return {string[]} クラス名の配列
 */
const splitClassName = (className) =>
	typeof className === 'string' ? className.split(/\s+/).filter(Boolean) : [];

/**
 * className に TRIM_CLASS が含まれているかを判定する。
 *
 * @param {string|undefined} className ブロックの追加 CSS クラス
 * @return {boolean} 含まれていれば true
 */
export const hasTrimClass = (className) =>
	splitClassName(className).includes(TRIM_CLASS);

/**
 * TRIM_CLASS を付け外しした className を返す。
 * 利用者が入れたほかのクラスは順序を保って残す。
 *
 * @param {string|undefined} className ブロックの追加 CSS クラス
 * @param {boolean}          enabled   true なら付ける、false なら外す
 * @return {string|undefined} 更新後の className（クラスが 1 つも無ければ undefined）
 */
export const toggleTrimClass = (className, enabled) => {
	// いったん TRIM_CLASS を取り除き、ON のときだけ末尾に付け直す
	const classes = splitClassName(className).filter(
		(item) => item !== TRIM_CLASS
	);
	if (enabled) {
		classes.push(TRIM_CLASS);
	}
	return classes.length > 0 ? classes.join(' ') : undefined;
};
