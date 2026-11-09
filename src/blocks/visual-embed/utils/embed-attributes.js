/**
 * Build the iframe only from the attributes the block stores (`embedAttributes`).
 * ブロックが保存する属性（`embedAttributes`）だけから iframe を組み立てる。
 *
 * The same rules live in safe-embed.php (vk_blocks_visual_embed_sanitize_attributes()).
 * Changing only one side makes the editor preview and the saved / rendered iframe differ.
 * 同じ規則を safe-embed.php（vk_blocks_visual_embed_sanitize_attributes()）にも持っている。
 * 片方だけ変えると、エディタのプレビューと保存・描画される iframe が食い違う。
 */
import { decodeEntities } from '@wordpress/html-entities';
import { isAllowedSrc } from './match-url-pattern';

// Attribute names that may be stored and rendered. Keep the order: PHP writes the saved data in this order.
// 保存・描画してよい属性名。順番も PHP の出力順と同じに保つ。
export const EMBED_ATTRIBUTE_NAMES = [
	'src',
	'width',
	'height',
	'title',
	'class',
	'id',
	'allow',
	'allowfullscreen',
	'loading',
	'referrerpolicy',
	'frameborder',
	'scrolling',
	'style',
];

// Stored value of an embed that was cleared, rejected or lost. It is `{ src: '' }` instead of `{}` because WordPress
// re-serializes the blocks of users without unfiltered_html on save and turns an empty object into `[]`, which the
// editor would read as "not set" and replace with the default map.
// 消去・不許可・消失済みの埋め込みの保存値。`{}` ではなく `{ src: '' }` にしているのは、unfiltered_html の無い
// ユーザーの保存で WordPress がブロックを再シリアライズして空のオブジェクトを `[]` に変え、エディタが「未指定」
// とみなして既定の地図に戻してしまうのを防ぐため。
export const EMPTY_EMBED_ATTRIBUTES = { src: '' };

// Accepted width / height values (number, px or %).
// 幅・高さとして受け付ける値（数値・px・%）。
const SIZE_VALUE_REGEX = /^\d+(px|%)?$/;

