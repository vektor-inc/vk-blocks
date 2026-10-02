/**
 * "Copy styles" / "Paste styles" common component
 * (src/components/copy-paste-styles/) — unit tests for the generic,
 * kind-based value validators (attribute-validation.js) and the generic
 * attribute-extraction helpers (pick-attributes.js). These are block-
 * agnostic, so the tests below use made-up attribute keys/kinds rather than
 * any real block's own attributes (the Icon block's own configuration is
 * covered separately in test/unit/icon-copy-styles-config.test.js).
 *
 * 「スタイルをコピー/貼り付け」共通部品（src/components/copy-paste-styles/）—
 * 種類（kind）ごとの汎用バリデータ（attribute-validation.js）と、汎用の属性抽出
 * ヘルパー（pick-attributes.js）のテスト。これらはブロックに依存しないため、
 * 以下のテストでは実在のブロックの属性名ではなく仮の属性キー・kind を使う
 * （アイコンブロック自身の設定は test/unit/icon-copy-styles-config.test.js で
 * 別途カバーする）。
 */
import {
	isAllowedValue,
	isFiniteNumber,
	isValidColorValue,
	isValueValidForKind,
} from '../../src/components/copy-paste-styles/attribute-validation';
import {
	findSourceBlockByName,
	pickCopyableAttributes,
} from '../../src/components/copy-paste-styles/pick-attributes';

describe('isFiniteNumber', () => {
	test('有限数は true', () => {
		expect(isFiniteNumber(48)).toBe(true);
		expect(isFiniteNumber(0)).toBe(true);
	});

	test('文字列・NaN・Infinity・オブジェクトは false', () => {
		expect(isFiniteNumber('48')).toBe(false);
		expect(isFiniteNumber(NaN)).toBe(false);
		expect(isFiniteNumber(Infinity)).toBe(false);
		expect(isFiniteNumber({})).toBe(false);
		expect(isFiniteNumber(undefined)).toBe(false);
	});
});

describe('isAllowedValue', () => {
	test('許可リストに含まれる文字列は true', () => {
		expect(isAllowedValue('px', ['px', 'em'])).toBe(true);
	});

	test('許可リストに無い値・文字列以外は false', () => {
		expect(isAllowedValue('pt', ['px', 'em'])).toBe(false);
		expect(isAllowedValue(1, ['1', '2'])).toBe(false);
		expect(isAllowedValue('px')).toBe(false);
	});
});

describe('isValidColorValue', () => {
	test('hexカラーは true', () => {
		expect(isValidColorValue('#ff0000')).toBe(true);
	});

	test('カラーパレットのスラッグ（大文字・アンダースコア含む）は true', () => {
		expect(isValidColorValue('vk-primary-color')).toBe(true);
		expect(isValidColorValue('Theme_Primary_Color')).toBe(true);
	});

	test('allowInherit が true のときだけ inherit を許可する', () => {
		expect(isValidColorValue('inherit', { allowInherit: true })).toBe(true);
		expect(isValidColorValue('inherit', { allowInherit: false })).toBe(
			false
		);
		expect(isValidColorValue('inherit')).toBe(false);
	});

	test('hex・スラッグ・inherit のいずれでもない値、文字列以外は false', () => {
		expect(isValidColorValue('#12345')).toBe(false);
		expect(isValidColorValue('red;')).toBe(false);
		expect(isValidColorValue(123)).toBe(false);
	});
});

