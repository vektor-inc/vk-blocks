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
}
