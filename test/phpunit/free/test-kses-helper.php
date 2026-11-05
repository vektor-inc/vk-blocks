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
	 * Test vk_blocks_allow_wp_kses_allowed_html().
	 * vk_blocks_allow_wp_kses_allowed_html() のテスト。
	 *
	 * Checks the filter itself (which tags are added in which context) and the save paths that use it
	 * (a comment from a logged-out visitor, and posts saved by users without the unfiltered_html capability).
	 * フィルター単体（どの場面にどのタグを足すか）と、フィルターが使われる保存経路
	 * （未ログインの訪問者のコメント、unfiltered_html 権限の無いユーザーの投稿の保存）の両方を確認する。
	 *
	 * @return void
	 */
	public function test_vk_blocks_allow_wp_kses_allowed_html() {
		// Tags and attributes that the filter adds in the 'post' context.
		// 投稿の本文の場面でフィルターが足すタグと属性。
		$style_tag = array(
			'type' => true,
		);
		$svg_tag   = array(
			'viewbox'             => true,
			'xmlns'               => true,
			'preserveaspectratio' => true,
			'class'               => true,
			'width'               => true,
			'height'              => true,
			'aria-hidden'         => true,
			'focusable'           => true,
		);
		$path_tag  = array(
			'fill'         => true,
			'd'            => true,
			'stroke-width' => true,
			'class'        => true,
		);
		$rect_tag  = array(
			'x'      => true,
			'y'      => true,
			'width'  => true,
			'height' => true,
			'rx'     => true,
		);
		$a_tag     = array(
			'aria-pressed' => true,
		);
		$li_tag    = array(
			'aria-selected' => true,
			'tabindex'      => true,
		);

		// A list in the shape of the comment / data allowlist, used for the contexts that must stay unchanged.
		// 変えてはいけない場面に渡す、コメント・data の許可リストと同じ形の一覧。
		$comment_tags = array(
			'a' => array(
				'href'  => true,
				'title' => true,
			),
			'b' => array(),
		);

		// 1. Call the filter for each context (directly, or through WordPress for the last two cases).
		// 1. 場面ごとにフィルターを呼ぶ（最後の 2 件は WordPress 経由で呼ぶ）。
		$filter_cases = array(
			array(
				'test_condition_name' => '投稿の本文の場面で空の一覧を渡した場合 => style・svg・path・rect と a の aria-pressed・li の aria-selected と tabindex だけが足され、input は足されない',
				'conditions'          => array(
					'tags'    => array(),
					'context' => 'post',
				),
				'expected'            => array(
					'style' => $style_tag,
					'svg'   => $svg_tag,
					'path'  => $path_tag,
					'rect'  => $rect_tag,
					'a'     => $a_tag,
					'li'    => $li_tag,
				),
			),
			array(
				'test_condition_name' => '投稿の本文の場面で style に既存の属性がある場合 => 既存の属性を残して type が足される',
				'conditions'          => array(
					'tags'    => array(
						'style' => array(
							'media' => 'print',
						),
					),
					'context' => 'post',
				),
				'expected'            => array(
					'style' => array(
						'type'  => true,
						'media' => 'print',
					),
					'svg'   => $svg_tag,
					'path'  => $path_tag,
					'rect'  => $rect_tag,
					'a'     => $a_tag,
					'li'    => $li_tag,
				),
			),
			array(
				'test_condition_name' => '投稿の本文の場面で svg・path・rect・li に既存の属性がある場合 => 既存の属性を残して足りない属性が足される',
				'conditions'          => array(
					'tags'    => array(
						'svg'  => array(
							'role' => true,
						),
						'path' => array(
							'opacity' => true,
						),
						'rect' => array(
							'ry' => true,
						),
						'li'   => array(
							'role' => true,
						),
					),
					'context' => 'post',
				),
				'expected'            => array(
					'svg'   => array(
						'viewbox'             => true,
						'xmlns'               => true,
						'preserveaspectratio' => true,
						'class'               => true,
						'width'               => true,
						'height'              => true,
						'aria-hidden'         => true,
						'focusable'           => true,
						'role'                => true,
					),
					'path'  => array(
						'fill'         => true,
						'd'            => true,
						'stroke-width' => true,
						'class'        => true,
						'opacity'      => true,
					),
					'rect'  => array(
						'x'      => true,
						'y'      => true,
						'width'  => true,
						'height' => true,
						'rx'     => true,
						'ry'     => true,
					),
					'li'    => array(
						'aria-selected' => true,
						'tabindex'      => true,
						'role'          => true,
					),
					'style' => $style_tag,
					'a'     => $a_tag,
				),
			),
			array(
				'test_condition_name' => '投稿の本文の場面でほかのプラグインが svg の width と li の aria-selected・tabindex を false で足している場合 => 既存の定義を残す',
				'conditions'          => array(
					'tags'    => array(
						'svg' => array(
							'width' => false,
						),
						'li'  => array(
							'aria-selected' => false,
							'tabindex'      => false,
						),
					),
					'context' => 'post',
				),
				'expected'            => array(
					'svg'   => array(
						'viewbox'             => true,
						'xmlns'               => true,
						'preserveaspectratio' => true,
						'class'               => true,
						'width'               => false,
						'height'              => true,
						'aria-hidden'         => true,
						'focusable'           => true,
					),
					'li'    => array(
						'aria-selected' => false,
						'tabindex'      => false,
					),
					'style' => $style_tag,
					'path'  => $path_tag,
					'rect'  => $rect_tag,
					'a'     => $a_tag,
				),
			),
			array(
				'test_condition_name' => '投稿の本文の場面でほかのプラグインが input を足している場合 => input の属性はそのまま変わらない',
				'conditions'          => array(
					'tags'    => array(
						'input' => array(
							'name'    => true,
							'value'   => true,
							'checked' => true,
						),
					),
					'context' => 'post',
				),
				'expected'            => array(
					'input' => array(
						'name'    => true,
						'value'   => true,
						'checked' => true,
					),
					'style' => $style_tag,
					'svg'   => $svg_tag,
					'path'  => $path_tag,
					'rect'  => $rect_tag,
					'a'     => $a_tag,
					'li'    => $li_tag,
				),
			),
			array(
				'test_condition_name' => '投稿の本文の場面で a に既存の属性がある場合 => 既存の属性を残して aria-pressed が足される',
				'conditions'          => array(
					'tags'    => array(
						'a' => array(
							'href'  => true,
							'class' => true,
						),
					),
					'context' => 'post',
				),
				'expected'            => array(
					'a'     => array(
						'aria-pressed' => true,
						'href'         => true,
						'class'        => true,
					),
					'style' => $style_tag,
					'svg'   => $svg_tag,
					'path'  => $path_tag,
					'rect'  => $rect_tag,
					'li'    => $li_tag,
				),
			),
			array(
				'test_condition_name' => '投稿の本文の場面で a にほかのプラグインが aria-pressed を false で足している場合 => 既存の定義を残す',
				'conditions'          => array(
					'tags'    => array(
						'a' => array(
							'aria-pressed' => false,
							'href'         => true,
						),
					),
					'context' => 'post',
				),
				'expected'            => array(
					'a'     => array(
						'aria-pressed' => false,
						'href'         => true,
					),
					'style' => $style_tag,
					'svg'   => $svg_tag,
					'path'  => $path_tag,
					'rect'  => $rect_tag,
					'li'    => $li_tag,
				),
			),
			array(
				'test_condition_name' => 'コメントの場面（pre_comment_content）の場合 => a・svg・li などに何も足さず、受け取った一覧のまま',
				'conditions'          => array(
					'tags'    => $comment_tags,
					'context' => 'pre_comment_content',
				),
				'expected'            => $comment_tags,
			),
			array(
				'test_condition_name' => 'data の場面の場合 => 受け取った一覧のまま',
				'conditions'          => array(
					'tags'    => $comment_tags,
					'context' => 'data',
				),
				'expected'            => $comment_tags,
			),
			array(
				'test_condition_name' => '投稿タイトルの場面（title_save_pre）の場合 => 受け取った一覧のまま',
				'conditions'          => array(
					'tags'    => $comment_tags,
					'context' => 'title_save_pre',
				),
				'expected'            => $comment_tags,
			),
			array(
				'test_condition_name' => 'プロフィール文の場面（pre_user_description）の場合 => 受け取った一覧のまま',
				'conditions'          => array(
					'tags'    => $comment_tags,
					'context' => 'pre_user_description',
				),
				'expected'            => $comment_tags,
			),
			array(
				'test_condition_name' => 'すべてのタグを除去する場面（strip）の場合 => 空の一覧のまま',
				'conditions'          => array(
					'tags'    => array(),
					'context' => 'strip',
				),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'ほかのプラグインの独自の場面で input を許可している場合 => 受け取った一覧のまま',
				'conditions'          => array(
					'tags'    => array(
						'input' => array(
							'type'    => true,
							'checked' => true,
						),
					),
					'context' => 'vk_test_other_plugin_form',
				),
				'expected'            => array(
					'input' => array(
						'type'    => true,
						'checked' => true,
					),
				),
			),
			array(
				'test_condition_name' => '場面名が空文字の場合 => 受け取った一覧のまま',
				'conditions'          => array(
					'tags'    => $comment_tags,
					'context' => '',
				),
				'expected'            => $comment_tags,
			),
			array(
				'test_condition_name' => 'ほかのプラグインが apply_filters() を引数 1 つ（場面名なし）で呼んだ場合 => 致命的エラーにならず、受け取った一覧のまま',
				'conditions'          => array(
					'call' => 'apply_filters_one_arg',
					'tags' => array(),
				),
				'expected'            => array(),
			),
			array(
				'test_condition_name' => 'wp_kses_allowed_html() に配列を直接渡した場合（場面名は explicit） => 何も足されない',
				'conditions'          => array(
					'call' => 'wp_kses_allowed_html',
					'tags' => $comment_tags,
				),
				'expected'            => $comment_tags,
			),
		);

		foreach ( $filter_cases as $test_case ) {
			$conditions = $test_case['conditions'];
			$call       = isset( $conditions['call'] ) ? $conditions['call'] : 'direct';

			if ( 'apply_filters_one_arg' === $call ) {
				// Leave only this plugin's callback on the hook. Since WordPress 7.1, a core callback on this hook
				// also requires the context, so it would fail on a one-argument call by itself.
				// フックにこのプラグインのコールバックだけを残す。WordPress 7.1 以降は本体のコールバックも場面名を必須にしており、
				// 引数 1 つの呼び出しではそちらが先にエラーになるため外す（$wp_filter はテスト後に自動で元に戻る）。
				remove_filter( 'wp_kses_allowed_html', '_wp_kses_allow_note_mention_span', 10 );
				$actual = apply_filters( 'wp_kses_allowed_html', $conditions['tags'] );
			} elseif ( 'wp_kses_allowed_html' === $call ) {
				// Passing an array makes WordPress run the filter with the 'explicit' context.
				// 配列を渡すと、WordPress は場面名 explicit でフィルターを通す。
				$actual = wp_kses_allowed_html( $conditions['tags'] );
			} else {
				$actual = vk_blocks_allow_wp_kses_allowed_html( $conditions['tags'], $conditions['context'] );
			}

			$this->assertSame( $test_case['expected'], $actual, $test_case['test_condition_name'] );
		}

		// 2. Save through WordPress and check which tags remain in the saved content.
		// 2. WordPress の保存処理を通し、保存された内容にどのタグが残るかを確かめる。
		$button_content = '<div class="wp-block-vk-blocks-button vk_button"><a href="#" class="vk_button_link btn btn-primary" role="button" aria-pressed="true" rel="noopener"><div class="vk_button_link_caption">vk-test</div></a></div>';
		// Saved HTML of the outer block divider, the slider pause button and the tab labels.
		// アウターの区切り線・スライダーの停止ボタン・タブのラベルの保存 HTML。
		$outer_content  = '<div class="vk_outer_separator vk_outer_separator-position-upper vk_outer_separator-type-tilt" style="padding-bottom:3px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="m0,97 L100,100 L0,100 z" stroke-width="0" fill="#ffffff" class="has-text-color"></path></svg></div>';
		$slider_content = '<button type="button" class="vk_slider_pauseButton swiper-pause-button"><svg class="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-pause" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><rect x="3" y="2" width="4" height="12" rx="1" /><rect x="9" y="2" width="4" height="12" rx="1" /></svg></button>';
		$tab_content    = '<ul class="vk_tab_labels" role="tablist"><li id="vk_tab_labels_label-a" class="vk_tab_labels_label vk_tab_labels_label-state-active" tabindex="0" role="tab" aria-selected="true" aria-controls="vk_tab_bodys_body-a"><div class="">Tab A</div></li><li id="vk_tab_labels_label-b" class="vk_tab_labels_label vk_tab_labels_label-state-inactive" tabindex="-1" role="tab" aria-selected="false" aria-controls="vk_tab_bodys_body-b"><div class="">Tab B</div></li></ul>';
		$post_content   = '<style>.vk-test{color:red}</style><svg viewBox="0 0 10 10"><path d="M0 0L10 10"></path></svg><form method="post"><input type="text" name="vk-test"></form>';
		$save_cases     = array(
			array(
				'test_condition_name' => '未ログインの訪問者が style・input・svg を含むコメントを送った場合 => すべて消え、コメントで許可されている b は残る',
				'conditions'          => array(
					'save_as' => 'comment',
					'role'    => '',
					'content' => '<style>.vk-test{color:red}</style><input type="text" name="vk-test"><svg viewBox="0 0 10 10"><path d="M0 0L10 10"></path></svg><b>vk-test</b>',
				),
				'expected'            => array(
					'<style' => false,
					'<input' => false,
					'<svg'   => false,
					'<path'  => false,
					'<b>'    => true,
				),
			),
			array(
				'test_condition_name' => '未ログインの訪問者が aria-pressed 付きの a を含むコメントを送った場合 => aria-pressed は消え、a と href は残る',
				'conditions'          => array(
					'save_as' => 'comment',
					'role'    => '',
					'content' => '<a href="https://example.com/" aria-pressed="true">vk-test</a>',
				),
				'expected'            => array(
					'aria-pressed' => false,
					'<a href='     => true,
				),
			),
			array(
				'test_condition_name' => '投稿者がボタンブロックの保存 HTML（aria-pressed 付きの a）を保存した場合 => aria-pressed が残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'author',
					'content' => $button_content,
				),
				'expected'            => array(
					'aria-pressed="true"' => true,
					'role="button"'       => true,
				),
			),
			array(
				'test_condition_name' => '寄稿者がボタンブロックの保存 HTML（aria-pressed 付きの a）を保存した場合 => aria-pressed が残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'contributor',
					'content' => $button_content,
				),
				'expected'            => array(
					'aria-pressed="true"' => true,
					'role="button"'       => true,
				),
			),
			array(
				'test_condition_name' => '未ログインの訪問者がアウターの区切り線・スライダーの停止ボタン・タブのラベルを含むコメントを送った場合 => 足した属性・rect は消える',
				'conditions'          => array(
					'save_as' => 'comment',
					'role'    => '',
					'content' => $outer_content . $slider_content . $tab_content,
				),
				'expected'            => array(
					'has-text-color'             => false,
					'<rect'                      => false,
					'aria-selected'              => false,
					'focusable'                  => false,
					'vk_slider_pauseButton_icon' => false,
				),
			),
			array(
				'test_condition_name' => '投稿者がアウターの区切り線（path に class）を保存した場合 => path の class が残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'author',
					'content' => $outer_content,
				),
				'expected'            => array(
					'stroke-width="0" fill="#ffffff" class="has-text-color"' => true,
					'preserveaspectratio="none"' => true,
				),
			),
			array(
				'test_condition_name' => '投稿者がスライダーの停止ボタン（svg の属性と rect）を保存した場合 => svg の属性と rect の属性が残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'author',
					'content' => $slider_content,
				),
				'expected'            => array(
					'class="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-pause"' => true,
					'width="16" height="16"' => true,
					'aria-hidden="true"'     => true,
					'focusable="false"'      => true,
					'<rect x="3" y="2" width="4" height="12" rx="1"' => true,
					'<rect x="9" y="2" width="4" height="12" rx="1"' => true,
				),
			),
			array(
				'test_condition_name' => '寄稿者がスライダーの停止ボタン（svg の属性と rect）を保存した場合 => svg の属性と rect の属性が残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'contributor',
					'content' => $slider_content,
				),
				'expected'            => array(
					'width="16" height="16"' => true,
					'focusable="false"'      => true,
					'<rect x="3" y="2" width="4" height="12" rx="1"' => true,
				),
			),
			array(
				'test_condition_name' => '投稿者がタブのラベル（li の aria-selected）を保存した場合 => aria-selected が true・false とも残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'author',
					'content' => $tab_content,
				),
				'expected'            => array(
					'aria-selected="true"'  => true,
					'aria-selected="false"' => true,
					'role="tab"'            => true,
				),
			),
			array(
				'test_condition_name' => '投稿者がタブのラベル（li の tabindex）を保存した場合 => tabindex が 0・-1 とも残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'author',
					'content' => $tab_content,
				),
				'expected'            => array(
					'tabindex="0"'  => true,
					'tabindex="-1"' => true,
				),
			),
			array(
				'test_condition_name' => '寄稿者がタブのラベル（li の aria-selected と tabindex）を保存した場合 => aria-selected と tabindex が残る',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'contributor',
					'content' => $tab_content,
				),
				'expected'            => array(
					'aria-selected="true"' => true,
					'tabindex="0"'         => true,
					'tabindex="-1"'        => true,
				),
			),
			array(
				'test_condition_name' => '投稿者が style・svg・form・input を含む投稿を保存した場合 => style・svg・path は残り、form・input は消える',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'author',
					'content' => $post_content,
				),
				'expected'            => array(
					'<style' => true,
					'<svg'   => true,
					'<path'  => true,
					'<form'  => false,
					'<input' => false,
				),
			),
			array(
				'test_condition_name' => '寄稿者が style・svg・form・input を含む投稿を保存した場合 => style・svg・path は残り、form・input は消える',
				'conditions'          => array(
					'save_as' => 'post',
					'role'    => 'contributor',
					'content' => $post_content,
				),
				'expected'            => array(
					'<style' => true,
					'<svg'   => true,
					'<path'  => true,
					'<form'  => false,
					'<input' => false,
				),
			),
		);

		// A post that accepts comments, used by the comment case.
		// コメントのケースで使う、コメントを受け付ける投稿。
		$comment_post_id = $this->factory()->post->create(
			array(
				'comment_status' => 'open',
			)
		);

		// Turn off the comment flood check, because comments are sent several times from the same IP address.
		// 同じ IP アドレスから続けてコメントを送るため、連続投稿の制限を無効にする（$wp_filter はテスト後に自動で元に戻る）。
		remove_action( 'check_comment_flood', 'check_comment_flood_db', 10 );

		foreach ( $save_cases as $test_case ) {
			// Switch to a logged-out visitor or a user of the given role. KSES is set up again for that user.
			// 未ログインの訪問者、または指定した権限グループのユーザーに切り替える（KSES もそのユーザー向けに設定し直される）。
			$user_id = 0;
			if ( '' !== $test_case['conditions']['role'] ) {
				$user_id = $this->factory()->user->create(
					array(
						'role' => $test_case['conditions']['role'],
					)
				);
			}
			wp_set_current_user( $user_id );
			$this->assertFalse( current_user_can( 'unfiltered_html' ), $test_case['test_condition_name'] );

			if ( 'comment' === $test_case['conditions']['save_as'] ) {
				// Register the comment with the same function that wp-comments-post.php uses.
				// wp-comments-post.php と同じ関数でコメントを登録する。
				$comment_id = wp_new_comment(
					wp_slash(
						array(
							'comment_post_ID'      => $comment_post_id,
							'comment_author'       => 'vk-test',
							'comment_author_email' => 'vk-test@example.com',
							'comment_author_url'   => '',
							'comment_author_IP'    => '127.0.0.1',
							'comment_agent'        => '',
							'comment_content'      => $test_case['conditions']['content'],
							'comment_type'         => 'comment',
							'comment_parent'       => 0,
							'user_id'              => 0,
						)
					),
					true
				);
				$this->assertIsInt( $comment_id, $test_case['test_condition_name'] );
				$saved_content = get_comment( $comment_id )->comment_content;
			} else {
				// Save a draft post as the current user.
				// 現在のユーザーで下書きの投稿を保存する。
				$post_id       = wp_insert_post(
					array(
						'post_author'  => $user_id,
						'post_content' => $test_case['conditions']['content'],
						'post_status'  => 'draft',
						'post_title'   => $test_case['test_condition_name'],
						'post_type'    => 'post',
					)
				);
				$saved_content = get_post_field( 'post_content', $post_id, 'raw' );
			}

			// Check each tag: true means it must remain, false means it must be removed.
			// タグごとに確かめる（true は残る、false は消える）。
			// WordPress 6.9 以前の kses は属性名の大文字小文字を保ち、7.0 以降は小文字にするため、大文字小文字は区別しない。
			foreach ( $test_case['expected'] as $tag => $is_kept ) {
				$message = $test_case['test_condition_name'] . ' : ' . $tag;
				if ( $is_kept ) {
					$this->assertStringContainsStringIgnoringCase( $tag, $saved_content, $message );
				} else {
					$this->assertStringNotContainsStringIgnoringCase( $tag, $saved_content, $message );
				}
			}
		}

		wp_set_current_user( 0 );
	}

	/**
	 * Verify that users without unfiltered_html keep safe highlighter colors when saving posts.
	 * unfiltered_html 権限を持たないユーザーが投稿を保存しても、安全な蛍光マーカー色が保持されることを確認する。
	 *
	 * Covers both the legacy rgba() form and the palette slug reference form
	 * (`var(--wp--preset--color--<slug>, <color code>)`) written by the highlighter format.
	 * 蛍光マーカー書式が出力する従来の rgba() 形式と、パレットのスラッグを参照する形式の
	 * （`var(--wp--preset--color--<スラッグ>, <色コード>)`）両方を対象にする。
	 *
	 * @return void
	 */
	public function test_vk_blocks_allow_color_functions_in_kses() {
		$test_cases = array(
			array(
				'test_condition_name' => '投稿者が rgba の蛍光マーカー色を保存した場合 => 色が保持される',
				'role'                => 'author',
				'style'               => '--vk-highlighter-color: rgba(240, 145, 145, 0.7)',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '寄稿者が rgba の蛍光マーカー色を保存した場合 => 色が保持される',
				'role'                => 'contributor',
				'style'               => '--vk-highlighter-color: rgba(255, 255, 0, 0.5)',
				'expected'            => true,
			),
			array(
				// Save format for an opaque palette color. The 0.7 opacity is applied in CSS
				// instead of being baked into the post content, so only the reference is stored.
				// パレットに登録された不透明な色を選んだ場合の保存形式。不透明度 0.7 は記事本文に
				// 焼かず CSS 側で掛けるため、ここでは色の参照だけを保存する。
				'test_condition_name' => '投稿者がパレットの不透明な色をスラッグ参照で保存した場合 => 参照が保持される',
				'role'                => 'author',
				'style'               => '--vk-highlighter-base: var(--wp--preset--color--black, #000000)',
				'expected'            => true,
			),
			array(
				// Palette colors that already carry an alpha are not multiplied by 0.7, so the
				// reference with its fallback goes into the variable holding the final color.
				// パレット側に不透明度が指定されている色は 0.7 を掛けないため、
				// 0.7 適用済みの色を入れる変数側に、予備の値つきの参照を保存する。
				'test_condition_name' => '寄稿者が不透明度つきのパレット色をスラッグ参照で保存した場合 => 参照が保持される',
				'role'                => 'contributor',
				'style'               => '--vk-highlighter-color: var(--wp--preset--color--text-secondary, rgba(0,0,0,0.5))',
				'expected'            => true,
			),
			array(
				'test_condition_name' => '投稿者が不正な rgba 値を保存した場合 => 色が除去される',
				'role'                => 'author',
				'style'               => '--vk-highlighter-color: rgba(javascript:alert(1))',
				'expected'            => false,
			),
			array(
				// 閉じ括弧のない巨大な数値・カンマ・空白の羅列。ストリッピング用正規表現を
				// バックトラック爆発させて preg_replace() に null を返させ、fail-open
				// （本来拒否すべき値が許可される）を起こさないことを確認する。
				'test_condition_name' => '投稿者が閉じ括弧のない巨大な rgba 値を保存した場合 => 色が除去される',
				'role'                => 'author',
				'style'               => '--vk-highlighter-color: rgba(' . str_repeat( '0,', 300000 ) . str_repeat( ' ', 300000 ),
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
			$expected_style = $test_case['style'];
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
