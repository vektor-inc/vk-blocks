/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// 等速ループ（#3053）の追加で、既存の保存済みスライダーがリカバリーを求められないことを固定する。
//
// 新しい属性（playbackMode / marqueeSpeed）は「等速ループのときだけ」保存データに書き出す作りの
// ため、既存の投稿に対する save の出力は1文字も変わらない、というのがこの機能の前提。
// それを確かめるため、deprecated を一切登録せずに既存の fixture を解析し、
// **現行の save だけで**検証に通ることを見る（deprecated 経由で救われているだけなら落ちる）。
// あわせて、等速ループの fixture が現行の save と一致することも確かめる。
//
// Pins down that adding the continuous loop mode (#3053) does not make existing saved sliders
// ask for block recovery.
//
// The new attributes (playbackMode / marqueeSpeed) are written into the saved data only in
// marquee mode, so the save output for existing posts must not change by a single character.
// To check that, the existing fixtures are parsed with NO deprecations registered, so they
// must validate against the current save alone (being rescued by a deprecation would fail
// here). The marquee fixture is also checked against the current save.

import fs from 'fs';
import path from 'path';
import {
	registerBlockType,
	unregisterBlockType,
	parse,
} from '@wordpress/blocks';

jest.mock('@wordpress/i18n', () => {
	const actual = jest.requireActual('@wordpress/i18n');
	return {
		...actual,
		__: (text) => text,
		_x: (text) => text,
	};
});

// index.js を副作用込みで import して、本番と同じ getSaveElement フィルタ（高さ・ズーム用の
// <style>）を登録する。これが無いと検証パイプラインが本番と一致しない。
// Imported for its side effects so the real getSaveElement filter (the height / zoom <style>)
// is registered as in production; without it the pipeline under test would not be the real one.
import {
	metadata as sliderMetadata,
	settings as sliderSettings,
} from '../../src/blocks/slider';
import {
	metadata as sliderItemMetadata,
	settings as sliderItemSettings,
} from '../../src/blocks/slider-item';
import '@wordpress/block-library/build-module/paragraph/init';

const FIXTURE_DIR = path.resolve(
	__dirname,
	'..',
	'e2e-tests',
	'fixtures',
	'blocks'
);

const readFixture = (fileName) =>
	fs.readFileSync(path.join(FIXTURE_DIR, fileName), 'utf8');

// 現行の save で保存された既存の fixture（通常方式・停止ボタンあり・ズームあり）
// Existing fixtures saved by the current save (standard, with the pause button, with zoom).
const EXISTING_FIXTURES = [
	'vk-blocks__slider__default.html',
	'vk-blocks__slider__pause-button.html',
	'vk-blocks__slider__zoom.html',
];

const MARQUEE_FIXTURE = 'vk-blocks__slider__marquee.html';

// 検証に失敗したときの診断ログで jest-console が落ちないよう握りつぶす（成否は isValid で見る）
// Silence the diagnostics logged on a validation failure so jest-console does not fail the
// test on its own; the outcome is asserted through isValid.
const muteParseConsole = () => {
	/* eslint-disable no-console */
	const spies = ['error', 'warn', 'info'].map((method) =>
		jest.spyOn(console, method).mockImplementation(() => {})
	);
	/* eslint-enable no-console */
	return () => spies.forEach((spy) => spy.mockRestore());
};

describe('スライダー: 等速ループ追加後も既存の保存内容が現行 save と一致する / existing content still matches the current save', () => {
	beforeAll(() => {
		// edit は不要なので最小スタブにする。deprecated は外し、現行 save だけで検証させる。
		// category は独自カテゴリが jest 環境に未登録のため core の 'text' に寄せる。
		// edit is stubbed out. deprecations are removed so validation uses the current save only.
		// The custom category is not registered under jest, so a core one is used instead.
		registerBlockType(
			{ ...sliderItemMetadata, category: 'text' },
			{ ...sliderItemSettings, edit: () => null }
		);
		registerBlockType(
			{ ...sliderMetadata, category: 'text' },
			{ ...sliderSettings, edit: () => null, deprecated: [] }
		);
	});

	afterAll(() => {
		unregisterBlockType('vk-blocks/slider');
		unregisterBlockType('vk-blocks/slider-item');
	});

	it.each(EXISTING_FIXTURES)(
		'%s はリカバリーを求められない / %s needs no recovery',
		(fileName) => {
			const restore = muteParseConsole();
			try {
				const [block] = parse(readFixture(fileName));
				expect(block.name).toBe('vk-blocks/slider');
				// false なら、等速ループの追加で既存投稿の save 出力が変わったということ
				// False means adding the marquee mode changed the save output for existing posts.
				expect(block.isValid).toBe(true);
				// 既存の投稿は通常方式として解釈される
				// Existing posts are interpreted as the standard mode.
				expect(block.attributes.playbackMode).toBe('default');
			} finally {
				restore();
			}
		}
	);

	it('前提: 既存の fixture に等速ループの出力が含まれていない / existing fixtures carry no marquee output', () => {
		// fixture を等速ループの形式で作り直してしまうと、上の検証が意味を失うため
		// If a fixture were regenerated in the marquee form, the check above would lose its meaning.
		EXISTING_FIXTURES.forEach((fileName) => {
			const html = readFixture(fileName);
			expect(html).not.toContain('playbackMode');
			expect(html).not.toContain('vk_slider--marquee');
		});
	});

	it('等速ループの fixture は現行 save と一致する / the marquee fixture matches the current save', () => {
		const restore = muteParseConsole();
		try {
			const [block] = parse(readFixture(MARQUEE_FIXTURE));
			expect(block.isValid).toBe(true);
			expect(block.attributes.playbackMode).toBe('marquee');
			expect(block.attributes.marqueeSpeed).toBe(80);
		} finally {
			restore();
		}
	});
});
