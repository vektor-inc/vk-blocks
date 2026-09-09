/* eslint camelcase: 0 */
// 保存形式（deprecated の save 関数）と、その保存形式向けの追加 CSS を出すフックの対応表。
//
// 以前はフックを配列で持ち、`deprecated/save/index.js` の配列と並び順が一致していることを
// 暗黙の前提にして添字で結んでいた。
// 片方にだけ要素を足すと以降が 1 つずつずれ、壊れ方は当たった世代によって 2 通りに分かれる。#3083
//   - ズレた先に別のフックが存在する世代: 例外は出ず、古い保存形式に別世代の CSS が静かに当たる
//   - ズレて hooks 配列の範囲を超える末尾側の世代: 添字が `undefined` になり、
//     React が `Element type is invalid` で例外を投げる（フロントがクラッシュする）
// これは机上の話ではなく、実際に一度作り込まれている。コミット bc15e274c（zoomFinalScal typo の
// 後方互換）が `deprecated/save/index.js` にだけ 2 件足して hooks 側を触らなかったため、
// deprecated 16 件に対し hooks 14 件のズレが約 2 か月間ブランチ上に残っていた
// （2026-01-21 〜 0201716d1 での修正まで）。この状態のままリリースされていれば、下位の世代には
// 別のフックが当たり、最下位の save1_2_1 / save1_0_16 は範囲外アクセスでクラッシュしていた。
// develop へのマージ（e05fd09ad）の前に気付けたので出荷はされていない。
// save 関数そのものをキーにすることで、並び順への依存を無くしている。
//
// キーは各 save モジュールの default export の参照。`deprecated/save/index.js` も同じモジュールを
// import しており、ES モジュールは解決後のパスごとに単一インスタンスなので、
// `blocks.getSaveElement` に渡ってくる `type.save` と同一参照で一致する。
//
// Maps each saved markup format (a deprecation's `save` function) to the hook that emits
// the extra CSS for that format.
//
// The hooks used to be an array joined to `deprecated/save/index.js` by position, which
// silently assumed both arrays stayed in the same order.
// Adding an entry to only one of them shifted everything after it, and it broke in one of two
// ways depending on which generation the visitor's content matched. #3083
//   - A generation whose shifted index still lands on a hook: no exception — the old format
//     quietly gets another generation's CSS.
//   - A generation at the tail, shifted past the end of the hooks array: `undefined` is
//     rendered as a component and React throws `Element type is invalid`, crashing the
//     front end.
// This is not hypothetical — it was actually built once. Commit bc15e274c (the zoomFinalScal
// typo fallbacks) added two entries to `deprecated/save/index.js` without touching the hooks,
// leaving 16 deprecations against 14 hooks for about two months on the branch (2026-01-21 until
// the fix in 0201716d1). Had it been released that way, older generations would have got the
// wrong hook and the last two (save1_2_1 / save1_0_16) would have crashed on the out-of-range
// access. It was caught before the merge into develop (e05fd09ad), so it never shipped.
// Keying on the `save` function itself removes that dependency.
//
// The keys are the save modules' default exports. `deprecated/save/index.js` imports the very
// same modules, and ES modules are single instances per resolved path, so these are
// reference-equal to the `type.save` handed to `blocks.getSaveElement`.
import save1_126_4 from '../save/1.126.4/save';
import save1_124_0 from '../save/1.124.0/save';
import save1_121_1 from '../save/1.121.1/save';
import save1_115_0 from '../save/1.115.0/save';
import save1_110_1 from '../save/1.110.1/save';
import save1_105_0 from '../save/1.105.0/save';
import save1_80_1 from '../save/1.80.1/save';
import save1_51_0 from '../save/1.51.0/save';
import save1_48_1 from '../save/1.48.1/save';
import save1_34_1 from '../save/1.34.1/save';
import save1_13_1 from '../save/1.13.1/save';
import save1_10_0 from '../save/1.10.0/save';
import save1_9_2 from '../save/1.9.2/save';
import save1_9_1 from '../save/1.9.1/save';
import save1_2_1 from '../save/1.2.1/save';
import save1_0_16 from '../save/1.0.16/save';

