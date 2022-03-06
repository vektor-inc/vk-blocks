<?php
/**
 * Class VKBSpacerTest
 *
 * @package Vk_Blocks_Pro
 */

/**
 * Post List block test case.
 */
class VKBSpacerTest extends WP_UnitTestCase {

	/**
	 * Undocumented function
	 *
	 * @return void
	 */
	public function test_vk_blocks_get_spacer_size() {
		print PHP_EOL;
		print '------------------------------------' . PHP_EOL;
		print 'test_vk_blocks_get_spacer_size' . PHP_EOL;
		print '------------------------------------' . PHP_EOL;
		$test_array = array(
			array(
				'options' => array(
					'margin_size' => '',
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => null,
			),
			array(
				'options' => array(
					'margin_size' => null,
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => null,
			),
			array(
				'options' => array(
					'margin_size' => array( 'md' => 2 ),
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => 2,
			),
			array(
				'options' => array(
					'margin_size' => array( 'md' => array( 'mobile' => 3 ) ),
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => 3,
			),
			// スペーサーサイズがどれかの端末で指定されていたら、他のスペーサーサイズ未指定の時
			// tablet -> pc -> mobile の順で自動適用する.
			array(
				'options' => array(
					'margin_size' => array( 'md' => array( 'mobile' => 3 ) ),
				),
				'size'    => 'md',
				'device'  => 'pc',
				'correct' => 3,
			),
			// スペーサーサイズがどれかの端末で指定されていたら、他のスペーサーサイズ未指定の時
			// tablet -> pc -> mobile の順で自動適用する.
			// モバイルのサイズが欲しい / PCとタブが指定されているので tabletが優先される.
			array(
				'options' => array(
					'margin_size' => array(
						'md' => array(
							'pc'     => 3,
							'tablet' => 2,
						),
					),
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => 2,
			),
			// 0指定の時にちゃんと0で返ってくるかどうか？
			array(
				'options' => array(
					'margin_size' => array( 'md' => 0 ),
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => 0,
			),
			array(
				'options' => array(
					'margin_size' => array( 'md' => array( 'mobile' => 0 ) ),
				),
				'size'    => 'md',
				'device'  => 'mobile',
				'correct' => 0,
			),
		);

		foreach ( $test_array as $value ) {
			$return = vk_blocks_get_spacer_size( $value['options'], $value['size'], $value['device'] );
			print 'return  :' . esc_attr( $return ) . PHP_EOL;
			print 'correct :' . esc_attr( $value['correct'] ) . PHP_EOL;
			$this->assertEquals( $value['correct'], $return );
		}
	}

	/**
	 * サイズのCSSを出力するかどうかのテスト
	 *
	 * @return void
	 */
	public function test_vk_blocks_is_size_print() {
		print PHP_EOL;
		print '------------------------------------' . PHP_EOL;
		print 'test_vk_blocks_is_size_print' . PHP_EOL;
		print '------------------------------------' . PHP_EOL;
		$test_array = array(
			array(
				'options' => array(
					'margin_size' => array( 'md' => 2 ),
				),
				'device'  => 'mobile',
				'correct' => true,
			),
			array(
				'options' => array(
					'margin_size' => array( 'md' => array( 'mobile' => 3 ) ),
				),
				'device'  => 'mobile',
				'correct' => true,
			),
			// 0指定の時
			array(
				'options' => array(
					'margin_size' => array( 'md' => 0 ),
				),
				'device'  => 'mobile',
				'correct' => true,
			),
			array(
				'options' => array(
					'margin_size' => array( 'md' => array( 'mobile' => 0 ) ),
				),
				'device'  => 'mobile',
				'correct' => true,
			),
			/*********************************
			 * 出力しない（false）のケース.
			 */
			array(
				'options' => array(
					'margin_size' => null,
				),
				'device'  => 'pc',
				'correct' => false,
			),
			array(
				'options' => array(
					'margin_size' => array( 'md' => null ),
				),
				'device'  => 'pc',
				'correct' => false,
			),
		);

		foreach ( $test_array as $value ) {
			$return = vk_blocks_is_size_print( $value['options'], $value['device'] );
			print 'return  :' . esc_attr( $return ) . PHP_EOL;
			print 'correct :' . esc_attr( $value['correct'] ) . PHP_EOL;
			$this->assertEquals( $value['correct'], $return );
		}
	}

	/**
	 * スペーサーサイズのCSS変数のスタイルを取得するテスト
	 *
	 * @return void
	 */
	public function test_vk_blocks_get_spacer_size_style() {
		print PHP_EOL;
		print '------------------------------------' . PHP_EOL;
		print 'test_vk_blocks_get_spacer_size_style' . PHP_EOL;
		print '------------------------------------' . PHP_EOL;
		$test_array = array(
			array(
				'options'     => array(
					'margin_size' => array( 'md' => array( 'mobile' => 3 ) ),
				),
				'unit'        => 'em',
				'spacer_size' => 'md',
				'device'      => 'mobile',
				'correct'     => '--vk-margin-md:3em;',
			),
			array(
				'options'     => array(
					'margin_size' => array( 'md' => null ),
				),
				'unit'        => 'em',
				'spacer_size' => 'md',
				'device'      => 'mobile',
				'correct'     => '',
			),
		);

		foreach ( $test_array as $value ) {
			$return = vk_blocks_get_spacer_size_style( $value['options'], $value['spacer_size'], $value['device'], $value['unit'] );
			print 'return  :' . esc_attr( $return ) . PHP_EOL;
			print 'correct :' . esc_attr( $value['correct'] ) . PHP_EOL;
			$this->assertEquals( $value['correct'], $return );
		}
	}

};
