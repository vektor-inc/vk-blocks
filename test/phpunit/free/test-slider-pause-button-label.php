<?php
/**
 * Class VK_Blocks_Slider_Pause_Button_Label_Test
 *
 * スライダーの停止/再生ボタンへのラベル注入（#3071）のテスト。
 * Tests for the slider pause / play button label injection (#3071).
 *
 * @package vektor-inc/vk-blocks-pro
 */

class VK_Blocks_Slider_Pause_Button_Label_Test extends VK_UnitTestCase {

	/**
	 * ラベルを持たない停止/再生ボタンのマークアップを返す。
	 * Returns pause / play button markup without any labels.
	 *
	 * @return string
	 */
	private function get_button_markup() {
		return '<button type="button" class="vk_slider_pauseButton swiper-pause-button">'
			. '<svg class="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-pause"></svg>'
			. '<svg class="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-play"></svg>'
			. '</button>';
	}

	/**
	 * vk_blocks_add_slider_pause_button_labels() の各ケースを確認する。
	 * Verifies vk_blocks_add_slider_pause_button_labels() across the cases below.
	 *
	 * 条件と期待値をケース配列にまとめ、ループで検証する（phpunit.md）。
	 * すべてのケースに共通する 2 つの不変条件（冪等性・属性の非重複）は、ケースごとに
	 * 別枠で持たず、ループ内で毎回まとめて確認する。ケース間で異なるのは「入力
	 * content」と「1 回適用した結果に期待すること」だけなので、この 2 点だけを
	 * 配列に持たせている。
	 *
	 * Test cases and expectations are collected into an array and run in a loop
	 * (see phpunit.md). Two invariants that every case must satisfy — idempotency
	 * and no attribute duplication on a second pass — are checked once per case
	 * inside the loop rather than being encoded as separate cases, since only the
	 * input content and the single-pass expectations actually differ between cases.
	 */
	public function test_vk_blocks_add_slider_pause_button_labels() {

		// エスケープ確認ケース専用の翻訳フィルタ。翻訳をアンパサンド・引用符・
		// 山括弧を含む文字列に差し替え、二重エスケープの検出を可能にする。
		//
		// Translation filter used only by the escaping case below. Replaces the
		// translations with strings containing an ampersand, quotes and angle
		// brackets, which is what makes the double-encoding check meaningful.
		$malicious_pause          = 'Pause & resume "slideshow" <b>';
		$malicious_play           = 'Play & pause "slideshow" <i>';
		// テキストドメインは Pro 版と無料版で異なる。無料版のビルドでは gulp の
		// text-domain-free タスクが `__( ..., 'vk-blocks-pro' )` の呼び出しを
		// `'vk-blocks'` へ書き換えるが、この比較のような素の文字列は書き換え対象外。
		// 片方だけを見ると無料版でフィルタが素通りし、訳文が差し替わらないまま
		// 「エスケープされていない」と誤検知して落ちるため、両方を受け付ける。
		//
		// The text domain differs between the Pro and free builds. In the free build the
		// gulp text-domain-free task rewrites `__( ..., 'vk-blocks-pro' )` call sites to
		// `'vk-blocks'`, but a bare string like this comparison is left alone. Matching
		// only one of them makes the filter a no-op in the free build, so the
		// translations are never swapped in and the case fails as if the output were
		// unescaped. Accept both.
		$target_text_domains          = array( 'vk-blocks-pro', 'vk-blocks' );
		$malicious_translation_filter = function ( $translation, $text, $domain ) use ( $malicious_pause, $malicious_play, $target_text_domains ) {
			if ( ! in_array( $domain, $target_text_domains, true ) ) {
				return $translation;
			}
			if ( 'Pause slideshow' === $text ) {
				return $malicious_pause;
			}
			if ( 'Play slideshow' === $text ) {
				return $malicious_play;
			}
			return $translation;
		};
		$escaped_pause                = 'Pause &amp; resume &quot;slideshow&quot; &lt;b&gt;';
		$escaped_play                 = 'Play &amp; pause &quot;slideshow&quot; &lt;i&gt;';

		// 入れ子スライダーのケースで使う、ボタンを 2 個持つコンテンツ。
		// Content with two buttons, used by the nested-slider case.
		$nested_content = '<div class="swiper vk_slider">'
			. '<div class="swiper-wrapper"><div class="swiper-slide">'
			. '<div class="swiper vk_slider">' . $this->get_button_markup() . '</div>'
			. '</div></div>'
			. $this->get_button_markup()
			. '</div>';

		// 対象外のコンテンツ（ボタン自体が無い／別クラス）。
		// Content with no target (no button at all / a different class).
		$content_without_button = '<div class="swiper vk_slider"><div class="swiper-wrapper"></div></div>';
		$content_with_other_class = '<div data-note="swiper-pause-button"><button type="button" class="other-button"></button></div>';

		// 旧バージョンで訳文が焼き付いたままの保存済みコンテンツ。
		// Content saved by an older version with a stale translation baked in.
		$legacy_content = '<button type="button" class="vk_slider_pauseButton swiper-pause-button"'
			. ' aria-label="OLD PAUSE" data-label-pause="OLD PAUSE" data-label-play="OLD PLAY"></button>';

		$test_cases = array(
			array(
				'test_condition_name'   => 'ラベルを持たない単一のボタン => aria-label / data-label-pause / data-label-play の3属性が付与される',
				'content'                => '<div class="swiper vk_slider">' . $this->get_button_markup() . '</div>',
				'translation_filter'     => null,
				'expected_contains'      => array(
					'aria-label="Pause slideshow"',
					'data-label-pause="Pause slideshow"',
					'data-label-play="Play slideshow"',
					// 元のクラスやアイコンは維持される。
					// The original classes and icons are preserved.
					'class="vk_slider_pauseButton swiper-pause-button"',
					'vk_slider_pauseButton_icon-play',
				),
				'expected_not_contains'  => array(),
				'expected_counts'        => array(),
				'expected_unchanged'     => false,
			),
			array(
				'test_condition_name'   => '入れ子になった複数のボタン => すべてのボタンにラベルが付く',
				'content'                => $nested_content,
				'translation_filter'     => null,
				'expected_contains'      => array(),
				'expected_not_contains'  => array(),
				// スライド内に別のスライダーが入れ子になっている場合、内側のボタンは
				// 自身の render_block で 1 度、外側のスライダーのコンテンツとしても
				// う 1 度処理されるが、ここでは注入関数を直接 1 回呼ぶだけなので、
				// 単純に「ボタン 2 個ともラベルが付く」ことだけを確認する。
				//
				// A slider nested inside another slider's slide is processed twice in
				// production (once by its own render_block, once as part of the outer
				// slider's content), but this case calls the injection function
				// directly a single time, so it only needs to confirm both buttons end
				// up labeled.
				'expected_counts'        => array(
					'aria-label="Pause slideshow"'   => 2,
					'data-label-play="Play slideshow"' => 2,
				),
				'expected_unchanged'     => false,
			),
			array(
				'test_condition_name'   => '翻訳文に HTML 特殊文字（& " < >）が含まれる場合 => エスケープされ、かつ二重エスケープされない',
				'content'                => $this->get_button_markup(),
				'translation_filter'     => $malicious_translation_filter,
				'expected_contains'      => array(
					'aria-label="' . $escaped_pause . '"',
					'data-label-pause="' . $escaped_pause . '"',
					'data-label-play="' . $escaped_play . '"',
				),
				'expected_not_contains'  => array(
					// 生のタグや属性を閉じる引用符が漏れていない。
					// Neither a raw tag nor an attribute-closing quote leaks into the markup.
					'<b>',
					'<i>',
					'"slideshow"',
					// 二重エスケープされていない。& が 1 文字含まれているため、esc_attr()
					// を重ねがけした実装ならここで &amp;amp; が現れて落ちる。
					// Not double encoded. The ampersand is what makes this fail if the
					// value were escaped a second time on top of what set_attribute()
					// already does.
					'&amp;amp;',
					'&amp;quot;',
					'&amp;lt;',
				),
				'expected_counts'        => array(),
				'expected_unchanged'     => false,
			),
			array(
				'test_condition_name'   => '対象ボタンを含まないコンテンツ => 変更されずそのまま返る',
				'content'                => $content_without_button,
				'translation_filter'     => null,
				'expected_contains'      => array(),
				'expected_not_contains'  => array(),
				'expected_counts'        => array(),
				'expected_unchanged'     => true,
			),
			array(
				'test_condition_name'   => '文字列としては swiper-pause-button を含むが対象クラスのボタンではない場合 => 変更されずそのまま返る',
				'content'                => $content_with_other_class,
				'translation_filter'     => null,
				'expected_contains'      => array(),
				'expected_not_contains'  => array(),
				'expected_counts'        => array(),
				'expected_unchanged'     => true,
			),
			array(
				'test_condition_name'   => '旧バージョンで訳文が焼き付いた保存済みコンテンツ => 現在の訳文で上書きされる',
				'content'                => $legacy_content,
				'translation_filter'     => null,
				'expected_contains'      => array(
					'aria-label="Pause slideshow"',
					'data-label-pause="Pause slideshow"',
					'data-label-play="Play slideshow"',
				),
				'expected_not_contains'  => array( 'OLD PAUSE', 'OLD PLAY' ),
				'expected_counts'        => array(),
				'expected_unchanged'     => false,
			),
		);

		foreach ( $test_cases as $case ) {
			if ( null !== $case['translation_filter'] ) {
				add_filter( 'gettext', $case['translation_filter'], 10, 3 );
			}

			// 差し込んだ翻訳フィルタは、途中のアサーションが失敗しても必ず外す。
			// finally が無いと、失敗した時点でメソッドが中断してフィルタが登録されたまま残り、
			// 以降に `__( 'Pause slideshow', ... )` を通る別のテストが偽の訳文を受け取って
			// 連鎖的に落ちる（本当の失敗が 1 件なのに何件も赤くなり、原因が追えなくなる）。
			//
			// The injected translation filter must come off even when an assertion in between
			// fails. Without the finally, a failure aborts the method with the filter still
			// registered, so every later test that goes through
			// `__( 'Pause slideshow', ... )` picks up the fake translation and fails too —
			// turning one real failure into a cascade that hides its cause.
			try {
				$actual = vk_blocks_add_slider_pause_button_labels( $case['content'] );

				if ( $case['expected_unchanged'] ) {
					// 対象外のコンテンツは 1 バイトも変更されずに返る。
					// Content with no target is returned completely unchanged.
					$this->assertSame( $case['content'], $actual, $case['test_condition_name'] );
				}

				foreach ( $case['expected_contains'] as $expected_substring ) {
					$this->assertStringContainsString( $expected_substring, $actual, $case['test_condition_name'] );
				}
				foreach ( $case['expected_not_contains'] as $unexpected_substring ) {
					$this->assertStringNotContainsString( $unexpected_substring, $actual, $case['test_condition_name'] );
				}
				foreach ( $case['expected_counts'] as $needle => $expected_count ) {
					$this->assertSame( $expected_count, substr_count( $actual, $needle ), $case['test_condition_name'] );
				}

				// 不変条件（全ケース共通）:
				// 1. 冪等性 — 同じ内容にもう一度適用しても結果が変わらない。スライド内に
				//    別のスライダーが入れ子になっている場合、内側のボタンは自身の
				//    render_block で 1 度、外側のスライダーのコンテンツとしてもう 1 度
				//    処理されるため、この性質が必要になる。
				// 2. 属性が重複しない — 2 回目の適用で aria-label / data-label-* の
				//    出現回数が増えない。
				//
				// Invariants checked for every case:
				// 1. Idempotency — applying the function again to its own output
				//    produces the same result. This matters because a slider nested
				//    inside another slider's slide is processed once on its own
				//    render_block pass and again as part of the outer slider's content.
				// 2. No attribute duplication — the occurrence count of aria-label /
				//    data-label-* does not grow on the second pass.
				$twice = vk_blocks_add_slider_pause_button_labels( $actual );
				$this->assertSame( $actual, $twice, $case['test_condition_name'] . '（2 回適用しても結果が変わらない）' );
				foreach ( array( 'aria-label=', 'data-label-pause=', 'data-label-play=' ) as $attribute_prefix ) {
					$this->assertSame(
						substr_count( $actual, $attribute_prefix ),
						substr_count( $twice, $attribute_prefix ),
						$case['test_condition_name'] . '（2 回目の適用で属性が重複しない）'
					);
				}
			} finally {
				if ( null !== $case['translation_filter'] ) {
					remove_filter( 'gettext', $case['translation_filter'], 10 );
				}
			}
		}
	}

