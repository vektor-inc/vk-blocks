/* eslint-env jest */
/**
 * Outer ブロックの divider-path 純関数のテスト。
 *
 * 既存の component-divider.js から切り出した純関数 getDividerPathD が、
 * リファクタ前と完全に同じ d 文字列を生成することを検証する。
 *
 * 期待値は origin/master の component-divider.js に書かれていた
 * テンプレートリテラルを忠実にコピーした「ゴールデン値」。
 */
import { getDividerPathD } from '../../src/blocks/_pro/outer/utils/divider-path';

describe('getDividerPathD - tilt', () => {
	test('level > 0', () => {
		const level = 30;
		expect(getDividerPathD(level, 'tilt')).toBe(
			`m0,${100 - level} L100,100 L0,100 z`
		);
	});

	test('level < 0', () => {
		const level = -30;
		const absLevel = Math.abs(level);
		expect(getDividerPathD(level, 'tilt')).toBe(
			`m100,${100 - absLevel} L0,100 L100,100 z`
		);
	});

	test('level === 0 returns null', () => {
		expect(getDividerPathD(0, 'tilt')).toBeNull();
	});
});

describe('getDividerPathD - curve', () => {
	test('level > 0', () => {
		const level = 40;
		expect(getDividerPathD(level, 'curve')).toBe(
			`m0,${100 - level} q50,${level * 2},100,0 V100 L0,100 z`
		);
	});

	test('level < 0', () => {
		const level = -40;
		expect(getDividerPathD(level, 'curve')).toBe(
			`m0,100 q50,${level * 2},100,0 V100 L0,100 z`
		);
	});

	test('level === 0 returns null', () => {
		expect(getDividerPathD(0, 'curve')).toBeNull();
	});
});

describe('getDividerPathD - wave', () => {
	test('level > 0', () => {
		const level = 50;
		expect(getDividerPathD(level, 'wave')).toBe(
			`m0,${100 - level / 2} q20,${level},40,0 t40,0 t40,0 V100 L0,100 z`
		);
	});

	test('level < 0', () => {
		const level = -50;
		expect(getDividerPathD(level, 'wave')).toBe(
			`m0,${level / 2 + 100} q20,${level},40,0 t40,0 t40,0 V100 L0,100 z`
		);
	});

	test('level === 0 returns null', () => {
		expect(getDividerPathD(0, 'wave')).toBeNull();
	});
});

describe('getDividerPathD - triangle', () => {
	test('level > 0', () => {
		const level = 60;
		const absLevel = Math.abs(level);
		const DivideAbs4 = absLevel / 4;
		expect(getDividerPathD(level, 'triangle')).toBe(
			`m0,100 h${50 - DivideAbs4} l${DivideAbs4},-${absLevel} l${DivideAbs4},${absLevel} h${DivideAbs4} v100 h-100 z`
		);
	});

	test('level < 0', () => {
		const level = -60;
		const absLevel = Math.abs(level);
		const DivideAbs4 = absLevel / 4;
		expect(getDividerPathD(level, 'triangle')).toBe(
			`m0,${100 - absLevel} h${50 - DivideAbs4} l${DivideAbs4},${absLevel} l${DivideAbs4},-${absLevel} h${50 - DivideAbs4} v${absLevel + 1} h-100 z`
		);
	});

	test('level === 0 returns null', () => {
		expect(getDividerPathD(0, 'triangle')).toBeNull();
	});
});

describe('getDividerPathD - largeTriangle', () => {
	test('level > 0', () => {
		const level = 70;
		const absLevel = Math.abs(level);
		expect(getDividerPathD(level, 'largeTriangle')).toBe(
			`M50,${100 - absLevel} H50 L50,${100 - absLevel} 100,100 H100 V100 H0 Z`
		);
	});

	test('level < 0', () => {
		const level = -70;
		const absLevel = Math.abs(level);
		expect(getDividerPathD(level, 'largeTriangle')).toBe(
			`M0,${100 - absLevel} H0 L50,100 100,${100 - absLevel} H100 V100 H0 Z`
		);
	});

	test('level === 0 returns null', () => {
		expect(getDividerPathD(0, 'largeTriangle')).toBeNull();
	});
});

