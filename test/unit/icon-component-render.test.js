/* eslint-env jest */
/**
 * VKBIcon（src/blocks/icon/component.js）の既定値フォールバック回帰テスト。
 *
 * サイズ・余白の単位・数値は、生の style 文字列へ連結する前に
 * sanitizeSizeUnit() / sanitizeFiniteNumber()（src/utils/icon-style-attribute-validation.js）
 * で検証している。ブロック自身のUI（単位の SelectControl・数値の RangeControl）
 * では作りえない値（許可リストに無い単位・非数値）を渡しても、出力が
 * block.json の既定値（サイズ36px・余白22px）へ倒れることを固定する（issue #3205）。
 *
 * Regression test for VKBIcon's (src/blocks/icon/component.js) fallback to
 * default values. Size/margin units and numbers are validated with
 * sanitizeSizeUnit() / sanitizeFiniteNumber()
 * (src/utils/icon-style-attribute-validation.js) before being concatenated
 * into a raw style string. A value the block's own UI (the unit
 * SelectControl / the number RangeControl) could never produce (a
 * disallowed unit, a non-number) still falls back to block.json's default
 * (36px size / 22px margin) instead of being written out as-is (issue
 * #3205).
 */
import { renderToString } from '@wordpress/element';
import { VKBIcon } from '@vkblocks/blocks/icon/component';

describe('VKBIcon - 想定外の単位・数値は既定値へフォールバックする', () => {
	it('許可リストに無い単位（iconSizeUnit: pt）は px にフォールバックする', () => {
		const html = renderToString(
			<VKBIcon
				lbType="0"
				lbSize={48}
				lbSizeUnit="pt"
				lbMargin={10}
				lbMarginUnit="px"
			/>
		);
		expect(html).toContain('48px');
		expect(html).not.toContain('48pt');
	});

	it('許可リストに無い単位（iconMarginUnit: pt）は px にフォールバックする', () => {
		const html = renderToString(
			<VKBIcon
				lbType="0"
				lbSize={48}
				lbSizeUnit="px"
				lbMargin={10}
				lbMarginUnit="pt"
			/>
		);
		// margin は width/height の calc() 内で 2 倍されて連結される（10 * 2 = 20）
		expect(html).toContain('20px');
		expect(html).not.toContain('20pt');
	});

	it('数値ではない iconSize は既定値 36 にフォールバックする', () => {
		const html = renderToString(
			<VKBIcon
				lbType="0"
				lbSize="forty-eight"
				lbSizeUnit="em"
				lbMargin={10}
				lbMarginUnit="px"
			/>
		);
		expect(html).toContain('36em');
	});

	it('数値ではない iconMargin は既定値 22 にフォールバックする', () => {
		const html = renderToString(
			<VKBIcon
				lbType="0"
				lbSize={48}
				lbSizeUnit="px"
				lbMargin="ten"
				lbMarginUnit="px"
			/>
		);
		// margin は width/height の calc() 内で 2 倍されて連結される（22 * 2 = 44）
		expect(html).toContain('44px');
	});
});