	/**
	 * ブロック名付きの render_block フィルタに登録され、対象ブロックで実際に効くことを確認する。
	 * Confirms the callback is hooked to the per-block-name render_block filters and
	 * actually fires for the target blocks.
	 *
	 * 汎用の `render_block` ではなく `render_block_{$block_name}` を使っているため、
	 * 対象ブロック以外ではそもそもコールバックが呼ばれない。「対象外は素通し」の代わりに
	 * 「汎用フィルタには登録していない」ことを固定する。
	 *
	 * これは `test_vk_blocks_add_slider_pause_button_labels()` の配列（入力 content →
	 * 出力の期待値）とは検証している軸が異なる（フィルタの登録先そのものを見る）ため、
	 * 同じ配列に統合せず別メソッドとして残している。
	 *
	 * The callback is hooked to the per-block-name filters rather than the generic
	 * `render_block`, so it is never invoked for other blocks in the first place. Instead
	 * of a pass-through case, this pins down that the generic filter is not used.
	 *
	 * This checks a different axis (where the callback is hooked) than
	 * `test_vk_blocks_add_slider_pause_button_labels()`'s array (input content →
	 * expected output), so it is kept as a separate method instead of being folded
	 * into that array.
	 */
	public function test_hooked_to_per_block_name_render_filters() {
		$content = $this->get_button_markup();

		// スライダーブロック（静的）。
		// Slider block (static).
		$this->assertStringContainsString(
			'aria-label="Pause slideshow"',
			apply_filters( 'render_block_vk-blocks/slider', $content, array(), null )
		);

		// 投稿リストスライダーブロック（動的）。
		// Post List Slider block (dynamic).
		$this->assertStringContainsString(
			'aria-label="Pause slideshow"',
			apply_filters( 'render_block_vk-blocks/post-list-slider', $content, array(), null )
		);

		// 汎用の render_block には登録していない（全ブロックで走らせないため）。
		// Not hooked to the generic render_block filter, so it does not run for every block.
		$this->assertFalse(
			has_filter( 'render_block', 'vk_blocks_add_slider_pause_button_labels' )
		);
	}
}
