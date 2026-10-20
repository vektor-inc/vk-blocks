<?php
/**
 * Tests for wp_kses helper adjustments.
 *
 * @package Vk_Blocks_Pro
 */

/**
 * Class VKBlocksKsesHelperTest
 */
class VKBlocksKsesHelperTest extends VK_UnitTestCase {

	/**
	 * Verify that existing input attributes are preserved and new ones are added.
	 *
	 * @return void
	 */
	public function test_input_attributes_are_merged() {
		$tags = array(
			'input' => array(
				'name'    => 'custom-name',
				'value'   => 'foo',
				'checked' => 'checked',
			),
		);

		$result = vk_blocks_allow_wp_kses_allowed_html( $tags );

		$this->assertArrayHasKey( 'input', $result );
		$this->assertArrayHasKey( 'name', $result['input'] );
		$this->assertArrayHasKey( 'value', $result['input'] );
		$this->assertArrayHasKey( 'checked', $result['input'] );
		$this->assertArrayHasKey( 'type', $result['input'] );
		$this->assertArrayHasKey( 'id', $result['input'] );

		$this->assertSame( 'custom-name', $result['input']['name'] );
		$this->assertSame( 'foo', $result['input']['value'] );
		$this->assertSame( 'checked', $result['input']['checked'] );
		$this->assertTrue( $result['input']['type'] );
		$this->assertTrue( $result['input']['id'] );
	}

	/**
	 * Ensure style attributes are appended without removing existing ones.
	 *
	 * @return void
	 */
	public function test_style_attributes_are_preserved() {
		$tags = array(
			'style' => array(
				'media' => 'print',
			),
		);

		$result = vk_blocks_allow_wp_kses_allowed_html( $tags );

		$this->assertArrayHasKey( 'style', $result );
		$this->assertArrayHasKey( 'media', $result['style'] );
		$this->assertArrayHasKey( 'type', $result['style'] );

		$this->assertSame( 'print', $result['style']['media'] );
		$this->assertTrue( $result['style']['type'] );
	}

	/**
	 * Confirm SVG/path attributes merge correctly.
	 *
	 * @return void
	 */
	public function test_svg_and_path_attributes_are_merged() {
		$tags = array(
			'svg'  => array(
				'width'  => true,
				'height' => true,
			),
			'path' => array(
				'class' => true,
			),
		);

		$result = vk_blocks_allow_wp_kses_allowed_html( $tags );

		$this->assertArrayHasKey( 'svg', $result );
		$this->assertArrayHasKey( 'width', $result['svg'] );
		$this->assertArrayHasKey( 'height', $result['svg'] );
		$this->assertArrayHasKey( 'viewbox', $result['svg'] );
		$this->assertArrayHasKey( 'xmlns', $result['svg'] );
		$this->assertArrayHasKey( 'preserveaspectratio', $result['svg'] );

		$this->assertArrayHasKey( 'path', $result );
		$this->assertArrayHasKey( 'class', $result['path'] );
		$this->assertArrayHasKey( 'fill', $result['path'] );
		$this->assertArrayHasKey( 'd', $result['path'] );
		$this->assertArrayHasKey( 'stroke-width', $result['path'] );

		$this->assertTrue( $result['svg']['width'] );
		$this->assertTrue( $result['svg']['height'] );
		$this->assertTrue( $result['svg']['viewbox'] );
		$this->assertTrue( $result['svg']['xmlns'] );
		$this->assertTrue( $result['svg']['preserveaspectratio'] );

		$this->assertTrue( $result['path']['class'] );
		$this->assertTrue( $result['path']['fill'] );
		$this->assertTrue( $result['path']['d'] );
		$this->assertTrue( $result['path']['stroke-width'] );
	}

	/**
	 * Verify that users without unfiltered_html keep safe highlighter colors when saving posts.
	 * unfiltered_html 権限を持たないユーザーが投稿を保存しても、安全な蛍光マーカー色が保持されることを確認する。
	 *
	 * @return void
	 */
	public function test_vk_blocks_allow_color_functions_in_kses() {
		$test_cases = array(
			array(
				'test_condition_name' => '投稿者が rgba の蛍光マーカー色を保存した場合 => 色が保持される',
				'role'                => 'author',
				'color'               => 'rgba(240, 145, 145, 0.7)',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '寄稿者が rgba の蛍光マーカー色を保存した場合 => 色が保持される',
				'role'                => 'contributor',
				'color'               => 'rgba(255, 255, 0, 0.5)',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '投稿者が不正な rgba 値を保存した場合 => 色が除去される',
				'role'                => 'author',
				'color'               => 'rgba(javascript:alert(1))',
				'expected'            => false,
			),
			array(
				// 閉じ括弧のない巨大な数値・カンマ・空白の羅列。ストリッピング用正規表現を
				// バックトラック爆発させて preg_replace() に null を返させ、fail-open
				// （本来拒否すべき値が許可される）を起こさないことを確認する。
				'test_condition_name' => '投稿者が閉じ括弧のない巨大な rgba 値を保存した場合 => 色が除去される',
				'role'                => 'author',
				'color'               => 'rgba(' . str_repeat( '0,', 300000 ) . str_repeat( ' ', 300000 ),
				'expected'            => false,
			),
		);

		foreach ( $test_cases as $test_case ) {
			// Create and switch to a user who cannot bypass KSES.
			// KSES を迂回できないユーザーを作成して切り替える。
			$user = $this->factory()->user->create_and_get(
				array(
					'role' => $test_case['role'],
				)
			);
			wp_set_current_user( $user->ID );
			$this->assertFalse( current_user_can( 'unfiltered_html' ), $test_case['test_condition_name'] );

			// Save the same inline style that the highlighter format generates.
			// 蛍光マーカー書式が生成するインラインスタイルを保存する。
			$expected_style = '--vk-highlighter-color: ' . $test_case['color'];
			$content        = '<p><span class="vk_highlighter" style="' . $expected_style . ';">マーカー</span></p>';
			$post_id        = wp_insert_post(
				array(
					'post_author'  => $user->ID,
					'post_content' => $content,
					'post_status'  => 'draft',
					'post_title'   => $test_case['test_condition_name'],
					'post_type'    => 'post',
				)
			);
			$saved_content  = get_post_field( 'post_content', $post_id, 'raw' );

			if ( $test_case['expected'] ) {
				$this->assertStringContainsString( $expected_style, $saved_content, $test_case['test_condition_name'] );
			} else {
				$this->assertStringNotContainsString( $expected_style, $saved_content, $test_case['test_condition_name'] );
			}
		}

		wp_set_current_user( 0 );
	}
}
