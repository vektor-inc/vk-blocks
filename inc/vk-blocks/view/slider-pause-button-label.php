<?php
/**
 * Slider pause / play button label injection.
 * スライダーの停止/再生ボタンへのラベル注入。
 *
 * @package vk-blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Returns the aria-labels for the slider pause / play button.
 * スライダーの停止/再生ボタンに使う aria-label を返す。
 *
 * These strings must never be baked into the saved block markup: a static block's
 * `save` output is compared byte for byte against the current `save` result, so a
 * translated string frozen in the database turns into a block validation error the
 * moment the translation changes. They are resolved here, at render time, instead.
 *
 * この文字列を保存済みマークアップに焼き付けてはいけない。静的ブロックの `save` 出力は
 * 現行の `save` 結果とバイト単位で突き合わされるため、翻訳文がデータベースに固定されると
 * 翻訳を変えた瞬間にブロック検証エラーになる。そのため描画時にここで解決する。
 *
 * Resolving on the PHP side also means the front end follows the site locale rather
 * than the locale of whoever happened to edit the post in the block editor.
 * PHP 側で解決することで、フロントの表示は「投稿を編集した人のロケール」ではなく
 * サイトのロケールに従うようになる。
 *
 * ⚠️ 同期注意: ここの英語原文は、以下 2 ファイルの FALLBACK_LABEL_PAUSE /
 * FALLBACK_LABEL_PLAY にリテラルで複製されている。原文を変更する場合は必ず両方を
 * 更新すること。
 *   - src/blocks/slider/view.js
 *   - src/blocks/_pro/post-list-slider/view.js
 * これらは PHP のラベル注入を通らなかった場合の最終フォールバックで、めったに発火
 * しないため、乖離しても実行時には気づけない。view.js は gulp で直接 minify される
 * 都合で PHP と値を共有できず、やむなく重複させている。
 *
 * ⚠️ Sync note: the English source strings here are duplicated as literals in the
 * FALLBACK_LABEL_PAUSE / FALLBACK_LABEL_PLAY constants of the two files below. When
 * changing the source strings, update both of them as well.
 *   - src/blocks/slider/view.js
 *   - src/blocks/_pro/post-list-slider/view.js
 * Those are the last-resort fallback for markup that never went through the PHP
 * injection. They almost never fire, so a drift would not surface at runtime. The view
 * scripts are minified directly by gulp and cannot share the value with PHP, hence the
 * duplication.
 *
 * @return array{pause:string,play:string} Labels for the playing / paused states.
 *                                         再生中／停止中それぞれのラベル。
 */
function vk_blocks_get_slider_pause_button_labels() {
	return array(
		// Shown while playing — pressing the button pauses the slideshow.
		// 再生中に表示するラベル（押すと停止する）。
		'pause' => __( 'Pause slideshow', 'vk-blocks' ),
		// Shown while paused — pressing the button resumes the slideshow.
		// 停止中に表示するラベル（押すと再生する）。
		'play'  => __( 'Play slideshow', 'vk-blocks' ),
	);
}

/**
 * Adds the aria-label / data-label-* attributes to every pause / play button in the markup.
 * マークアップ内のすべての停止/再生ボタンに aria-label / data-label-* 属性を付与する。
 *
 * Buttons are located by their `swiper-pause-button` class rather than by a dedicated
 * marker attribute, so that content saved by older versions — which already carries the
 * translated labels baked in — also gets them overwritten with the current translation.
 * ボタンは専用のマーカー属性ではなく `swiper-pause-button` クラスで特定する。こうすることで、
 * 翻訳文が焼き付いた古いバージョンの保存済みコンテンツについても、描画時に現在の訳文で
 * 上書きできる。
 *
 * The operation is idempotent: the injected values do not depend on the existing markup,
 * so running it twice over the same button produces the same result. This matters because
 * a slider nested inside another slider's slide is processed once on its own `render_block`
 * pass and again as part of the outer slider's content.
 * この処理は冪等である。付与する値は既存のマークアップに依存しないため、同じボタンを 2 回
 * 処理しても結果は変わらない。スライド内に別のスライダーが入れ子になっている場合、内側の
 * スライダーは自身の `render_block` で 1 度、外側のスライダーのコンテンツとしてもう 1 度
 * 処理されるため、この性質が必要になる。
 *
 * Attribute values are HTML-escaped by `WP_HTML_Tag_Processor::set_attribute()` itself.
 * Escaping here as well would double-encode the translated text, so it must not be done.
 * 属性値は `WP_HTML_Tag_Processor::set_attribute()` 自身が HTML エスケープする。
 * ここで重ねてエスケープすると翻訳文が二重エンコードされるため行わない。
 *
 * `WP_HTML_Tag_Processor` is available on every WordPress version this plugin supports
 * (see "Requires at least" in readme.txt), so there is no fallback path.
 * `WP_HTML_Tag_Processor` は本プラグインが対応するすべての WordPress で利用できる
 * （readme.txt の "Requires at least" を参照）ため、フォールバック経路は用意していない。
 *
 * @param string $content 停止/再生ボタンを含む可能性があるマークアップ / markup that may contain pause / play buttons.
 * @return string ラベルを付与したマークアップ / the markup with the labels applied.
 */
function vk_blocks_add_slider_pause_button_labels( $content ) {
	// Skip the parser entirely when there is obviously no button to touch.
	// ボタンが明らかに含まれていない場合はパーサーを動かさずに素通しする。
	if ( ! is_string( $content ) || false === strpos( $content, 'swiper-pause-button' ) ) {
		return $content;
	}

	$labels = vk_blocks_get_slider_pause_button_labels();

	$processor = new WP_HTML_Tag_Processor( $content );
	while (
		$processor->next_tag(
			array(
				'tag_name'   => 'BUTTON',
				'class_name' => 'swiper-pause-button',
			)
		)
	) {
		// The initial state is "playing", so aria-label describes the pause action.
		// 初期状態は再生中なので、aria-label は停止操作を表す。
		$processor->set_attribute( 'aria-label', $labels['pause'] );
		// view.js swaps aria-label between these two values as the state changes.
		// view.js が状態変化に応じてこの 2 つの値で aria-label を入れ替える。
		$processor->set_attribute( 'data-label-pause', $labels['pause'] );
		$processor->set_attribute( 'data-label-play', $labels['play'] );
	}

	return $processor->get_updated_html();
}

/*
 * Both the Slider block (static, labels stripped from `save`) and the Post List Slider
 * block (dynamic, labels stripped from its render callback) are handled by the same
 * callback, so the label strings and the attribute names live in exactly one place.
 * スライダーブロック（静的・`save` からラベルを除去済み）と投稿リストスライダーブロック
 * （動的・render callback からラベルを除去済み）を同じコールバックで処理し、
 * ラベル文字列と属性名の定義箇所を 1 箇所に集約する。
 *
 * The per-block-name filter is used instead of the generic `render_block`, so the
 * callback is not invoked for every block on the page and no block name check is needed.
 * 汎用の `render_block` ではなくブロック名付きのフィルタを使う。ページ上のすべての
 * ブロックでコールバックが呼ばれることがなくなり、ブロック名の判定自体も不要になる。
 */
add_filter( 'render_block_vk-blocks/slider', 'vk_blocks_add_slider_pause_button_labels' );
add_filter( 'render_block_vk-blocks/post-list-slider', 'vk_blocks_add_slider_pause_button_labels' );
