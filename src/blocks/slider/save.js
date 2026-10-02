import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PauseButton } from './pause-button';

export default function save({ attributes }) {
	const {
		pagination,
		blockId,
		width,
		autoPlay,
		autoPlayStop,
		autoPlayDelay,
		pauseButton,
		loop,
		effect,
		speed,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		navigationPosition,
		centeredSlides,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		direction,
		showActualSlideCount,
	} = attributes;

	const sliderData = {
		autoPlay,
		autoPlayStop,
		autoPlayDelay,
		pauseButton,
		pagination,
		width,
		loop,
		effect,
		speed,
		direction,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		centeredSlides,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		blockId,
	};

	// 既定値 false のまま無条件でキーを出すと、この属性が存在しなかった頃の
	// 保存済み投稿の HTML と現在の save 出力が食い違い、「ブロックの検証に
	// 失敗しました」というリカバリー表示が既存サイト全体で出てしまう。
	// 値が true のときだけキーを出すことで、既存投稿の出力を変えない。
	//
	// Emitting this key unconditionally (even at its false default) would make
	// the save output differ from posts saved before this attribute existed,
	// triggering a block-validation "attempt recovery" notice site-wide. Only
	// emit the key when true, so existing posts keep their current output.
	if (showActualSlideCount) {
		sliderData.showActualSlideCount = true;
	}

	let alignClass = '';
	if ('full' === width) {
		alignClass = ' alignfull';
	} else if ('wide' === width) {
		alignClass = ' alignwide';
	}

	// ページネーションの HTML
	//
	// aria-label 用の読み上げテンプレート文字列（#3080）は、ここでは出力しない。
	// save() は決定的関数である必要があり、__() の翻訳結果（保存時点のロケールで
	// 解決された文字列）を保存HTMLに埋め込むと、後でサイトの言語設定を変えたときに
	// save() の再計算結果（新ロケールの翻訳）と保存済みHTML（保存時点の翻訳）が
	// 食い違い、ブロック検証エラーになってしまう（この属性を条件付き出力にした
	// 本来の目的＝既存投稿の検証エラー回避と矛盾するため、CodeRabbitレビューで
	// 指摘・修正）。翻訳文字列は wp_localize_script() 経由で渡し、view.js が
	// window.vkBlocksSliderI18n.actualCountLabel から取得する
	// （vk_blocks_localize_slider_actual_count_label() を参照）。
	// showActualSlideCount・pagination・loop は真偽値・列挙値でロケールに依存しない
	// ため、data-vkb-slider の JSON にある値だけで view.js 側の適用判定は完結する。
	//
	// The aria-label template string (#3080) is intentionally NOT emitted here.
	// save() must be a deterministic function: embedding __()'s translation result
	// (resolved against whatever locale was active at save time) into the saved
	// HTML would make save()'s recomputed output (using a possibly different,
	// later locale) diverge from the frozen saved HTML if the site's language
	// setting changes, causing a block-validation error — defeating the very
	// purpose this attribute was made conditional for in the first place (existing
	// posts must keep validating). Found and fixed via CodeRabbit review. The
	// translated string is instead passed via wp_localize_script() and read by
	// view.js from window.vkBlocksSliderI18n.actualCountLabel (see
	// vk_blocks_localize_slider_actual_count_label()). showActualSlideCount,
	// pagination, and loop are booleans/enums (locale-independent), so view.js can
	// still decide whether to apply the override from the data-vkb-slider JSON alone.
	let pagination_html = '';
	if (pagination !== 'hide') {
		pagination_html = (
			<div
				className={`swiper-pagination swiper-pagination-${pagination}`}
			></div>
		);
	}

	// ナビゲーションの HTML
	let navigation_next_html = '';
	let navigation_prev_html = '';
	if (navigationPosition !== 'hide') {
		navigation_next_html = (
			<div
				className={`swiper-button-next swiper-button-${navigationPosition}`}
			></div>
		);
		navigation_prev_html = (
			<div
				className={`swiper-button-prev swiper-button-${navigationPosition}`}
			></div>
		);
	}

	// `swiper-container` は Swiper v7 以前の旧クラス名。v8 で `swiper` にリネームされ、
	// 現行の Swiper では参照されないため出力しない（#3069）。
	// 旧クラスを含む保存済みコンテンツは deprecated/save/1.124.0 で救済する。
	// `swiper-container` is the pre-v8 legacy class name (renamed to `swiper` in v8)
	// and is no longer referenced by Swiper, so it is not emitted anymore (#3069).
	// Content saved with the legacy class is handled by deprecated/save/1.124.0.
	const blockProps = useBlockProps.save({
		className: `swiper vk_slider vk_slider_${blockId}${alignClass}`,
	});

	// 停止/再生ボタンの HTML（自動再生が有効かつ表示設定が ON の時のみ出力）。
	// ⚠️ ボタンはスライダーのルート直下に置くこと。view.js が
	// :scope > .swiper-pause-button で直下のみを検索するため、ラッパーで囲むと
	// 停止/再生ボタンと「視差効果を減らす」対応が機能しなくなる
	// （保存出力の変更になるため deprecation も必要になる）。
	// ⚠️ Keep this button a DIRECT CHILD of the slider root: view.js locates it
	// with ':scope > .swiper-pause-button', so wrapping it breaks the pause/play
	// button and the reduced-motion handling (changing the saved markup would
	// also require a block deprecation).
	//
	// ⚠️ ラベル（aria-label / data-label-*）はここでは出力しない。翻訳文を保存出力に
	// 焼き付けると翻訳変更時にブロック検証エラーになるため、PHP 側
	// （inc/vk-blocks/view/slider-pause-button-label.php）が描画時に付与する。
	// ⚠️ The labels (aria-label / data-label-*) are intentionally not emitted here:
	// baking translated text into the saved output causes a block validation error when
	// the translation changes, so they are added at render time by
	// inc/vk-blocks/view/slider-pause-button-label.php instead.
	const pause_button_html = autoPlay && pauseButton ? <PauseButton /> : '';

	return (
		<div {...blockProps} data-vkb-slider={JSON.stringify(sliderData)}>
			<div className={`swiper-wrapper`}>
				<InnerBlocks.Content />
			</div>
			{navigation_next_html}
			{navigation_prev_html}
			{pagination_html}
			{pause_button_html}
		</div>
	);
}
