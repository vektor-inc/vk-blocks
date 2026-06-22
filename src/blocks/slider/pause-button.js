import { __ } from '@wordpress/i18n';

/**
 * スライダーの自動再生 停止/再生ボタンの HTML を返す。
 *
 * 停止/再生の状態切り替えはフロント側 (view.js) で行うため、
 * ここでは再生中（停止アイコン表示）の初期状態でマークアップを生成する。
 * 切り替え時に使う aria-label は data 属性として保持しておく。
 *
 * @return {JSX.Element} 停止/再生ボタン要素
 */
export const PauseButton = () => {
	// 再生中に表示するラベル（押すと停止する）/ ラベルは1文ごとに区切る
	const labelPause = __('Pause slideshow', 'vk-blocks');
	// 停止中に表示するラベル（押すと再生する）
	const labelPlay = __('Play slideshow', 'vk-blocks');

	return (
		<button
			type="button"
			className="vk_slider_pauseButton swiper-pause-button"
			aria-label={labelPause}
			data-label-pause={labelPause}
			data-label-play={labelPlay}
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
