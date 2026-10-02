/**
 * Registry of per-block "Copy styles" / "Paste styles" configurations
 * (issue #3205's Icon block feature, generalized so other blocks can reuse
 * it). A block registers its own configuration once, from its own module
 * (see e.g. src/blocks/icon/copy-styles-config.js), via
 * registerCopyStylesConfig(). The common menu component
 * (src/components/copy-paste-styles/index.js) looks configurations up by
 * block name via getCopyStylesConfig() and never needs to know about a
 * specific block ahead of time.
 *
 * A configuration object has the shape:
 *   {
 *     blockName: string,
 *     attributes: Array<{ key, kind, kindOptions, isLegacyUnset }>, // see pick-attributes.js / attribute-validation.js
 *     narrowAttributesForTarget?: (attributesToApply, targetBlock, helpers) => { attributes, narrowed: true } | undefined,
 *     notifyNarrowedPaste?: (narrowedCount, notices) => void,
 *   }
 *
 * narrowAttributesForTarget, when provided, must return only a subset of the
 * attributesToApply it was given (see e.g. src/blocks/icon/copy-styles-config.js,
 * which keeps only the color keys out of what it received) — it narrows down
 * what gets applied, it never adds a key or a value that was not already in
 * attributesToApply.
 *
 * This registry has no access control of its own: registerCopyStylesConfig()
 * trusts whatever config object it is given, and registering again for a
 * blockName that is already registered silently replaces the previous
 * configuration (see registerCopyStylesConfig() below). It must therefore
 * only ever be called from this plugin's own trusted code (each block's own
 * module, e.g. src/blocks/icon/copy-styles-config.js), never with a
 * blockName or config derived from untrusted input.
 *
 * 「スタイルをコピー/貼り付け」設定（issue #3205 のアイコンブロック機能を、他の
 * ブロックでも使い回せるよう一般化したもの）のブロックごとのレジストリ。
 * 各ブロックは自分自身のモジュール（例: src/blocks/icon/copy-styles-config.js）
 * から registerCopyStylesConfig() で一度だけ設定を登録する。共通のメニュー
 * コンポーネント（src/components/copy-paste-styles/index.js）は
 * getCopyStylesConfig() でブロック名から設定を引くだけで、特定のブロックを
 * あらかじめ知っておく必要はない。
 *
 * 設定オブジェクトの形は上記コメントのとおり。
 *
 * narrowAttributesForTarget を指定する場合、返す値は必ず受け取った
 * attributesToApply の部分集合でなければならない（例:
 * src/blocks/icon/copy-styles-config.js は受け取った内容から色のキーだけを
 * 残す）。実際に反映する内容を絞り込むだけであり、attributesToApply に無かった
 * キーや値を新たに追加することはない。
 *
 * このレジストリ自体はアクセス制御を持たない。registerCopyStylesConfig() は
 * 渡された設定オブジェクトをそのまま信頼し、既に登録済みの blockName で再度
 * 呼び出すと以前の設定を黙って上書きする（後の登録が有効になる。下記
 * registerCopyStylesConfig() 参照）。そのため、呼び出し元は必ずこのプラグイン
 * 自身の信頼されたコード（各ブロック自身のモジュール、例:
 * src/blocks/icon/copy-styles-config.js）に限り、外部からの信頼できない入力に
 * 由来する blockName や設定を渡してはならない。
 */

/** @type {Map<string, Object>} */
const configsByBlockName = new Map();

/**
 * Registers a block's "Copy styles"/"Paste styles" configuration. Calling
 * this again for the same blockName replaces the previous configuration
 * (last registration wins), which mirrors how e.g. registerBlockType()
 * behaves for a re-registration.
 *
 * ブロックの「スタイルをコピー/貼り付け」設定を登録する。同じ blockName で
 * 再度呼び出した場合は、以前の設定を上書きする（後の登録が有効になる。
 * registerBlockType() の再登録時の挙動と同じ考え方）。
 *
 * @param {Object} config Configuration object (see module doc for the shape). Ignored (with no error) when missing a blockName.
 */
export function registerCopyStylesConfig(config) {
	if (!config || !config.blockName) {
		return;
	}
	configsByBlockName.set(config.blockName, config);
}

/**
 * Looks up a registered configuration by block name.
 *
 * ブロック名から登録済みの設定を取得する。
 *
 * @param {string} blockName Block name, e.g. 'vk-blocks/icon'.
 * @return {Object|undefined} The registered configuration, or undefined when none is registered for blockName.
 */
export function getCopyStylesConfig(blockName) {
	return configsByBlockName.get(blockName);
}
