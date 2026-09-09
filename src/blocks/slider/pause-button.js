import { __ } from '@wordpress/i18n';

/**
 * スライダーの自動再生 停止/再生ボタンの HTML を返す。
 *
 * 停止/再生の状態切り替えはフロント側 (view.js) で行うため、
 * ここでは再生中（停止アイコン表示）の初期状態でマークアップを生成する。
 *
 * ⚠️ 保存出力に翻訳文を入れないこと。静的ブロックの save 出力は現行の save 結果と
 * バイト単位で突き合わされるため、翻訳文を焼き付けると翻訳を変更した時点で
 * ブロック検証エラーになる。フロントの aria-label / data-label-* は PHP 側
 * （inc/vk-blocks/view/slider-pause-button-label.php）が描画時に付与する。
 * withLabels はエディタ表示用のオプションで、save からは決して渡さないこと。
 * ⚠️ Never bake translated text into the saved markup: a static block's save output is
 * compared byte for byte against the current save result, so a frozen translation turns
 * into a block validation error as soon as the translation changes. On the front end the
 * aria-label / data-label-* attributes are added at render time by
 * inc/vk-blocks/view/slider-pause-button-label.php. `withLabels` exists for the editor
 * preview only and must never be passed from save.
 *
 * ⚠️ 配置上の制約: このボタンはスライダーのルート直下に配置すること。
 * view.js が :scope > .swiper-pause-button で直下のみを検索するため、
 * ラッパー要素で囲むと機能しなくなる。
 * ⚠️ Placement contract: this button must be rendered as a DIRECT CHILD of the
 * slider root — view.js locates it with ':scope > .swiper-pause-button', so
 * wrapping it in another element breaks the feature.
 *
 * @param {Object}  props            プロパティ / props
 * @param {boolean} props.withLabels true の場合のみ aria-label / data-label-* を出力する
 *                                   （エディタ表示用。save からは渡さない）
 *                                   Emit aria-label / data-label-* only when true
 *                                   (editor preview only; never passed from save).
 * @return {JSX.Element} 停止/再生ボタン要素 / the pause / play button element
 */
export const PauseButton = ({ withLabels = false } = {}) => {
	// エディタ表示用のラベル。保存出力には含めない。
	// Labels for the editor preview only; never part of the saved output.
	const labelProps = withLabels
		? {
				// 再生中に表示するラベル（押すと停止する）/ ラベルは1文ごとに区切る
				'aria-label': __('Pause slideshow', 'vk-blocks'),
				'data-label-pause': __('Pause slideshow', 'vk-blocks'),
				// 停止中に表示するラベル（押すと再生する）
				'data-label-play': __('Play slideshow', 'vk-blocks'),
			}
		: {};

	return (
		<button
			type="button"
			className="vk_slider_pauseButton swiper-pause-button"
			{...labelProps}
		>
			{/* 停止アイコン（再生中に表示） */}
			<svg
				className="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-pause"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				aria-hidden="true"
				focusable="false"
			>
				<rect x="3" y="2" width="4" height="12" rx="1" />
				<rect x="9" y="2" width="4" height="12" rx="1" />
			</svg>
			{/* 再生アイコン（停止中に表示） */}
			<svg
				className="vk_slider_pauseButton_icon vk_slider_pauseButton_icon-play"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				aria-hidden="true"
				focusable="false"
			>
				<path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5z" />
			</svg>
		</button>
	);
};
