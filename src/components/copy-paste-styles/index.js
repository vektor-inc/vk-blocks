/**
 * "Copy styles" / "Paste styles" menu items, added to the block settings
 * menu (⋮) via BlockSettingsMenuControls, the same slot core uses for its
 * own Copy styles / Paste styles items. Originally built for the Icon block
 * (vk-blocks/icon, issue #3205) and generalized here so any block can opt
 * in by registering a configuration (see config-registry.js) from its own
 * module — this component itself contains no block-specific names,
 * constants or wording; those live in each block's own configuration (e.g.
 * src/blocks/icon/copy-styles-config.js).
 *
 * Some blocks already have core's own Copy styles / Paste styles (any block
 * with `supports.color` or `supports.typography`), so this component never
 * renders its items for a selection where core's own items would appear
 * (see coreCopyStylesWouldShow in CopyPasteStylesMenuControls below),
 * avoiding duplicate menu entries.
 *
 * アイコンブロック用に作られた「スタイルをコピー」「スタイルを貼り付け」メニュー
 * 項目（issue #3205）を、コアの同名メニューと同じ BlockSettingsMenuControls
 * スロットへ追加する。他のブロックも設定（config-registry.js 参照）を自分の
 * モジュールから登録するだけで使い回せるよう一般化しており、本コンポーネント自身は
 * ブロック固有の名前・定数・文言を持たない（それらは各ブロック自身の設定、例:
 * src/blocks/icon/copy-styles-config.js に置く）。
 *
 * supports.color または supports.typography を持つブロックは、既にコア自身の
 * 「スタイルをコピー/貼り付け」が表示されるため、そのようなブロックの選択では
 * 本コンポーネントは自分の項目を出さない（下記 coreCopyStylesWouldShow 参照）。
 * これにより重複表示を防ぐ。
 */
import { __, sprintf } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	getBlockType,
	hasBlockSupport,
	parse,
	serialize,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

import { getCopyStylesConfig } from './config-registry';
import {
	findSourceBlockByName,
	pickCopyableAttributes,
} from './pick-attributes';

/**
 * "Copy styles" menu item. Writes the selected block(s), serialized in
 * their saved HTML form (same approach core uses), to the clipboard, then
 * shows the same success notice core's own Copy styles uses.
 *
 * 「スタイルをコピー」メニュー項目。選択中のブロックを保存形式の HTML
 * （コアと同じ serialize()）にしてクリップボードへ書き込み、コアの「スタイルを
 * コピー」と同じ成功通知を表示する。
 *
 * @param {Object}   props
 * @param {string[]} props.clientIds Selected block client IDs.
 * @param {Function} props.onClose   Closes the block settings menu.
 * @return {JSX.Element} MenuItem element.
 */
function CopyStylesMenuItem({ clientIds, onClose }) {
	const { getBlocksByClientId } = useSelect(blockEditorStore);
	const { createSuccessNotice } = useDispatch(noticesStore);
	const ref = useCopyToClipboard(
		() => serialize(getBlocksByClientId(clientIds)),
		() => {
			// Same wording as core's useNotifyCopy() for the "copyStyles"
			// event (untranslated domain so the core translation is reused).
			// コア（useNotifyCopy）の copyStyles イベントと同じ文言
			// （テキストドメイン無しでコアの翻訳を流用）。
			createSuccessNotice(__('Styles copied to clipboard.'), {
				type: 'snackbar',
			});
			onClose();
		}
	);

	return (
		<MenuItem ref={ref}>
			{
				// Reuse core's own English string so its existing
				// translations are reused as-is (repo convention, see
				// e.g. the Reset button in src/blocks/icon/edit.js).
				// コアと同じ原文を使い、コアの翻訳を流用する（本リポジトリの慣習。
				// 例: src/blocks/icon/edit.js の Reset ボタン）。
				__('Copy styles')
			}
		</MenuItem>
	);
}

/**
 * "Paste styles" menu item. Reads the clipboard, looks for a copied block
 * matching config.blockName, and applies its style attributes (as declared
 * by config.attributes) to every currently selected block of that same
 * type, in a single undo step.
 *
 * 「スタイルを貼り付け」メニュー項目。クリップボードを読み、config.blockName に
 * 一致するコピー済みブロックを探して、選択中の同じ種類のブロックすべてへ
 * config.attributes が宣言するスタイル属性を反映する（1回の元に戻すでまとめて
 * 戻せるようにする）。
 *
 * @param {Object}   props
 * @param {string[]} props.clientIds Selected block client IDs.
 * @param {Function} props.onClose   Closes the block settings menu.
 * @param {Object}   props.config    Registered configuration for the selected blocks' name (see config-registry.js).
 * @return {JSX.Element} MenuItem element.
 */
