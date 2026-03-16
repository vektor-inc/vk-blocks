import { __ } from '@wordpress/i18n';
import { ToggleControl, SelectControl } from '@wordpress/components';
import { ColorPalette } from '@wordpress/block-editor';
import ScrollHint from '@vkblocks/components/scroll-hint';

/**
 * スクロールバー関連の共通attribute定義
 * Group/Table ブロックの addAttribute フィルターで使用
 * Tab ブロックは block.json で同等の属性を直接定義
 */
export const scrollbarAttributes = {
	scrollbarVisible: {
		type: 'boolean',
		default: true,
	},
	scrollbarColor: {
		type: 'string',
		default: '',
	},
	scrollbarTrackColor: {
		type: 'string',
		default: '',
	},
};

/**
 * addExtraProps フィルターでスクロールバー関連の属性を適用する共通関数
 * @param {Object} saveElementProps - 保存要素のprops
 * @param {Object} attributes       - ブロックのattributes
 */
export function applyScrollbarProps(saveElementProps, attributes) {
	// scrollbarVisible が false の場合のみ属性を追加
	if (attributes.scrollable && attributes.scrollbarVisible === false) {
		saveElementProps['data-scrollbar-visible'] = 'false';
	} else {
		delete saveElementProps['data-scrollbar-visible'];
	}

	// scrollbarColor が設定されている場合のみ属性を追加
	if (attributes.scrollable && attributes.scrollbarColor) {
		saveElementProps['data-scrollbar-color'] = attributes.scrollbarColor;
		saveElementProps.style = {
			...saveElementProps.style,
			'--vk-scrollbar-color': attributes.scrollbarColor,
		};
	} else {
		delete saveElementProps['data-scrollbar-color'];
		if (saveElementProps.style) {
			delete saveElementProps.style['--vk-scrollbar-color'];
		}
	}

	// scrollbarTrackColor が設定されている場合のみ属性を追加
	if (attributes.scrollable && attributes.scrollbarTrackColor) {
		saveElementProps['data-scrollbar-track-color'] =
			attributes.scrollbarTrackColor;
		saveElementProps.style = {
			...saveElementProps.style,
			'--vk-scrollbar-track-color': attributes.scrollbarTrackColor,
		};
	} else {
		delete saveElementProps['data-scrollbar-track-color'];
		if (saveElementProps.style) {
			delete saveElementProps.style['--vk-scrollbar-track-color'];
		}
	}
}

/**
 * スクロール関連のdata属性とスタイルをattributesから構築する共通関数。
 * save / addExtraProps / editor BlockListBlock の3箇所で同一ロジックを使うための
 * Single Source of Truth。
 *
 * @param {Object} attributes - ブロックのattributes
 * @return {{ dataAttrs: Object, styles: Object }} data属性とCSSカスタムプロパティ
 */
export function buildScrollDataProps(attributes) {
	const dataAttrs = {};
	const styles = {};

	if (attributes.scrollable !== true) {
		return { dataAttrs, styles };
	}

	// ブレークポイント
	if (attributes.scrollBreakpoint) {
		dataAttrs['data-scroll-breakpoint'] = attributes.scrollBreakpoint;
	}

	// スクロールヒント
	if (attributes.showScrollMessage === true) {
		dataAttrs['data-output-scroll-hint'] = 'true';
	}
	if (
		attributes.iconOutputLeft === true &&
		attributes.showScrollMessage === true
	) {
		dataAttrs['data-icon-output-left'] = 'true';
	}
	if (
		attributes.iconOutputRight === true &&
		attributes.showScrollMessage === true
	) {
		dataAttrs['data-icon-output-right'] = 'true';
	}

	// テキスト折り返し防止
	const layoutType = attributes.layout?.type;
	const isGridOrFlexLayout = layoutType === 'grid' || layoutType === 'flex';
	if (
		attributes.textNoWrap !== false &&
		!(attributes.tableMode === true) &&
		!isGridOrFlexLayout
	) {
		dataAttrs['data-text-nowrap'] = 'true';
	}

	// テーブルモード
	if (attributes.tableMode === true) {
		dataAttrs['data-table-mode'] = 'true';
	}

	// スクロールバー
	if (attributes.scrollbarVisible === false) {
		dataAttrs['data-scrollbar-visible'] = 'false';
	}
	if (attributes.scrollbarColor) {
		dataAttrs['data-scrollbar-color'] = attributes.scrollbarColor;
		styles['--vk-scrollbar-color'] = attributes.scrollbarColor;
	}
	if (attributes.scrollbarTrackColor) {
		dataAttrs['data-scrollbar-track-color'] =
			attributes.scrollbarTrackColor;
		styles['--vk-scrollbar-track-color'] = attributes.scrollbarTrackColor;
	}

	return { dataAttrs, styles };
}

