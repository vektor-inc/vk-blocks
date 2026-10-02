/**
 * "Copy styles" / "Paste styles" (issue #3205) configuration for the Icon
 * block (vk-blocks/icon), registered with the shared common component
 * (src/components/copy-paste-styles/). This is the only module that should
 * know this block's own attribute names, which attributes are copyable,
 * the Icon Outer narrowing rule, and the Icon-Outer-specific notice
 * wording — the common component itself stays block-agnostic (see
 * src/components/copy-paste-styles/index.js).
 *
 * Importing this module (see src/blocks/icon/index.js) is what performs the
 * registration; it has no other exports consumed at runtime (the named
 * exports below exist for this file's own unit tests).
 *
 * アイコンブロック（vk-blocks/icon）の「スタイルをコピー/貼り付け」（issue #3205）
 * 設定。共通部品（src/components/copy-paste-styles/）へ登録する。このブロック
 * 自身の属性名・コピー対象の属性・Icon Outer への絞り込みルール・Icon Outer
 * 専用の通知文言を知っているのはこのファイルだけで、共通部品自体はブロックに
 * 依存しない（src/components/copy-paste-styles/index.js 参照）。
 *
 * このモジュールを import すること（src/blocks/icon/index.js 参照）自体が登録を
 * 実行する。下記の named export は本ファイル自身の単体テストのために存在し、
 * 実行時に他から使われるものではない。
 */
import { __, _n, sprintf } from '@wordpress/i18n';

import { registerCopyStylesConfig } from '@vkblocks/components/copy-paste-styles/config-registry';
import {
	ICON_SIZE_UNITS,
	ICON_TYPES,
} from '@vkblocks/utils/icon-style-attribute-validation';

/**
 * Block name of the Icon block.
 *
 * アイコンブロック（vk-blocks/icon）のブロック名。
 *
 * @type {string}
 */
export const ICON_BLOCK_NAME = 'vk-blocks/icon';

/**
 * Block name of the Icon Outer (horizontal icon group) block. Only this
 * module needs to know it, to decide whether a paste target is one of its
 * child icons.
 *
 * 横並びアイコンブロック（vk-blocks/icon-outer）のブロック名。貼り付け先が
 * その子アイコンかどうかを判定するために、このファイルだけが知っていればよい。
 *
 * @type {string}
 */
const ICON_OUTER_BLOCK_NAME = 'vk-blocks/icon-outer';

/**
 * Attribute keys that may be applied when pasting onto a child icon inside
 * vk-blocks/icon-outer. Size, margin, corner radius and style are
 * controlled by the parent block, so only the color attributes are allowed
 * here.
 *
 * vk-blocks/icon-outer の子アイコンに貼り付ける場合に反映してよい属性キー一覧。
 * サイズ・余白・角丸・形状は親（icon-outer）が管理しているため、色のみに絞る。
 *
 * @type {string[]}
 */
const ICON_OUTER_CHILD_ATTRIBUTE_KEYS = ['iconColor', 'iconFontColor'];

/**
 * Attribute definitions covered by "Copy styles" / "Paste styles". A
 * size/margin value is always paired with its unit (iconSize +
 * iconSizeUnit, iconMargin + iconMarginUnit) so a copied size is never left
 * without its unit. faIcon, link-related attributes, anchor, className and
 * iconAlign (alignment) are intentionally excluded.
 *
 * 「スタイルをコピー/貼り付け」の対象とする属性定義一覧。数値と単位は必ずセットで
 * 扱う（iconSize + iconSizeUnit、iconMargin + iconMarginUnit）。コピーしたサイズが
 * 単位を伴わずに残ることはない。faIcon・リンク系属性・anchor・className・
 * iconAlign（配置）はここに含めない。
 *
 * @type {Array<Object>}
 */
const ICON_COPYABLE_ATTRIBUTE_DEFS = [
	{
		key: 'iconType',
		kind: 'choice',
		kindOptions: { allowedValues: ICON_TYPES },
	},
	{
		key: 'iconColor',
		kind: 'color',
		kindOptions: { allowInherit: true },
		// Legacy string 'undefined' in iconColor is treated as unset,
		// matching the existing compatibility handling in edit.js.
		// 旧形式の 'undefined'（文字列）は未設定として扱う（edit.js の既存互換処理と同じ判定）。
		isLegacyUnset: (value) => value === 'undefined',
	},
	{
		key: 'iconFontColor',
		kind: 'color',
		kindOptions: { allowInherit: false },
	},
	{ key: 'iconSize', kind: 'number' },
	{
		key: 'iconSizeUnit',
		kind: 'choice',
		kindOptions: { allowedValues: ICON_SIZE_UNITS },
	},
	{ key: 'iconMargin', kind: 'number' },
	{
		key: 'iconMarginUnit',
		kind: 'choice',
		kindOptions: { allowedValues: ICON_SIZE_UNITS },
	},
	{ key: 'iconRadius', kind: 'number' },
];

