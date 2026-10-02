/**
 * Registers the "Copy styles" / "Paste styles" BlockSettingsMenuControls
 * Fill (see index.js) exactly once for the whole editor, via
 * registerPlugin(), instead of every opted-in block instance mounting its
 * own copy of the Fill.
 *
 * This is a side-effect-only module: importing it (see
 * src/blocks/bundle.js) is what performs the registration. It lives in the
 * free bundle so that both free and Pro blocks can opt in by registering a
 * configuration (see config-registry.js) from their own module, regardless
 * of which bundle they ship in.
 *
 * BlockSettingsMenuControls is a Slot/Fill (@wordpress/components
 * createSlotFill), so where a Fill is mounted does not matter for which
 * block's context it applies to — the Slot always passes the same
 * selection-derived fillProps (canEdit, selectedBlocks, selectedClientIds)
 * regardless of how many Fills are mounted or from where (verified against
 * the block-editor package's block-settings-menu-controls/index.js). A
 * single, editor-wide Fill is therefore both correct and cheaper than one
 * per block instance.
 *
 * 「スタイルをコピー/貼り付け」の BlockSettingsMenuControls Fill（index.js 参照）を、
 * registerPlugin() でエディタ全体に対して1回だけ登録する。対応する各ブロックの
 * インスタンスがそれぞれ自分の Fill をマウントする必要はない。
 *
 * 本ファイルは副作用のみを持つモジュールで、import すること（src/blocks/bundle.js
 * 参照）自体が登録を実行する。無料版バンドルに置くことで、無料版・Pro版どちらの
 * ブロックも、自分がどちらのバンドルで配布されるかに関わらず、自分自身のモジュール
 * から設定（config-registry.js 参照）を登録するだけで利用できる。
 *
 * BlockSettingsMenuControls は Slot/Fill（@wordpress/components の
 * createSlotFill）のため、Fill をどこでマウントしてもどのブロックの文脈に
 * 適用されるかは変わらない — Slot 側は、Fill をいくつ・どこからマウントしても
 * 常に同じ、選択状態から導かれた fillProps（canEdit・selectedBlocks・
 * selectedClientIds）を渡す（@wordpress/block-editor の
 * block-settings-menu-controls/index.js で確認済み）。したがって、エディタ全体で
 * 1つだけの Fill は、ブロックの数だけマウントするより正しく、かつ軽量になる。
 */
import { registerPlugin } from '@wordpress/plugins';

import CopyPasteStylesMenuControls from './index';

registerPlugin('vk-blocks-copy-paste-styles', {
	render: CopyPasteStylesMenuControls,
});
