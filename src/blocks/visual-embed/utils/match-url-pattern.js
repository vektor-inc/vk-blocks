/**
 * 許可 URL パターンと src URL のドメイン境界一致を判定するユーティリティ。
 *
 * `https://*.example.com/path/*` のようなパターン表記をサポートし、
 * - ホスト名はドメイン境界（ドット区切り）で判定して
 *   `https://attacker.com/.example.com/...` のような偽装を弾く
 * - パス側は `*` を正規表現の `.*` に展開して柔軟一致
 * を行う。
 */

// ワイルドカードを URL として解釈するためのプレースホルダ。
// ユーザーが入力する許可 URL パターンにこの文字列が含まれる現実性はほぼ
// ゼロだが、衝突可能性をさらに下げるため目立つ識別子にしている。
const WILDCARD_PLACEHOLDER = 'vkwildcardplaceholder';

// 正規表現特殊文字をエスケープ。
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * ホスト名のドメイン境界一致判定。
 *
 * patternHost が "*.example.com" のとき、 "example.com" 自体と
 * 任意のサブドメインを許可する（パス側の偽装サブドメインは弾く）。
 *
 * @param {string} hostname    検証対象 URL のホスト名
 * @param {string} patternHost 許可パターンのホスト名（`*.` プレフィックス可）
 * @return {boolean} 一致すれば true
 */
export const isHostMatch = (hostname, patternHost) => {
	if (!patternHost.startsWith('*.')) {
		return hostname === patternHost;
	}
	const suffix = patternHost.slice(2);
	return hostname === suffix || hostname.endsWith('.' + suffix);
};

// 生 URL 文字列から明示ポート（`:1234`）を抽出する。
// new URL() はデフォルトポート（http:80 / https:443）を空文字に正規化してしまうため、
// 「パターンがデフォルトポートを明示しているか」を保持できない。
// → 明示ポートが書かれていたら fail-close で一致を要求するために、文字列段階で抽出する。
const extractExplicitPort = (str) => {
	const m = str.match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*?:(\d+)(?=[/?#]|$)/i);
	return m ? m[1] : '';
};

/**
 * 許可パターンと src URL のドメイン境界マッチ。
 *
 * @param {string} urlStr     検証対象 URL
 * @param {string} patternStr 許可パターン（例: `https://*.google.com/*`）
 * @return {boolean} 一致すれば true
 */
export const matchUrlPattern = (urlStr, patternStr) => {
	// 型ガード。`.replace` を持つが `.match` を持たないオブジェクト等が
	// 紛れた場合に extractExplicitPort の中で例外が出るのを防ぎ、
	// fail-close に統一する。
	if (typeof urlStr !== 'string' || typeof patternStr !== 'string') {
		return false;
	}

	let url;
	let patternUrl;
	try {
		url = new URL(urlStr);
		patternUrl = new URL(patternStr.replace(/\*/g, WILDCARD_PLACEHOLDER));
	} catch (e) {
		return false;
	}

	// プロトコル一致
	if (url.protocol !== patternUrl.protocol) {
		return false;
	}

	// ホスト名はドメイン境界で判定（スラッシュを跨ぐ偽装を防ぐ）
	const patternHost = patternUrl.hostname.replace(
		new RegExp(WILDCARD_PLACEHOLDER, 'g'),
		'*'
	);
	if (!isHostMatch(url.hostname, patternHost)) {
		return false;
	}

	// 明示ポート一致（パターンが :443 / :80 のようなデフォルトポートを明示している場合も含めて、
	// 対象 URL 側にも同じ明示ポートが必要。fail-close で別ポートのバイパスを防ぐ）
	const patternExplicitPort = extractExplicitPort(patternStr);
	if (patternExplicitPort) {
		const urlExplicitPort = extractExplicitPort(urlStr);
		if (urlExplicitPort !== patternExplicitPort) {
			return false;
		}
	}

	// パスはワイルドカード対応の正規表現で判定
	const pathRegex = patternUrl.pathname
		.split(WILDCARD_PLACEHOLDER)
		.map(escapeRegExp)
		.join('.*');
	if (!new RegExp('^' + pathRegex + '$').test(url.pathname)) {
		return false;
	}

	// クエリが指定されていれば同じワイルドカード規則で判定
	// （pathname のみ比較すると、フル URL で絞っていた既存パターンが今までより
	//  広く許可されてしまうため、search も同じルールで比較する）
	if (patternUrl.search) {
		const searchRegex = patternUrl.search
			.slice(1)
			.split(WILDCARD_PLACEHOLDER)
			.map(escapeRegExp)
			.join('.*');
		if (!new RegExp('^' + searchRegex + '$').test(url.search.slice(1))) {
			return false;
		}
	}

	// フラグメント（#hash）が指定されていれば同じワイルドカード規則で判定
	// （search と同じく fail-close。パターン側に hash が無ければ不問）
	if (patternUrl.hash) {
		const hashRegex = patternUrl.hash
			.slice(1)
			.split(WILDCARD_PLACEHOLDER)
			.map(escapeRegExp)
			.join('.*');
		if (!new RegExp('^' + hashRegex + '$').test(url.hash.slice(1))) {
			return false;
		}
	}

	return true;
};

/**
 * src URL が許可パターン配列のいずれかにマッチするか判定する。
 *
 * @param {string}   src      検証対象 URL
 * @param {string[]} patterns 許可パターン配列
 * @return {boolean} いずれかに一致すれば true
 */
export const isAllowedSrc = (src, patterns) => {
	if (!src) {
		return false;
	}
	if (!Array.isArray(patterns) || patterns.length === 0) {
		return false;
	}
	return patterns.some((pattern) => matchUrlPattern(src, pattern));
};
