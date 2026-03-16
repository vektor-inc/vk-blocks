import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import HorizontalScrollControls, {
	scrollbarAttributes,
	applyScrollbarProps,
} from '@vkblocks/utils/horizontal-scroll-controls';

/**
 * Internal dependencies
 */
import { VkPanelIcon } from '@vkblocks/components/vk-icon';

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
				default: 'table-scrollable-mobile',
			},
			showScrollMessage: {
				type: 'boolean',
				default: false,
			},
			scrollMessageText: {
				type: 'string',
				default: __('You can scroll', 'vk-blocks'),
			},
			scrollIconLeft: {
				type: 'string',
				default: 'fa-solid fa-caret-left',
			},
			scrollIconRight: {
				type: 'string',
				default: 'fa-solid fa-caret-right',
			},
			iconOutputLeft: {
				type: 'boolean',
				default: true,
			},
			iconOutputRight: {
				type: 'boolean',
				default: true,
			},
			cellVertical: {
				type: 'boolean',
				default: false,
			},
			cellVerticalBreakpoint: {
				type: 'string',
				default: 'table-cell-vertical-mobile',
			},
			...scrollbarAttributes,
		};
	}
	return settings;
};
addFilter('blocks.registerBlockType', 'vk-blocks/table-style', addAttribute);