import SliderHook1_126_4 from './1.126.4';
import SliderHook1_121_1 from './1.121.1';
import SliderHook1_115_0 from './1.115.0';
import SliderHook1_104_0 from './1.104.0';
import SliderHook1_48_1 from './1.48.1';
import SliderHook1_34_1 from './1.34.1';
import SliderHook1_13_1 from './1.13.1';
import SliderHook1_10_0 from './1.10.0';
import SliderHook1_9_2 from './1.9.2';
import SliderHook1_9_1 from './1.9.1';
import SliderHook1_2_1 from './1.2.1';
import SliderHook1_0_16 from './1.0.16';

// 1 つのフックが複数の保存形式に対応することがある。save 側でマークアップや属性スキーマだけが
// 変わり、追加 CSS の出力は変わらなかった世代では、同じフックを使い回すのが正しい対応付けになる。
// One hook can serve several saved formats: when a release changed only the saved markup or
// the attribute schema and not the extra CSS, reusing the same hook is the correct mapping.
const deprecatedHooks = new Map([
	// 1.125.0〜1.126.4（停止/再生ボタンに翻訳文を焼き付けていた頃）。
	// 高さ・ズームの追加 CSS は現行 index.js の出力と同一だが、現行から import すると
	// index.js 側を変更した時に一緒に変わってしまうため、専用フックとして固定してある。#3071
	// 1.125.0 through 1.126.4 (the pause / play button still carried baked-in labels). Its
	// height and zoom CSS is identical to what index.js emits today, but it is kept as its own
	// frozen hook so that changing index.js later cannot change it too. #3071
	[save1_126_4, SliderHook1_126_4],
	// 1.124.0（ルート要素に旧クラス swiper-container を併記していた頃）。
	// zoom・height のインライン CSS 出力は 1.121.1 と完全に同一のためフックを共有する。#3069
	// 1.124.0 (the root element still carried the legacy swiper-container class). Its inline
	// zoom and height CSS is identical to 1.121.1, so the same hook is shared. #3069
	[save1_124_0, SliderHook1_121_1],
	// 1.121.1（pauseButton 追加前 / zoom CSS は var(--vk-slider-item-bg-image) 形式）
	// 1.121.1 (before pauseButton was added; zoom CSS uses var(--vk-slider-item-bg-image))
	[save1_121_1, SliderHook1_121_1],
	// 1.115.0（zoomFinalScal typo の後方互換もこの save を共有する）
	// 1.115.0 (the zoomFinalScal typo deprecation shares this save as well)
	[save1_115_0, SliderHook1_115_0],
	// 1.110.1（direction 属性の有無・zoomFinalScal typo の各 deprecated がこの save を共有する）
	// 1.110.1 (the deprecations with/without the direction attribute and the zoomFinalScal
	// typo all share this save)
	[save1_110_1, SliderHook1_104_0],
	// 1.105.0
	[save1_105_0, SliderHook1_48_1],
	// 1.80.1
	[save1_80_1, SliderHook1_48_1],
	// 1.51.0
	[save1_51_0, SliderHook1_48_1],
	// 1.48.1
	[save1_48_1, SliderHook1_48_1],
	// 1.34.1
	[save1_34_1, SliderHook1_34_1],
	// 1.13.1
	[save1_13_1, SliderHook1_13_1],
	// 1.10.0
	[save1_10_0, SliderHook1_10_0],
	// 1.9.2
	[save1_9_2, SliderHook1_9_2],
	// 1.9.1
	[save1_9_1, SliderHook1_9_1],
	// 1.2.1
	[save1_2_1, SliderHook1_2_1],
	// 1.0.16
	[save1_0_16, SliderHook1_0_16],
]);

export default deprecatedHooks;