// Style values that must not reach the preview iframe.
// プレビューの iframe に渡してはいけない style の値。
const UNSAFE_STYLE_REGEX = /expression|url\s*\(|@import|behavior|-moz-binding/i;

// Properties that let an iframe cover the page. Same rule as vk_blocks_visual_embed_remove_layout_style() in PHP.
// iframe でページ全体を覆えるプロパティ。PHP の vk_blocks_visual_embed_remove_layout_style() と同じ規則。
const LAYOUT_STYLE_PROPERTY_REGEX =
	/^(?:position|top|right|bottom|left|z-index|inset(?:-.+)?)$/;

// An entity left after decoding means a double-encoded value. Same expression as PHP.
// デコード後に残るエンティティは多重符号化された値。PHP と同じ式。
const REMAINING_ENTITY_REGEX = /&#?[A-Za-z0-9]+;/;

// Characters allowed in id and class tokens.
// id・class のトークンに使える文字。
const NAME_TOKEN_REGEX = /^[A-Za-z0-9_-]+$/;

/**
 * Decode only the references that end with `;`, the same as PHP html_entity_decode( ENT_QUOTES | ENT_HTML5 ).
 * `;` で終わる参照だけを戻す。PHP の html_entity_decode( ENT_QUOTES | ENT_HTML5 ) と同じ。
 *
 * decodeEntities() parses the text as HTML, so it also expands a legacy reference without `;`
 * (for example `&region` in `?a=1&region=JP` becomes `®ion`).
 * decodeEntities() は HTML として解析するため、`;` の無い旧来の参照も展開してしまう
 * （`?a=1&region=JP` の `&region` が `®ion` になる）。
 *
 * @param {string} value Attribute value.
 * @return {string} Decoded value.
 */
const decodeSemicolonEntities = (value) =>
	value.replace(/&#?[A-Za-z0-9]+;/g, (entity) => decodeEntities(entity));

/**
 * Remove the layout properties from a style value and keep the other declarations.
 * style の値から配置系のプロパティを除き、それ以外の宣言を残す。
 *
 * @param {string} style Style value.
 * @return {string} Style value without the layout properties.
 */
export const removeLayoutStyle = (style) =>
	style
		.split(';')
		.filter((declaration) => {
			const colon = declaration.indexOf(':');
			const property =
				colon < 0
					? ''
					: declaration.slice(0, colon).trim().toLowerCase();
			return (
				property !== '' && !LAYOUT_STYLE_PROPERTY_REGEX.test(property)
			);
		})
		.map((declaration) => declaration.trim())
		.join(';');

/**
 * Allowed URL patterns (defaults and the `vk_blocks_visual_embed_allowed_url_patterns` filter), passed from PHP.
 * PHP から渡される許可 URL パターン（既定値とフィルター `vk_blocks_visual_embed_allowed_url_patterns` の分）。
 *
 * @return {string[]} URL patterns.
 */
export const getAllowedUrlPatterns = () => {
	const patterns =
		typeof window !== 'undefined' &&
		window.vkBlocksVisualEmbed &&
		window.vkBlocksVisualEmbed.allowedUrlPatterns;
	return Array.isArray(patterns) ? patterns : [];
};

/**
 * Whether the value can be used as the iframe width / height.
 * 値を iframe の幅・高さとして使えるか。
 *
 * @param {string} value Width or height.
 * @return {boolean} True when the value is a number, px or %.
 */
export const isValidEmbedSize = (value) =>
	typeof value === 'string' && SIZE_VALUE_REGEX.test(value);

/**
 * Keep only the allowed attributes of the stored data. An iframe with a disallowed source becomes an empty object.
 * 保存データのうち許可された属性だけを残す。不許可の URL の iframe は空のオブジェクトにする。
 *
 * @param {Object}   data     Stored or pasted attributes.
 * @param {string[]} patterns Allowed URL patterns.
 * @return {Object} Safe attributes, or an empty object.
 */
export const sanitizeEmbedAttributes = (
	data,
	patterns = getAllowedUrlPatterns()
) => {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return {};
	}
	// KSES turns "&" into "&amp;" inside the saved data for users without unfiltered_html, so decode before checking.
	// unfiltered_html の無いユーザーの保存では KSES が保存データの "&" を "&amp;" に変えるため、判定の前に戻す。
	const src =
		typeof data.src === 'string' ? decodeSemicolonEntities(data.src) : '';
	if (REMAINING_ENTITY_REGEX.test(src) || !isAllowedSrc(src, patterns)) {
		return {};
	}
	const result = { src };
	EMBED_ATTRIBUTE_NAMES.forEach((name) => {
		if (name === 'src' || typeof data[name] !== 'string') {
			return;
		}
		const value = decodeSemicolonEntities(data[name]);
		if (['width', 'height'].includes(name) && !isValidEmbedSize(value)) {
			return;
		}
		let kept = value;
		if (name === 'style') {
			kept = UNSAFE_STYLE_REGEX.test(value)
				? ''
				: removeLayoutStyle(value);
		} else if (name === 'class') {
			kept = value
				.split(/\s+/)
				.filter((token) => NAME_TOKEN_REGEX.test(token))
				.join(' ');
		} else if (name === 'id') {
			kept = NAME_TOKEN_REGEX.test(value.trim()) ? value.trim() : '';
		}
		if (
			kept === '' &&
			(name === 'style' || name === 'class' || name === 'id')
		) {
			return;
		}
		result[name] = kept;
	});
	return result;
};

/**
 * Take the allowed attributes from the first iframe of pasted or legacy HTML. Everything else in the HTML is ignored.
 * 貼り付けた HTML や旧形式の HTML の最初の iframe から、許可された属性だけを取り出す。それ以外の HTML は使わない。
 *
 * @param {string}   code     Pasted embed code or legacy HTML.
 * @param {string[]} patterns Allowed URL patterns.
 * @return {Object} Safe attributes, or an empty object.
 */
export const extractEmbedAttributes = (
	code,
	patterns = getAllowedUrlPatterns()
) => {
	if (
		typeof code !== 'string' ||
		typeof window === 'undefined' ||
		typeof window.DOMParser === 'undefined'
	) {
		return {};
	}
	const iframe = new window.DOMParser()
		.parseFromString(code, 'text/html')
		.querySelector('iframe');
	if (!iframe) {
		return {};
	}
	const data = {};
	EMBED_ATTRIBUTE_NAMES.forEach((name) => {
		if (iframe.hasAttribute(name)) {
			data[name] = iframe.getAttribute(name);
		}
	});
	return sanitizeEmbedAttributes(data, patterns);
};

/**
 * Convert the attributes of a block saved by 1.130.1 or earlier (`iframeCode` and the saved preview HTML) into `embedAttributes`.
 * 1.130.1 以前が保存したブロックの属性（`iframeCode` と保存済みプレビューの HTML）を `embedAttributes` へ変換する。
 *
 * The saved preview HTML is used first because it is what the public page showed. An empty preview (the iframe was
 * removed by KSES) stays empty instead of falling back to the default map.
 * 公開ページに表示されていた保存済みプレビューの HTML を優先する。空のプレビュー（KSES で iframe が消えたもの）は
 * 既定の地図に戻さず空のままにする。
 *
 * @param {Object}   attributes Legacy block attributes.
 * @param {string[]} patterns   Allowed URL patterns.
 * @return {Object} Attributes for the current block version.
 */
export const migrateLegacyAttributes = (
	attributes,
	patterns = getAllowedUrlPatterns()
) => {
	const { iframeCode, legacyPreview, ...rest } = attributes;
	const embedAttributes = extractEmbedAttributes(
		legacyPreview !== undefined ? legacyPreview : iframeCode,
		patterns
	);
	return {
		...rest,
		embedAttributes: embedAttributes.src
			? embedAttributes
			: EMPTY_EMBED_ATTRIBUTES,
	};
};

/**
 * Build the iframe HTML for the editor preview from safe attributes.
 * 安全な属性からエディタのプレビュー用の iframe HTML を組み立てる。
 *
 * @param {Object} data Safe attributes.
 * @return {string} iframe HTML, or an empty string when there is no source.
 */
export const createIframeCode = (data) => {
	if (!data || !data.src || typeof document === 'undefined') {
		return '';
	}
	const iframe = document.createElement('iframe');
	EMBED_ATTRIBUTE_NAMES.forEach((name) => {
		if (data[name] !== undefined) {
			iframe.setAttribute(name, data[name]);
		}
	});
	return iframe.outerHTML;
};
