/**
 * Outer deprecated: save 配列と hooks 配列の本数一致を固定する。
 * ズレると getSaveElement フックが off-by-one で別時代のフックに当たり、
 * 「ブロックを回復」回帰の原因になる（#3023 / drill-lanser 報告）。
 */
import deprecated from '../../src/blocks/_pro/outer/deprecated/save';
import hooks from '../../src/blocks/_pro/outer/deprecated/hooks';

describe('Outer deprecated hooks length', () => {
	test('hooks 本数は deprecated save 本数と一致する', () => {
		// deprecated 配列そのものを読む（save 関数の命名規則に依存しない）。
		expect(deprecated.length).toBeGreaterThan(0);
		expect(hooks.length).toBe(deprecated.length);
	});
});
