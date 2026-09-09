<?php
/**
 * Class Test_Site_Title_Extension
 *
 * inc/vk-blocks/extensions/core/site-title.php のテスト。
 *
 * @package Vk_Blocks_Pro
 */

/**
 * core/site-title 拡張（vk_blocks_render_core_site_title）のテストケース。
 */
class Test_Site_Title_Extension extends WP_UnitTestCase {

	/**
	 * フロントページ以外の検証に使う固定ページの ID
	 *
	 * @var int
	 */
	public $other_page_id;

	/**
	 * 各テストケースの実行直前に呼ばれる
	 */
	public function setUp(): void {
		parent::setUp();

		// フロントページ以外を再現するための固定ページを作成
		$this->other_page_id = $this->factory->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Other Page',
			)
		);
	}

	/**
	 * 各テストケースの実行直後に呼ばれる
	 */
	public function tearDown(): void {
		wp_delete_post( $this->other_page_id, true );
		$this->other_page_id = 0;

		parent::tearDown();
	}

	/**
	 * vk_blocks_render_core_site_title() のテスト。
	 *
	 * isFrontPageH1 属性の有無・is_front_page() の真偽・block_content の内容の
	 * 組み合わせで、期待どおりに <h1> / <div> が出し分けられるかを検証する。
	 */
	public function test_vk_blocks_render_core_site_title() {
		$h1_content  = '<h1 class="wp-block-site-title has-text-align-center" style="color:red">My Site</h1>';
		$div_content = '<div class="wp-block-site-title has-text-align-center" style="color:red">My Site</div>';

		$test_cases = array(
			array(
				'test_condition_name' => '属性が未設定の場合 => フロントページ以外でも <h1> のまま変化しない',
				'is_front_page'       => false,
				'block'               => array( 'attrs' => array() ),
				'block_content'       => $h1_content,
				'expected'            => $h1_content,
			),
			array(
				'test_condition_name' => 'isFrontPageH1 が false の場合 => フロントページでも <h1> のまま変化しない',
				'is_front_page'       => true,
				'block'               => array( 'attrs' => array( 'isFrontPageH1' => false ) ),
				'block_content'       => $h1_content,
				'expected'            => $h1_content,
			),
			array(
				'test_condition_name' => 'isFrontPageH1 が true かつ フロントページ の場合 => 既に <h1> のため変化しない',
				'is_front_page'       => true,
				'block'               => array( 'attrs' => array( 'isFrontPageH1' => true ) ),
				'block_content'       => $h1_content,
				'expected'            => $h1_content,
			),
			array(
				'test_condition_name' => 'isFrontPageH1 が true かつ フロントページ以外 の場合 => <h1> が <div> に置換され、class・style 属性は維持される',
				'is_front_page'       => false,
				'block'               => array( 'attrs' => array( 'isFrontPageH1' => true ) ),
				'block_content'       => $h1_content,
				'expected'            => $div_content,
			),
			array(
				'test_condition_name' => 'isFrontPageH1 が true かつ フロントページ以外だが wp-block-site-title クラスを含まない場合 => パターン不一致のため変化しない',
				'is_front_page'       => false,
				'block'               => array( 'attrs' => array( 'isFrontPageH1' => true ) ),
				'block_content'       => '<h1 class="some-other-class">My Site</h1>',
				'expected'            => '<h1 class="some-other-class">My Site</h1>',
			),
			array(
				'test_condition_name' => 'isFrontPageH1 が true かつ フロントページ以外だが block_content が空文字列の場合 => 空文字列のまま変化しない',
				'is_front_page'       => false,
				'block'               => array( 'attrs' => array( 'isFrontPageH1' => true ) ),
				'block_content'       => '',
				'expected'            => '',
			),
		);

		foreach ( $test_cases as $case ) {
			// is_front_page() の真偽を切り替えるため、フロントページ / 固定ページへ移動する。
			// デフォルトのテスト環境は show_on_front が 'posts' のため、トップページへの
			// 移動で is_front_page() は true になる。
			if ( $case['is_front_page'] ) {
				$this->go_to( home_url( '/' ) );
			} else {
				$this->go_to( get_permalink( $this->other_page_id ) );
			}

			// go_to() 後の is_front_page() が想定どおりかを前提条件として確認しておく。
			$this->assertSame(
				$case['is_front_page'],
				is_front_page(),
				$case['test_condition_name'] . '（前提条件: is_front_page() の状態）'
			);

			$actual = vk_blocks_render_core_site_title( $case['block_content'], $case['block'] );

			$this->assertSame( $case['expected'], $actual, $case['test_condition_name'] );
		}
	}
}
