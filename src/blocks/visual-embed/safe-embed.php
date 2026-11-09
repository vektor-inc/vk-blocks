<?php
/**
 * Visual Embed: server-side validation, saving and rendering of the embed.
 * ビジュアル埋め込み: 埋め込みのサーバー側検証・保存・描画。
 *
 * The block stores the iframe source and allowed attributes (`embedAttributes`) instead of the iframe HTML.
 * They are validated before KSES on every save (including direct REST requests and legacy markup) and again
 * when rendering, and the iframe is built in PHP. The iframe tag is never added to the post allowed HTML list.
 * iframe の HTML ではなく、URL と許可した属性（`embedAttributes`）を保存する。保存のたびに KSES より前に
 * 検証し（REST の直接送信や旧形式のマークアップも含む）、描画時にも検証して PHP で iframe を組み立てる。
 * iframe タグを投稿本文の HTML 許可リストへ追加することはしない。
 *
 * @package vk-blocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get the allowed URL patterns used by both the editor and the server.
 * エディタとサーバーの両方で使う許可 URL パターンを取得する。
 *
 * @return string[] URL patterns such as `https://*.google.com/*`.
 */
function vk_blocks_visual_embed_allowed_patterns() {
	$default_patterns = array(
		'https://*.google.com/*',
		'https://*.youtube.com/embed/*',
		'https://www.openstreetmap.org/export/*',
		'https://player.vimeo.com/*',
	);

	/**
	 * Filters the additional allowed URL patterns of the Visual Embed block.
	 * ビジュアル埋め込みブロックで追加で許可する URL パターンを変更する。
	 *
	 * @param string[] $patterns Additional URL patterns. 追加の URL パターン。
	 */
	$additional_patterns = apply_filters( 'vk_blocks_visual_embed_allowed_url_patterns', array() );

	return array_merge( $default_patterns, is_array( $additional_patterns ) ? $additional_patterns : array() );
}

/**
 * Parse an HTTP(S) URL or a wildcard pattern into its components without browser-specific normalization.
 * HTTP(S) の URL またはワイルドカード付きパターンを、ブラウザー固有の補正を行わずに構成要素へ分解する。
 *
 * Only an unambiguous form is accepted: ASCII host, optional port, and no control characters, quotes,
 * angle brackets, backslashes, malformed percent-encoding or dot segments. Non-ASCII characters in the
 * path, query and fragment (for example Japanese map search words) are percent-encoded the same way as
 * browsers do, so the editor (JavaScript) and the server compare the same values.
 * あいまいさの無い形だけを受け付ける（ASCII のホスト、任意のポート。制御文字・引用符・山括弧・バックスラッシュ・
 * 不正なパーセント符号化・ドット区間は不可）。パス・クエリ・フラグメントの非 ASCII 文字（日本語の地図の検索語など）
 * はブラウザーと同じ方法でパーセント符号化し、エディタ（JavaScript）とサーバーが同じ値を比較できるようにする。
 *
 * @param mixed $value URL or pattern.
 * @return array|false Components (scheme, host, port, path, query, hash), or false when not accepted.
 */
function vk_blocks_visual_embed_parse_url( $value ) {
	if ( ! is_string( $value ) || preg_match( '/[\x00-\x1f\x7f<>"\'\\\\]/', $value ) || preg_match( '/%(?![a-f0-9]{2})/i', $value ) ) {
		return false;
	}
	if ( ! preg_match( '~^(https?)://([a-z0-9.*-]+)(?::([0-9]+))?(/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$~iD', $value, $matches ) ) {
		return false;
	}

	// Percent-encode non-ASCII characters in the path, query and fragment.
	// パス・クエリ・フラグメントの非 ASCII 文字をパーセント符号化する。
	foreach ( array( 4, 5, 6 ) as $index ) {
		if ( isset( $matches[ $index ] ) ) {
			$matches[ $index ] = preg_replace_callback(
				'/[^\x21-\x7e]+/',
				/**
				 * Percent-encode one run of non-ASCII characters.
				 * 非 ASCII 文字の並び 1 つをパーセント符号化する。
				 *
				 * @param string[] $segment Matched characters.
				 * @return string Percent-encoded characters.
				 */
				static function ( $segment ) {
					return rawurlencode( $segment[0] );
				},
				$matches[ $index ]
			);
		}
	}

	$path = isset( $matches[4] ) && '' !== $matches[4] ? $matches[4] : '/';
	// Dot segments are resolved differently by PHP and browsers, so they are rejected.
	// ドット区間は PHP とブラウザーで解釈が違うため受け付けない。
	if ( preg_match( '~(?:^|/)(?:\.|%2e){1,2}(?:/|$)~i', $path ) ) {
		return false;
	}

	$port = isset( $matches[3] ) ? $matches[3] : '';
	if ( '' !== $port && ( (int) $port > 65535 || (string) (int) $port !== $port ) ) {
		return false;
	}

	return array(
		'scheme' => strtolower( $matches[1] ),
		'host'   => strtolower( $matches[2] ),
		'port'   => $port,
		'path'   => $path,
		'query'  => isset( $matches[5] ) ? $matches[5] : '',
		'hash'   => isset( $matches[6] ) ? $matches[6] : '',
	);
}

