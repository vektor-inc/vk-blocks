<?php
/**
 * Plugin Name: VK E2E Event CPT
 * Description: Registers the event post type (event) and taxonomy (event-cat) used by taxonomy.spec.ts.
 *              Previously the spec downloaded VK All in One Expansion Unit from wordpress.org and
 *              built the custom post type with it; that depended on the external network and made
 *              results flaky, so it is now loaded as a mu-plugin through `mappings` in .wp-env.tests.json.
 *              For the test environment only. It is not part of the distributed plugin.
 *
 *              日本語: taxonomy.spec.ts 用のイベント投稿タイプ（event）とタクソノミー（event-cat）を登録する。
 *              以前は VK All in One Expansion Unit を wordpress.org から実際にダウンロードして
 *              カスタム投稿タイプを作っていたが、外部ネットワークに依存して結果が揺らぐため、
 *              .wp-env.tests.json の mappings で mu-plugin として読み込む形に置き換えた。
 *              テスト環境専用。本番のプラグイン配布物には含まれない。
 *
 * @package vk-blocks-pro
 */

// Do not load directly. / 直接読み込まない。
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// The WordPress test library defines this function before loading mu-plugins; skip the E2E fixture during PHPUnit runs.
// WordPress テストライブラリは mu-plugin より先にこの関数を定義するため、PHPUnit 実行時は E2E fixture を読み込まない。
if ( function_exists( 'tests_add_filter' ) ) {
	return;
}

add_action(
	'init',
	function () {
		// The spec looks elements up by their on-screen labels, so set them explicitly so they do
		// not change between WordPress versions (add_new_item differs around WP 7.0 unless set).
		// ラベルは taxonomy.spec.ts が画面上の文言で要素を探すため、WordPress のバージョンで
		// 文言が変わらないよう明示する（add_new_item を明示しないと WP 7.0 前後で変わる）。
		register_taxonomy(
			'event-cat',
			'event',
			array(
				'hierarchical' => true,
				'show_in_rest' => true,
				'show_ui'      => true,
				'public'       => true,
				'rewrite'      => array( 'slug' => 'event-cat' ),
				'labels'       => array(
					'name'          => 'Event Category',
					'singular_name' => 'Event Category',
					'add_new_item'  => 'Add Category',
				),
			)
		);

		register_post_type(
			'event',
			array(
				'public'       => true,
				'show_in_rest' => true,
				'has_archive'  => true,
				'supports'     => array( 'title', 'editor' ),
				'taxonomies'   => array( 'event-cat' ),
				'rewrite'      => array( 'slug' => 'event' ),
				'labels'       => array(
					'name'          => 'Event',
					'singular_name' => 'Event',
				),
			)
		);
	}
);
