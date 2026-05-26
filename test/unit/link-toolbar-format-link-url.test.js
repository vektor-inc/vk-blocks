/* eslint-env jest */
import { formatLinkUrl } from '@vkblocks/components/link-toolbar/format-link-url';

describe('link-toolbar: formatLinkUrl', () => {
	// --- 素通しすべき URL（http:// を付加してはいけない） ---

	test('http:// で始まる絶対 URL はそのまま返す', () => {
		expect(formatLinkUrl('http://example.com/foo')).toBe(
			'http://example.com/foo'
		);
	});

	test('https:// で始まる絶対 URL はそのまま返す', () => {
		expect(formatLinkUrl('https://example.com/foo')).toBe(
			'https://example.com/foo'
		);
	});

	test('/ で始まる相対パス（サイト内絶対パス）はそのまま返す', () => {
		expect(formatLinkUrl('/foo')).toBe('/foo');
	});

	test('/ で始まるネストした相対パスもそのまま返す（http:/// にならない）', () => {
		// 不具合の中心: 以前は LinkPreview 側で `http://` + `/foo/bar` = `http:////foo/bar` 相当になっていた
		expect(formatLinkUrl('/foo/bar')).toBe('/foo/bar');
	});

	test('"/" 単独でもそのまま返す（サイトルートを示す有効なリンク）', () => {
		// 素通し条件: `/` で始まるためそのまま返す
		expect(formatLinkUrl('/')).toBe('/');
	});

	test('protocol-relative URL（// で始まる）はそのまま返す', () => {
		// 素通し条件: `/` で始まるためそのまま返す。ブラウザは現在のプロトコルで解釈する有効なケース
		expect(formatLinkUrl('//example.com/foo')).toBe('//example.com/foo');
	});

	test('# で始まるアンカーリンクはそのまま返す', () => {
		expect(formatLinkUrl('#section1')).toBe('#section1');
	});

	test('"#" 単独でもそのまま返す（ページ先頭アンカー）', () => {
		// 素通し条件: `#` で始まるためそのまま返す
		expect(formatLinkUrl('#')).toBe('#');
	});

	test('tel: スキームはそのまま返す', () => {
		expect(formatLinkUrl('tel:09012345678')).toBe('tel:09012345678');
	});

	test('mailto: スキームはそのまま返す', () => {
		expect(formatLinkUrl('mailto:foo@example.com')).toBe(
			'mailto:foo@example.com'
		);
	});

	test('空文字は空文字を返す', () => {
		expect(formatLinkUrl('')).toBe('');
	});

	// --- http:// を付加すべき URL ---

	test('スキームなしのドメイン形式には http:// を付加する', () => {
		expect(formatLinkUrl('example.com/foo')).toBe('http://example.com/foo');
	});

	test('ドメインのみでも http:// を付加する', () => {
		expect(formatLinkUrl('example.com')).toBe('http://example.com');
	});

	test('大文字スキーム "HTTPS://" は素通しされず http:// が付加される（現挙動の明文化）', () => {
		// 現挙動の明文化: startsWith は case-sensitive のため `HTTPS://` は素通し判定にマッチせず
		// `http://HTTPS://example.com` という結果になる。これは旧コードと同じ挙動で、
		// 今回のスコープ外（危険スキーム判定強化と合わせて別 issue で対応予定）だが、回帰検知のためテストで明示する。
		expect(formatLinkUrl('HTTPS://example.com')).toBe(
			'http://HTTPS://example.com'
		);
	});

	// --- 異常系（クラッシュしないこと） ---

	test('undefined を渡しても空文字を返す（クラッシュしない）', () => {
		expect(formatLinkUrl(undefined)).toBe('');
	});

	test('null を渡しても空文字を返す（クラッシュしない）', () => {
		expect(formatLinkUrl(null)).toBe('');
	});
});