/**
 * Check a URL against one allowed pattern with the same rules as the editor (matchUrlPattern()).
 * 1 つの許可パターンに対して、エディタ（matchUrlPattern()）と同じ規則で URL を照合する。
 *
 * The scheme must match, the host is compared at a domain boundary (`*.example.com` allows `example.com`
 * and its subdomains only), a port written in the pattern must match, and the path, query and fragment
 * follow the `*` wildcard. A query or fragment is checked only when the pattern has one.
 * スキームが一致し、ホストはドメイン境界で比較し（`*.example.com` は `example.com` とそのサブドメインだけを許可）、
 * パターンにポートがあれば一致を求め、パス・クエリ・フラグメントは `*` のワイルドカードで照合する。
 * クエリとフラグメントはパターンにある場合だけ照合する。
 *
 * @param mixed $url     URL to check.
 * @param mixed $pattern Allowed URL pattern.
 * @return bool True when the URL matches the pattern.
 */
function vk_blocks_visual_embed_match_url( $url, $pattern ) {
	$target  = vk_blocks_visual_embed_parse_url( $url );
	$allowed = vk_blocks_visual_embed_parse_url( $pattern );
	if ( ! $target || ! $allowed || false !== strpos( $target['host'], '*' ) || $target['scheme'] !== $allowed['scheme'] ) {
		return false;
	}

	// Host: domain boundary match.
	// ホスト: ドメイン境界で照合する。
	$allowed_host = $allowed['host'];
	if ( 0 === strpos( $allowed_host, '*.' ) ) {
		$suffix = substr( $allowed_host, 2 );
		if ( $target['host'] !== $suffix && substr( $target['host'], -strlen( '.' . $suffix ) ) !== '.' . $suffix ) {
			return false;
		}
	} elseif ( $allowed_host !== $target['host'] ) {
		return false;
	}

	// Port: required only when the pattern specifies one.
	// ポート: パターンに指定がある場合だけ一致を求める。
	if ( '' !== $allowed['port'] && $target['port'] !== $allowed['port'] ) {
		return false;
	}

	// Path, query and fragment: `*` wildcard.
	// パス・クエリ・フラグメント: `*` のワイルドカードで照合する。
	foreach ( array( 'path', 'query', 'hash' ) as $part ) {
		if ( 'path' !== $part && '' === $allowed[ $part ] ) {
			continue;
		}
		$regex = str_replace( '\\*', '.*', preg_quote( $allowed[ $part ], '~' ) );
		if ( ! preg_match( '~^' . $regex . '$~D', $target[ $part ] ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Whether the source URL matches one of the allowed patterns (defaults and filter).
 * URL が許可パターン（既定値とフィルター）のいずれかに一致するか。
 *
 * @param mixed $src Source URL.
 * @return bool True when allowed.
 */
function vk_blocks_visual_embed_is_allowed_src( $src ) {
	foreach ( vk_blocks_visual_embed_allowed_patterns() as $pattern ) {
		if ( vk_blocks_visual_embed_match_url( $src, $pattern ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Get the iframe attribute names that may be stored and rendered, in output order.
 * 保存・描画してよい iframe の属性名を、出力順で取得する。
 *
 * Keep in sync with EMBED_ATTRIBUTE_NAMES in utils/embed-attributes.js.
 * utils/embed-attributes.js の EMBED_ATTRIBUTE_NAMES と同じ一覧に保つこと。
 *
 * @return string[] Attribute names.
 */
function vk_blocks_visual_embed_attribute_names() {
	return array( 'src', 'width', 'height', 'title', 'class', 'id', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy', 'frameborder', 'scrolling', 'style' );
}

/**
 * Remove the properties that let an iframe cover the page (position, offsets, inset and z-index) from a style value.
 * iframe でページ全体を覆えるプロパティ（position・上下左右・inset・z-index）を style から除く。
 *
 * Other properties are kept, so styles that existing users have set are not lost.
 * それ以外は残すので、既存ユーザーが付けた style は消えない。
 *
 * @param string $style Style value already filtered by safecss_filter_attr().
 * @return string Style value without the layout properties.
 */
function vk_blocks_visual_embed_remove_layout_style( $style ) {
	$kept = array();
	foreach ( explode( ';', $style ) as $declaration ) {
		$property = strtolower( trim( strstr( $declaration, ':', true ) ) );
		if ( '' === $property || preg_match( '/^(?:position|top|right|bottom|left|z-index|inset(?:-.+)?)$/', $property ) ) {
			continue;
		}
		$kept[] = trim( $declaration );
	}
	return implode( ';', $kept );
}

/**
 * Keep only the allowed attributes of the stored data. Data whose source is not allowed becomes empty.
 * 保存データのうち許可された属性だけを残す。URL が許可されていないデータは空にする。
 *
 * Attribute values are entity-decoded first because KSES turns `&` into `&amp;` inside the saved data for
 * users without unfiltered_html. Width and height must be a number, px or %. The style value goes through
 * safecss_filter_attr() and the other values through sanitize_text_field(). Attribute names outside
 * vk_blocks_visual_embed_attribute_names() (for example `srcdoc` or `onload`) are never kept.
 * unfiltered_html の無いユーザーの保存では KSES が保存データの `&` を `&amp;` に変えるため、先にエンティティを戻す。
 * 幅と高さは数値・px・% のみ。style は safecss_filter_attr()、それ以外は sanitize_text_field() を通す。
 * vk_blocks_visual_embed_attribute_names() に無い属性名（`srcdoc`・`onload` など）は残さない。
 *
 * @param mixed $data Stored or extracted attributes.
 * @return array Safe attributes keyed by name, or an empty array.
 */
function vk_blocks_visual_embed_sanitize_attributes( $data ) {
	if ( is_object( $data ) ) {
		$data = (array) $data;
	}
	if ( ! is_array( $data ) || ! isset( $data['src'] ) || ! is_string( $data['src'] ) ) {
		return array();
	}

	$src = html_entity_decode( $data['src'], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	// A source that still contains an entity after decoding (for example `&#x2e;`) is a double-encoded value. Reject it.
	// デコード後もエンティティ（`&#x2e;` など）が残る src は多重符号化された値なので拒否する。
	if ( preg_match( '/&#?[A-Za-z0-9]+;/', $src ) || ! vk_blocks_visual_embed_is_allowed_src( $src ) ) {
		return array();
	}

	$result = array( 'src' => $src );
	foreach ( vk_blocks_visual_embed_attribute_names() as $name ) {
		if ( 'src' === $name || ! isset( $data[ $name ] ) || ! is_string( $data[ $name ] ) ) {
			continue;
		}
		$value = html_entity_decode( $data[ $name ], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		if ( 'width' === $name || 'height' === $name ) {
			if ( ! preg_match( '/^\d+(?:px|%)?$/D', $value ) ) {
				continue;
			}
		} elseif ( 'style' === $name ) {
			$value = vk_blocks_visual_embed_remove_layout_style( safecss_filter_attr( $value ) );
			if ( '' === $value ) {
				continue;
			}
		} elseif ( 'id' === $name || 'class' === $name ) {
			// Only letters, digits, `_` and `-` (class names separated by spaces).
			// 英数字・`_`・`-` のみ（class は空白区切りで複数可）。外れる値は除去する。
			$tokens = preg_split( '/\s+/', trim( $value ), -1, PREG_SPLIT_NO_EMPTY );
			$tokens = array_filter(
				$tokens,
				static function ( $token ) {
					return (bool) preg_match( '/^[A-Za-z0-9_-]+$/D', $token );
				}
			);
			if ( 'id' === $name ) {
				$tokens = 1 === count( $tokens ) && 1 === count( preg_split( '/\s+/', trim( $value ) ) ) ? $tokens : array();
			}
			$value = implode( ' ', $tokens );
			if ( '' === $value ) {
				continue;
			}
		} else {
			$value = sanitize_text_field( $value );
		}
		$result[ $name ] = $value;
	}

	return $result;
}

/**
 * Take the allowed attributes from the first iframe of legacy or pasted HTML. The rest of the HTML is ignored.
 * 旧形式または貼り付けられた HTML の最初の iframe から、許可された属性だけを取り出す。それ以外の HTML は使わない。
 *
 * @param mixed $html Legacy block HTML or pasted embed code.
 * @return array Safe attributes, or an empty array when there is no allowed iframe.
 */
function vk_blocks_visual_embed_extract_attributes( $html ) {
	if ( ! is_string( $html ) || '' === trim( $html ) ) {
		return array();
	}

	$processor = new WP_HTML_Tag_Processor( $html );
	if ( ! $processor->next_tag( 'iframe' ) ) {
		return array();
	}

	$data = array();
	foreach ( vk_blocks_visual_embed_attribute_names() as $name ) {
		$value = $processor->get_attribute( $name );
		// A boolean attribute (for example `allowfullscreen` without a value) is returned as true.
		// 値の無い属性（`allowfullscreen` だけの書き方など）は true で返る。
		if ( true === $value ) {
			$value = '';
		}
		if ( is_string( $value ) ) {
			$data[ $name ] = $value;
		}
	}

	return vk_blocks_visual_embed_sanitize_attributes( $data );
}

/**
 * Get the default embed (the `embedAttributes` default of block.json) as safe attributes.
 * 既定の埋め込み（block.json の `embedAttributes` の既定値）を安全な属性として取得する。
 *
 * @return array Safe attributes of the default embed.
 */
function vk_blocks_visual_embed_default_attributes() {
	static $default_attributes = null;
	if ( null === $default_attributes ) {
		$metadata           = wp_json_file_decode( __DIR__ . '/block.json', array( 'associative' => true ) );
		$default_attributes = vk_blocks_visual_embed_sanitize_attributes(
			isset( $metadata['attributes']['embedAttributes']['default'] ) ? $metadata['attributes']['embedAttributes']['default'] : array()
		);
	}
	return $default_attributes;
}

/**
 * Resolve the safe iframe attributes of a block from its raw attributes and saved HTML.
 * ブロックの生の属性と保存済み HTML から、安全な iframe の属性を求める。
 *
 * Order of precedence:
 * 1. `embedAttributes` (current format). An empty object means the embed was cleared or lost.
 * 2. Saved HTML (legacy format): the iframe is taken from what the public page displayed.
 *    An emptied preview (the iframe was removed by KSES) stays empty.
 * 3. `iframeCode` (legacy attribute without saved HTML).
 * 4. Otherwise the default embed of block.json.
 * 優先順位:
 * 1. `embedAttributes`（現在の形式）。空のオブジェクトは消去済み・消失済みを表す。
 * 2. 保存済み HTML（旧形式）。公開ページに表示されていた iframe を使う。
 *    空になったプレビュー（KSES で iframe が消えたもの）は空のままにする。
 * 3. `iframeCode`（保存済み HTML の無い旧形式の属性）。
 * 4. いずれも無ければ block.json の既定の埋め込み。
 *
 * @param array  $attributes Raw block attributes (as parsed from the block comment).
 * @param string $content    Saved block HTML (empty for the current format).
 * @return array Safe attributes, or an empty array.
 */
function vk_blocks_visual_embed_get_attributes( $attributes, $content = '' ) {
	$attributes = is_array( $attributes ) ? $attributes : array();
	if ( array_key_exists( 'embedAttributes', $attributes ) ) {
		return vk_blocks_visual_embed_sanitize_attributes( $attributes['embedAttributes'] );
	}
	if ( is_string( $content ) && '' !== trim( $content ) ) {
		return vk_blocks_visual_embed_extract_attributes( $content );
	}
	if ( array_key_exists( 'iframeCode', $attributes ) ) {
		return vk_blocks_visual_embed_extract_attributes( $attributes['iframeCode'] );
	}
	return vk_blocks_visual_embed_default_attributes();
}

/**
 * Convert the raw attributes of one block to the current format with validated `embedAttributes`.
 * 1 つのブロックの生の属性を、検証済みの `embedAttributes` を持つ現在の形式へ変換する。
 *
 * An embed that was cleared, rejected or lost is stored as `{"src":""}` rather than `{}`. KSES re-serializes
 * the blocks of users without unfiltered_html and turns an empty object into `[]`, which the editor would read
 * as "not set" and replace with the default map.
 * 消去・不許可・消失済みの埋め込みは `{}` ではなく `{"src":""}` で保存する。unfiltered_html の無いユーザーの
 * 保存では KSES がブロックを再シリアライズして空のオブジェクトを `[]` に変え、エディタが「未指定」とみなして
 * 既定の地図に戻してしまうため。
 *
 * @param array  $attributes Raw block attributes.
 * @param string $content    Saved block HTML (legacy format).
 * @return array Attributes to serialize.
 */
function vk_blocks_visual_embed_normalize_block_attributes( $attributes, $content = '' ) {
	$attributes = is_array( $attributes ) ? $attributes : array();
	$embed      = vk_blocks_visual_embed_get_attributes( $attributes, $content );
	unset( $attributes['iframeCode'], $attributes['legacyPreview'] );
	$attributes['embedAttributes'] = empty( $embed ) ? array( 'src' => '' ) : $embed;
	return $attributes;
}

/**
 * Rewrite every Visual Embed block in the post content into the current, validated format.
 * 本文中のすべてのビジュアル埋め込みブロックを、検証済みの現在の形式へ書き換える。
 *
 * Only the Visual Embed blocks are replaced; the rest of the content is left byte for byte as it was.
 * The whole content is deliberately not run through parse_blocks() / serialize_blocks(), because that
 * round trip changes the attributes of other blocks (for example an empty object becomes `[]`).
 * A block comment that is not closed is left untouched (the render callback still validates it).
 * When a regular expression fails (for example the PCRE limit is exceeded), the content is returned unchanged.
 * 書き換えるのはビジュアル埋め込みブロックだけで、それ以外の本文は 1 バイトも変えない。
 * 本文全体を parse_blocks() / serialize_blocks() に通すと他のブロックの属性が変わる（空のオブジェクトが
 * `[]` になるなど）ため、あえて使わない。閉じられていないブロックコメントはそのまま残す（描画時に検証される）。
 * 正規表現が失敗した場合（PCRE の上限を超えた場合など）は、本文をそのまま返す。
 *
 * @param string $content Unslashed post content.
 * @return string Post content with the Visual Embed blocks rewritten.
 */
function vk_blocks_visual_embed_normalize_content( $content ) {
	if ( ! is_string( $content ) || false === strpos( $content, 'wp:vk-blocks/visual-embed' ) ) {
		return $content;
	}

	/**
	 * Serialize one Visual Embed block in the current format from its attributes JSON and saved HTML.
	 * 属性の JSON と保存済み HTML から、1 つのビジュアル埋め込みブロックを現在の形式で書き出す。
	 *
	 * @param string $attributes_json Attributes JSON of the block comment (empty when there is none).
	 * @param string $block_html      Saved block HTML (empty for the current format).
	 * @return string Serialized block.
	 */
	$serialize = static function ( $attributes_json, $block_html ) {
		$attributes = '' !== $attributes_json ? json_decode( $attributes_json, true ) : array();
		return serialize_block(
			array(
				'blockName'    => 'vk-blocks/visual-embed',
				'attrs'        => vk_blocks_visual_embed_normalize_block_attributes( $attributes, $block_html ),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);
	};

	// The attributes JSON is matched with the same expression as the WordPress block parser (WP_Block_Parser).
	// The loops are possessive: a lazy loop such as `(?:(?!-->).)*?` exhausts the PCRE JIT stack on a block of
	// a few tens of KB, preg_replace_callback() then returns null and the whole post content would be emptied.
	// 属性の JSON は WordPress のブロックパーサー（WP_Block_Parser）と同じ式で照合する。
	// 繰り返しは所有格にしている。`(?:(?!-->).)*?` のような最短一致の繰り返しは数十 KB のブロックで PCRE の
	// JIT スタックを使い切り、preg_replace_callback() が null を返して本文全体が空になるため。
	$attributes_pattern = '(?:(\{(?:(?:[^}]+|\}+(?=\})|(?!\}\s+/?-->).)*+)?\})\s+)?';

	// Legacy format: opening comment, saved HTML (never containing another block comment), closing comment.
	// 旧形式: 開始コメント、保存済み HTML（他のブロックコメントは含まない）、終了コメント。
	$normalized = preg_replace_callback(
		'~<!--\s+wp:vk-blocks/visual-embed\s+' . $attributes_pattern . '-->((?:[^<]++|<(?!!--\s+/?wp:))*+)<!--\s+/wp:vk-blocks/visual-embed\s+-->~s',
		/**
		 * Rewrite one legacy block.
		 * 旧形式のブロック 1 つを書き換える。
		 *
		 * @param string[] $matches 1: attributes JSON, 2: saved HTML.
		 * @return string Serialized block.
		 */
		static function ( $matches ) use ( $serialize ) {
			return $serialize( $matches[1], $matches[2] );
		},
		$content
	);

	// Current format: self-closing comment.
	// 現在の形式: 自己終了のコメント。
	if ( is_string( $normalized ) ) {
		$normalized = preg_replace_callback(
			'~<!--\s+wp:vk-blocks/visual-embed\s+' . $attributes_pattern . '/-->~s',
			/**
			 * Rewrite one block in the current format.
			 * 現在の形式のブロック 1 つを書き換える。
			 *
			 * @param string[] $matches 1: attributes JSON (missing when there is none).
			 * @return string Serialized block.
			 */
			static function ( $matches ) use ( $serialize ) {
				return $serialize( isset( $matches[1] ) ? $matches[1] : '', '' );
			},
			$normalized
		);
	}

	// Keep the content as it was rather than saving an empty post when a regular expression fails.
	// 正規表現が失敗した場合は、空の本文を保存せず元の本文を返す。
	return is_string( $normalized ) ? $normalized : $content;
}

/**
 * Validate the Visual Embed blocks on every save, before KSES removes the iframe.
 * 保存のたびに、KSES が iframe を消す前にビジュアル埋め込みブロックを検証する。
 *
 * Runs on `content_save_pre` for all users and all save paths (the editor, direct REST requests, revisions),
 * so a disallowed source or an unknown attribute is never stored, and legacy blocks are moved to the
 * current format when the post is saved.
 * すべてのユーザー・すべての保存経路（エディタ・REST の直接送信・リビジョン）で `content_save_pre` から実行する。
 * 不許可の URL や未知の属性は保存されず、旧形式のブロックは投稿の保存時に現在の形式へ移る。
 *
 * @param string $content Slashed post content.
 * @return string Slashed post content.
 */
function vk_blocks_visual_embed_filter_saved_content( $content ) {
	if ( ! is_string( $content ) || false === strpos( $content, 'wp:vk-blocks/visual-embed' ) ) {
		return $content;
	}
	$unslashed  = wp_unslash( $content );
	$normalized = vk_blocks_visual_embed_normalize_content( $unslashed );
	return $normalized === $unslashed ? $content : wp_slash( $normalized );
}
// Before wp_filter_post_kses() (priority 10). wp_filter_post_kses()（優先度 10）より前に実行する。
add_filter( 'content_save_pre', 'vk_blocks_visual_embed_filter_saved_content', 9 );

/**
 * Render the block from validated attributes only (legacy saved HTML is never output as is).
 * 検証済みの属性だけからブロックを描画する（旧形式の保存済み HTML をそのまま出力することはない）。
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Saved block HTML (legacy format).
 * @param WP_Block $block      Block instance.
 * @return string Block HTML.
 */
function vk_blocks_visual_embed_render( $attributes, $content, $block ) {
	$raw_attributes = isset( $block->parsed_block['attrs'] ) ? $block->parsed_block['attrs'] : $attributes;
	$embed          = vk_blocks_visual_embed_get_attributes( $raw_attributes, $content );
	$wrapper        = get_block_wrapper_attributes( array( 'class' => 'vk-visual-embed' ) );

	if ( empty( $embed ) ) {
		return '<div ' . $wrapper . '></div>';
	}

	// Escape with double encoding so that the browser receives exactly the validated string (esc_attr() keeps a valid entity such as `&#x2e;` as is).
	// 二重エンコードで出力し、検証した文字列がそのままブラウザーに渡るようにする（esc_attr() は `&#x2e;` のような有効なエンティティを変えない）。
	$iframe_attributes = '';
	foreach ( $embed as $name => $value ) {
		$iframe_attributes .= ' ' . $name . '="' . htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' ) . '"';
	}

	return '<div ' . $wrapper . '><div class="vk-visual-embed-preview"><iframe' . $iframe_attributes . '></iframe></div></div>';
}
