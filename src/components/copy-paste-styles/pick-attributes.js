/**
 * Generic attribute extraction for the "Copy styles" / "Paste styles"
 * common component (src/components/copy-paste-styles/). Pure helpers with
 * no dependency on React or @wordpress/data, so they can be unit tested
 * with Jest in isolation from the editor.
 *
 * 「スタイルをコピー/貼り付け」共通部品（src/components/copy-paste-styles/）が使う、
 * 属性抽出の汎用ヘルパー。React・@wordpress/data 等に依存しない純関数のため、
 * Jest でロジックのみをエディタから独立して単体テストできる。
 */
import { isValueValidForKind } from './attribute-validation';

/**
 * Picks only the attributes a block's "Copy styles"/"Paste styles"
 * configuration declares as copyable out of a source block's attributes.
 * Each value is validated against its attribute definition's kind (see
 * attribute-validation.js) and discarded (turned into undefined) when it is
 * not one of the choices the block's own UI could have produced.
 *
 * A value that is unset (undefined) on the source, or discarded by
 * validation, is still included in the result (the key is never omitted) so
 * that pasting always overwrites the target's appearance to match the
 * source exactly. A definition's optional isLegacyUnset(value) lets a block
 * treat an old, no-longer-produced value (e.g. a literal string
 * 'undefined') as unset before validation runs.
 *
 * ブロックの「スタイルをコピー/貼り付け」設定がコピー対象と宣言した属性だけを、
 * ソースブロックの attributes から抜き出す。各値はその属性定義の kind
 * （attribute-validation.js 参照）で検証し、ブロック自身のUIが作りえない値は
 * 捨てて未設定（undefined）にする。
 *
 * コピー元で未設定（undefined）だった項目、および検証で捨てた項目も、
 * 貼り付け先の見た目を確実に一致させるため「未設定」のまま結果に含める
 * （キー自体を省略しない）。定義側の任意の isLegacyUnset(value) により、もはや
 * ブロックが作らなくなった旧形式の値（例: 文字列 'undefined'）を、検証の前に
 * 未設定として扱わせることができる。
 *
 * @param {Object} sourceAttributes Attributes of the block being copied from.
 * @param {Array}  attributeDefs    Attribute definitions ({ key, kind, kindOptions, isLegacyUnset }), from a registered config's `attributes`.
 * @return {Object} Attribute object to use when pasting (has every key in attributeDefs).
 */
export function pickCopyableAttributes(
	sourceAttributes = {},
	attributeDefs = []
) {
	return attributeDefs.reduce((result, def) => {
		let value = sourceAttributes ? sourceAttributes[def.key] : undefined;

		// A block-declared legacy value (e.g. iconColor: 'undefined') is
		// treated as unset before validation runs.
		// ブロックが宣言した旧形式の値（例: iconColor: 'undefined'）は、
		// 検証の前に未設定として扱う。
		if (
			value !== undefined &&
			def.isLegacyUnset &&
			def.isLegacyUnset(value)
		) {
			value = undefined;
		}

		// Discard a value the block's own UI could never have produced.
		// ブロック自身のUIでは作りえない値は捨てて未設定にする。
		if (
			value !== undefined &&
			!isValueValidForKind(def.kind, value, def.kindOptions)
		) {
			value = undefined;
		}

		result[def.key] = value;
		return result;
	}, {});
}

/**
 * Finds the first block matching blockName among parsed blocks. Returns
 * undefined when the copied content only contains other blocks (e.g. a
 * Heading block), so callers can show a warning notice.
 *
 * parse() 済みブロック配列の中から、blockName に一致する最初のブロックを探す。
 * 見出しなど別ブロックだけをコピーしていた場合は undefined を返し、
 * 呼び出し側で警告通知を出せるようにする。
 *
 * @param {Array}  parsedBlocks Block array returned by @wordpress/blocks parse().
 * @param {string} blockName    Block name to look for (a registered config's blockName).
 * @return {Object|undefined} The found block, or undefined.
 */
export function findSourceBlockByName(parsedBlocks, blockName) {
	if (!Array.isArray(parsedBlocks)) {
		return undefined;
	}
	return parsedBlocks.find((block) => block && block.name === blockName);
}
