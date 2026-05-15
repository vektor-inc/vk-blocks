/* eslint-env jest */
import {
	isHostMatch,
	matchUrlPattern,
	isAllowedSrc,
} from '@vkblocks/blocks/visual-embed/utils/match-url-pattern';

describe('visual-embed: isHostMatch', () => {
	test('完全一致パターンはホスト名が同一のときのみ true', () => {
		expect(isHostMatch('google.com', 'google.com')).toBe(true);
		expect(isHostMatch('www.google.com', 'google.com')).toBe(false);
	});

	test('"*." パターンはサフィックス自体とサブドメインを許可する', () => {
		expect(isHostMatch('google.com', '*.google.com')).toBe(true);
		expect(isHostMatch('www.google.com', '*.google.com')).toBe(true);
		expect(isHostMatch('foo.bar.google.com', '*.google.com')).toBe(true);
	});

	test('"*." パターンは別ドメインの末尾偽装を弾く', () => {
		expect(isHostMatch('google.com.attacker.com', '*.google.com')).toBe(
			false
		);
		expect(isHostMatch('notgoogle.com', '*.google.com')).toBe(false);
	});
});

describe('visual-embed: matchUrlPattern (16 ケース)', () => {
	const PATTERN = 'https://*.google.com/*';

	// 正常系: マッチすべき URL
	test('[正常] https://www.google.com/maps はマッチする', () => {
		expect(matchUrlPattern('https://www.google.com/maps', PATTERN)).toBe(
			true
		);
	});

	test('[正常] https://attack.google.com/x はマッチする', () => {
		expect(matchUrlPattern('https://attack.google.com/x', PATTERN)).toBe(
			true
		);
	});

	test('[正常] https://foo.bar.google.com/x はマッチする', () => {
		expect(matchUrlPattern('https://foo.bar.google.com/x', PATTERN)).toBe(
			true
		);
	});

	test('[正常] https://google.com/maps はマッチする（サフィックス自体）', () => {
		expect(matchUrlPattern('https://google.com/maps', PATTERN)).toBe(true);
	});

	// 攻撃系: 弾くべき URL
	test('[攻撃] https://attacker.com/.google.com/foo は弾く', () => {
		expect(
			matchUrlPattern('https://attacker.com/.google.com/foo', PATTERN)
		).toBe(false);
	});

	test('[攻撃] https://attacker.com/?.google.com/x は弾く', () => {
		expect(
			matchUrlPattern('https://attacker.com/?.google.com/x', PATTERN)
		).toBe(false);
	});

	test('[攻撃] https://evil.com/?fake=.google.com は弾く', () => {
		expect(
			matchUrlPattern('https://evil.com/?fake=.google.com', PATTERN)
		).toBe(false);
	});

	test('[攻撃] https://www.google.com.attacker.com/foo は弾く（末尾偽装）', () => {
		expect(
			matchUrlPattern('https://www.google.com.attacker.com/foo', PATTERN)
		).toBe(false);
	});

	// プロトコル偽装
	test('[プロトコル] http://www.google.com/maps は弾く（http）', () => {
		expect(matchUrlPattern('http://www.google.com/maps', PATTERN)).toBe(
			false
		);
	});

	test('[プロトコル] ftp://www.google.com/maps は弾く', () => {
		expect(matchUrlPattern('ftp://www.google.com/maps', PATTERN)).toBe(
			false
		);
	});

	// 別ドメイン
	test('[別ドメイン] https://www.google.co.jp/maps は弾く', () => {
		expect(matchUrlPattern('https://www.google.co.jp/maps', PATTERN)).toBe(
			false
		);
	});

	test('[別ドメイン] https://notgoogle.com/maps は弾く', () => {
		expect(matchUrlPattern('https://notgoogle.com/maps', PATTERN)).toBe(
			false
		);
	});

	// パス不一致
	test('[パス] https://www.youtube.com/embed/xxx を google パターンに当てても弾く', () => {
		expect(
			matchUrlPattern('https://www.youtube.com/embed/xxx', PATTERN)
		).toBe(false);
	});

	test('[パス] https://player.vimeo.com/video/123 をパス指定パターンで判定', () => {
		// player.vimeo.com/* は player.vimeo.com 配下を許可
		expect(
			matchUrlPattern(
				'https://player.vimeo.com/video/123',
				'https://player.vimeo.com/*'
			)
		).toBe(true);
		// /export/* は通らない
		expect(
			matchUrlPattern(
				'https://www.openstreetmap.org/render/abc',
				'https://www.openstreetmap.org/export/*'
			)
		).toBe(false);
	});

	// 異常系: 不正な URL
	test('[異常] 空文字列は弾く', () => {
		expect(matchUrlPattern('', PATTERN)).toBe(false);
	});

	test('[異常] 不正な URL 文字列は弾く', () => {
		expect(matchUrlPattern('not a url', PATTERN)).toBe(false);
		expect(matchUrlPattern('javascript:alert(1)', PATTERN)).toBe(false); // eslint-disable-line no-script-url
	});

	test('[異常] urlStr が非文字列なら例外を出さず false を返す（fail-close）', () => {
		expect(matchUrlPattern(null, PATTERN)).toBe(false);
		expect(matchUrlPattern(undefined, PATTERN)).toBe(false);
		expect(matchUrlPattern(123, PATTERN)).toBe(false);
		expect(matchUrlPattern({}, PATTERN)).toBe(false);
	});

	test('[異常] patternStr が非文字列なら例外を出さず false を返す（fail-close）', () => {
		expect(matchUrlPattern('https://www.google.com/maps', null)).toBe(
			false
		);
		expect(matchUrlPattern('https://www.google.com/maps', undefined)).toBe(
			false
		);
		expect(matchUrlPattern('https://www.google.com/maps', 123)).toBe(false);
		expect(matchUrlPattern('https://www.google.com/maps', {})).toBe(false);
	});
});

