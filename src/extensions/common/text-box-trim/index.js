/**
 * 見出し・段落ブロックの「文字の上下を詰める」トグル
 *
 * 本体の「タイポグラフィ」パネルの中に項目として足す。
 * ON にすると is-vk-trim-both クラスが付き、style.scss の text-box で
 * 行の高さによって文字の上下にできる余白（ハーフレディング）を取り除く。
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { VkPanelIcon } from '@vkblocks/components/vk-icon';
import { hasTrimClass, toggleTrimClass } from './class-name';

const TARGET_BLOCKS = ['core/heading', 'core/paragraph'];

// ラベルとアイコンを同じ行で縦中央にそろえる（アイコンは 24px で行より高い）
const LABEL_WITH_ICON_STYLE = {
	display: 'inline-flex',
	alignItems: 'center',
};

// スイッチのラベルの中では本体の CSS が線の色を文字色にそろえないため、
// ON の黒地で線が黒くならないよう、線の色を文字色に指定する
const ICON_FILL_STYLE = { fill: 'currentColor' };

/**
 * 「タイポグラフィ」パネルの中に出すトグル。
 *
 * @param {Object}   props               props
 * @param {string}   props.clientId      ブロックの clientId
 * @param {Object}   props.attributes    ブロックの属性
 * @param {Function} props.setAttributes 属性の更新関数
 * @return {JSX.Element} トグル
 */
const TextBoxTrimControl = ({ clientId, attributes, setAttributes }) => {
	const { className } = attributes;
	const isTrimmed = hasTrimClass(className);
	const label = __('Trim text top and bottom', 'vk-blocks');

	return (
		<InspectorControls group="typography">
			<ToolsPanelItem
				panelId={clientId}
				label={label}
				hasValue={() => hasTrimClass(attributes.className)}
				onDeselect={() =>
					setAttributes({
						className: toggleTrimClass(attributes.className, false),
					})
				}
				// 「⋮」→「リセット」でトグルも OFF に戻す。
				// 第 1 引数には className が入らないため、元の属性は第 2 引数から読む
				resetAllFilter={(newAttributes, context) => ({
					className: toggleTrimClass(
						context?.attributes?.className ??
							newAttributes?.className,
						false
					),
				})}
				isShownByDefault
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={
						<span style={LABEL_WITH_ICON_STYLE}>
							{label}
							{/* アイコンは飾りなので、チェックボックスの名前には含めない */}
							<span
								aria-hidden="true"
								style={LABEL_WITH_ICON_STYLE}
							>
								<VkPanelIcon
									isActive={isTrimmed}
									customStyle={ICON_FILL_STYLE}
								/>
							</span>
						</span>
					}
					help={__(
						'Removes the space above and below the text created by the line height (half-leading).',
						'vk-blocks'
					)}
					checked={isTrimmed}
					onChange={(checked) =>
						setAttributes({
							className: toggleTrimClass(className, checked),
						})
					}
				/>
			</ToolsPanelItem>
		</InspectorControls>
	);
};

const withTextBoxTrimControl = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		// 対象ブロックを選択しているときだけトグルを出す
		if (!TARGET_BLOCKS.includes(props.name) || !props.isSelected) {
			return <BlockEdit {...props} />;
		}

		return (
			<>
				<BlockEdit {...props} />
				<TextBoxTrimControl
					clientId={props.clientId}
					attributes={props.attributes}
					setAttributes={props.setAttributes}
				/>
			</>
		);
	};
}, 'withTextBoxTrimControl');

addFilter(
	'editor.BlockEdit',
	'vk-blocks/text-box-trim',
	withTextBoxTrimControl
);