export const addBlockControl = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes, name, clientId } = props;
		if (!isValidBlockType(name)) {
			return <BlockEdit {...props} />;
		}
		const {
			scrollable,
			scrollBreakpoint,
			showScrollMessage,
			scrollMessageText,
			scrollIconLeft,
			scrollIconRight,
			iconOutputLeft,
			iconOutputRight,
			cellVertical,
			cellVerticalBreakpoint,
			scrollbarVisible,
			scrollbarColor,
			scrollbarTrackColor,
		} = attributes;

		const blockProps = useBlockProps({
			className:
				`${scrollable ? 'is-style-vk-table-scrollable' : ''} ${cellVertical ? 'is-style-vk-table-cell-vertical' : ''}`.trim(),
			...(scrollable && { 'data-scroll-breakpoint': scrollBreakpoint }),
			...(scrollable &&
				scrollbarVisible === false && {
					'data-scrollbar-visible': 'false',
				}),
			...(scrollable &&
				scrollbarColor && {
					'data-scrollbar-color': scrollbarColor,
				}),
			...(scrollable &&
				scrollbarTrackColor && {
					'data-scrollbar-track-color': scrollbarTrackColor,
				}),
			...(scrollable &&
				(scrollbarColor || scrollbarTrackColor) && {
					style: {
						...(scrollbarColor && {
							'--vk-scrollbar-color': scrollbarColor,
						}),
						...(scrollbarTrackColor && {
							'--vk-scrollbar-track-color': scrollbarTrackColor,
						}),
					},
				}),
			...(cellVertical && {
				'data-cell-vertical-breakpoint': cellVerticalBreakpoint,
			}),
		});

		// スクロール可能トグル変更のハンドル
		const handleToggleChange = (checked) => {
			setAttributes({ scrollable: checked });

			if (!checked) {
				setAttributes({
					showScrollMessage: false,
					scrollBreakpoint: 'table-scrollable-mobile',
					scrollbarVisible: true,
					scrollbarColor: '',
					scrollbarTrackColor: '',
				});
			}
		};

		// ブレークポイント選択変更のハンドル
		const handleSelectChange = (value) => {
			setAttributes({ scrollBreakpoint: value });
		};

		// cellVerticalトグル変更のハンドル
		const handleCellVerticalToggleChange = (checked) => {
			setAttributes({ cellVertical: checked });

			if (!checked) {
				// OFF の場合、関連するクラスや属性をリセット
				setAttributes({
					cellVerticalBreakpoint: 'table-cell-vertical-mobile',
				});
			}
		};

		// cellVerticalブレークポイント選択変更のハンドル
		const handleCellVerticalSelectChange = (value) => {
			setAttributes({ cellVerticalBreakpoint: value });
		};

		// コンポーネントのマウントまたは更新後に属性を更新
		useEffect(() => {
			// 初期ロード時にクラスや属性を確認して scrollable を ON にする
			const checkTableScrollAttributes = () => {
				const blockRoot = document.querySelector(
					`[data-block="${clientId}"]`
				);
				if (!blockRoot) {
					return;
				}
				const tables = blockRoot.querySelectorAll('.wp-block-table');
				tables.forEach((table) => {
					const hasScrollableClass = table.classList.contains(
						'is-style-vk-table-scrollable'
					);
					const hasBreakpointAttr = table.hasAttribute(
						'data-scroll-breakpoint'
					);
					// もし is-style-vk-table-scrollable クラスや data-scroll-breakpoint 属性がついていたら scrollable を ON に設定
					if (hasScrollableClass || hasBreakpointAttr) {
						setAttributes({ scrollable: true });
					}
				});
			};

			// コンポーネントの初回レンダリング時に実行
			checkTableScrollAttributes();
		}, [clientId]); // 初期レンダリング時のみ実行

		// scrollable、cellVertical の状態が確定したら処理を実行
		useEffect(() => {
			const updateTableAttributes = () => {
				// clientId で現在のブロック root を特定してスコープを絞る
				const blockRoot = document.querySelector(
					`[data-block="${clientId}"]`
				);
				if (!blockRoot) {
					return;
				}
				const tables = blockRoot.querySelectorAll('.wp-block-table');
				tables.forEach((table) => {
					// scrollable 状態に応じてクラスと属性を更新
					if (!scrollable) {
						table.classList.remove('is-style-vk-table-scrollable');
						table.removeAttribute('data-scroll-breakpoint');
					} else {
						const breakpoint =
							table.getAttribute('data-scroll-breakpoint') ||
							'table-scrollable-mobile';
						table.classList.add('is-style-vk-table-scrollable');
						table.setAttribute(
							'data-scroll-breakpoint',
							breakpoint
						);
					}

					table.setAttribute(
						'data-output-scroll-hint',
						showScrollMessage ? 'true' : 'false'
					);

					table.setAttribute(
						'data-icon-output-left',
						iconOutputLeft ? 'true' : 'false'
					);

					table.setAttribute(
						'data-icon-output-right',
						iconOutputRight ? 'true' : 'false'
					);

					// cellVertical 状態に応じたクラスと属性を更新
					if (!cellVertical) {
						// cellVertical が OFF の場合
						table.classList.remove(
							'is-style-vk-table-cell-vertical'
						);
						table.removeAttribute('data-cell-vertical-breakpoint');
					} else {
						// cellVertical が ON の場合
						table.classList.add('is-style-vk-table-cell-vertical');
						table.setAttribute(
							'data-cell-vertical-breakpoint',
							cellVerticalBreakpoint
						);
					}
					// scrollbar visibility
					if (scrollbarVisible === false) {
						table.setAttribute('data-scrollbar-visible', 'false');
					} else {
						table.removeAttribute('data-scrollbar-visible');
					}

					// scrollbar color
					if (scrollbarColor) {
						table.setAttribute(
							'data-scrollbar-color',
							scrollbarColor
						);
						table.style.setProperty(
							'--vk-scrollbar-color',
							scrollbarColor
						);
					} else {
						table.removeAttribute('data-scrollbar-color');
						table.style.removeProperty('--vk-scrollbar-color');
					}

					// scrollbar track color
					if (scrollbarTrackColor) {
						table.setAttribute(
							'data-scrollbar-track-color',
							scrollbarTrackColor
						);
						table.style.setProperty(
							'--vk-scrollbar-track-color',
							scrollbarTrackColor
						);
					} else {
						table.removeAttribute('data-scrollbar-track-color');
						table.style.removeProperty(
							'--vk-scrollbar-track-color'
						);
					}
				});
			};

			// 状態が undefined でない場合のみ実行
			if (typeof scrollable !== 'undefined') {
				updateTableAttributes();
			}
		}, [
			clientId,
			scrollable,
			scrollBreakpoint,
			showScrollMessage,
			scrollIconLeft,
			scrollIconRight,
			iconOutputLeft,
			iconOutputRight,
			cellVertical,
			cellVerticalBreakpoint,
			scrollbarVisible,
			scrollbarColor,
			scrollbarTrackColor,
		]);

		if (props.isSelected) {
			const blockEditContent = <BlockEdit {...props} />;

			return (
				<>
					<div {...blockProps}>
						{scrollable && showScrollMessage && (
							<div
								className="vk-scroll-hint"
								data-scroll-breakpoint={scrollBreakpoint}
								data-icon-output-left={
									iconOutputLeft ? 'true' : 'false'
								}
								data-icon-output-right={
									iconOutputRight ? 'true' : 'false'
								}
								data-hint-icon-left={
									iconOutputLeft ? scrollIconLeft : ''
								}
								data-hint-icon-right={
									iconOutputRight ? scrollIconRight : ''
								}
							>
								{iconOutputLeft && (
									<i
										className={`${scrollIconLeft} left-icon`}
									></i>
								)}
								<span>{scrollMessageText}</span>
								{iconOutputRight && (
									<i
										className={`${scrollIconRight} right-icon`}
									></i>
								)}
							</div>
						)}
						{blockEditContent}
					</div>
					<InspectorControls>
						<PanelBody
							title={__('Table Horizontal Scroll', 'vk-blocks')}
							icon={<VkPanelIcon isActive={scrollable} />}
							initialOpen={false}
						>
							<HorizontalScrollControls
								scrollable={scrollable}
								scrollBreakpoint={scrollBreakpoint}
								onScrollableChange={handleToggleChange}
								onBreakpointChange={handleSelectChange}
								prefix="table-scrollable-"
								scrollbarVisible={scrollbarVisible}
								scrollbarColor={scrollbarColor}
								scrollbarTrackColor={scrollbarTrackColor}
								onScrollbarVisibleChange={(checked) => {
									setAttributes({
										scrollbarVisible: checked,
									});
								}}
								onScrollbarColorChange={(color) => {
									setAttributes({
										scrollbarColor: color || '',
									});
								}}
								onScrollbarTrackColorChange={(color) => {
									setAttributes({
										scrollbarTrackColor: color || '',
									});
								}}
								scrollHintProps={{
									showScrollMessage,
									scrollMessageText,
									scrollIconLeft,
									scrollIconRight,
									...props,
								}}
							/>
						</PanelBody>
						<PanelBody
							title={__('Table Cell Vertical', 'vk-blocks')}
							icon={<VkPanelIcon isActive={cellVertical} />}
							initialOpen={false}
						>
							<ToggleControl
								label={__('Cell Vertical', 'vk-blocks')}
								checked={cellVertical}
								onChange={handleCellVerticalToggleChange}
							/>
							{cellVertical && (
								<>
									<SelectControl
										label={__(
											'Cell Vertical Breakpoint',
											'vk-blocks'
										)}
										value={cellVerticalBreakpoint}
										options={[
											{
												label: __(
													'Mobile size',
													'vk-blocks'
												),
												value: 'table-cell-vertical-mobile',
											},
											{
												label: __(
													'Tablet size',
													'vk-blocks'
												),
												value: 'table-cell-vertical-tablet',
											},
											{
												label: __(
													'PC size',
													'vk-blocks'
												),
												value: 'table-cell-vertical-pc',
											},
										]}
										onChange={
											handleCellVerticalSelectChange
										}
									/>
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

// 保存時に追加のプロパティを設定
const addExtraProps = (saveElementProps, blockType, attributes) => {
	if (isValidBlockType(blockType.name)) {
		// 'scrollable' が true の場合のみ 'is-style-vk-table-scrollable' クラスと 'data-scroll-breakpoint' を設定
		if (attributes.scrollable) {
			saveElementProps.className =
				`${saveElementProps.className || ''} is-style-vk-table-scrollable`.trim();
			saveElementProps['data-scroll-breakpoint'] =
				attributes.scrollBreakpoint;
		}

		// cellVerticalがtrueの場合にcellVerticalBreakpointを設定
		if (attributes.cellVertical) {
			saveElementProps.className += ` is-style-vk-table-cell-vertical`;
			saveElementProps['data-cell-vertical-breakpoint'] =
				attributes.cellVerticalBreakpoint;
		} else {
			// cellVerticalがfalseの場合、不要なクラスや属性を削除
			saveElementProps.className = saveElementProps.className
				.replace('is-style-vk-table-cell-vertical', '')
				.trim();
			delete saveElementProps['data-cell-vertical-breakpoint'];
		}

		// 'showScrollMessage' が true の場合のみ 'data-output-scroll-hint' を追加
		if (attributes.showScrollMessage) {
			saveElementProps['data-output-scroll-hint'] = 'true';
		} else {
			delete saveElementProps['data-output-scroll-hint'];
		}

		// iconOutputLeft が true の場合のみ属性を追加
		if (attributes.iconOutputLeft && attributes.showScrollMessage) {
			saveElementProps['data-icon-output-left'] = 'true';
		} else {
			delete saveElementProps['data-icon-output-left'];
		}

		// iconOutputRight が true の場合のみ属性を追加
		if (attributes.iconOutputRight && attributes.showScrollMessage) {
			saveElementProps['data-icon-output-right'] = 'true';
		} else {
			delete saveElementProps['data-icon-output-right'];
		}

		// scrollbar関連の属性を適用
		applyScrollbarProps(saveElementProps, attributes);
	} else if (blockType.name !== 'core/group') {
		// 他のブロックでは不要な属性を削除
		// core/group はグループブロック独自の横スクロール機能で data-scroll-breakpoint 等を使用するため除外
		delete saveElementProps['data-scroll-breakpoint'];
		delete saveElementProps['data-output-scroll-hint'];
		delete saveElementProps['data-icon-output-left'];
		delete saveElementProps['data-icon-output-right'];
		delete saveElementProps['data-cell-vertical-breakpoint'];
	}

	return saveElementProps;
};
addFilter(
	'blocks.getSaveContent.extraProps',
	'vk-blocks/table-style',
	addExtraProps
);

const removeVkTableMobileBlockFromEditor = createHigherOrderComponent(
	(BlockListBlock) => {
		return (props) => {
			const { attributes, setAttributes } = props;

			// `cellVertical` が `true` の場合のみ `.vk-table--mobile-block` を削除
			if (
				attributes?.cellVertical &&
				attributes?.className?.includes('vk-table--mobile-block')
			) {
				const updatedClassName = attributes.className
					.replace(/\bvk-table--mobile-block\b/g, '')
					.trim();

				// `setAttributes` を使用して `className` を更新
				if (updatedClassName !== attributes.className) {
					setAttributes({ className: updatedClassName });
				}
			}

			return <BlockListBlock {...props} />;
		};
	},
	'withRemoveVkTableMobileBlock'
);

addFilter(
	'editor.BlockListBlock',
	'vk-blocks/remove-vk-table-mobile-block',
	removeVkTableMobileBlockFromEditor
);
