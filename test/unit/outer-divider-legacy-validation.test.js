/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */
/**
 * Outer 境界線 mask 化（#2997 / PR #3023）の後方互換回帰テスト。
 *
 * このテストの目的は「既存ユーザーが保存した legacy（塗り）方式の Outer ブロック」が、
 * mask 化を入れた現行コードで開いてもリカバリーボタンを要求されないことを保証すること。
 *
 * 既存の outer-divider-render.test.js は componentDivider を単体レンダリングするだけで、
 * block.json の default（dividerRenderMode='mask'）→ 現行 save → deprecated チェーン
 * → getSaveElement フィルタ（innerSideSpace の <style> 付与）という
 * 「実際にエディタが通す検証パイプライン」を一切通っていなかったため、今回の不具合を見逃した。
 *
 * そこで本テストは @wordpress/blocks の registerBlockType + parse + isValidBlock を使い、
 * legacy-render fixture（dividerRenderMode を持たない＝既存ユーザーの保存内容相当）が
 * 検証パイプライン全体を通して valid と判定されることを assert する。
 * これが今後 mask 周辺をいじった際の回帰の砦になる。
 */
import fs from 'fs';
import path from 'path';
import {
	registerBlockType,
	unregisterBlockType,
	parse,
	getBlockType,
} from '@wordpress/blocks';
import { removeFilter } from '@wordpress/hooks';

// 翻訳関数は原文をそのまま返すようにするが、@wordpress/components が必要とする
// isRTL など他の export は本物を維持する（一部だけ差し替えると components が壊れるため）。
jest.mock('@wordpress/i18n', () => {
	const actual = jest.requireActual('@wordpress/i18n');
	return {
		...actual,
		__: (text) => text,
		_x: (text) => text,
	};
});

// block.json / save / deprecated / getSaveElement フィルタを本物のまま読み込む。
import metadata from '../../src/blocks/_pro/outer/block.json';
import save from '../../src/blocks/_pro/outer/save';
import deprecated from '../../src/blocks/_pro/outer/deprecated/save/';

// index.js の getSaveElement フィルタ（innerSideSpace 用 <style> を付与する後方互換フック）を
// 実際に登録するため、副作用込みで import する。これがないと検証パイプラインが本番と一致しない。
import '../../src/blocks/_pro/outer/index.js';

// legacy-render fixture は本テスト専用の入力データのため、フルコンテンツ統合
// テスト（test/integration/full-content）がスキャンする e2e-tests 配下ではなく
// test/unit/fixtures に置く。これらは意図的に deprecated 移行を発生させるため、
// フルコンテンツテストの「移行なしで valid」前提と衝突するのを避ける。
const FIXTURE_DIR = path.resolve(__dirname, 'fixtures');

// legacy-render fixture（既存ユーザーの保存内容相当）の一覧。
const legacyFixtures = [
	'vk-blocks__outer__divider__legacy-render__tilt.html',
	'vk-blocks__outer__divider__legacy-render__curve.html',
	'vk-blocks__outer__divider__legacy-render__wave.html',
	'vk-blocks__outer__divider__legacy-render__triangle.html',
	'vk-blocks__outer__divider__legacy-render__largeTriangle.html',
	'vk-blocks__outer__divider__legacy-render__serrated.html',
	'vk-blocks__outer__divider__legacy-render__book.html',
	// 負値 lower_level（-100）: lower divider の path が反転する分岐を legacy 検証で固定する
	// （実データに -56/-89/-100 があり、正値 fixture だけでは反転分岐を検知できないため）。
	'vk-blocks__outer__divider__legacy-render__book-negative.html',
	'vk-blocks__outer__divider__legacy-render__pyramid.html',
	// fixed / parallax 背景の既存ブロック（塗り＝legacy で保存されている）。
	// #2997 / PR #3023 で「fixed/parallax → legacy 強制フォールバック」を撤去したため、
	// これらが recovery を出さず deprecated 経由で legacy を維持できることを重点的に固定する
	// （撤去後に最も影響を受けるシナリオ）。
	'vk-blocks__outer__divider__legacy-render__fixed.html',
	'vk-blocks__outer__divider__legacy-render__parallax.html',
];

/**
 * fixture HTML を読み込み、ブロックコメント部分のみ返す。
 *
 * @param {string} fileName fixture ファイル名。
 * @return {string} fixture の中身。
 */
const readFixture = (fileName) =>
	fs.readFileSync(path.join(FIXTURE_DIR, fileName), 'utf8');

/**
 * parse() 中に Gutenberg が出す想定どおりの診断ログを握りつぶす。
 * @wordpress/jest-console が未宣言の console 呼び出しでテストを fail させるため。
 *
 * @return {{ restore: () => void }} finally で呼ぶ cleanup。
 */
