<?php
/**
 * Class PageContentBlockTest
 *
 * @package Vk_Blocks_Pro
 */

/**
 * Page Content block test case.
 * * Test_Page_Content で同じ内容を行っているので、1.95.0 リリース以降 PageContentBlockTest は削除
 */
class PageContentBlockTest extends VK_UnitTestCase {

	/**
	 * PageContentブロックで表示する固定ページ
	 *
	 * @var int|\WP_Error $page_id
	 */
	public $page_id;

	/**
	 * 各テストケースの実行直前に呼ばれる
	 */
	public function setUp(): void {
		parent::setUp();

		$page          = array(
			'post_title'   => 'Page Title',
			'post_content' => '<!-- wp:paragraph --><p>This is my page.</p><!-- /wp:paragraph -->',
			'post_type'    => 'page',
			'post_status'  => 'publish',
		);
		$this->page_id = wp_insert_post( $page );
	}

	/**
	 * Tear down each test method.
	 */
	public function tearDown(): void {
		wp_delete_post( $this->page_id, true );
		$this->page_id = 0;
	}

	/**
	 * A single example test.
	 */
	public function test_page_content() {
		$attributes = array(
			'name'       => 'vk-blocks/page-content',
			'className'  => '',
			'TargetPost' => $this->page_id,
		);

		$this->set_current_user( 'administrator' );

		WP_Block_Supports::init();
		WP_Block_Supports::$block_to_render =  array('blockName'=> $attributes['name'], 'attrs' => $attributes );

		$actual   = vk_blocks_page_content_render_callback( $attributes );
		$expected = vk_blocks_unescape_html( '<div class=\"vk_pageContent vk_pageContent-id-' . intval( $this->page_id ) . ' wp-block-vk-blocks-page-content\"><p class=\"wp-block-paragraph\">This is my page.<\/p><\/div><a href=\"' . admin_url() . 'post.php?post=' . intval( $this->page_id ) . '&#038;action=edit\" class=\"vk_pageContent_editBtn btn btn-outline-primary btn-sm veu_adminEdit\" target=\"_blank\" rel=\"noopener noreferrer\">' . esc_html__( 'Edit this area', 'vk-blocks' ) . '<\/a>' );

		// WP バージョンにより <p> に class="wp-block-paragraph" が付く場合と付かない場合がある
		$normalize = function ( $html ) {
			return preg_replace( '/<p class="wp-block-paragraph">/', '<p>', $html );
		};
		$this->assertEquals( $normalize( $expected ), $normalize( $actual ) );
	}
}

class Test_Page_Content extends WP_UnitTestCase {

	/**
	 * 公開固定ページの ID
	 *
	 * @var int
	 */
	public $public_page_id;

	/**
	 * 非公開固定ページの ID
	 *
	 * @var int
	 */
	public $private_page_id;

	/**
	 * 下書き固定ページの ID
	 *
	 * @var int
	 */
	public $draft_page_id;

	public function setUp(): void {
		parent::setUp();

		// テスト用の固定ページを作成
		$this->public_page_id = $this->factory->post->create( array(
			'post_type'   => 'page',
			'post_status' => 'publish',
			'post_title'  => 'Public Page',
			'post_content' => 'This is a public page.',
		) );

		$this->private_page_id = $this->factory->post->create( array(
			'post_type'   => 'page',
			'post_status' => 'private',
			'post_title'  => 'Private Page',
			'post_content' => 'This is a private page.',
		) );

		$this->draft_page_id = $this->factory->post->create( array(
			'post_type'   => 'page',
			'post_status' => 'draft',
			'post_title'  => 'Draft Page',
			'post_content' => 'This is a draft page.',
		) );
	}

	public function tearDown(): void {
		// テストで作成した投稿を削除
		wp_delete_post( $this->public_page_id, true );
		wp_delete_post( $this->private_page_id, true );
		wp_delete_post( $this->draft_page_id, true );

		parent::tearDown();
	}

