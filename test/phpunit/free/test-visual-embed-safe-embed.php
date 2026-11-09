<?php
/**
 * Tests for the Visual Embed block server side (safe-embed.php).
 * ビジュアル埋め込みブロックのサーバー側（safe-embed.php）のテスト。
 *
 * @package Vk_Blocks_Pro
 */

/**
 * Class VKBlocksVisualEmbedSafeEmbedTest
 */
class VKBlocksVisualEmbedSafeEmbedTest extends WP_UnitTestCase {

	/**
	 * Load the implementation when the built block has not been loaded.
	 * ビルド済みのブロックが読み込まれていない場合に実装を読み込む。
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		if ( ! function_exists( 'vk_blocks_visual_embed_match_url' ) ) {
			require_once dirname( __DIR__, 3 ) . '/src/blocks/visual-embed/safe-embed.php';
		}
	}

	/**
	 * Restore the logged-out state and the KSES filters for it.
	 * 未ログインの状態と、その状態の KSES フィルターに戻す。
	 *
	 * @return void
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		kses_init();
		parent::tear_down();
	}

	/**
	 * Log in as a new user with the role and apply the KSES filters for that user.
	 * 指定した権限グループのユーザーを作ってログインし、そのユーザー向けの KSES フィルターを適用する。
	 *
	 * @param string $role User role.
	 * @return void
	 */
	private function login_as( $role ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );
		kses_init();
	}

	/**
	 * Build the markup that 1.130.1 and earlier saved.
	 * 1.130.1 以前が保存していたマークアップを組み立てる。
	 *
	 * @param array  $attributes   Block comment attributes.
	 * @param string $preview_html HTML inside the preview element.
	 * @param string $classes      Extra wrapper classes (align / custom class).
	 * @return string Block markup.
	 */
	private function legacy_block( $attributes, $preview_html, $classes = '' ) {
		$comment = empty( $attributes ) ? '<!-- wp:vk-blocks/visual-embed -->' : '<!-- wp:vk-blocks/visual-embed ' . serialize_block_attributes( $attributes ) . ' -->';
		$class   = 'wp-block-vk-blocks-visual-embed ' . ( '' !== $classes ? $classes . ' ' : '' ) . 'vk-visual-embed';
		return $comment . "\n" . '<div class="' . $class . '"><div class="vk-visual-embed-preview">' . $preview_html . '</div></div>' . "\n" . '<!-- /wp:vk-blocks/visual-embed -->';
	}

	/**
	 * Test vk_blocks_visual_embed_match_url().
	 * vk_blocks_visual_embed_match_url() のテスト。
	 *
	 * The cases are shared with the editor test (test/unit/visual-embed-embed-attributes.test.js) so that
	 * the JavaScript and PHP checks agree.
	 * エディタ側のテスト（test/unit/visual-embed-embed-attributes.test.js）とケースを共有し、JavaScript と PHP の判定が一致することを確かめる。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_match_url() {
		$shared_cases = wp_json_file_decode( dirname( __DIR__, 2 ) . '/fixtures/visual-embed-url-cases.json', array( 'associative' => true ) );
		$this->assertNotEmpty( $shared_cases );

		$test_cases = array(
			array(
				'test_condition_name' => 'パターン側が URL でない場合 => 不一致',
				'url'                 => 'https://www.google.com/maps',
				'pattern'             => 'not a url',
				'expected'            => false,
			),
			array(
				'test_condition_name' => 'パターン側が null の場合 => 不一致',
				'url'                 => 'https://www.google.com/maps',
				'pattern'             => null,
				'expected'            => false,
			),
			array(
				'test_condition_name' => 'URL のホストにワイルドカードを含む場合 => 不一致',
				'url'                 => 'https://*.google.com/maps',
				'pattern'             => 'https://*.google.com/*',
				'expected'            => false,
			),
			array(
				'test_condition_name' => 'パターンのパスの途中にワイルドカードがある場合 => 前後が一致すれば一致',
				'url'                 => 'https://www.google.com/maps/embed/v1/place?q=x',
				'pattern'             => 'https://www.google.com/maps/*/place?q=*',
				'expected'            => true,
			),
		);
		foreach ( $shared_cases as $case ) {
			$test_cases[] = array(
				'test_condition_name' => '共通ケース: ' . $case['name'],
				'url'                 => $case['url'],
				'pattern'             => $case['pattern'],
				'expected'            => $case['expected'],
			);
		}

		foreach ( $test_cases as $case ) {
			$this->assertSame( $case['expected'], vk_blocks_visual_embed_match_url( $case['url'], $case['pattern'] ), $case['test_condition_name'] );
		}
	}

	/**
	 * Test vk_blocks_visual_embed_is_allowed_src().
	 * vk_blocks_visual_embed_is_allowed_src() のテスト。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_is_allowed_src() {
		$add_pattern  = static function ( $patterns ) {
			$patterns[] = 'https://embed.example.test/*';
			return $patterns;
		};
		$break_filter = static function () {
			return 'https://embed.example.test/*';
		};

		$test_cases = array(
			array(
				'test_condition_name' => '既定の Google Maps => 許可',
				'conditions'          => array( 'filter' => null ),
				'src'                 => 'https://www.google.com/maps/embed?pb=!1m0',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '既定の YouTube 埋め込み => 許可',
				'conditions'          => array( 'filter' => null ),
				'src'                 => 'https://www.youtube.com/embed/abc',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '既定の OpenStreetMap エクスポート => 許可',
				'conditions'          => array( 'filter' => null ),
				'src'                 => 'https://www.openstreetmap.org/export/embed.html?bbox=1',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '既定の Vimeo プレイヤー => 許可',
				'conditions'          => array( 'filter' => null ),
				'src'                 => 'https://player.vimeo.com/video/1',
				'expected'            => true,
			),
			array(
				'test_condition_name' => 'YouTube の視聴ページ => 不許可',
				'conditions'          => array( 'filter' => null ),
				'src'                 => 'https://www.youtube.com/watch?v=abc',
				'expected'            => false,
			),
			array(
				'test_condition_name' => 'フィルター未登録の独自ドメイン => 不許可',
				'conditions'          => array( 'filter' => null ),
				'src'                 => 'https://embed.example.test/map',
				'expected'            => false,
			),
			array(
				'test_condition_name' => 'フィルターで追加した独自ドメイン => 許可',
				'conditions'          => array( 'filter' => $add_pattern ),
				'src'                 => 'https://embed.example.test/map',
				'expected'            => true,
			),
			array(
				'test_condition_name' => 'フィルターを追加しても別のドメイン => 不許可',
				'conditions'          => array( 'filter' => $add_pattern ),
				'src'                 => 'https://evil.test/embed',
				'expected'            => false,
			),
			array(
				'test_condition_name' => 'フィルターが配列以外を返した場合は既定だけ有効 => 既定の Google Maps は許可',
				'conditions'          => array( 'filter' => $break_filter ),
				'src'                 => 'https://www.google.com/maps',
				'expected'            => true,
			),
			array(
				'test_condition_name' => 'フィルターが配列以外を返した場合は追加分が無効 => 独自ドメインは不許可',
				'conditions'          => array( 'filter' => $break_filter ),
				'src'                 => 'https://embed.example.test/map',
				'expected'            => false,
			),
		);

		foreach ( $test_cases as $case ) {
			if ( $case['conditions']['filter'] ) {
				add_filter( 'vk_blocks_visual_embed_allowed_url_patterns', $case['conditions']['filter'] );
			}
			$this->assertSame( $case['expected'], vk_blocks_visual_embed_is_allowed_src( $case['src'] ), $case['test_condition_name'] );
			if ( $case['conditions']['filter'] ) {
				remove_filter( 'vk_blocks_visual_embed_allowed_url_patterns', $case['conditions']['filter'] );
			}
		}
	}

	/**
	 * Test vk_blocks_visual_embed_sanitize_attributes().
	 * vk_blocks_visual_embed_sanitize_attributes() のテスト。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_sanitize_attributes() {
		$test_cases = array(
			array(
				'test_condition_name' => '許可した属性だけを残し、未知の属性（srcdoc・onload・sandbox）は捨てる',
				'data'                => array(
					'src'             => 'https://www.youtube.com/embed/abc',
					'width'           => '560',
					'height'          => '315',
					'title'           => 'Video',
					'allowfullscreen' => '',
					'srcdoc'          => '<script>alert(1)</script>',
					'onload'          => 'alert(1)',
					'sandbox'         => '',
				),
				'expected'            => array(
					'src'             => 'https://www.youtube.com/embed/abc',
					'width'           => '560',
					'height'          => '315',
					'title'           => 'Video',
					'allowfullscreen' => '',
				),
			),
			array(
				'test_condition_name' => 'KSES で &amp; に変わった保存データは & に戻してから判定する',
				'data'                => array(
					'src'   => 'https://www.google.com/maps?a=1&amp;b=2',
					'title' => 'Tom &amp; Jerry',
				),
				'expected'            => array(
					'src'   => 'https://www.google.com/maps?a=1&b=2',
					'title' => 'Tom & Jerry',
				),
			),
			array(
				'test_condition_name' => '不正な幅は捨て、style は safecss_filter_attr() で整え、title のタグは除く',
				'data'                => array(
					'src'    => 'https://www.google.com/maps',
					'width'  => 'auto',
					'height' => '450px',
					'style'  => 'border:0; -moz-binding:url(https://evil.test/x.xml)',
					'title'  => 'Map <script>alert(1)</script>',
				),
				'expected'            => array(
					'src'    => 'https://www.google.com/maps',
					'height' => '450px',
					'title'  => 'Map',
					'style'  => 'border:0',
				),
			),
			array(
				'test_condition_name' => 'style が全て無効なら style 自体を出力しない',
				'data'                => array(
					'src'   => 'https://www.google.com/maps',
					'style' => 'behavior:url(x.htc)',
				),
				'expected'            => array( 'src' => 'https://www.google.com/maps' ),
			),
			array(
				'test_condition_name' => '文字列以外の値は捨てる',
				'data'                => array(
					'src'             => 'https://www.google.com/maps',
					'allowfullscreen' => true,
					'width'           => 560,
				),
				'expected'            => array( 'src' => 'https://www.google.com/maps' ),
			),
			array(
				'test_condition_name' => 'オブジェクト（stdClass）でも配列と同じに扱う',
				'data'                => (object) array(
					'src'   => 'https://www.google.com/maps',
					'width' => '100%',
				),
				'expected'            => array(
					'src'   => 'https://www.google.com/maps',
					'width' => '100%',
				),
			),
			array(
				'test_condition_name' => '多重符号化（&amp;amp;#x2e;）を含む src => 空',
				'data'                => array( 'src' => 'https://www.youtube.com/embed/&amp;amp;#x2e;&amp;amp;#x2e;/x' ),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '多重符号化（&amp;amp;#x5c;）を含む src => 空',
				'data'                => array( 'src' => 'https://www.youtube.com/embed/a&amp;amp;#x5c;b' ),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '多重符号化（&amp;amp;#x2f;）を含む src => 空',
				'data'                => array( 'src' => 'https://www.youtube.com/embed/a&amp;amp;#x2f;b' ),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'style の position・top・inset・z-index は除き、それ以外は残す',
				'data'                => array(
					'src'   => 'https://www.google.com/maps',
					'style' => 'border:0;position:fixed;top:0;left:0;right:0;bottom:0;inset:0;z-index:9999;max-width:100%',
				),
				'expected'            => array(
					'src'   => 'https://www.google.com/maps',
					'style' => 'border:0;max-width:100%',
				),
			),
			array(
				'test_condition_name' => 'style が配置系だけなら style 自体を出力しない',
				'data'                => array(
					'src'   => 'https://www.google.com/maps',
					'style' => 'position:absolute;inset-block-start:0',
				),
				'expected'            => array( 'src' => 'https://www.google.com/maps' ),
			),
			array(
				'test_condition_name' => 'id・class は英数字・_・- だけ残し、外れる値は除去する',
				'data'                => array(
					'src'   => 'https://www.google.com/maps',
					'id'    => 'my-map_1',
					'class' => 'a-b c_d e"f g<h>',
				),
				'expected'            => array(
					'src'   => 'https://www.google.com/maps',
					'class' => 'a-b c_d',
					'id'    => 'my-map_1',
				),
			),
			array(
				'test_condition_name' => '不正な文字を含む id は除去する',
				'data'                => array(
					'src' => 'https://www.google.com/maps',
					'id'  => 'a b',
				),
				'expected'            => array( 'src' => 'https://www.google.com/maps' ),
			),
			array(
				'test_condition_name' => '不許可の URL => 空',
				'data'                => array(
					'src'   => 'https://www.google.com.attacker.test/maps',
					'width' => '560',
				),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'javascript スキーム => 空',
				'data'                => array( 'src' => 'javascript:alert(1)' ),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'src が無い => 空',
				'data'                => array( 'width' => '560' ),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'src が文字列でない => 空',
				'data'                => array( 'src' => array( 'https://www.google.com/maps' ) ),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '空のオブジェクト（消失済み） => 空',
				'data'                => array(),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '配列・オブジェクト以外 => 空',
				'data'                => '<iframe src="https://www.google.com/maps"></iframe>',
				'expected'            => array(),
			),
		);

		foreach ( $test_cases as $case ) {
			$this->assertSame( $case['expected'], vk_blocks_visual_embed_sanitize_attributes( $case['data'] ), $case['test_condition_name'] );
		}

		// Cases shared with the JS unit test (test/unit/visual-embed-embed-attributes.test.js).
		// JS のユニットテストと共通のケース。
		$shared_cases = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/visual-embed-sanitize-cases.json' ), true );
		foreach ( $shared_cases as $case ) {
			$this->assertSame( $case['expected'], vk_blocks_visual_embed_sanitize_attributes( $case['data'] ), '共通ケース: ' . $case['name'] );
		}
	}

	/**
	 * Test vk_blocks_visual_embed_extract_attributes().
	 * vk_blocks_visual_embed_extract_attributes() のテスト。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_extract_attributes() {
		$test_cases = array(
			array(
				'test_condition_name' => '最初の iframe の許可属性だけを取り出し、同梱の script・危険な属性・2 つ目の iframe は捨てる',
				'html'                => '<p>x</p><iframe src="https://www.youtube.com/embed/abc" width="560" srcdoc="<script>alert(1)</script>" onload="alert(1)" allowfullscreen></iframe><script>alert(2)</script><iframe src="https://evil.test/"></iframe>',
				'expected'            => array(
					'src'             => 'https://www.youtube.com/embed/abc',
					'width'           => '560',
					'allowfullscreen' => '',
				),
			),
			array(
				'test_condition_name' => '属性値のエンティティは実体に戻す',
				'html'                => '<iframe src="https://www.google.com/maps?a=1&amp;b=2" title="Tom &amp; Jerry"></iframe>',
				'expected'            => array(
					'src'   => 'https://www.google.com/maps?a=1&b=2',
					'title' => 'Tom & Jerry',
				),
			),
			array(
				'test_condition_name' => '大文字のタグ名でも取り出す',
				'html'                => '<IFRAME SRC="https://www.google.com/maps" WIDTH="100%"></IFRAME>',
				'expected'            => array(
					'src'   => 'https://www.google.com/maps',
					'width' => '100%',
				),
			),
			array(
				'test_condition_name' => '不許可の URL の iframe => 空',
				'html'                => '<iframe src="https://evil.test/embed"></iframe>',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'iframe が無い => 空',
				'html'                => '<p>no iframe</p>',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '旧エディタが保存したエラー文 => 空',
				'html'                => 'Only allowed URLs can be embedded.',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '空文字・空白だけ => 空',
				'html'                => "  \n",
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '文字列以外 => 空',
				'html'                => null,
				'expected'            => array(),
			),
		);

		foreach ( $test_cases as $case ) {
			$this->assertSame( $case['expected'], vk_blocks_visual_embed_extract_attributes( $case['html'] ), $case['test_condition_name'] );
		}
	}

	/**
	 * Test vk_blocks_visual_embed_get_attributes().
	 * vk_blocks_visual_embed_get_attributes() のテスト。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_get_attributes() {
		$default_src = 'https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sus!4v1609459543842!5m2!1sen!2sus';
		$default     = array(
			'src'             => $default_src,
			'width'           => '100%',
			'height'          => '450',
			'allowfullscreen' => '',
			'loading'         => 'lazy',
			'referrerpolicy'  => 'no-referrer-when-downgrade',
			'style'           => 'border:0',
		);
		$legacy_html = '<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview"><iframe src="https://www.youtube.com/embed/abc" width="600" height="340"></iframe></div></div>';

		$test_cases = array(
			array(
				'test_condition_name' => '現在の形式: embedAttributes を検証して返す',
				'attributes'          => array(
					'embedAttributes' => array(
						'src'    => 'https://www.google.com/maps',
						'width'  => '560',
						'onload' => 'alert(1)',
					),
				),
				'content'             => '',
				'expected'            => array(
					'src'   => 'https://www.google.com/maps',
					'width' => '560',
				),
			),
			array(
				'test_condition_name' => '現在の形式: embedAttributes があれば保存済み HTML や iframeCode は使わない',
				'attributes'          => array(
					'embedAttributes' => array( 'src' => 'https://www.google.com/maps' ),
					'iframeCode'      => '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
				),
				'content'             => $legacy_html,
				'expected'            => array( 'src' => 'https://www.google.com/maps' ),
			),
			array(
				'test_condition_name' => '現在の形式: 空の embedAttributes（消去・消失済み）=> 空（既定の地図に戻さない）',
				'attributes'          => array( 'embedAttributes' => array() ),
				'content'             => '',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '現在の形式: 空として保存した {"src":""} => 空（既定の地図に戻さない）',
				'attributes'          => array( 'embedAttributes' => array( 'src' => '' ) ),
				'content'             => '',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '旧形式: 保存済み HTML の iframe を iframeCode より優先する',
				'attributes'          => array(
					'iframeCode'  => '<iframe src="https://www.google.com/maps?from=attr"></iframe>',
					'iframeWidth' => '600',
				),
				'content'             => $legacy_html,
				'expected'            => array(
					'src'    => 'https://www.youtube.com/embed/abc',
					'width'  => '600',
					'height' => '340',
				),
			),
			array(
				'test_condition_name' => '旧形式: KSES で空になったプレビュー => 空（既定の地図に戻さない）',
				'attributes'          => array(
					'iframeCode'  => '',
					'iframeWidth' => '560',
				),
				'content'             => '<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview"></div></div>',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '旧形式: 属性無しで保存済み HTML が既定の地図 => その地図（style は整えられる）',
				'attributes'          => array(),
				'content'             => '<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview"><iframe src="' . $default_src . '" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>',
				'expected'            => $default,
			),
			array(
				'test_condition_name' => '旧形式: 保存済み HTML が無く iframeCode だけ => iframeCode から取り出す',
				'attributes'          => array( 'iframeCode' => '<iframe src="https://www.youtube.com/embed/abc" height="340"></iframe>' ),
				'content'             => '',
				'expected'            => array(
					'src'    => 'https://www.youtube.com/embed/abc',
					'height' => '340',
				),
			),
			array(
				'test_condition_name' => '旧形式: 保存済み HTML が無く iframeCode が空文字 => 空',
				'attributes'          => array( 'iframeCode' => '' ),
				'content'             => '',
				'expected'            => array(),
			),
			array(
				'test_condition_name' => '属性も保存済み HTML も無い（未指定）=> block.json の既定の地図',
				'attributes'          => array(),
				'content'             => '',
				'expected'            => $default,
			),
			array(
				'test_condition_name' => '属性が配列でない => 既定の地図',
				'attributes'          => null,
				'content'             => '',
				'expected'            => $default,
			),
		);

		foreach ( $test_cases as $case ) {
			$this->assertSame( $case['expected'], vk_blocks_visual_embed_get_attributes( $case['attributes'], $case['content'] ), $case['test_condition_name'] );
		}
	}

	/**
	 * Test vk_blocks_visual_embed_normalize_content().
	 * vk_blocks_visual_embed_normalize_content() のテスト。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_normalize_content() {
		$youtube  = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="600" height="340" title="Legacy Issue 3302"></iframe>';
		$intact   = $this->legacy_block(
			array(
				'iframeCode'   => $youtube,
				'iframeWidth'  => '600',
				'iframeHeight' => '340',
				'align'        => 'center',
				'className'    => 'legacy-custom',
			),
			$youtube,
			'aligncenter legacy-custom'
		);
		$stripped = $this->legacy_block(
			array(
				'iframeCode'   => '',
				'iframeWidth'  => '560',
				'iframeHeight' => '315',
			),
			''
		);
		$group    = '<!-- wp:group {"style":{},"layout":{"type":"constrained"}} -->' . "\n" . '<div class="wp-block-group"><!-- wp:paragraph --><p>Keep 日本語 &amp; "quotes" back\\slash</p><!-- /wp:paragraph -->' . "\n" . '%s' . "\n" . '</div>' . "\n" . '<!-- /wp:group -->';
		// A legacy block of about 120 KB. The former lazy expressions exhausted the PCRE JIT stack at a few tens of KB.
		// 約 120 KB の旧形式ブロック。以前の最短一致の式は数十 KB で PCRE の JIT スタックを使い切っていた。
		$long_title = str_repeat( 'a', 60000 );
		$long_code  = '<iframe src="https://www.youtube.com/embed/abc" title="' . $long_title . '"></iframe>';
		$long       = $this->legacy_block( array( 'iframeCode' => $long_code ), $long_code );

		$test_cases = array(
			array(
				'test_condition_name' => '旧形式（iframe あり）=> 幅・高さ・配置・クラスを保ち、検証済みの embedAttributes を持つ自己終了ブロックになる',
				'content'             => $intact,
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"600","iframeHeight":"340","align":"center","className":"legacy-custom","embedAttributes":{"src":"https://www.youtube.com/embed/dQw4w9WgXcQ","width":"600","height":"340","title":"Legacy Issue 3302"}} /-->',
			),
			array(
				'test_condition_name' => '旧形式（KSES で空）=> 空を表す embedAttributes（{"src":""}）になり、既定の地図には戻らない',
				'content'             => $stripped,
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"560","iframeHeight":"315","embedAttributes":{"src":""}} /-->',
			),
			array(
				'test_condition_name' => '旧形式（属性無しの既定の地図）=> 既定の地図の embedAttributes を持つ',
				'content'             => $this->legacy_block( array(), '<iframe src="https://www.google.com/maps/embed?pb=!1m0" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' ),
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps/embed?pb=!1m0","width":"100%","height":"450","allowfullscreen":"","loading":"lazy","referrerpolicy":"no-referrer-when-downgrade","style":"border:0"}} /-->',
			),
			array(
				'test_condition_name' => '旧形式（不許可の URL の iframe）=> 空の embedAttributes になり URL は残らない',
				'content'             => $this->legacy_block( array( 'iframeCode' => '<iframe src="https://evil.test/embed"></iframe>' ), '<iframe src="https://evil.test/embed" onload="alert(1)"></iframe>' ),
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":""}} /-->',
			),
			array(
				'test_condition_name' => '現在の形式（危険な属性と & を含む URL）=> 許可属性だけが残り & は \\u0026 で保存される',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps?a=1\\u0026b=2","srcdoc":"\\u003cscript\\u003e","onload":"alert(1)","width":"560"},"iframeWidth":"560"} /-->',
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps?a=1\\u0026b=2","width":"560"},"iframeWidth":"560"} /-->',
			),
			array(
				'test_condition_name' => '現在の形式（不許可の URL）=> 空の embedAttributes',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com.attacker.test/maps"}} /-->',
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":""}} /-->',
			),
			array(
				'test_condition_name' => '現在の形式（KSES の再シリアライズで [] になった空）=> {"src":""} に直す',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"560","embedAttributes":[]} /-->',
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"560","embedAttributes":{"src":""}} /-->',
			),
			array(
				'test_condition_name' => '現在の形式（空として保存した {"src":""}）=> そのまま',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":""}} /-->',
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":""}} /-->',
			),
			array(
				'test_condition_name' => '現在の形式（属性無し）=> 既定の地図の embedAttributes を明示する',
				'content'             => '<!-- wp:vk-blocks/visual-embed /-->',
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sus!4v1609459543842!5m2!1sen!2sus","width":"100%","height":"450","allowfullscreen":"","loading":"lazy","referrerpolicy":"no-referrer-when-downgrade","style":"border:0"}} /-->',
			),
			array(
				'test_condition_name' => 'グループの中の旧形式 => 埋め込みだけ書き換え、他のブロック（空オブジェクトの属性・日本語・引用符・バックスラッシュ）は 1 バイトも変えない',
				'content'             => sprintf( $group, $stripped ),
				'expected'            => sprintf( $group, '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"560","iframeHeight":"315","embedAttributes":{"src":""}} /-->' ),
			),
			array(
				'test_condition_name' => '同じ本文に複数ある => すべて書き換える',
				'content'             => $stripped . "\n\n" . $intact,
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"560","iframeHeight":"315","embedAttributes":{"src":""}} /-->' . "\n\n" . '<!-- wp:vk-blocks/visual-embed {"iframeWidth":"600","iframeHeight":"340","align":"center","className":"legacy-custom","embedAttributes":{"src":"https://www.youtube.com/embed/dQw4w9WgXcQ","width":"600","height":"340","title":"Legacy Issue 3302"}} /-->',
			),
			array(
				'test_condition_name' => '閉じられていない旧形式 => 変更しない（描画時に検証する）',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"iframeCode":"x"} -->' . "\n" . '<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"></div>' . "\n" . '<!-- wp:paragraph --><p>after</p><!-- /wp:paragraph -->',
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"iframeCode":"x"} -->' . "\n" . '<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"></div>' . "\n" . '<!-- wp:paragraph --><p>after</p><!-- /wp:paragraph -->',
			),
			array(
				'test_condition_name' => 'ビジュアル埋め込みが無い本文 => 同じ文字列を返す',
				'content'             => sprintf( $group, '<!-- wp:paragraph --><p>only text</p><!-- /wp:paragraph -->' ),
				'expected'            => sprintf( $group, '<!-- wp:paragraph --><p>only text</p><!-- /wp:paragraph -->' ),
			),
			array(
				'test_condition_name' => '文字列以外 => そのまま返す',
				'content'             => null,
				'expected'            => null,
			),
			array(
				'test_condition_name' => '大きな旧形式（約 120 KB）=> 正規表現が失敗せずに書き換える',
				'content'             => $long,
				'expected'            => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.youtube.com/embed/abc","title":"' . $long_title . '"}} /-->',
			),
			array(
				'test_condition_name' => '正規表現が失敗した場合（PCRE の上限超え）=> 空にせず元の本文を返す',
				'conditions'          => array( 'pcre.backtrack_limit' => '1' ),
				'content'             => sprintf( $group, $stripped ),
				'expected'            => sprintf( $group, $stripped ),
			),
		);

		foreach ( $test_cases as $case ) {
			// Lower the PCRE limit only for the case that makes the regular expression fail, and restore it right after.
			// 正規表現を失敗させるケースだけ PCRE の上限を下げ、直後に元へ戻す。
			$previous_limit = isset( $case['conditions']['pcre.backtrack_limit'] ) ? ini_set( 'pcre.backtrack_limit', $case['conditions']['pcre.backtrack_limit'] ) : false;
			$actual         = vk_blocks_visual_embed_normalize_content( $case['content'] );
			if ( false !== $previous_limit ) {
				ini_set( 'pcre.backtrack_limit', $previous_limit );
			}
			$this->assertSame( $case['expected'], $actual, $case['test_condition_name'] );
		}
	}

	/**
	 * Test vk_blocks_visual_embed_filter_saved_content().
	 * vk_blocks_visual_embed_filter_saved_content() のテスト。
	 *
	 * Saves through wp_insert_post() / wp_update_post() and the REST API as users with and without
	 * the unfiltered_html capability.
	 * unfiltered_html 権限の有るユーザーと無いユーザーで、wp_insert_post() / wp_update_post() と REST API から保存する。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_filter_saved_content() {
		$code      = '<iframe src="https://www.google.com/maps?a=1&amp;b=2" width="560" height="315" style="border:0;" srcdoc="bad" onload="alert(1)"></iframe>';
		$paragraph = '<!-- wp:paragraph --><p>It\'s a "quoted" back\\slash 日本語</p><!-- /wp:paragraph -->';
		$legacy    = $paragraph . "\n\n" . $this->legacy_block(
			array(
				'iframeCode'   => $code,
				'iframeWidth'  => '560',
				'iframeHeight' => '315',
				'align'        => 'center',
				'className'    => 'custom-embed',
			),
			$code,
			'aligncenter custom-embed'
		);

		// 1. Save legacy markup with wp_insert_post() as each role, then reopen and save again.
		// 1. 各権限グループで wp_insert_post() により旧形式を保存し、開き直してもう一度保存する。
		$save_cases = array(
			array(
				'test_condition_name' => '管理者（unfiltered_html あり）=> & はそのまま保存される',
				'role'                => 'administrator',
				'expected_src'        => 'https://www.google.com/maps?a=1&b=2',
			),
			array(
				'test_condition_name' => '投稿者（unfiltered_html なし）=> KSES により & が &amp; で保存されるが iframe は消えない',
				'role'                => 'author',
				'expected_src'        => 'https://www.google.com/maps?a=1&amp;b=2',
			),
			array(
				'test_condition_name' => '寄稿者（unfiltered_html なし）=> 投稿者と同じ',
				'role'                => 'contributor',
				'expected_src'        => 'https://www.google.com/maps?a=1&amp;b=2',
			),
		);

		foreach ( $save_cases as $case ) {
			$this->login_as( $case['role'] );
			$post_id = wp_insert_post(
				wp_slash(
					array(
						'post_title'   => 'Visual Embed ' . $case['role'],
						'post_content' => $legacy,
						'post_status'  => 'draft',
					)
				)
			);
			$saved   = get_post_field( 'post_content', $post_id, 'raw' );
			$blocks  = parse_blocks( $saved );
			$block   = $blocks[2];
			$message = $case['test_condition_name'];

			$this->assertSame( $paragraph, serialize_block( $blocks[0] ), $message . ' / 他のブロックは変わらない' );
			$this->assertSame( 'vk-blocks/visual-embed', $block['blockName'], $message );
			$this->assertSame( $case['expected_src'], $block['attrs']['embedAttributes']['src'], $message );
			$this->assertSame( '560', $block['attrs']['embedAttributes']['width'], $message );
			$this->assertSame( '315', $block['attrs']['embedAttributes']['height'], $message );
			$this->assertSame( 'border:0', $block['attrs']['embedAttributes']['style'], $message );
			$this->assertSame( 'center', $block['attrs']['align'], $message );
			$this->assertSame( 'custom-embed', $block['attrs']['className'], $message );
			$this->assertSame( '560', $block['attrs']['iframeWidth'], $message );
			$this->assertArrayNotHasKey( 'srcdoc', $block['attrs']['embedAttributes'], $message );
			$this->assertArrayNotHasKey( 'onload', $block['attrs']['embedAttributes'], $message );
			$this->assertArrayNotHasKey( 'iframeCode', $block['attrs'], $message );
			$this->assertStringNotContainsString( '<iframe', $saved, $message );
			$this->assertSame( 'https://www.google.com/maps?a=1&b=2', vk_blocks_visual_embed_get_attributes( $block['attrs'] )['src'], $message . ' / 読み取り時は & に戻る' );

			// Saving the stored content again does not change it.
			// 保存済みの内容をもう一度保存しても変わらない。
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $post_id,
						'post_content' => $saved,
					)
				)
			);
			$this->assertSame( $saved, get_post_field( 'post_content', $post_id, 'raw' ), $message . ' / 再保存で変わらない' );

			$rendered = do_blocks( $saved );
			$this->assertStringContainsString( '<iframe src="https://www.google.com/maps?a=1&amp;b=2" width="560" height="315" style="border:0"></iframe>', $rendered, $message . ' / 描画' );
			$this->assertStringContainsString( 'custom-embed', $rendered, $message . ' / 描画' );
			$this->assertStringContainsString( 'aligncenter', $rendered, $message . ' / 描画' );
			$this->assertStringNotContainsString( 'onload', $rendered, $message . ' / 描画' );
		}

		// 2. Direct REST requests as an author must not store or render a disallowed or unsafe embed.
		// 2. 投稿者による REST の直接送信では、不許可・危険な埋め込みを保存も描画もしない。
		$this->login_as( 'author' );
		$rest_cases = array(
			array(
				'test_condition_name' => 'REST 直接送信: 別ドメインの URL => 保存されない',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://attacker.test/embed","srcdoc":"\\u003cscript\\u003ealert(1)\\u003c/script\\u003e","onload":"alert(1)"}} /-->',
				'rejected'            => 'attacker.test',
			),
			array(
				'test_condition_name' => 'REST 直接送信: 許可ドメインを前に付けた偽装ホスト => 保存されない',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com.attacker.test/embed"}} /-->',
				'rejected'            => 'attacker.test',
			),
			array(
				'test_condition_name' => 'REST 直接送信: javascript スキーム => 保存されない',
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"javascript:alert(1)"}} /-->',
				'rejected'            => 'javascript:',
			),
			array(
				'test_condition_name' => 'REST 直接送信: 旧形式の本文に別ドメインの iframe => 保存されない',
				'content'             => $this->legacy_block( array( 'iframeCode' => '<iframe src="https://attacker.test/embed"></iframe>' ), '<iframe src="https://attacker.test/embed"></iframe>' ),
				'rejected'            => 'attacker.test',
			),
		);

		foreach ( $rest_cases as $case ) {
			$request = new WP_REST_Request( 'POST', '/wp/v2/posts' );
			$request->set_body_params(
				array(
					'title'   => 'REST embed',
					'content' => $case['content'],
				)
			);
			$response = rest_get_server()->dispatch( $request );
			$this->assertSame( 201, $response->get_status(), $case['test_condition_name'] );

			$post  = get_post( $response->get_data()['id'] );
			$block = parse_blocks( $post->post_content )[0];
			$this->assertSame( 'vk-blocks/visual-embed', $block['blockName'], $case['test_condition_name'] );
			$this->assertSame( array( 'src' => '' ), $block['attrs']['embedAttributes'], $case['test_condition_name'] );
			$this->assertSame( array(), vk_blocks_visual_embed_get_attributes( $block['attrs'] ), $case['test_condition_name'] );
			$this->assertStringNotContainsString( $case['rejected'], $post->post_content, $case['test_condition_name'] );
			$this->assertStringNotContainsString( '<iframe', $post->post_content, $case['test_condition_name'] );
			$this->assertStringNotContainsString( '<iframe', do_blocks( $post->post_content ), $case['test_condition_name'] . ' / 描画' );
		}

		// 3. A direct REST request with an allowed embed is stored and rendered.
		// 3. REST の直接送信でも許可された埋め込みは保存・描画される。
		$request = new WP_REST_Request( 'POST', '/wp/v2/posts' );
		$request->set_body_params(
			array(
				'title'   => 'REST embed allowed',
				'content' => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.youtube.com/embed/abc","width":"560","height":"315","title":"REST"}} /-->',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );
		$post = get_post( $response->get_data()['id'] );
		$this->assertStringContainsString( '<iframe src="https://www.youtube.com/embed/abc" width="560" height="315" title="REST"></iframe>', do_blocks( $post->post_content ), 'REST 直接送信: 許可された埋め込み => 描画される' );
	}

	/**
	 * Test vk_blocks_visual_embed_render().
	 * vk_blocks_visual_embed_render() のテスト。
	 *
	 * @return void
	 */
	public function test_vk_blocks_visual_embed_render() {
		$add_pattern = static function ( $patterns ) {
			$patterns[] = 'https://embed.example.test/*';
			return $patterns;
		};
		$youtube     = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="600" height="340" title="Legacy Issue 3302"></iframe>';

		$test_cases = array(
			array(
				'test_condition_name' => '旧形式（iframe あり）=> 保存済み HTML の iframe を属性から組み立て直して描画し、配置とクラスを保つ',
				'conditions'          => array( 'filter' => null ),
				'content'             => $this->legacy_block(
					array(
						'iframeCode'   => $youtube,
						'iframeWidth'  => '600',
						'iframeHeight' => '340',
						'align'        => 'center',
						'className'    => 'legacy-custom',
					),
					$youtube,
					'aligncenter legacy-custom'
				),
				'expected_contains'   => array( '<div class="vk-visual-embed-preview">' . $youtube . '</div>', 'wp-block-vk-blocks-visual-embed', 'aligncenter', 'legacy-custom', 'vk-visual-embed' ),
				'expected_missing'    => array(),
			),
			array(
				'test_condition_name' => '旧形式（KSES で空）=> 枠だけを描画し、既定の地図は出さない',
				'conditions'          => array( 'filter' => null ),
				'content'             => $this->legacy_block(
					array(
						'iframeCode'   => '',
						'iframeWidth'  => '560',
						'iframeHeight' => '315',
					),
					''
				),
				'expected_contains'   => array( '<div class="vk-visual-embed wp-block-vk-blocks-visual-embed"></div>' ),
				'expected_missing'    => array( '<iframe', 'google.com' ),
			),
			array(
				'test_condition_name' => '旧形式（不許可の URL や危険な属性を含む保存済み HTML）=> そのまま出力しない',
				'conditions'          => array( 'filter' => null ),
				'content'             => $this->legacy_block(
					array( 'iframeCode' => '<iframe src="https://evil.test/embed"></iframe>' ),
					'<iframe src="https://evil.test/embed" onload="alert(1)"></iframe><script>alert(2)</script>'
				),
				'expected_contains'   => array( '<div class="vk-visual-embed wp-block-vk-blocks-visual-embed"></div>' ),
				'expected_missing'    => array( '<iframe', 'evil.test', '<script', 'onload' ),
			),
			array(
				'test_condition_name' => '現在の形式（投稿者の保存で &amp; になった src）=> & を二重にせず描画する',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps?a=1\\u0026amp;b=2","width":"560","title":"Tom \\u0026amp; Jerry"}} /-->',
				'expected_contains'   => array( '<iframe src="https://www.google.com/maps?a=1&amp;b=2" width="560" title="Tom &amp; Jerry"></iframe>' ),
				'expected_missing'    => array( '&amp;amp;' ),
			),
			array(
				'test_condition_name' => '現在の形式（管理者の保存で & のままの src）=> 同じ HTML になる',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps?a=1\\u0026b=2","width":"560","title":"Tom \\u0026 Jerry"}} /-->',
				'expected_contains'   => array( '<iframe src="https://www.google.com/maps?a=1&amp;b=2" width="560" title="Tom &amp; Jerry"></iframe>' ),
				'expected_missing'    => array(),
			),
			array(
				'test_condition_name' => '現在の形式（データベースに直接書かれた危険な属性）=> 許可属性だけを描画する',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.youtube.com/embed/abc","onload":"alert(1)","srcdoc":"x","style":"border:0;-moz-binding:url(https://evil.test/x)"}} /-->',
				'expected_contains'   => array( '<iframe src="https://www.youtube.com/embed/abc" style="border:0"></iframe>' ),
				'expected_missing'    => array( 'onload', 'srcdoc', 'evil.test' ),
			),
			array(
				'test_condition_name' => '現在の形式（title の多重符号化）=> 検証した文字列がそのまま属性値になる',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.youtube.com/embed/abc","title":"a&amp;#x2e;"}} /-->',
				'expected_contains'   => array( '<iframe src="https://www.youtube.com/embed/abc" title="a&amp;#x2e;"></iframe>' ),
				'expected_missing'    => array(),
			),
			array(
				'test_condition_name' => '旧形式（保存済み HTML に全画面化の style）=> position などを除いて描画する',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed -->' . "\n" . '<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview"><iframe src="https://www.youtube.com/embed/abc" style="border:0;position:fixed;top:0;left:0;z-index:99999"></iframe></div></div>' . "\n" . '<!-- /wp:vk-blocks/visual-embed -->',
				'expected_contains'   => array( '<iframe src="https://www.youtube.com/embed/abc" style="border:0"></iframe>' ),
				'expected_missing'    => array( 'position', 'z-index' ),
			),
			array(
				'test_condition_name' => '現在の形式（不許可の URL）=> 枠だけを描画する',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com.attacker.test/maps"}} /-->',
				'expected_contains'   => array( '<div class="vk-visual-embed wp-block-vk-blocks-visual-embed"></div>' ),
				'expected_missing'    => array( '<iframe', 'attacker.test' ),
			),
			array(
				'test_condition_name' => '現在の形式（空の embedAttributes）=> 枠だけを描画する',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{}} /-->',
				'expected_contains'   => array( '<div class="vk-visual-embed wp-block-vk-blocks-visual-embed"></div>' ),
				'expected_missing'    => array( '<iframe' ),
			),
			array(
				'test_condition_name' => '現在の形式（属性無し）=> 既定の地図を描画する',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed /-->',
				'expected_contains'   => array( '<iframe src="https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sus!4v1609459543842!5m2!1sen!2sus" width="100%" height="450" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="border:0"></iframe>' ),
				'expected_missing'    => array(),
			),
			array(
				'test_condition_name' => 'フィルターで許可した独自ドメイン => 描画する',
				'conditions'          => array( 'filter' => $add_pattern ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://embed.example.test/map","height":"400"}} /-->',
				'expected_contains'   => array( '<iframe src="https://embed.example.test/map" height="400"></iframe>' ),
				'expected_missing'    => array(),
			),
			array(
				'test_condition_name' => 'フィルターを外した独自ドメイン（保存後に許可を取り消した場合）=> 描画しない',
				'conditions'          => array( 'filter' => null ),
				'content'             => '<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://embed.example.test/map","height":"400"}} /-->',
				'expected_contains'   => array( '<div class="vk-visual-embed wp-block-vk-blocks-visual-embed"></div>' ),
				'expected_missing'    => array( '<iframe', 'embed.example.test' ),
			),
		);

		foreach ( $test_cases as $case ) {
			if ( $case['conditions']['filter'] ) {
				add_filter( 'vk_blocks_visual_embed_allowed_url_patterns', $case['conditions']['filter'] );
			}
			$rendered = do_blocks( $case['content'] );
			foreach ( $case['expected_contains'] as $expected ) {
				$this->assertStringContainsString( $expected, $rendered, $case['test_condition_name'] );
			}
			foreach ( $case['expected_missing'] as $missing ) {
				$this->assertStringNotContainsString( $missing, $rendered, $case['test_condition_name'] );
			}
			if ( $case['conditions']['filter'] ) {
				remove_filter( 'vk_blocks_visual_embed_allowed_url_patterns', $case['conditions']['filter'] );
			}
		}
	}
}
