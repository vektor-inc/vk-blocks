/* eslint-env jest */
/**
 * タブラベルのパディング・角丸設定（issue #3022）で使用する UnitControl の
 * 単位候補に step が指定されていることを確認する回帰テスト。
 *
 * wp-components（@wordpress/components）の UnitControl は units 配列の各エントリに step が無いと
 * 単位に関わらず step=1 として扱い、値確定時に ensureValidStep() で最寄りの整数へ
 * 丸めてしまう。em / rem / % で 0.5 のような小数を入力できるようにするため、
 * 各単位に小数対応の step（em/rem: 0.01, %: 0.1）が設定されていることを検証する。
 * PR #3041 で報告された「小数を入力できない」不具合の再発防止が目的。
 */
import {
	TAB_LABEL_PADDING_UNITS,
	TAB_LABEL_BORDER_RADIUS_UNITS,
} from '@vkblocks/blocks/_pro/tab/edit';

describe('タブラベル UnitControl の単位候補の step', () => {
	const findUnit = (units, value) =>
		units.find((unit) => unit.value === value);

	it('パディングの全単位に step が定義されている', () => {
		TAB_LABEL_PADDING_UNITS.forEach((unit) => {
			expect(typeof unit.step).toBe('number');
		});
	});

	it('角丸の全単位に step が定義されている', () => {
		TAB_LABEL_BORDER_RADIUS_UNITS.forEach((unit) => {
			expect(typeof unit.step).toBe('number');
		});
	});

	it('em / rem は小数入力できる step（1 未満）を持つ', () => {
		[TAB_LABEL_PADDING_UNITS, TAB_LABEL_BORDER_RADIUS_UNITS].forEach(
			(units) => {
				['em', 'rem'].forEach((value) => {
					const unit = findUnit(units, value);
					expect(unit).toBeDefined();
					expect(unit.step).toBeLessThan(1);
				});
			}
		);
	});

	it('% は小数入力できる step（1 未満）を持つ', () => {
		const unit = findUnit(TAB_LABEL_BORDER_RADIUS_UNITS, '%');
		expect(unit).toBeDefined();
		expect(unit.step).toBeLessThan(1);
	});

	it('px は整数刻みの step（1）を持つ', () => {
		[TAB_LABEL_PADDING_UNITS, TAB_LABEL_BORDER_RADIUS_UNITS].forEach(
			(units) => {
				const unit = findUnit(units, 'px');
				expect(unit).toBeDefined();
				expect(unit.step).toBe(1);
			}
		);
	});
});
