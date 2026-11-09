/**
 * Allowed-URL check shared with the server (vk_blocks_visual_embed_match_url() in safe-embed.php).
 * サーバー側（safe-embed.php の vk_blocks_visual_embed_match_url()）と共通の許可 URL 判定。
 *
 * Both sides parse the URL with the same rules instead of `new URL()` so that the editor and PHP accept and
 * reject exactly the same strings. The shared cases live in test/fixtures/visual-embed-url-cases.json.
 * Changing a rule here without changing the PHP side makes the editor accept a URL that the server rejects
 * (or the other way round).
 * `new URL()` ではなく PHP と同じ規則で URL を解析し、エディタと PHP が同じ文字列を同じように許可・拒否する。
 * 共通のテストケースは test/fixtures/visual-embed-url-cases.json。ここの規則だけを変えると、エディタでは
 * 通るのにサーバーで拒否される（またはその逆の）URL ができる。
 */

// Characters that are never accepted (control characters, quotes, angle brackets, backslash).
// 受け付けない文字（制御文字・引用符・山括弧・バックスラッシュ）。
const FORBIDDEN_CHARACTERS_REGEX = /[\x00-\x1f\x7f<>"'\\]/;

// Malformed percent-encoding such as "%xx". 不正なパーセント符号化（"%xx" など）。
const MALFORMED_PERCENT_REGEX = /%(?![a-f0-9]{2})/i;

// scheme, host (ASCII, "*" allowed for patterns), optional port, path, query, fragment.
// スキーム・ホスト（ASCII。パターンでは "*" 可）・任意のポート・パス・クエリ・フラグメント。
const URL_REGEX =
	/^(https?):\/\/([a-z0-9.*-]+)(?::([0-9]+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i;

// Dot segments ("." or "..", also percent-encoded) are resolved differently by browsers and PHP.
// ドット区間（"." や ".."、パーセント符号化したものも）はブラウザーと PHP で解釈が違う。
const DOT_SEGMENT_REGEX = /(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)/i;

// Characters outside printable ASCII are percent-encoded the same way as PHP's rawurlencode().
// 表示可能な ASCII 以外の文字は PHP の rawurlencode() と同じ方法でパーセント符号化する。
const NON_ASCII_REGEX = /[^\x21-\x7e]+/g;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Parse an HTTP(S) URL or a wildcard pattern into its components without browser-specific normalization.
 * HTTP(S) の URL またはワイルドカード付きパターンを、ブラウザー固有の補正を行わずに構成要素へ分解する。
 *
 * @param {unknown} value URL or pattern.
 * @return {Object|null} Components (scheme, host, port, path, query, hash), or null when not accepted.
 */
const parseEmbedUrl = (value) => {
	if (
		typeof value !== 'string' ||
		FORBIDDEN_CHARACTERS_REGEX.test(value) ||
		MALFORMED_PERCENT_REGEX.test(value)
	) {
		return null;
	}
	const match = value.match(URL_REGEX);
	if (!match) {
		return null;
	}
	const encodeComponent = (part = '') =>
		part.replace(NON_ASCII_REGEX, (text) => encodeURIComponent(text));
	let path, query, hash;
	try {
		path = encodeComponent(match[4]) || '/';
		query = encodeComponent(match[5]);
		hash = encodeComponent(match[6]);
	} catch (error) {
		// encodeURIComponent() throws on a lone surrogate. Reject the URL instead of breaking the block.
		// encodeURIComponent() は対になっていないサロゲート文字で例外を出す。ブロックを壊さず不許可として扱う。
		return null;
	}
	if (DOT_SEGMENT_REGEX.test(path)) {
		return null;
	}
	const port = match[3] || '';
	if (port && (Number(port) > 65535 || String(Number(port)) !== port)) {
		return null;
	}
	return {
		scheme: match[1].toLowerCase(),
		host: match[2].toLowerCase(),
		port,
		path,
		query,
		hash,
	};
};

/**
 * Match a hostname at a domain boundary. `*.example.com` allows `example.com` and its subdomains only.
 * ホスト名をドメイン境界で照合する。`*.example.com` は `example.com` とそのサブドメインだけを許可する。
 *
 * @param {string} hostname    Hostname of the URL to check.
 * @param {string} patternHost Hostname of the allowed pattern (may start with `*.`).
 * @return {boolean} True when the hostname matches.
 */
export const isHostMatch = (hostname, patternHost) => {
	if (!patternHost.startsWith('*.')) {
		return hostname === patternHost;
	}
	const suffix = patternHost.slice(2);
	return hostname === suffix || hostname.endsWith('.' + suffix);
};

/**
 * Check a URL against one allowed pattern with the same rules as the server.
 * 1 つの許可パターンに対して、サーバーと同じ規則で URL を照合する。
 *
 * The scheme must match, the host is compared at a domain boundary, a port written in the pattern must match,
 * and the path, query and fragment follow the `*` wildcard. A query or fragment is checked only when the
 * pattern has one.
 * スキームが一致し、ホストはドメイン境界で比較し、パターンにポートがあれば一致を求め、パス・クエリ・
 * フラグメントは `*` のワイルドカードで照合する。クエリとフラグメントはパターンにある場合だけ照合する。
 *
 * @param {unknown} urlStr     URL to check.
 * @param {unknown} patternStr Allowed URL pattern (for example `https://*.google.com/*`).
 * @return {boolean} True when the URL matches the pattern.
 */
export const matchUrlPattern = (urlStr, patternStr) => {
	const url = parseEmbedUrl(urlStr);
	const pattern = parseEmbedUrl(patternStr);
	if (
		!url ||
		!pattern ||
		url.host.includes('*') ||
		url.scheme !== pattern.scheme ||
		!isHostMatch(url.host, pattern.host) ||
		(pattern.port && url.port !== pattern.port)
	) {
		return false;
	}
	return ['path', 'query', 'hash'].every((part) => {
		if (part !== 'path' && !pattern[part]) {
			return true;
		}
		const expression = pattern[part]
			.split('*')
			.map(escapeRegExp)
			.join('.*');
		return new RegExp('^' + expression + '$').test(url[part]);
	});
};

/**
 * Whether the source URL matches one of the allowed patterns.
 * URL が許可パターンのいずれかに一致するか。
 *
 * @param {unknown}  src      Source URL.
 * @param {string[]} patterns Allowed URL patterns.
 * @return {boolean} True when allowed.
 */
export const isAllowedSrc = (src, patterns) =>
	Array.isArray(patterns) &&
	patterns.some((pattern) => matchUrlPattern(src, pattern));
