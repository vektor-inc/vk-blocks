/**
 * リンクツールバー用の URL 正規化ヘルパー。
 *
 * 入力された URL 文字列に対し、以下の条件に当てはまるものは「素通し」してそのまま返す:
 *  - `http://` / `https://` で始まる絶対 URL
 *  - `/` で始まる相対パス（サイト内絶対パス含む）
 *  - `#` で始まるページ内アンカー
 *  - `tel:` / `mailto:` などのスキーム
 *  - 空文字
 *
 * 上記以外（例: `example.com/foo`）の場合は、ブラウザが
 * ホスト名と誤解釈しないよう `http://` を補って返す。
 *
 * 文字列以外の値（undefined / null など）が渡された場合は、
 * `LinkToolbar` 側で `setLinkUrl('')` 経由で空文字に正規化される想定だが、
 * 念のため空文字を返してクラッシュしないようにする。
 *
 * @param {string} url 整形対象の URL 文字列
 * @return {string} 整形後の URL 文字列
 */
export const formatLinkUrl = (url) => {
	if (typeof url !== 'string' || url === '') {
		return '';
	}

	if (
		url.startsWith('http://') ||
		url.startsWith('https://') ||
		url.startsWith('/') ||
		url.startsWith('#') ||
		url.startsWith('tel:') ||
		url.startsWith('mailto:')
	) {
		return url;
	}

	// その他のリンクは http:// を付加する
	return 'http://' + url;
};

export default formatLinkUrl;