describe('visual-embed: matchUrlPattern (ポート明示)', () => {
	test('[ポート] パターン側に :443 明示があり対象URLにポート指定なしなら弾く（fail-close）', () => {
		expect(
			matchUrlPattern(
				'https://example.com/x',
				'https://example.com:443/*'
			)
		).toBe(false);
	});

	test('[ポート] パターン側に :443 明示があり対象URLが :443 明示なら通す', () => {
		expect(
			matchUrlPattern(
				'https://example.com:443/x',
				'https://example.com:443/*'
			)
		).toBe(true);
	});

	test('[ポート] パターン側に :443 明示があり対象URLが別ポートなら弾く', () => {
		expect(
			matchUrlPattern(
				'https://example.com:8443/x',
				'https://example.com:443/*'
			)
		).toBe(false);
	});

	test('[ポート] パターン側にポート指定なしならポート不問', () => {
		expect(
			matchUrlPattern(
				'https://example.com:8443/x',
				'https://example.com/*'
			)
		).toBe(true);
	});
});

describe('visual-embed: matchUrlPattern (クエリ)', () => {
	test('[クエリ] パターン側に ?key=ABC があり対象URLが同一なら通す', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed?key=ABC',
				'https://example.com/embed?key=ABC'
			)
		).toBe(true);
	});

	test('[クエリ] パターン側に ?key=ABC があり対象URLが ?key=XYZ なら弾く', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed?key=XYZ',
				'https://example.com/embed?key=ABC'
			)
		).toBe(false);
	});

	test('[クエリ] パターン側に ?key=* のワイルドカードがあれば任意の値を許可', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed?key=anything',
				'https://example.com/embed?key=*'
			)
		).toBe(true);
	});

	test('[クエリ] パターン側にクエリ指定なしなら対象URLのクエリは不問', () => {
		expect(
			matchUrlPattern(
				'https://www.google.com/maps?q=tokyo',
				'https://*.google.com/*'
			)
		).toBe(true);
	});

	test('[クエリ] パターン側にクエリ指定あるが対象URLにクエリがないなら弾く', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed',
				'https://example.com/embed?key=ABC'
			)
		).toBe(false);
	});
});

describe('visual-embed: matchUrlPattern (ハッシュフラグメント)', () => {
	test('[ハッシュ] パターン側に #safe があり対象URLが同一なら通す', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed#safe',
				'https://example.com/embed#safe'
			)
		).toBe(true);
	});

	test('[ハッシュ] パターン側に #safe があり対象URLが #anything なら弾く', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed#anything',
				'https://example.com/embed#safe'
			)
		).toBe(false);
	});

	test('[ハッシュ] パターン側に #* のワイルドカードがあれば任意の値を許可', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed#anything',
				'https://example.com/embed#*'
			)
		).toBe(true);
	});

	test('[ハッシュ] パターン側にハッシュ指定なしなら対象URLのハッシュは不問', () => {
		expect(
			matchUrlPattern(
				'https://www.google.com/maps#section',
				'https://*.google.com/*'
			)
		).toBe(true);
	});

	test('[ハッシュ] パターン側にハッシュ指定あるが対象URLにハッシュがないなら弾く', () => {
		expect(
			matchUrlPattern(
				'https://example.com/embed',
				'https://example.com/embed#safe'
			)
		).toBe(false);
	});
});

describe('visual-embed: isAllowedSrc', () => {
	const PATTERNS = [
		'https://*.google.com/*',
		'https://*.youtube.com/embed/*',
		'https://www.openstreetmap.org/export/*',
		'https://player.vimeo.com/*',
	];

	test('許可パターンのいずれかにマッチすれば true', () => {
		expect(isAllowedSrc('https://www.google.com/maps', PATTERNS)).toBe(
			true
		);
		expect(
			isAllowedSrc('https://www.youtube.com/embed/abc', PATTERNS)
		).toBe(true);
		expect(
			isAllowedSrc('https://player.vimeo.com/video/123', PATTERNS)
		).toBe(true);
	});

	test('どれにもマッチしなければ false', () => {
		expect(isAllowedSrc('https://attacker.com/x', PATTERNS)).toBe(false);
		expect(
			isAllowedSrc('https://www.google.com.attacker.com/x', PATTERNS)
		).toBe(false);
	});

	test('src が空/未定義/null なら false', () => {
		expect(isAllowedSrc('', PATTERNS)).toBe(false);
		expect(isAllowedSrc(undefined, PATTERNS)).toBe(false);
		expect(isAllowedSrc(null, PATTERNS)).toBe(false);
	});

	test('パターン配列が空/未定義なら false（フェイルクローズ）', () => {
		expect(isAllowedSrc('https://www.google.com/maps', [])).toBe(false);
		expect(isAllowedSrc('https://www.google.com/maps', undefined)).toBe(
			false
		);
	});
});
