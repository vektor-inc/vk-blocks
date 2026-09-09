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
import {
	getDividerPathD,
	clampLevel,
} from '../../src/blocks/_pro/outer/utils/divider-path';

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

describe('clampLevel - エディタ入口の level 範囲ガード', () => {
	test('正規値（-100〜100）はそのまま返す', () => {
		expect(clampLevel(0)).toBe(0);
		expect(clampLevel(50)).toBe(50);
		expect(clampLevel(-50)).toBe(-50);
		expect(clampLevel(100)).toBe(100);
		expect(clampLevel(-100)).toBe(-100);
	});

	test('範囲外は [-100, 100] に丸める', () => {
		expect(clampLevel(100000)).toBe(100);
		expect(clampLevel(-100000)).toBe(-100);
		expect(clampLevel(101)).toBe(100);
		expect(clampLevel(-101)).toBe(-100);
	});

	test('数値文字列は数値に変換して丸める', () => {
		expect(clampLevel('50')).toBe(50);
		expect(clampLevel('100000')).toBe(100);
	});

	test('非数値・非有限は 0 にする（PHP: 非数値 → 0）', () => {
		expect(clampLevel('abc')).toBe(0);
		expect(clampLevel('')).toBe(0);
		expect(clampLevel(NaN)).toBe(0);
		expect(clampLevel(Infinity)).toBe(0);
		expect(clampLevel(-Infinity)).toBe(0);
		expect(clampLevel(undefined)).toBe(0);
		expect(clampLevel(null)).toBe(0);
	});

	test('配列・オブジェクトは 0（PHP filter_var(FLOAT)=false と同じ・Number([50])=50 の化け対策）', () => {
		// 配列・オブジェクトは Number に落ちる前に 0。
		expect(clampLevel([50])).toBe(0);
		expect(clampLevel([])).toBe(0);
		expect(clampLevel([50, 60])).toBe(0);
		expect(clampLevel({})).toBe(0);
		expect(clampLevel({ x: 50 })).toBe(0);
	});

	test('boolean は PHP filter_var(FLOAT) と同値（true→1・false→0）', () => {
		expect(clampLevel(true)).toBe(1);
		expect(clampLevel(false)).toBe(0);
	});
});

describe('getDividerPathD - level クランプ（エディタ入口）', () => {
	// 手書き JSON の巨大 level でも path 生成は ±100 に丸めて暴発しない。
	test('巨大な正の level は level=100 と同じ d を返す（範囲丸め）', () => {
		[
			'tilt',
			'curve',
			'wave',
			'triangle',
			'largeTriangle',
			'serrated',
			'book',
			'pyramid',
		].forEach((type) => {
			expect(getDividerPathD(100000, type)).toBe(
				getDividerPathD(100, type)
			);
		});
	});

	test('巨大な負の level は level=-100 と同じ d を返す（範囲丸め）', () => {
		[
			'tilt',
			'curve',
			'wave',
			'triangle',
			'largeTriangle',
			'serrated',
			'book',
			'pyramid',
		].forEach((type) => {
			expect(getDividerPathD(-100000, type)).toBe(
				getDividerPathD(-100, type)
			);
		});
	});

	test('非数値 level は 0 扱い（level=0 で null を返す型は null）', () => {
		expect(getDividerPathD('abc', 'tilt')).toBeNull();
		expect(getDividerPathD(NaN, 'wave')).toBeNull();
		expect(getDividerPathD(Infinity, 'curve')).toBeNull();
		expect(getDividerPathD(undefined, 'triangle')).toBeNull();
		// serrated は level=0 でも path を返す（clamp 後 0 として）
		expect(getDividerPathD('abc', 'serrated')).toBe(
			getDividerPathD(0, 'serrated')
		);
	});

	test('serrated のループ本数は level に比例せず 60 で頭打ち（DoS 防御）', () => {
		// clamp 済み 100 → serrationCount = 40 + floor(100/5) = 60（Math.min(count, 60) で頭打ち）。
		// serrationCount=60 で組んだゴールデンと一致させ、「60 分割で cap される」ことを明示する。
		const serrationCount = 60;
		const step = 100 / serrationCount;
		const height = 10;
		const pathData = Array.from({ length: serrationCount + 1 })
			.map((_, i) => {
				const x = i * step;
				const y = i % 2 === 0 ? 100 - height : 100;
				return `${x},${y}`;
			})
			.join(' L ');
		const capped = `M0,100 L ${pathData} L100,100 Z`;
		expect(getDividerPathD(100, 'serrated')).toBe(capped);
		// 巨大 level でも clamp 済み 100（= 60 分割）と完全一致＝ループが有界であることを固定。
		expect(getDividerPathD(100000, 'serrated')).toBe(capped);
	});
});