function PasteStylesMenuItem({ clientIds, onClose, config }) {
	const registry = useRegistry();
	const {
		getBlocksByClientId,
		getBlockRootClientId,
		getBlockName,
		getBlockEditingMode,
		canEditBlock,
	} = useSelect(blockEditorStore);
	const { updateBlockAttributes } = useDispatch(blockEditorStore);
	const { createSuccessNotice, createWarningNotice, createErrorNotice } =
		useDispatch(noticesStore);

	async function handlePasteStyles() {
		if (!window.navigator?.clipboard) {
			createErrorNotice(
				// Same wording as core's use-paste-styles (untranslated
				// domain so the core translation is reused).
				// コア（use-paste-styles）と同じ文言（テキストドメイン無しでコアの翻訳を流用）。
				__(
					'Unable to paste styles. This feature is only available on secure (https) sites in supporting browsers.'
				),
				{ type: 'snackbar' }
			);
			onClose();
			return;
		}

		let html = '';
		try {
			html = await window.navigator.clipboard.readText();
		} catch {
			createErrorNotice(
				__(
					'Unable to paste styles. Please allow browser clipboard permissions before continuing.'
				),
				{ type: 'snackbar' }
			);
			onClose();
			return;
		}

		let parsedBlocks = [];
		try {
			parsedBlocks = html
				? parse(html, { __unstableSkipMigrationLogs: true })
				: [];
		} catch {
			parsedBlocks = [];
		}

		const sourceBlock = findSourceBlockByName(
			parsedBlocks,
			config.blockName
		);
		if (!sourceBlock) {
			createWarningNotice(
				__(
					"Unable to paste styles. Block styles couldn't be found within the copied content."
				),
				{ type: 'snackbar' }
			);
			onClose();
			return;
		}

		// Only apply to blocks that are still individually editable: default
		// editing mode (not contentOnly/disabled, e.g. inside a locked
		// pattern) and canEditBlock() (e.g. not restricted by the current
		// user's role/template lock).
		//
		// 個別に編集可能なブロックだけに絞る: 編集モードが既定（contentOnly・
		// disabled 等ではない。ロックされたパターン内など）で、かつ
		// canEditBlock()（ロール・テンプレートロック等で制限されていない）
		// を満たすブロックのみ対象にする。
		const targetBlocks = getBlocksByClientId(clientIds)
			.filter(Boolean)
			.filter(
				(block) => getBlockEditingMode(block.clientId) === 'default'
			)
			.filter((block) => canEditBlock(block.clientId));

		// All selected blocks were filtered out above (e.g. locked inside a
		// pattern, or restricted by the current user's role/template lock).
		// Without this, nothing else in this function runs and the menu just
		// closes, leaving the user unsure whether the paste worked.
		//
		// 上のフィルタで選択中のブロックが全て除外された場合（例: ロックされた
		// パターン内、ロール・テンプレートロックによる制限）。これを出さないと
		// この後の処理が何も走らずメニューが閉じるだけになり、貼り付けが効いたのか
		// 利用者にわからなくなる。
		if (targetBlocks.length === 0) {
			// Each sentence uses its own translation call, per this
			// project's i18n rule of one sentence per translation call
			// (see the block's own notifyNarrowedPaste for the same pattern).
			//
			// 1文につき1つの翻訳関数に収める本プロジェクトの i18n ルールに従い、
			// 文ごとに翻訳関数を分ける（ブロック側の notifyNarrowedPaste と同じ方針）。
			const unableSentence = __('Unable to paste styles.', 'vk-blocks');
			const lockedSentence = sprintf(
				// translators: %s: Name of the block that couldn't be pasted onto, e.g. "Icon".
				__(
					'No %s blocks could be updated because they are locked or not editable.',
					'vk-blocks'
				),
				getBlockType(config.blockName)?.title
			);
			createWarningNotice(`${unableSentence} ${lockedSentence}`, {
				type: 'snackbar',
			});
			onClose();
			return;
		}

		const sourceAttributes = pickCopyableAttributes(
			sourceBlock.attributes,
			config.attributes
		);

		// A block's configuration may narrow down what is actually applied
		// depending on the paste target (e.g. the Icon block only applies
		// color to a child icon inside Icon Outer). This is entirely
		// optional and block-specific: this common component only needs to
		// know how many targets were narrowed, so it can report that count
		// separately, and to call the block's own extra notice function.
		//
		// ブロックの設定は、貼り付け先によって実際に反映する内容を絞り込める
		// （例: アイコンブロックは Icon Outer の子アイコンには色だけ反映する）。
		// これは任意かつブロック固有の処理で、共通部品側は「何件絞り込まれたか」
		// だけを知り、絞り込まれた件数をまとめて報告し、ブロック側の追加通知関数を
		// 呼び出せればよい。
		let narrowedCount = 0;
		registry.batch(() => {
			targetBlocks.forEach((block) => {
				let attributesToApply = sourceAttributes;

				if (typeof config.narrowAttributesForTarget === 'function') {
					const narrowedResult = config.narrowAttributesForTarget(
						sourceAttributes,
						block,
						{ getBlockRootClientId, getBlockName }
					);
					if (narrowedResult?.narrowed) {
						narrowedCount += 1;
						attributesToApply = narrowedResult.attributes;
					}
				}

				updateBlockAttributes(block.clientId, attributesToApply);
			});
		});

		// The "Pasted styles to ..." count only covers blocks that received
		// the full style (not narrowed down), so it matches what actually
		// changed on each block. Narrowed targets are reported separately by
		// the block's own notifyNarrowedPaste(), since they only received a
		// subset of the copied styles.
		//
		// 「Pasted styles to ...」の件数は、絞り込まれずスタイル全体を反映した
		// ブロックだけを数える（実際に変わった内容と件数を一致させるため）。
		// 絞り込まれた貼り付け先は、ブロック自身の notifyNarrowedPaste() で
		// 別に通知する（反映したのはコピー内容の一部のため）。
		const fullyStyledCount = targetBlocks.length - narrowedCount;

		if (fullyStyledCount === 1) {
			createSuccessNotice(
				sprintf(
					// translators: %s: Name of the block being pasted, e.g. "Icon".
					__('Pasted styles to %s.'),
					getBlockType(config.blockName)?.title
				),
				{ type: 'snackbar' }
			);
		} else if (fullyStyledCount > 1) {
			createSuccessNotice(
				sprintf(
					// translators: %d: The number of the blocks.
					__('Pasted styles to %d blocks.'),
					fullyStyledCount
				),
				{ type: 'snackbar' }
			);
		}

		if (
			narrowedCount > 0 &&
			typeof config.notifyNarrowedPaste === 'function'
		) {
			config.notifyNarrowedPaste(narrowedCount, {
				createSuccessNotice,
			});
		}

		onClose();
	}

	return (
		<MenuItem onClick={handlePasteStyles}>{__('Paste styles')}</MenuItem>
	);
}