const muteParseConsole = () => {
	/* eslint-disable no-console */
	const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
	const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
	/* eslint-enable no-console */
	return {
		restore: () => {
			errSpy.mockRestore();
			warnSpy.mockRestore();
			infoSpy.mockRestore();
		},
	};
};

describe('Outer divider mask 化 - 既存 legacy ブロックの後方互換', () => {
	beforeAll(() => {
		// edit は jsdom 上で不要なので最小スタブで登録する（検証は save / deprecated のみ使う）。
		// category は block.json の独自カテゴリ（vk-blocks-cat-layout）が jest 環境に
		// 未登録で警告になるため、検証に無関係な core カテゴリ 'text' で上書きする。
		registerBlockType(
			{ ...metadata, category: 'text' },
			{
				edit: () => null,
				save,
				deprecated,
			}
		);
	});

	afterAll(() => {
		unregisterBlockType('vk-blocks/outer');
		// getSaveElement フィルタはここでは外さない。
		// 本番（index.js import で常駐）と同じ状態を 2 つ目の describe にも
		// 引き継ぐため。フィルタの掃除は最後の describe の afterAll で 1 回だけ行う。
	});

	it('ブロックが正しく登録されている', () => {
		expect(getBlockType('vk-blocks/outer')).toBeTruthy();
	});

	it.each(legacyFixtures)(
		'%s が valid と判定される（リカバリー不要）',
		(fileName) => {
			const html = readFixture(fileName);

			// parse は内部で「現行 save での検証 → 不一致なら deprecated チェーンを走査
			// → 一致した deprecated の migrate を適用」という本番と同じ手順を踏む。
			// この過程で Gutenberg は「現行 save では mask 出力なので legacy 保存と不一致」を
			// console.error/warn で、「deprecated で復旧できた」を console.info で出力する。
			// これは正常系（mask default → legacy 保存データを deprecated で救済）でも必ず出る
			// 想定どおりの診断ログなので、本テストでは spy で握りつぶす
			//（@wordpress/jest-console が未宣言の console 呼び出しでテストを fail させるため）。
			// 救済の成否は isValid / dividerRenderMode で確認する（ログレベルや回数には依存しない）。
			const { restore } = muteParseConsole();

			try {
				// parse は内部で検証 + deprecated migration を行い、
				// isValid を block オブジェクトに付与する。
				const blocks = parse(html);
				expect(blocks).toHaveLength(1);

				const block = blocks[0];
				// 既存ユーザーの保存内容が valid（= リカバリーボタンが出ない）であること。
				expect(block.isValid).toBe(true);

				// dividerRenderMode 追加前救済の migrate で 'legacy' が補完されていること。
				// （mask default が legacy 保存データに適用されても見た目が変わらない担保。
				//  先頭 deprecated の isEligible は path あり／mode=mask だけなので、
				//  path なしの legacy fixture は 1.124.0 系へ回る）
				expect(block.attributes.dividerRenderMode).toBe('legacy');
			} finally {
				restore();
			}
		}
	);
});

/**
 * fixture の元 HTML（保存済み legacy）が、deprecated チェーン経由で最終的に
 * valid と判定されることを直接確認する補助テスト。
 *
 * parse() の結果 isValid が true になること（最新 save では不一致でも
 * deprecated チェーン（dividerRenderMode 追加前 → 1.124.0 系）で救済されること）を固定する。
 */
describe('Outer divider - 検証パイプラインの内訳', () => {
	const html = readFixture(
		'vk-blocks__outer__divider__legacy-render__tilt.html'
	);

	beforeAll(() => {
		if (!getBlockType('vk-blocks/outer')) {
			// category は検証に無関係なため core の 'text' で登録する（独自カテゴリ警告回避）。
			registerBlockType(
				{ ...metadata, category: 'text' },
				{ edit: () => null, save, deprecated }
			);
		}
	});

	afterAll(() => {
		if (getBlockType('vk-blocks/outer')) {
			unregisterBlockType('vk-blocks/outer');
		}
		removeFilter(
			'blocks.getSaveElement',
			'vk-blocks/outer-addInlineFrontCss'
		);
	});

	it('parse 後に最終的に valid（deprecated 経由で救済）', () => {
		// 1 つ目の describe と同様、正常系でも必ず出る想定どおりの診断ログ
		//（現行 save は mask のため legacy 保存と不一致 → deprecated で救済）を spy で
		// 握りつぶす（@wordpress/jest-console が未宣言 console 呼び出しでテストを fail させるため）。
		const { restore } = muteParseConsole();

		try {
			const blocks = parse(html);
			expect(blocks[0].isValid).toBe(true);
		} finally {
			restore();
		}
	});
});
