/* eslint-env jest */
/**
 * componentDivider のレンダリング回帰テスト。
 *
 * getDividerPathD の戻り値（path の d 文字列）は outer-divider-path.test.js で
 * 固定しているが、d 以外の出力（fill / className / sectionPadding）はそちらでは
 * 検証できない。本ファイルは componentDivider を実レンダリングし、これらの出力が
 * リファクタ前と不変であることを固定する（PR #3010 / Issue #2997）。
 *
 * 特に book / pyramid は「#fff フォールバック後の color」で className を再計算する
 * 元実装の挙動を保持しており（color 未指定でも has-text-color が付く）、他の種類とは
 * 異なる。この差分が崩れると既存コンテンツの保存 HTML 互換が壊れるため重点的に固定する。
 */
import { renderToString } from '@wordpress/element';
import { componentDivider } from '@vkblocks/blocks/_pro/outer/component-divider';

/**
 * componentDivider をレンダリングし、検証に必要な部分を抜き出す。
 *
 * @param {Object} opts         オプション。
 * @param {number} opts.level   level 値。
 * @param {string} [opts.color] color 値（未指定可）。
 * @param {string} opts.side    'upper' | 'lower'。
 * @param {string} opts.type    dividerType。
 * @return {{html: string, divStyle: string, pathFill: string, pathClass: string}} 抜粋。
 */
const render = ({ level, color, side, type }) => {
	const html = renderToString(
		componentDivider(level, color, side, type, false, 0, 0, 0)
	);
	const divStyle = (html.match(
		/<div class="vk_outer_separator[^"]*" style="([^"]*)"/
	) || [])[1];
	const pathFill = (html.match(/<path[^>]*\sfill="([^"]*)"/) || [])[1];
	const pathClass = (html.match(/<path[^>]*\sclass="([^"]*)"/) || [])[1];
	return { html, divStyle, pathFill, pathClass };
};

describe('componentDivider - fill / className 互換', () => {
	it('book は color 未指定でも has-text-color が付き、fill は #fff', () => {
		const { pathFill, pathClass } = render({
			level: 50,
			color: undefined,
			side: 'upper',
			type: 'book',
		});
		expect(pathFill).toBe('#fff');
		expect(pathClass).toBe('has-text-color');
	});

	it('pyramid も book と同じ（color 未指定で has-text-color / fill #fff）', () => {
		const { pathFill, pathClass } = render({
			level: 50,
			color: undefined,
			side: 'upper',
			type: 'pyramid',
		});
		expect(pathFill).toBe('#fff');
		expect(pathClass).toBe('has-text-color');
	});

	it('curve は color 未指定だと has-text-color が付かない（book/pyramid との差分）', () => {
		const { pathFill, pathClass } = render({
			level: 50,
			color: undefined,
			side: 'upper',
			type: 'curve',
		});
		expect(pathFill).toBe('#fff');
		expect(pathClass).toBe('');
	});

	it('book + HEX 色は fill にその HEX、class は has-text-color', () => {
		const { pathFill, pathClass } = render({
			level: 50,
			color: '#ff0000',
			side: 'upper',
			type: 'book',
		});
		expect(pathFill).toBe('#ff0000');
		expect(pathClass).toBe('has-text-color');
	});

	it('book + スラッグ色は fill currentColor、class に has-{slug}-color', () => {
		const { pathFill, pathClass } = render({
			level: 50,
			color: 'vivid-red',
			side: 'upper',
			type: 'book',
		});
		expect(pathFill).toBe('currentColor');
		expect(pathClass).toBe('has-text-color has-vivid-red-color');
	});

	it('curve + スラッグ色は fill currentColor、class に has-{slug}-color', () => {
		const { pathFill, pathClass } = render({
			level: 50,
			color: 'vivid-red',
			side: 'upper',
			type: 'curve',
		});
		expect(pathFill).toBe('currentColor');
		expect(pathClass).toBe('has-text-color has-vivid-red-color');
	});
});

describe('componentDivider - sectionPadding 互換', () => {
	it('curve は lvl>0 で abs(lvl)、lvl<0 で abs(lvl)*2', () => {
		expect(
			render({ level: 50, side: 'upper', type: 'curve' }).divStyle
		).toBe('padding-bottom:50px');
		expect(
			render({ level: -50, side: 'upper', type: 'curve' }).divStyle
		).toBe('padding-bottom:100px');
	});

	it('serrated は level に依らず 10px', () => {
		expect(
			render({ level: 50, side: 'upper', type: 'serrated' }).divStyle
		).toBe('padding-bottom:10px');
		expect(
			render({ level: -30, side: 'upper', type: 'serrated' }).divStyle
		).toBe('padding-bottom:10px');
	});

	it('tilt / wave / triangle / largeTriangle / book / pyramid は abs(lvl)', () => {
		[
			'tilt',
			'wave',
			'triangle',
			'largeTriangle',
			'book',
			'pyramid',
		].forEach((type) => {
			expect(render({ level: -40, side: 'upper', type }).divStyle).toBe(
				'padding-bottom:40px'
			);
		});
	});

	it('lower 側は padding-top に出力される', () => {
		expect(
			render({ level: 50, side: 'lower', type: 'book' }).divStyle
		).toBe('padding-top:50px');
	});

	it('既知 8 タイプ以外の dividerType は元実装どおり undefinedpx を出力する', () => {
		// 元実装（master）は不正な dividerType のとき sectionPadding 未代入
		// （undefined）のまま `undefined + 'px'` を style に出力していた。
		// save 出力の byte 互換のため、この挙動を回帰テストとして固定する。
		expect(
			render({ level: 50, side: 'upper', type: 'unknownType' }).divStyle
		).toBe('padding-bottom:undefinedpx');
		expect(
			render({ level: -50, side: 'upper', type: 'unknownType' }).divStyle
		).toBe('padding-bottom:undefinedpx');
		expect(
			render({ level: 50, side: 'lower', type: 'unknownType' }).divStyle
		).toBe('padding-top:undefinedpx');
		// dividerType が undefined の場合も同様に undefinedpx になる
		expect(
			render({ level: 50, side: 'upper', type: undefined }).divStyle
		).toBe('padding-bottom:undefinedpx');
	});
});
