import { __ } from '@wordpress/i18n';
import { ToggleControl, SelectControl } from '@wordpress/components';
import ScrollHint from '@vkblocks/components/scroll-hint';

/**
 * Horizontal Scroll Controls Component
 *
 * 共通のHorizontal Scroll設定UIコンポーネント
 * tableとgroupブロックで共通使用
 *
 * @typedef {Object} HorizontalScrollControlsProps
 * @property {boolean}                       scrollable                          - Scrollable状態
 * @property {string}                        scrollBreakpoint                    - ブレークポイントの値 (例: 'table-scrollable-mobile', 'group-scrollable-pc')
 * @property {(checked: boolean) => void}    onScrollableChange                  - Scrollable変更ハンドラ
 * @property {(value: string) => void}       onBreakpointChange                  - ブレークポイント変更ハンドラ
 * @property {string}                        [prefix='scrollable-']              - ブレークポイント値のプレフィックス
 * @property {Object}                        [scrollHintProps]                   - ScrollHintコンポーネントに渡すprops
 * @property {boolean}                       [scrollHintProps.showScrollMessage] - スクロールメッセージを表示するか
 * @property {string}                        [scrollHintProps.scrollMessageText] - スクロールメッセージのテキスト
 * @property {string}                        [scrollHintProps.scrollIconLeft]    - 左側のアイコンクラス名
 * @property {string}                        [scrollHintProps.scrollIconRight]   - 右側のアイコンクラス名
 * @property {boolean}                       [scrollHintProps.iconOutputLeft]    - 左側のアイコンを表示するか
 * @property {boolean}                       [scrollHintProps.iconOutputRight]   - 右側のアイコンを表示するか
 * @property {React.ReactNode}               [children]                          - 追加のコントロール（groupブロックのtextNoWrapやtableModeなど）
 * @property {React.ReactNode}               [description]                       - 説明文（groupブロック用）
 *
 * @param    {HorizontalScrollControlsProps} props                               - Component props
 * @return {JSX.Element} Horizontal Scroll Controls
 */
const HorizontalScrollControls = ({
	scrollable,
	scrollBreakpoint,
	onScrollableChange,
	onBreakpointChange,
	prefix = 'scrollable-',
	scrollHintProps,
	children,
	description,
}) => {
	const breakpointOptions = [
		{
			label: __('Mobile size', 'vk-blocks'),
			value: `${prefix}mobile`,
		},
		{
			label: __('Tablet size', 'vk-blocks'),
			value: `${prefix}tablet`,
		},
		{
			label: __('PC size', 'vk-blocks'),
			value: `${prefix}pc`,
		},
	];

	return (
		<>
			{description && description}
			<ToggleControl
				label={__('Scrollable', 'vk-blocks')}
				checked={scrollable}
				onChange={onScrollableChange}
			/>
			{scrollable && (
				<>
					<SelectControl
						label={__('Horizontal Scroll Breakpoint', 'vk-blocks')}
						value={scrollBreakpoint}
						options={breakpointOptions}
						onChange={onBreakpointChange}
					/>
					{children}
					{scrollHintProps && <ScrollHint {...scrollHintProps} />}
				</>
			)}
		</>
	);
};

export default HorizontalScrollControls;
