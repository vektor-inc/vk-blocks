/* eslint camelcase: 0 */
/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// 保存形式（deprecated の save 関数）と、追加 CSS を出すフックの対応表を検証する。
//
// 以前は 2 つの配列を添字で結んでいた。
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
//
// なお bc15e274c が足した 2 件は、既に対応表にある save 関数（save1_115_0 / save1_110_1）を
// 共有する deprecated だった。つまり Map 方式であれば、あの変更は対応表に何の影響も無く、
// 事故そのものが起きない。並び順に依存していたことだけが事故の原因だった。
// このテストが受け持つのはその先の穴で、次の 2 つを検出する。
//   - 新しい save 関数を持つ deprecated を足して、対応付けを書き忘れた
//   - deprecated を消したのに、対応表のエントリだけ残った
//
// Verifies the table that maps each saved markup format (a deprecation's `save` function) to
// the hook emitting its extra CSS.
//
// The two lists used to be joined by array position.
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
//
// Note that the two deprecations bc15e274c added share save functions the table already had
// (save1_115_0 / save1_110_1). Under the Map that change would not have touched the mapping at
// all and the incident simply could not have happened — the position dependency was the whole
// cause. What this test guards is the remaining gap:
//   - a deprecation with a brand-new save function is added and its mapping is forgotten
//   - a deprecation is removed but its mapping is left behind

import deprecatedHooks from '../../src/blocks/slider/deprecated/hooks';
import deprecated from '../../src/blocks/slider/deprecated/save';
import save1_124_0 from '../../src/blocks/slider/deprecated/save/1.124.0/save';
import save1_121_1 from '../../src/blocks/slider/deprecated/save/1.121.1/save';

// save 関数は import するだけで描画しないが、依存パッケージの読み込みを避けるためモックする
// The save functions are imported but never rendered here; mock their dependencies so the
// real packages are not pulled into the test environment.
jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));
jest.mock('@wordpress/block-editor', () => ({
	InnerBlocks: { Content: () => null },
	useBlockProps: { save: (props) => props },
}));

// deprecated に登場する save 関数の集合（同じ save を複数の deprecated が共有することがある）
// The set of save functions used by the deprecations (several deprecations can share one save)
const deprecatedSaves = new Set(deprecated.map((item) => item.save));

describe('slider deprecated hook mapping', () => {
	it('maps every deprecated save function to a hook / すべての deprecated の save に対応するフックがある', () => {
		// 対応付けが無い save の位置を集める。追加 CSS 側の書き忘れはここで落ちる。
		// Collect the deprecations whose save has no mapping — a forgotten hook fails here.
		const unmapped = deprecated
			.map((item, index) => ({ index, save: item.save }))
			.filter(({ save }) => !deprecatedHooks.has(save))
			.map(({ index }) => index);

		expect(unmapped).toEqual([]);
	});

	it('has no mapping for a save that is no longer deprecated / deprecated から消えた save の対応付けが残っていない', () => {
		// deprecated を削ったのに対応表だけ残っている状態を検出する
		// Detects a mapping left behind after its deprecation was removed
		const stale = Array.from(deprecatedHooks.keys()).filter(
			(save) => !deprecatedSaves.has(save)
		);

		expect(stale).toHaveLength(0);
	});

	it('covers exactly the distinct save functions / 対応表の件数が deprecated の save の種類数と一致する', () => {
		expect(deprecatedHooks.size).toBe(deprecatedSaves.size);
	});

	it('maps every save to a renderable component / すべての対応先がコンポーネントである', () => {
		// 値が undefined でも Map.has は true を返すため、値の型も確認する
		// Map.has is true even when the value is undefined, so check the value type as well
		const invalid = Array.from(deprecatedHooks.values()).filter(
			(hook) => typeof hook !== 'function'
		);

		expect(invalid).toHaveLength(0);
	});

	it('shares one hook between 1.124.0 and 1.121.1 / 1.124.0 と 1.121.1 は同じフックを共有する', () => {
		// 1.124.0 は保存マークアップのクラスだけが違い、zoom・height の追加 CSS は
		// 1.121.1 と完全に同一のためフックを共有している。#3069
		// 1.124.0 differs only in the classes of the saved markup; its zoom and height CSS is
		// identical to 1.121.1, so the two share a hook. #3069
		expect(deprecatedHooks.get(save1_124_0)).toBe(
			deprecatedHooks.get(save1_121_1)
		);
	});
});