	public function test_vk_blocks_page_content_render_callback() {
		$tests = array(
			array(
				'test_name' => '通常の公開固定ページの場合',
				'attributes' => [
					'name'       => 'vk-blocks/page-content',
					'className'  => '',
					'TargetPost' => $this->public_page_id,
				],
				'expected' => '<div class="vk_pageContent vk_pageContent-id-' . $this->public_page_id . ' wp-block-vk-blocks-page-content">This is a public page.</div><a href="' . esc_url( get_edit_post_link( $this->public_page_id ) ) . '" class="vk_pageContent_editBtn btn btn-outline-primary btn-sm veu_adminEdit" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Edit this area', 'vk-blocks' ) . '</a>',
			),
			array(
				'test_name' => '非公開の固定ページの場合',
				'attributes' => [
					'name'       => 'vk-blocks/page-content',
					'className'  => '',
					'TargetPost' => $this->private_page_id,
				],
				'expected' => '',
			),
			array(
				'test_name' => '下書きの固定ページの場合',
				'attributes' => [
					'name'       => 'vk-blocks/page-content',
					'className'  => '',
					'TargetPost' => $this->draft_page_id,
				],
				'expected' => '',
			),
		);

		foreach ( $tests as $test ) {
			$result = vk_blocks_page_content_render_callback( $test['attributes'] );
			$this->assertEquals( $test['expected'], $result, $test['test_name'] );
		}
	}

	/**
	 * Security: verify that the marginTop / marginBottom attributes are not concatenated into the class string without sanitization.
	 * セキュリティ: marginTop / marginBottom 属性が class 文字列へ無害化されずに連結されていないかを確認する。
	 * issue #3065: regression test for the vulnerability where render_callback concatenated values into the class attribute without escaping.
	 * issue #3065: render_callback 内でエスケープなしに class 属性へ連結していた脆弱性の回帰テスト。
	 */
	public function test_vk_blocks_page_content_render_callback_sanitizes_margin_classes() {
		$tests = array(
			array(
				'test_name'  => '正常な marginTop / marginBottom クラス名の場合 => そのまま class に反映される',
				'attributes' => array(
					'name'         => 'vk-blocks/page-content',
					'className'    => '',
					'TargetPost'   => $this->public_page_id,
					'marginTop'    => 'vk_margin-top-30',
					'marginBottom' => 'vk_margin-bottom-30',
				),
				'contains'   => array( 'vk_margin-top-30', 'vk_margin-bottom-30' ),
				'not_contains' => array(),
			),
			array(
				'test_name'  => 'marginTop / marginBottom に class 属性を脱出させる不正値を指定した場合 => 不正な文字が除去される',
				'attributes' => array(
					'name'         => 'vk-blocks/page-content',
					'className'    => '',
					'TargetPost'   => $this->public_page_id,
					'marginTop'    => 'vk_margin-top-30"><script>alert(1)</script>',
					'marginBottom' => 'vk_margin-bottom-30" onmouseover="alert(2)',
				),
				'contains'   => array(),
				// '"><' or the bare 'onmouseover' can also appear in the safe class string left after sanitization
				// (e.g. "...30 onmouseoveralert2"), so asserting on them is a false-positive risk.
				// Assert only on structures that would actually form an event handler or script tag.
				// '"><' や裸の 'onmouseover' は、無害化後に残る安全なクラス文字列
				// （例: "...30 onmouseoveralert2"）にも現れうるため誤検知の元になる。
				// 実際にイベントハンドラや script タグとして成立する構造だけを検証する。
				'not_contains' => array( '<script', 'onmouseover="', 'alert(' ),
			),
		);

		foreach ( $tests as $test ) {
			$result = vk_blocks_page_content_render_callback( $test['attributes'] );

			foreach ( $test['contains'] as $needle ) {
				$this->assertStringContainsString( $needle, $result, $test['test_name'] );
			}
			foreach ( $test['not_contains'] as $needle ) {
				$this->assertStringNotContainsString( $needle, $result, $test['test_name'] );
			}
		}
	}

	/**
	 * REST リクエスト時は編集リンクを出力しないことを確認
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_vk_blocks_page_content_render_callback_rest_request() {
		define( 'REST_REQUEST', true );

		$attributes = array(
			'name'       => 'vk-blocks/page-content',
			'className'  => '',
			'TargetPost' => $this->public_page_id,
		);

		WP_Block_Supports::init();
		WP_Block_Supports::$block_to_render = array(
			'blockName' => $attributes['name'],
			'attrs'     => $attributes,
		);

		$result = vk_blocks_page_content_render_callback( $attributes );

		$this->assertStringContainsString( 'vk_pageContent', $result, 'REST リクエスト時も固定ページ本文のラッパーを出力する' );
		$this->assertStringNotContainsString( 'vk_pageContent_editBtn', $result, 'REST リクエスト時は編集リンクを出力しない' );
	}
}