/**
 * Narrows down the attributes actually applied when the paste target is a
 * child icon inside vk-blocks/icon-outer: only color
 * (ICON_OUTER_CHILD_ATTRIBUTE_KEYS) is kept, since size, margin, corner
 * radius and style follow the parent Icon Outer block's own setting. For
 * any other target, this returns undefined so the common component applies
 * the full copied styles unchanged.
 *
 * 貼り付け先が vk-blocks/icon-outer の子アイコンの場合、実際に反映する属性を
 * 色（ICON_OUTER_CHILD_ATTRIBUTE_KEYS）だけに絞り込む。サイズ・余白・角丸・
 * 形状は親（Icon Outer）ブロック自身の設定が使われるため。それ以外の貼り付け先
 * では undefined を返し、共通部品側がコピーしたスタイルをそのまま全件反映する。
 *
 * @param {Object}   attributesToApply            Result of pickCopyableAttributes() for this paste.
 * @param {Object}   targetBlock                  The block being pasted onto (has .clientId).
 * @param {Object}   helpers
 * @param {Function} helpers.getBlockRootClientId block-editor store selector.
 * @param {Function} helpers.getBlockName         block-editor store selector.
 * @return {{attributes: Object, narrowed: true}|undefined} Narrowed result, or undefined when not an Icon Outer child.
 */
function narrowAttributesForTarget(
	attributesToApply,
	targetBlock,
	{ getBlockRootClientId, getBlockName }
) {
	const rootClientId = getBlockRootClientId(targetBlock.clientId);
	const isIconOuterChild =
		!!rootClientId && getBlockName(rootClientId) === ICON_OUTER_BLOCK_NAME;

	if (!isIconOuterChild) {
		return undefined;
	}

	const narrowedAttributes = ICON_OUTER_CHILD_ATTRIBUTE_KEYS.reduce(
		(result, key) => {
			if (Object.prototype.hasOwnProperty.call(attributesToApply, key)) {
				result[key] = attributesToApply[key];
			}
			return result;
		},
		{}
	);

	return { attributes: narrowedAttributes, narrowed: true };
}

/**
 * Shows the notice for pasting onto Icon Outer's child icons: only color was
 * applied because size, margin, corner radius and style follow the parent
 * Icon Outer block's setting. The block name matches the Icon Outer block's
 * own title exactly (block.json "title": "Icon Outer") so the notice and the
 * inserter/list view use the same name. Each sentence uses its own
 * translation call, and the count uses _n() for the singular/plural split,
 * per this project's i18n rule of one sentence per translation call.
 *
 * Icon Outer の子アイコンへ貼り付けた場合の通知。サイズ・余白・角丸・形状は
 * 親（Icon Outer）ブロックの設定が使われる旨を伝える。ブロック名は Icon Outer
 * ブロック自身のタイトル（block.json の "title": "Icon Outer"）とそのまま
 * 一致させ、インサーターやリストビューの表記と揃える。1文につき1つの翻訳
 * 関数に収める本プロジェクトの i18n ルールに従い、文ごとに翻訳関数を分け、
 * 件数は _n() で単数・複数を書き分ける。
 *
 * @param {number}   narrowedCount               Number of Icon Outer child blocks pasted onto.
 * @param {Object}   notices
 * @param {Function} notices.createSuccessNotice notices store's createSuccessNotice.
 */
function notifyNarrowedPaste(narrowedCount, { createSuccessNotice }) {
	const colorAppliedSentence = sprintf(
		// translators: %d: Number of icons inside the Icon Outer block that received the pasted color.
		_n(
			'Pasted color to %d icon in the Icon Outer block.',
			'Pasted color to %d icons in the Icon Outer block.',
			narrowedCount,
			'vk-blocks-pro'
		),
		narrowedCount
	);
	const parentControlledSentence = __(
		'Size, margin, corner radius and style follow the Icon Outer block setting.',
		'vk-blocks'
	);

	createSuccessNotice(`${colorAppliedSentence} ${parentControlledSentence}`, {
		type: 'snackbar',
	});
}

/**
 * The Icon block's "Copy styles"/"Paste styles" configuration, exported for
 * this file's own unit tests (see test/unit/icon-copy-styles-config.test.js).
 * Not intended to be imported anywhere else — other code should look this
 * up via getCopyStylesConfig(ICON_BLOCK_NAME) instead.
 *
 * アイコンブロックの「スタイルをコピー/貼り付け」設定。本ファイル自身の単体テスト
 * （test/unit/icon-copy-styles-config.test.js）のために export している。他の
 * コードから直接 import する想定ではなく、getCopyStylesConfig(ICON_BLOCK_NAME)
 * で引くこと。
 *
 * @type {Object}
 */
export const iconCopyStylesConfig = {
	blockName: ICON_BLOCK_NAME,
	attributes: ICON_COPYABLE_ATTRIBUTE_DEFS,
	narrowAttributesForTarget,
	notifyNarrowedPaste,
};

registerCopyStylesConfig(iconCopyStylesConfig);