describe('getDividerPathD - serrated', () => {
	test('serrated has fixed pattern (not level-dependent like other types)', () => {
		// serrated は呼び出すと常に d 文字列を返す（null にならない）
		expect(typeof getDividerPathD(10, 'serrated')).toBe('string');
		expect(typeof getDividerPathD(0, 'serrated')).toBe('string');
		expect(typeof getDividerPathD(-10, 'serrated')).toBe('string');
	});

	test('serrated level=0 matches expected golden value', () => {
		// baseSerrationCount=40, step=100/40=2.5, height=10
		// i 偶数→y=90, i 奇数→y=100, i=0..40
		const baseSerrationCount = 40;
		const step = 100 / baseSerrationCount;
		const height = 10;
		const pathData = Array.from({ length: baseSerrationCount + 1 })
			.map((_, i) => {
				const x = i * step;
				const y = i % 2 === 0 ? 100 - height : 100;
				return `${x},${y}`;
			})
			.join(' L ');
		expect(getDividerPathD(0, 'serrated')).toBe(
			`M0,100 L ${pathData} L100,100 Z`
		);
	});

	test('serrated level=50 (positive: serrationCount=40+10=50)', () => {
		const serrationCount = 50;
		const step = 100 / serrationCount;
		const height = 10;
		const pathData = Array.from({ length: serrationCount + 1 })
			.map((_, i) => {
				const x = i * step;
				const y = i % 2 === 0 ? 100 - height : 100;
				return `${x},${y}`;
			})
			.join(' L ');
		expect(getDividerPathD(50, 'serrated')).toBe(
			`M0,100 L ${pathData} L100,100 Z`
		);
	});

	test('serrated level=-50 (negative: serrationCount=40-10=30)', () => {
		const serrationCount = 30;
		const step = 100 / serrationCount;
		const height = 10;
		const pathData = Array.from({ length: serrationCount + 1 })
			.map((_, i) => {
				const x = i * step;
				const y = i % 2 === 0 ? 100 - height : 100;
				return `${x},${y}`;
			})
			.join(' L ');
		expect(getDividerPathD(-50, 'serrated')).toBe(
			`M0,100 L ${pathData} L100,100 Z`
		);
	});
});

describe('getDividerPathD - book', () => {
	test('level > 0', () => {
		const level = 30;
		expect(getDividerPathD(level, 'book')).toBe(
			`M0,100 H0 C40,${100 - level * 0.1} 50,${100 - level} 50,${100 - level} C50,${100 - level} 60,${100 - level * 0.1} 100,100 H100 V100 H0 Z`
		);
	});

	test('level === 0 (returns flat path)', () => {
		expect(getDividerPathD(0, 'book')).toBe(
			`M0,100 H0 C40,100 50,100 50,100 C50,100 60,100 100,100 H100 V100 H0 Z`
		);
	});

	test('level < 0 (not -100)', () => {
		const level = -30;
		const absLevel = 30;
		const startY = 100 - absLevel;
		expect(getDividerPathD(level, 'book')).toBe(
			`M0,${startY} H0 C40,${100 - absLevel * 0.9} 50,100 50,100 C50,100 60,${100 - absLevel * 0.9} 100,${startY} H100 V100 H0 Z`
		);
	});

	test('level === -100 (boundary)', () => {
		// absLevel === 100 のときは controlPoint1Y=30, startY=0
		expect(getDividerPathD(-100, 'book')).toBe(
			`M0,0 H0 C40,30 50,100 50,100 C50,100 60,30 100,0 H100 V100 H0 Z`
		);
	});
});

describe('getDividerPathD - pyramid', () => {
	test('level > 0', () => {
		const level = 50;
		expect(getDividerPathD(level, 'pyramid')).toBe(
			`M0,${100 - level * 0.5} H0 L25,${100 - level} 60,${100 - level * 0.2} 75,${100 - level * 0.6} 100,100 H100 V100 H0 Z`
		);
	});

	test('level === 0', () => {
		expect(getDividerPathD(0, 'pyramid')).toBe(
			`M0,100 H0 L0,100 35,100 65,100 85,100 100,100 H100 V100 H0 Z`
		);
	});

	test('level < 0', () => {
		const level = -50;
		const absLevel = 50;
		expect(getDividerPathD(level, 'pyramid')).toBe(
			`M0,100 H0 L25,${100 - absLevel * 0.6} 40,${100 - absLevel * 0.2} 75,${100 - absLevel} 100,${100 - absLevel * 0.5} H100 V100 H0 Z`
		);
	});
});

describe('getDividerPathD - unknown type', () => {
	test('returns null for unknown dividerType', () => {
		expect(getDividerPathD(30, 'unknownType')).toBeNull();
	});

	test('returns null for undefined dividerType', () => {
		expect(getDividerPathD(30, undefined)).toBeNull();
	});
});
