/* eslint-env jest */
import { getCssLength } from '@vkblocks/blocks/visual-embed/utils/get-css-length';

describe('visual-embed: getCssLength', () => {
	test('純数値文字列は px を補完する', () => {
		expect(getCssLength('560')).toBe('560px');
	});

	test('px 付き文字列はそのまま返す', () => {
		expect(getCssLength('560px')).toBe('560px');
	});

	test('% 付き文字列はそのまま返す', () => {
		expect(getCssLength('100%')).toBe('100%');
	});

	test('rem などの単位付き文字列はそのまま返す', () => {
		expect(getCssLength('1.5rem')).toBe('1.5rem');
	});

	test('空文字列は undefined を返す', () => {
		expect(getCssLength('')).toBeUndefined();
	});

	test('null は undefined を返す', () => {
		expect(getCssLength(null)).toBeUndefined();
	});

	test('undefined は undefined を返す', () => {
		expect(getCssLength(undefined)).toBeUndefined();
	});

	test('数値 0 は 0px として扱う（CSS として有効な値）', () => {
		expect(getCssLength(0)).toBe('0px');
	});

	test('文字列 "0" も 0px として扱う', () => {
		expect(getCssLength('0')).toBe('0px');
	});

	test('数値型は String() 経由で px が補完される', () => {
		expect(getCssLength(100)).toBe('100px');
	});

	test('小数点を含む文字列は純数値正規表現にマッチせず素通しされる（現状仕様）', () => {
		expect(getCssLength('560.5')).toBe('560.5');
	});
});
