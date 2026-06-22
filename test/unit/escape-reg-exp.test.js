/* eslint-env jest */
import { escapeRegExp } from '../utils';

describe('escapeRegExp', () => {
	it('全メタ文字をエスケープし、リテラルとしてマッチする', () => {
		const literal = '.*+?^${}()|[]\\';
		const escaped = escapeRegExp(literal);
		// エスケープ後の文字列で組んだ正規表現は、元のリテラル文字列そのものにマッチする
		const re = new RegExp(`^${escaped}$`);
		expect(re.test(literal)).toBe(true);
		// メタ文字が演算子として作用していないこと（別の文字列にはマッチしない）
		expect(re.test('x')).toBe(false);
	});

	it('メタ文字を含まない文字列はそのまま扱える', () => {
		const plain = 'vk-blocks_123';
		expect(escapeRegExp(plain)).toBe(plain);
		expect(new RegExp(`^${escapeRegExp(plain)}$`).test(plain)).toBe(true);
	});

	it('空文字を扱える', () => {
		expect(escapeRegExp('')).toBe('');
		expect(new RegExp(`^${escapeRegExp('')}$`).test('')).toBe(true);
	});

	it('バックスラッシュをエスケープする', () => {
		const input = 'a\\b';
		const escaped = escapeRegExp(input);
		expect(escaped).toBe('a\\\\b');
		expect(new RegExp(`^${escaped}$`).test(input)).toBe(true);
	});

	it('Unicode 文字列はメタ文字のみエスケープしてリテラルにマッチする', () => {
		const input = 'こんにちは.世界(テスト)';
		const escaped = escapeRegExp(input);
		expect(new RegExp(`^${escaped}$`).test(input)).toBe(true);
		// '.' や '(' がメタ文字として作用していないこと
		expect(new RegExp(`^${escaped}$`).test('こんにちはX世界テスト')).toBe(
			false
		);
	});
});