/**
 * Renders the "Copy styles" / "Paste styles" menu items once BlockSettingsMenuControls
 * has already decided the selection is eligible (same name, config registered,
 * core's own items not shown). Kept as its own component (rather than inlined
 * in the render prop below) so useSelect() below runs as a normal hook call
 * inside a component's render, not inside an arbitrary callback.
 *
 * This is a defense-in-depth re-check of edit permission, independent of the
 * canEdit the render prop below already received: canEdit reflects only the
 * first selected block (see BlockSettingsMenuControls.Slot / core's
 * block-settings-dropdown.js), so with multiple blocks selected it would miss
 * a later block that is contentOnly/disabled or otherwise not editable. Core
 * currently avoids that gap by simply not rendering the Slot for a multi
 * selection containing such a block, so this re-check has no visible effect
 * today; it exists so this component does not silently rely on that
 * core behavior continuing unchanged.
 *
 * 選択がすでに条件を満たしている（同じ名前・設定登録済み・コア自身の項目は
 * 非表示）と BlockSettingsMenuControls 側で判定できた後に、「スタイルをコピー/
 * 貼り付け」のメニュー項目を描画する。以下の useSelect() を、任意のコールバックの
 * 中ではなく、コンポーネントのレンダー内での通常の hook 呼び出しとして実行する
 * ため、下の render prop に直接書かずこのコンポーネントに分けている。
 *
 * これは、render prop 側で既に受け取っている canEdit とは別の、多重防御としての
 * 編集権限の再チェック。canEdit は選択中の先頭ブロックだけを反映する
 * （BlockSettingsMenuControls.Slot・コアの block-settings-dropdown.js 参照）ため、
 * 複数選択時に2番目以降のブロックが contentOnly/disabled 等で編集不可でも
 * canEdit には現れない。現状のコアは、そのようなブロックを含む複数選択では
 * Slot 自体を出さないため、この再チェックは現時点では見え方に影響しないが、
 * コアのその挙動が今後も変わらないことに暗黙に依存しないためのもの。
 *
 * @param {Object}   props
 * @param {string[]} props.clientIds Selected block client IDs.
 * @param {Function} props.onClose   Closes the block settings menu.
 * @param {Object}   props.config    Registered configuration for the selected blocks' name (see config-registry.js).
 * @return {JSX.Element|null} Menu items, or null when not every selected block is individually editable.
 */