describe('isValueValidForKind', () => {
	test("kind 'number' は isFiniteNumber と同じ結果", () => {
		expect(isValueValidForKind('number', 48)).toBe(true);
		expect(isValueValidForKind('number', '48')).toBe(false);
	});

	test("kind 'choice' は kindOptions.allowedValues を見る", () => {
		expect(
			isValueValidForKind('choice', 'a', { allowedValues: ['a', 'b'] })
		).toBe(true);
		expect(
			isValueValidForKind('choice', 'c', { allowedValues: ['a', 'b'] })
		).toBe(false);
	});

	test("kind 'color' は isValidColorValue と同じ結果", () => {
		expect(
			isValueValidForKind('color', 'inherit', { allowInherit: true })
		).toBe(true);
		expect(isValueValidForKind('color', 'not-a-color;')).toBe(false);
	});

	test('未知の kind・未指定の kind は常に invalid（拒否する側に倒す）', () => {
		expect(isValueValidForKind('unknown-kind', 'anything')).toBe(false);
		expect(isValueValidForKind(undefined, 'anything')).toBe(false);
	});

	test("kind 'any' は常に valid（明示的に検証をしない場合のみ）", () => {
		expect(isValueValidForKind('any', 'anything')).toBe(true);
		expect(isValueValidForKind('any', undefined)).toBe(true);
	});
});

describe('pickCopyableAttributes', () => {
	const attributeDefs = [
		{ key: 'sampleNumber', kind: 'number' },
		{
			key: 'sampleChoice',
			kind: 'choice',
			kindOptions: { allowedValues: ['a', 'b'] },
		},
		{
			key: 'sampleColor',
			kind: 'color',
			kindOptions: { allowInherit: true },
			isLegacyUnset: (value) => value === 'undefined',
		},
	];

	test('定義された属性だけを抜き出す（対象外の属性は無視される）', () => {
		const result = pickCopyableAttributes(
			{
				sampleNumber: 10,
				sampleChoice: 'a',
				sampleColor: '#ff0000',
				notCopyable: 'ignored',
			},
			attributeDefs
		);

		expect(result).toEqual({
			sampleNumber: 10,
			sampleChoice: 'a',
			sampleColor: '#ff0000',
		});
	});

	test('許容されない値は undefined になる（キー自体は残る）', () => {
		const result = pickCopyableAttributes(
			{
				sampleNumber: 'not-a-number',
				sampleChoice: 'z',
				sampleColor: 'not-a-color;',
			},
			attributeDefs
		);

		expect(result).toHaveProperty('sampleNumber', undefined);
		expect(result).toHaveProperty('sampleChoice', undefined);
		expect(result).toHaveProperty('sampleColor', undefined);
	});

	test('isLegacyUnset に一致する値は検証前に未設定として扱う', () => {
		const result = pickCopyableAttributes(
			{ sampleColor: 'undefined' },
			attributeDefs
		);
		expect(result.sampleColor).toBeUndefined();
	});

	test('sourceAttributes を渡さない場合でも全キーを undefined で返す', () => {
		const result = pickCopyableAttributes(undefined, attributeDefs);
		attributeDefs.forEach((def) => {
			expect(result).toHaveProperty(def.key, undefined);
		});
	});

	test('attributeDefs が空配列なら空オブジェクトを返す', () => {
		expect(pickCopyableAttributes({ sampleNumber: 1 }, [])).toEqual({});
	});
});

describe('findSourceBlockByName', () => {
	test('blockName に一致するブロックが含まれる場合はそれを返す', () => {
		const targetBlock = { name: 'vk-blocks/sample', attributes: {} };
		const parsedBlocks = [
			{ name: 'core/paragraph', attributes: {} },
			targetBlock,
		];

		expect(findSourceBlockByName(parsedBlocks, 'vk-blocks/sample')).toBe(
			targetBlock
		);
	});

	test('blockName に一致するブロックが含まれない場合は undefined を返す', () => {
		const parsedBlocks = [
			{ name: 'core/heading', attributes: {} },
			{ name: 'core/paragraph', attributes: {} },
		];

		expect(
			findSourceBlockByName(parsedBlocks, 'vk-blocks/sample')
		).toBeUndefined();
	});

	test('空配列の場合は undefined を返す', () => {
		expect(findSourceBlockByName([], 'vk-blocks/sample')).toBeUndefined();
	});

	test('配列以外が渡された場合でもクラッシュせず undefined を返す', () => {
		expect(
			findSourceBlockByName(undefined, 'vk-blocks/sample')
		).toBeUndefined();
		expect(findSourceBlockByName(null, 'vk-blocks/sample')).toBeUndefined();
	});
});
