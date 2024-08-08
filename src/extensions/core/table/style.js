import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	Icon,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ReactComponent as IconSVG } from './icon.svg';

const isValidBlockType = (name) => {
	const validBlockTypes = ['core/table'];
	return validBlockTypes.includes(name);
};

export const addAttribute = (settings) => {
	if (isValidBlockType(settings.name)) {
		settings.attributes = {
			...settings.attributes,
			scrollable: {
				type: 'boolean',
			},
			scrollBreakpoint: {
				type: 'string',
				default: 'table-scrollable-mobile', // デフォルトをMobileブレイクポイントに設定
			},
		};
	}
	return settings;
};
addFilter('blocks.registerBlockType', 'vk-blocks/table-style', addAttribute);

export const addBlockControl = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes } = props;
		const { scrollable, scrollBreakpoint, className } = attributes;

		const updateScrollAttributes = (checked, value) => {
			let newClassName = className || '';

			// 現在のクラス名から is-style-vk-table-scrollable を削除
			newClassName = newClassName
				.replace('is-style-vk-table-scrollable', '')
				.trim();

			// scrollable クラスを付与または削除
			if (checked) {
				newClassName += ' is-style-vk-table-scrollable';
				setAttributes({
					className: newClassName.trim(),
					scrollable: checked,
					scrollBreakpoint: value,
				});
			} else {
				setAttributes({
					className: newClassName.trim(),
					scrollable: checked,
				});
			}
		};

		const handleToggleChange = (checked) => {
			updateScrollAttributes(checked, scrollBreakpoint);
		};

		const handleSelectChange = (value) => {
			setAttributes({
				scrollBreakpoint: value,
			});
		};

		// アイコンのスタイル
		const iconStyle = {
			width: '24px',
			height: '24px',
			...(scrollable && { color: '#fff', background: '#1e1e1e' }),
		};

		if (isValidBlockType(props.name) && props.isSelected) {
			return (
				<>
					<BlockEdit {...props} />
					<InspectorControls>
						<PanelBody
							title={__('Table Horizontal Scroll', 'vk-blocks')}
							icon={<Icon icon={IconSVG} style={iconStyle} />}
							initialOpen={false}
						>
							<ToggleControl
								label={__('Scrollable', 'vk-blocks')}
								checked={scrollable}
								onChange={handleToggleChange}
							/>
							{scrollable && (
								<>
									<SelectControl
										label={__(
											'Horizontal Scroll Breakpoint',
											'vk-blocks'
										)}
										value={scrollBreakpoint}
										options={[
											{
												label: __(
													'Mobile size',
													'vk-blocks'
												),
												value: 'table-scrollable-mobile',
											},
											{
												label: __(
													'Tablet size',
													'vk-blocks'
												),
												value: 'table-scrollable-tablet',
											},
											{
												label: __(
													'PC size',
													'vk-blocks'
												),
												value: 'table-scrollable-pc',
											},
										]}
										onChange={handleSelectChange}
									/>
									<p>
										{__(
											'Table cells are no longer fixed width when horizontal scroll breakpoint is reached.',
											'vk-blocks'
										)}
									</p>
								</>
							)}
						</PanelBody>
					</InspectorControls>
				</>
			);
		}

		return <BlockEdit {...props} />;
	};
}, 'addMyCustomBlockControls');
addFilter('editor.BlockEdit', 'vk-blocks/table-style', addBlockControl);

const addExtraProps = (saveElementProps, blockType, attributes) => {
	if (isValidBlockType(blockType.name)) {
		if (attributes.scrollable) {
			saveElementProps.className = saveElementProps.className
				? saveElementProps.className
				: '';
			saveElementProps.className += ' is-style-vk-table-scrollable';
			saveElementProps['data-scroll-breakpoint'] =
				attributes.scrollBreakpoint;
		} else {
			saveElementProps.className = saveElementProps.className
				.replace('is-style-vk-table-scrollable', '')
				.trim();
			delete saveElementProps['data-scroll-breakpoint'];
		}
	}

	return saveElementProps;
};
addFilter(
	'blocks.getSaveContent.extraProps',
	'vk-blocks/table-style',
	addExtraProps
);

// 横スクロールを処理する関数を定義
const updateTableScrollAttributes = () => {
	const tables = document.querySelectorAll(
		'.wp-block-table.is-style-vk-table-scrollable'
	);
	tables.forEach((table) => {
		const breakpoint =
			table.getAttribute('data-scroll-breakpoint') ||
			'table-scrollable-mobile';
		table.setAttribute('data-scroll-breakpoint', breakpoint);
		const minWidth = parseInt(breakpoint.replace(/\D/g, ''), 10);

		const handleResize = () => {
			const currentWidth = window.innerWidth;
			if (currentWidth <= minWidth) {
				table.style.overflowX = 'auto';
				table.style.webkitOverflowScrolling = 'touch';

				const innerTable = table.querySelector('table');
				if (innerTable) {
					innerTable.style.whiteSpace = 'nowrap';
				}
			} else {
				table.style.overflowX = '';
				table.style.webkitOverflowScrolling = '';

				const innerTable = table.querySelector('table');
				if (innerTable) {
					innerTable.style.whiteSpace = '';
				}
			}
		};

		// 初回の呼び出し
		handleResize();

		// リサイズイベントの設定
		window.addEventListener('resize', handleResize);
	});
};

document.addEventListener('DOMContentLoaded', updateTableScrollAttributes);
