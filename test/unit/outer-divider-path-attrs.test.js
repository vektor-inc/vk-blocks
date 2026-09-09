/**
 * Outer divider path / mask-height attrs helper.
 */
import {
	getDividerPathAttrs,
	dividerPathAttrsEqual,
} from '../../src/blocks/_pro/outer/utils/divider-path-attrs';

describe('getDividerPathAttrs', () => {
	test('端末別 OFF では base のみ埋め、tablet/pc は空 / 0', () => {
		const attrs = getDividerPathAttrs({
			dividerType: 'tilt',
			levelSettingPerDevice: false,
			upper_level: 50,
			upper_level_mobile: 10,
			upper_level_tablet: 20,
			upper_level_pc: 30,
			lower_level: -40,
			lower_level_mobile: 0,
			lower_level_tablet: 0,
			lower_level_pc: 0,
		});
		expect(attrs.upperDividerPathD).toBe('m0,50 L100,100 L0,100 z');
		expect(attrs.lowerDividerPathD).toBe('m100,60 L0,100 L100,100 z');
		expect(attrs.upperDividerPathDTablet).toBe('');
		expect(attrs.upperDividerPathDPc).toBe('');
		expect(attrs.lowerDividerPathDTablet).toBe('');
		expect(attrs.lowerDividerPathDPc).toBe('');
		expect(attrs.upperDividerMaskH).toBe(50);
		expect(attrs.lowerDividerMaskH).toBe(40);
		expect(attrs.upperDividerMaskHTablet).toBe(0);
		expect(attrs.upperDividerMaskHPc).toBe(0);
		expect(attrs.lowerDividerMaskHTablet).toBe(0);
		expect(attrs.lowerDividerMaskHPc).toBe(0);
	});

	test('端末別 ON では mobile/tablet/pc それぞれの d / 高さを埋める', () => {
		const attrs = getDividerPathAttrs({
			dividerType: 'wave',
			levelSettingPerDevice: true,
			upper_level: 0,
			upper_level_mobile: 50,
			upper_level_tablet: 0,
			upper_level_pc: 40,
			lower_level: 0,
			lower_level_mobile: 0,
			lower_level_tablet: 30,
			lower_level_pc: 0,
		});
		expect(attrs.upperDividerPathD).toBe(
			'm0,75 q20,50,40,0 t40,0 t40,0 V100 L0,100 z'
		);
		expect(attrs.upperDividerPathDTablet).toBe('');
		expect(attrs.upperDividerPathDPc).toBe(
			'm0,80 q20,40,40,0 t40,0 t40,0 V100 L0,100 z'
		);
		expect(attrs.lowerDividerPathD).toBe('');
		expect(attrs.lowerDividerPathDTablet).toBe(
			'm0,85 q20,30,40,0 t40,0 t40,0 V100 L0,100 z'
		);
		expect(attrs.lowerDividerPathDPc).toBe('');
		expect(attrs.upperDividerMaskH).toBe(50);
		expect(attrs.upperDividerMaskHTablet).toBe(0);
		expect(attrs.upperDividerMaskHPc).toBe(40);
		expect(attrs.lowerDividerMaskH).toBe(0);
		expect(attrs.lowerDividerMaskHTablet).toBe(30);
		expect(attrs.lowerDividerMaskHPc).toBe(0);
	});

	test('curve の負 level は帯高さが abs*2', () => {
		const attrs = getDividerPathAttrs({
			dividerType: 'curve',
			levelSettingPerDevice: false,
			upper_level: -50,
			upper_level_mobile: 0,
			upper_level_tablet: 0,
			upper_level_pc: 0,
			lower_level: 0,
			lower_level_mobile: 0,
			lower_level_tablet: 0,
			lower_level_pc: 0,
		});
		expect(attrs.upperDividerMaskH).toBe(100);
	});

	test('level=0 のときは serrated でも path を空にし高さは 0（toHeight とゲート一致）', () => {
		const attrs = getDividerPathAttrs({
			dividerType: 'serrated',
			levelSettingPerDevice: false,
			upper_level: 0,
			upper_level_mobile: 0,
			upper_level_tablet: 0,
			upper_level_pc: 0,
			lower_level: 0,
			lower_level_mobile: 0,
			lower_level_tablet: 0,
			lower_level_pc: 0,
		});
		expect(attrs.upperDividerPathD).toBe('');
		expect(attrs.lowerDividerPathD).toBe('');
		expect(attrs.upperDividerMaskH).toBe(0);
		expect(attrs.lowerDividerMaskH).toBe(0);
	});

	test('dividerPathAttrsEqual は全キー一致で true', () => {
		const a = getDividerPathAttrs({
			dividerType: 'tilt',
			levelSettingPerDevice: false,
			upper_level: 50,
			upper_level_mobile: 0,
			upper_level_tablet: 0,
			upper_level_pc: 0,
			lower_level: 0,
			lower_level_mobile: 0,
			lower_level_tablet: 0,
			lower_level_pc: 0,
		});
		expect(dividerPathAttrsEqual(a, { ...a })).toBe(true);
		expect(
			dividerPathAttrsEqual(a, { ...a, upperDividerPathD: 'x' })
		).toBe(false);
		expect(dividerPathAttrsEqual(a, { ...a, upperDividerMaskH: 1 })).toBe(
			false
		);
	});
});
