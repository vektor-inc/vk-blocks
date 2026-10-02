<?php
/**
 * Class VkBlocksFunctionsTest
 *
 * @package Vk_Blocks_Pro
 */

/**
 * Tests for standalone helper functions defined in
 * inc/vk-blocks/vk-blocks-functions.php.
 */
class VkBlocksFunctionsTest extends VK_UnitTestCase {

	/**
	 * テストで使うダミーのスクリプトハンドル名.
	 *
	 * @var string
	 */
	private $test_handle = 'vk-blocks-functions-test-handle';

	/**
	 * Tear down each test method.
	 */
	public function tearDown(): void {
		wp_deregister_script( $this->test_handle );
		parent::tearDown();
	}

	/**
	 * vk_blocks_localize_slider_actual_count_label() の回帰テスト（#3080, CodeRabbit指摘）。
	 *
	 * 対象ハンドルに、この関数とは無関係な inline data（`wp_scripts()->add_data()`
	 * で先に登録されたもの）が既に付いている状態でも、`actualCountLabel` を含む
	 * `vkBlocksSliderI18n` が正しく追加され、かつ既存の無関係なデータが失われ
	 * ないことを検証する。以前のガード実装は「ハンドルに何らかの data がある
	 * か」だけを見ていたため、この状況で誤ってスキップしてしまっていた
	 * （#3080, CodeRabbit指摘）。
	 *
	 * Regression test for vk_blocks_localize_slider_actual_count_label()
	 * (#3080, CodeRabbit feedback). Verifies that vkBlocksSliderI18n
	 * (containing actualCountLabel) is still correctly added — and the
	 * existing unrelated data is preserved — even when the target handle
	 * already carries inline data unrelated to this function (registered
	 * beforehand via `wp_scripts()->add_data()`). The previous guard only
	 * checked whether the handle had any data at all, so it wrongly skipped
	 * in this situation (#3080, CodeRabbit feedback).
	 */
	public function test_localize_slider_actual_count_label_preserves_unrelated_existing_inline_data() {
		wp_register_script( $this->test_handle, 'https://example.com/dummy.js', array(), '1.0', true );

		$unrelated_inline_data = 'var someUnrelatedThing = { foo: 1 };';
		wp_scripts()->add_data( $this->test_handle, 'data', $unrelated_inline_data );

		vk_blocks_localize_slider_actual_count_label( $this->test_handle );

		$data_after = wp_scripts()->get_data( $this->test_handle, 'data' );

		$this->assertStringContainsString( $unrelated_inline_data, $data_after, '無関係な既存の inline data が保持されていること' );
		$this->assertStringContainsString( 'var vkBlocksSliderI18n =', $data_after, 'vkBlocksSliderI18n オブジェクトが追加されていること' );
		$this->assertStringContainsString( 'actualCountLabel', $data_after, 'actualCountLabel キーが含まれていること' );
	}

	/**
	 * 二重呼び出し防止ガードの回帰テスト（#3080, CodeRabbit指摘）。
	 *
	 * 同じハンドルに対して vk_blocks_localize_slider_actual_count_label() を
	 * 2回呼んでも、vkBlocksSliderI18n の登録が重複しないことを直接検証する。
	 * wp_localize_script() は同じハンドルへ複数回呼ぶと（上書きではなく）
	 * 既存の inline data に追記するため、ガードが無いと同じ内容の
	 * <script>タグが重複出力されてしまう（CodeRabbit指摘）。
	 *
	 * Regression test for the double-call guard (#3080, CodeRabbit feedback).
	 * Directly verifies that calling
	 * vk_blocks_localize_slider_actual_count_label() twice for the same
	 * handle does not duplicate the vkBlocksSliderI18n registration.
	 * wp_localize_script() appends to (rather than overwrites) a handle's
	 * existing inline data when called more than once, so without this guard
	 * the same <script> tag content would be output twice (CodeRabbit
	 * feedback).
	 */
	public function test_localize_slider_actual_count_label_does_not_duplicate_on_second_call() {
		wp_register_script( $this->test_handle, 'https://example.com/dummy.js', array(), '1.0', true );

		vk_blocks_localize_slider_actual_count_label( $this->test_handle );
		vk_blocks_localize_slider_actual_count_label( $this->test_handle );

		$data_after  = wp_scripts()->get_data( $this->test_handle, 'data' );
		$occurrences = substr_count( $data_after, 'var vkBlocksSliderI18n =' );

		$this->assertSame( 1, $occurrences, 'vkBlocksSliderI18n の登録は2回呼んでも1回だけであること' );
	}
}