/**
 * buildScrollDataProps の結果から、すべてのスクロール関連data属性の
 * キー一覧を返す（addExtraProps での cleanup 用）。
 */
export const SCROLL_DATA_ATTR_KEYS = [
	'data-scroll-breakpoint',
	'data-output-scroll-hint',
	'data-icon-output-left',
	'data-icon-output-right',
	'data-text-nowrap',
	'data-table-mode',
	'data-scrollbar-visible',
	'data-scrollbar-color',
	'data-scrollbar-track-color',
];

/**
 * Scrollbar Controls Component
 *
 * スクロールバーの表示/非表示・カラー設定の共通UIコンポーネント
 * Group / Table / Tab ブロックで共通使用
 *
 * @param {Object}                     props
 * @param {boolean}                    props.scrollbarVisible            - スクロールバーの表示状態
 * @param {string}                     props.scrollbarColor              - スクロールバーの色
 * @param {string}                     props.scrollbarTrackColor         - スクロールバートラックの色
 * @param {(checked: boolean) => void} props.onScrollbarVisibleChange    - 表示切替ハンドラ
 * @param {(color: string) => void}    props.onScrollbarColorChange      - カラー変更ハンドラ
 * @param {(color: string) => void}    props.onScrollbarTrackColorChange - トラックカラー変更ハンドラ
 * @return {JSX.Element} Scrollbar Controls
 */
export const ScrollbarControls = ({
	scrollbarVisible,
	scrollbarColor,
	scrollbarTrackColor,
	onScrollbarVisibleChange,
	onScrollbarColorChange,
	onScrollbarTrackColorChange,
}) => {
	return (
		<>
			<ToggleControl
				label={__('Show Scrollbar', 'vk-blocks')}
				checked={scrollbarVisible !== false}
				onChange={onScrollbarVisibleChange}
				help={
					scrollbarVisible === false
						? __(
								'The scrollbar is hidden on the front end. Users can still scroll by touch or mouse drag.',
								'vk-blocks'
							)
						: __('The scrollbar is visible.', 'vk-blocks')
				}
			/>
			{scrollbarVisible !== false && (
				<>
					<p style={{ marginBottom: '8px' }}>
						{__('Scrollbar Color', 'vk-blocks')}
					</p>
					<ColorPalette
						value={scrollbarColor || undefined}
						onChange={onScrollbarColorChange}
						clearable={true}
					/>
					<p style={{ marginBottom: '8px' }}>
						{__('Scrollbar Track Color', 'vk-blocks')}
					</p>
					<ColorPalette
						value={scrollbarTrackColor || undefined}
						onChange={onScrollbarTrackColorChange}
						clearable={true}
					/>
				</>
			)}
		</>
	);
};

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
	scrollbarVisible,
	scrollbarColor,
	scrollbarTrackColor,
	onScrollbarVisibleChange,
	onScrollbarColorChange,
	onScrollbarTrackColorChange,
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
					<ScrollbarControls
						scrollbarVisible={scrollbarVisible}
						scrollbarColor={scrollbarColor}
						scrollbarTrackColor={scrollbarTrackColor}
						onScrollbarVisibleChange={onScrollbarVisibleChange}
						onScrollbarColorChange={onScrollbarColorChange}
						onScrollbarTrackColorChange={
							onScrollbarTrackColorChange
						}
					/>
					{children}
					{scrollHintProps && <ScrollHint {...scrollHintProps} />}
				</>
			)}
		</>
	);
};

export default HorizontalScrollControls;