function EditableCopyPasteStylesMenuItems({ clientIds, onClose, config }) {
	const allSelectedAreEditable = useSelect(
		(select) => {
			const { getBlockEditingMode, canEditBlock } =
				select(blockEditorStore);
			return (
				clientIds?.length > 0 &&
				clientIds.every(
					(clientId) =>
						getBlockEditingMode(clientId) === 'default' &&
						canEditBlock(clientId)
				)
			);
		},
		[clientIds]
	);

	if (!allSelectedAreEditable) {
		return null;
	}

	// BlockSettingsMenuControls.Slot already wraps every fill in its own
	// <MenuGroup>, so wrapping these items in another MenuGroup would nest
	// the groups and indent them by the inner group's padding.
	// BlockSettingsMenuControls.Slot は fill を既に <MenuGroup> で包んで描画する
	// ため、ここでさらに MenuGroup で包むと入れ子になり、内側のグループの
	// padding 分だけ項目がインデントされてしまう。
	return (
		<>
			<CopyStylesMenuItem clientIds={clientIds} onClose={onClose} />
			<PasteStylesMenuItem
				clientIds={clientIds}
				onClose={onClose}
				config={config}
			/>
		</>
	);
}

/**
 * Renders the currently selected blocks' "Copy styles" / "Paste styles"
 * menu items inside BlockSettingsMenuControls. Mounted exactly once for the
 * whole editor (see register-plugin.js), instead of once per block
 * instance, so no de-duplication against the current block instance's own
 * clientId is needed here (compare: the equivalent per-instance component
 * this replaced needed a selectedClientIds[0] === clientId check to avoid
 * rendering its items once per icon on the page).
 *
 * It only renders its items when:
 *  - the current user can edit the selection (canEdit, the same gate core's
 *    own Copy styles / Paste styles items use — see the block-editor
 *    package's BlockSettingsMenuControls.Slot / core's
 *    block-settings-dropdown.js), and
 *  - every selected block has the same name, and a "Copy styles"/"Paste
 *    styles" configuration is registered for that name (allowedConfig), and
 *  - core's own Copy styles / Paste styles are not shown for the selection
 *    (i.e. none of the selected blocks has supports.color or
 *    supports.typography), to avoid duplicate items, and
 *  - (re-checked by EditableCopyPasteStylesMenuItems above) every selected
 *    block is individually editable.
 *
 * 現在選択中のブロックの「スタイルをコピー/貼り付け」メニュー項目を
 * BlockSettingsMenuControls 内に表示する。エディタ全体でちょうど1回だけ
 * マウントされる（register-plugin.js 参照）ため、ブロックの数だけマウントされて
 * いた以前の実装（アイコンの各インスタンスの edit.js からマウント）とは異なり、
 * 自分自身の clientId との重複防止は不要になった。
 *
 * 次のときだけ項目を描画する:
 *  - 現在のユーザーが選択を編集できる（canEdit。コア自身の「スタイルをコピー/
 *    貼り付け」と同じ判定基準。@wordpress/block-editor の
 *    BlockSettingsMenuControls.Slot・コアの block-settings-dropdown.js を確認済み）
 *  - 選択中のブロックがすべて同じ名前で、その名前に対する「スタイルをコピー/
 *    貼り付け」設定が登録されている（allowedConfig）
 *  - 選択中のブロックについてコア自身の「スタイルをコピー/貼り付け」が表示され
 *    ない（＝いずれの選択ブロックも supports.color / supports.typography を
 *    持たない）とき（重複表示を防ぐ）
 *  - （上記 EditableCopyPasteStylesMenuItems で再チェック）選択中のブロックが
 *    すべて個別に編集可能であるとき
 *
 * @return {JSX.Element} BlockSettingsMenuControls Fill.
 */
export default function CopyPasteStylesMenuControls() {
	return (
		<BlockSettingsMenuControls>
			{({ onClose, canEdit, selectedBlocks, selectedClientIds }) => {
				const allSelectedShareOneName =
					selectedBlocks?.length > 0 &&
					selectedBlocks.every((name) => name === selectedBlocks[0]);
				const allowedConfig = allSelectedShareOneName
					? getCopyStylesConfig(selectedBlocks[0])
					: undefined;
				const coreCopyStylesWouldShow = selectedBlocks?.some(
					(name) =>
						hasBlockSupport(name, 'color') ||
						hasBlockSupport(name, 'typography')
				);

				if (!canEdit || !allowedConfig || coreCopyStylesWouldShow) {
					return null;
				}

				return (
					<EditableCopyPasteStylesMenuItems
						clientIds={selectedClientIds}
						onClose={onClose}
						config={allowedConfig}
					/>
				);
			}}
		</BlockSettingsMenuControls>
	);
}
