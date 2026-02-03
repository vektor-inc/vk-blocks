/**
 * group-style block type
 *
 * @package
 */
import { convertColorClass } from '@vkblocks/utils/color-code-to-class.js';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import {
	PanelBody,
	ToolbarGroup,
	ToggleControl,
	BaseControl,
} from '@wordpress/components';
import {
	InspectorControls,
	ColorPalette,
	BlockControls,
	useBlockProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { VkPanelIcon } from '@vkblocks/components/vk-icon';
import LinkToolbar from '@vkblocks/components/link-toolbar';
import HorizontalScrollControls from '@vkblocks/utils/horizontal-scroll-controls';
import deprecated from './deprecated/index';

/**
 * Check if the block type is valid for customization.
 *
 * @param {string} name The name of the block type.
 * @return {boolean} Whether the block type is valid.
 */
const isValidBlockType = (name) => {
	const validBlockTypes = ['core/group'];
	return validBlockTypes.includes(name);
};

const groupScrollableTargetBlocks = [
	'core/group',
	'core/columns',
	'core/gallery',
	'core/social-links',
	'core/buttons',
	'vk-blocks/grid-column',
	'vk-blocks/gridcolcard',
	'vk-blocks/button-outer',
	'vk-blocks/icon-outer',
	'vk-blocks/card',
	'vk-blocks/icon-card',
];

// ユーザー向けに表示するブロック名のリスト（core/groupは除外）
const displayableScrollableTargetBlocks = groupScrollableTargetBlocks.filter(
	(blockName) => blockName !== 'core/group'
);

const isFlexGridGroupBlock = (block) => {
	if (block.name !== 'core/group') {
		return false;
	}
	const layoutType = block.attributes?.layout?.type;
	return layoutType === 'grid' || layoutType === 'flex';
};

const isGroupScrollableAllowedBlock = (block) => {
	if (isFlexGridGroupBlock(block)) {
		return true;
	}
	if (groupScrollableTargetBlocks.includes(block.name)) {
		return true;
	}
	if (block?.name !== 'core/group') {
		return false;
	}
	return (
		hasOnlyGroupScrollableTargetBlocks(block.innerBlocks) ||
		containsFlexGridGroupBlocks(block.innerBlocks)
	);
};

const hasOnlyGroupScrollableTargetBlocks = (blocks = []) => {
	if (blocks.length === 0) {
		return false;
	}
	return blocks.every((block) => isGroupScrollableAllowedBlock(block));
};

const containsFlexGridGroupBlocks = (blocks = []) =>
	blocks.some(
		(block) =>
			isFlexGridGroupBlock(block) ||
			(block.innerBlocks?.length &&
				containsFlexGridGroupBlocks(block.innerBlocks))
	);

/**
 * Add custom attributes to the block settings.
 *
 * @param {Object} settings The block settings.
 * @return {Object} The modified block settings.
 */
export const addAttribute = (settings) => {
	if (isValidBlockType(settings.name)) {
		settings.attributes = {
			...settings.attributes,
			color: {
				type: 'string',
				default: '',
			},
			linkUrl: {
				type: 'string',
				default: '',
			},
			linkTarget: {
				type: 'string',
				default: '',
			},
			relAttribute: {
				type: 'string',
				default: '',
			},
			linkDescription: {
				type: 'string',
				default: '',
			},
			tagName: {
				type: 'string',
				default: 'div',
			},
			scrollable: {
				type: 'boolean',
			},
			scrollableAutoDisabled: {
				type: 'boolean',
				default: false,
			},
			scrollBreakpoint: {
				type: 'string',
				default: 'group-scrollable-mobile',
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
			textNoWrap: {
				type: 'boolean',
				default: true,
			},
			tableMode: {
				type: 'boolean',
				default: false,
			},
		};
	}
	return settings;
};
addFilter('blocks.registerBlockType', 'vk-blocks/group-style', addAttribute);

/**
 * Add custom controls to the block edit interface.
 *
 * @param {Function} BlockEdit The block edit component.
 * @return {Function} The modified block edit component.
 */
export const addBlockControl = createHigherOrderComponent((BlockEdit) => {
	let activeColor = '';

	return (props) => {
		const { attributes, setAttributes, name, clientId } = props;
		const {
			scrollable,
			scrollableAutoDisabled,
			scrollBreakpoint,
			showScrollMessage,
			scrollMessageText,
			scrollIconLeft,
			scrollIconRight,
			iconOutputLeft,
			iconOutputRight,
			textNoWrap,
			tableMode,
		} = attributes || {};

		// レイアウトタイプを取得
		const layoutType = attributes?.layout?.type;
		const isGridOrFlexLayout =
			layoutType === 'grid' || layoutType === 'flex';

		// カラムブロックの数をカウント（再帰的にチェック）
		const countColumnBlocks = (blocks) =>
			blocks.reduce(
				(count, block) =>
					count +
					(block.name === 'core/columns' ? 1 : 0) +
					(block.innerBlocks?.length
						? countColumnBlocks(block.innerBlocks)
						: 0),
				0
			);

		// 子ブロックを取得してカラムブロックの数をカウント
		const columnBlockCount = useSelect(
			(select) => {
				const block = select('core/block-editor').getBlock(clientId);
				if (!block || !block.innerBlocks) {
					return 0;
				}
				return countColumnBlocks(block.innerBlocks);
			},
			[clientId]
		);

		const { hasScrollableTargetBlocks } = useSelect(
			(select) => {
				const block = select('core/block-editor').getBlock(clientId);
				if (!block || !block.innerBlocks) {
					return {
						hasScrollableTargetBlocks: false,
					};
				}
				return {
					hasScrollableTargetBlocks:
						hasOnlyGroupScrollableTargetBlocks(block.innerBlocks),
				};
			},
			[clientId, layoutType]
		);
		const hasScrollableParentGroup = useSelect(
			(select) => {
				const parentIds =
					select('core/block-editor').getBlockParents(clientId) || [];
				if (!parentIds.length) {
					return false;
				}
				return parentIds.some((parentId) => {
					const parent =
						select('core/block-editor').getBlock(parentId);
					return (
						parent?.name === 'core/group' &&
						parent.attributes?.scrollable === true
					);
				});
			},
			[clientId]
		);
		// ブロックタイプの情報を取得して、ブロック名を人間が読みやすい形式に変換
		const blockTypes = useSelect((select) => {
			const { getBlockTypes } = select('core/blocks');
			return getBlockTypes();
		}, []);
		// ブロック名から人間が読みやすいタイトルを取得する関数
		const getBlockTitle = (blockName) => {
			const blockType = blockTypes.find(
				(type) => type.name === blockName
			);
			return blockType?.title || blockName;
		};
		const isScrollableTargetEligible =
			!isGridOrFlexLayout && hasScrollableTargetBlocks;
		const shouldShowScrollablePanel = !isGridOrFlexLayout;
		const shouldShowUnsupportedNotice =
			shouldShowScrollablePanel && !isScrollableTargetEligible;
		const shouldAutoDisableForUnsupported =
			!isGridOrFlexLayout && !hasScrollableTargetBlocks;

		// 複数のカラムブロックがあるかどうか
		const hasMultipleColumns = columnBlockCount >= 2;
		const previousScrollableRef = useRef(scrollable);
		const userToggledScrollableRef = useRef(false);

		useEffect(() => {
			if (!isScrollableTargetEligible && scrollable) {
				setAttributes({
					scrollable: false,
					scrollableAutoDisabled: shouldAutoDisableForUnsupported,
					showScrollMessage: false,
					scrollBreakpoint: 'group-scrollable-mobile',
					tableMode: false,
				});
			}
		}, [
			isScrollableTargetEligible,
			scrollable,
			shouldAutoDisableForUnsupported,
			setAttributes,
		]);
		useEffect(() => {
			if (
				isScrollableTargetEligible &&
				!scrollable &&
				scrollableAutoDisabled
			) {
				setAttributes({
					scrollable: true,
					scrollableAutoDisabled: false,
				});
			}
		}, [
			isScrollableTargetEligible,
			scrollable,
			scrollableAutoDisabled,
			setAttributes,
		]);
		useEffect(() => {
			if (userToggledScrollableRef.current) {
				userToggledScrollableRef.current = false;
				previousScrollableRef.current = scrollable;
				return;
			}
			const previousScrollable = previousScrollableRef.current;
			if (
				previousScrollable &&
				!scrollable &&
				!isScrollableTargetEligible &&
				shouldAutoDisableForUnsupported &&
				!scrollableAutoDisabled
			) {
				setAttributes({ scrollableAutoDisabled: true });
			}
			previousScrollableRef.current = scrollable;
		}, [
			isScrollableTargetEligible,
			scrollable,
			scrollableAutoDisabled,
			shouldAutoDisableForUnsupported,
			setAttributes,
		]);

		// カラムブロックの数が変わった時に tableMode を自動調整
		useEffect(() => {
			if (!scrollable || tableMode !== true) {
				return;
			}
			if (!hasMultipleColumns || isGridOrFlexLayout) {
				// カラムブロックが1つ以下、またはグリッド/フレックスの場合は無効化
				setAttributes({ tableMode: false });
			}
		}, [
			columnBlockCount,
			tableMode,
			hasMultipleColumns,
			isGridOrFlexLayout,
			scrollable,
			setAttributes,
		]);

		// レイアウトが flex/grid に変わったら scrollable を明示OFF（ヒントもOFF）
		useEffect(() => {
			if (isGridOrFlexLayout && scrollable) {
				setAttributes({
					scrollable: false,
					showScrollMessage: false,
				});
			}
		}, [isGridOrFlexLayout, scrollable, setAttributes]);

		// グリッド/フレックスレイアウトの場合は textNoWrap を false に設定
		useEffect(() => {
			if (isGridOrFlexLayout && textNoWrap !== false && scrollable) {
				setAttributes({ textNoWrap: false });
			}
		}, [isGridOrFlexLayout, textNoWrap, scrollable, setAttributes]);

		const blockProps = useBlockProps({
			className: scrollable ? 'is-style-vk-group-scrollable' : undefined,
			...(scrollable
				? { 'data-scroll-breakpoint': scrollBreakpoint }
				: {}),
			'data-output-scroll-hint': showScrollMessage ? 'true' : undefined,
			'data-icon-output-left':
				scrollable && showScrollMessage && iconOutputLeft
					? 'true'
					: undefined,
			'data-icon-output-right':
				scrollable && showScrollMessage && iconOutputRight
					? 'true'
					: undefined,
			'data-text-nowrap':
				scrollable &&
				textNoWrap !== false &&
				!(tableMode === true && hasMultipleColumns) &&
				!isGridOrFlexLayout
					? 'true'
					: undefined,
			'data-table-mode':
				scrollable && tableMode === true && hasMultipleColumns
					? 'true'
					: undefined,
		});

		if (isValidBlockType(name) && props.isSelected) {
			if (attributes.color) {
				activeColor = attributes.color;
			} else {
				activeColor = '#fffd6b';
			}

			// スクロール可能トグル変更のハンドル
			const handleToggleChange = (checked) => {
				userToggledScrollableRef.current = true;
				setAttributes({
					scrollable: checked,
					scrollableAutoDisabled: false,
				});

				if (!checked) {
					setAttributes({
						showScrollMessage: false,
						scrollBreakpoint: 'group-scrollable-mobile',
					});
				}
			};

			// ブレークポイント選択変更のハンドル
			const handleSelectChange = (value) => {
				setAttributes({ scrollBreakpoint: value });
			};

			return (
				<>
					<div {...blockProps}>
						{scrollable && showScrollMessage && (
							<div
								className="vk-scroll-hint"
								data-scroll-breakpoint={scrollBreakpoint}
								data-icon-output-left={
									iconOutputLeft ? 'true' : undefined
								}
								data-icon-output-right={
									iconOutputRight ? 'true' : undefined
								}
								data-hint-icon-left={
									iconOutputLeft ? scrollIconLeft : undefined
								}
								data-hint-icon-right={
									iconOutputRight
										? scrollIconRight
										: undefined
								}
							>
								{iconOutputLeft && (
									<i
										className={`${scrollIconLeft} left-icon`}
									/>
								)}
								<span>{scrollMessageText}</span>
								{iconOutputRight && (
									<i
										className={`${scrollIconRight} right-icon`}
									/>
								)}
							</div>
						)}
						<BlockEdit {...props} />
					</div>
					<BlockControls>
						<ToolbarGroup>
							<LinkToolbar
								linkUrl={attributes.linkUrl}
								setLinkUrl={(url) =>
									setAttributes({ linkUrl: url })
								}
								linkTarget={attributes.linkTarget}
								setLinkTarget={(target) =>
									setAttributes({ linkTarget: target })
								}
								relAttribute={attributes.relAttribute}
								setRelAttribute={(rel) =>
									setAttributes({ relAttribute: rel })
								}
								linkDescription={attributes.linkDescription}
								setLinkDescription={(description) =>
									setAttributes({
										linkDescription: description,
									})
								}
							/>
						</ToolbarGroup>
					</BlockControls>
					<InspectorControls>
						<PanelBody
							title={__('Border Color', 'vk-blocks')}
							initialOpen={false}
							className="group-border-color-controle"
						>
							<p className="font-size-11px alert alert-danger">
								{__(
									'Because of the theme that enabled theme.json become can specify the color from border panel that, specification from here is deprecated.',
									'vk-blocks'
								)}
							</p>
							<ColorPalette
								value={activeColor}
								disableCustomColors={true}
								onChange={(newColor) => {
									let newClassName =
										convertColorClass(newColor);

									if (attributes.className) {
										let inputClassName =
											attributes.className;

										inputClassName =
											inputClassName.split(' ');

										const filterClassName =
											inputClassName.filter(
												function (name) {
													return (
														-1 ===
														name.indexOf('vk-has-')
													);
												}
											);

										filterClassName.push(newClassName);

										newClassName =
											filterClassName.join(' ');
									}

									activeColor = newColor;
									setAttributes({
										className: newClassName,
										color: newColor,
									});
								}}
							/>
						</PanelBody>
						{shouldShowScrollablePanel && (
							<PanelBody
								title={__(
									'Group Horizontal Scroll',
									'vk-blocks'
								)}
								icon={<VkPanelIcon isActive={scrollable} />}
								initialOpen={false}
							>
								{hasScrollableParentGroup && (
									<div className="alert alert-warning">
										{__(
											'This Group is inside a parent Group with horizontal scroll enabled. The parent scroll setting takes precedence.',
											'vk-blocks'
										)}
									</div>
								)}
								{shouldShowUnsupportedNotice && (
									<div className="alert alert-warning">
										<p>
											{__(
												'This setting applies only when all direct child blocks are the following block.',
												'vk-blocks'
											)}
										</p>
										<ul>
											{displayableScrollableTargetBlocks.map(
												(blockName) => (
													<li key={blockName}>
														{getBlockTitle(
															blockName
														)}
													</li>
												)
											)}
										</ul>
										<p>
											{__(
												'Groups are supported only when their layout is Flex/Grid or when their direct inner blocks are supported.',
												'vk-blocks'
											)}
										</p>
									</div>
								)}
								{!shouldShowUnsupportedNotice && (
									<HorizontalScrollControls
										scrollable={scrollable}
										scrollBreakpoint={scrollBreakpoint}
										onScrollableChange={handleToggleChange}
										onBreakpointChange={handleSelectChange}
										prefix="group-scrollable-"
										description={
											<p>
												{__(
													'Enable horizontal scrolling for all blocks inside this group.',
													'vk-blocks'
												)}
											</p>
										}
										scrollHintProps={{
											showScrollMessage,
											scrollMessageText,
											scrollIconLeft,
											scrollIconRight,
											...props,
										}}
									>
										<ToggleControl
											label={__(
												'Prevent text wrapping',
												'vk-blocks'
											)}
											checked={textNoWrap !== false}
											onChange={(checked) => {
												setAttributes({
													textNoWrap: checked,
												});
											}}
											disabled={
												tableMode === true ||
												isGridOrFlexLayout
											}
											help={
												tableMode === true ||
												isGridOrFlexLayout
													? __(
															'This option is disabled when Table Mode is enabled or when using Grid/Flex layouts.',
															'vk-blocks'
														)
													: __(
															'Prevents text from wrapping to multiple lines and ensures horizontal scrolling. Disable this only if you want text to wrap naturally within the scrollable area.',
															'vk-blocks'
														)
											}
										/>
										<ToggleControl
											label={__(
												'Table Mode (Core Column Blocks Only)',
												'vk-blocks'
											)}
											checked={tableMode === true}
											onChange={(checked) => {
												setAttributes({
													tableMode: checked,
												});
											}}
											disabled={
												!hasMultipleColumns ||
												isGridOrFlexLayout
											}
											help={
												hasMultipleColumns
													? __(
															'Unifies column widths across multiple rows. Only works with core Column blocks.',
															'vk-blocks'
														)
													: __(
															'This option is only available when there are multiple core Column blocks.',
															'vk-blocks'
														)
											}
										/>
										{hasMultipleColumns && (
											<BaseControl>
												<div
													style={{
														display: 'flex',
														gap: '16px',
														marginTop: '12px',
														fontSize: '12px',
													}}
												>
													<div style={{ flex: 1 }}>
														<div
															style={{
																marginBottom:
																	'8px',
																fontWeight: 600,
																color: '#757575',
															}}
														>
															{__(
																'OFF',
																'vk-blocks'
															)}
														</div>
														<div
															style={{
																display: 'flex',
																flexDirection:
																	'column',
																gap: '4px',
															}}
														>
															<div
																style={{
																	display:
																		'flex',
																	gap: '4px',
																}}
															>
																<div
																	style={{
																		background:
																			'#e0e0e0',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 1,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																	}}
																>
																	{__(
																		'Col 1',
																		'vk-blocks'
																	)}
																</div>
																<div
																	style={{
																		background:
																			'#e0e0e0',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 2,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																	}}
																>
																	{__(
																		'Col 2',
																		'vk-blocks'
																	)}
																</div>
															</div>
															<div
																style={{
																	display:
																		'flex',
																	gap: '4px',
																}}
															>
																<div
																	style={{
																		background:
																			'#e0e0e0',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 2,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																	}}
																>
																	{__(
																		'Col 1',
																		'vk-blocks'
																	)}
																</div>
																<div
																	style={{
																		background:
																			'#e0e0e0',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 1,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																	}}
																>
																	{__(
																		'Col 2',
																		'vk-blocks'
																	)}
																</div>
															</div>
														</div>
														<div
															style={{
																marginTop:
																	'8px',
																fontSize:
																	'11px',
																color: '#757575',
																textAlign:
																	'center',
															}}
														>
															{__(
																'Different widths',
																'vk-blocks'
															)}
														</div>
													</div>
													<div style={{ flex: 1 }}>
														<div
															style={{
																marginBottom:
																	'8px',
																fontWeight: 600,
																color: '#757575',
															}}
														>
															{__(
																'ON',
																'vk-blocks'
															)}
														</div>
														<div
															style={{
																display: 'flex',
																flexDirection:
																	'column',
																gap: '4px',
															}}
														>
															<div
																style={{
																	display:
																		'flex',
																	gap: '4px',
																}}
															>
																<div
																	style={{
																		background:
																			'var(--vk-color-primary)',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 2,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																		color: '#fff',
																	}}
																>
																	{__(
																		'Col 1',
																		'vk-blocks'
																	)}
																</div>
																<div
																	style={{
																		background:
																			'var(--vk-color-primary)',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 2,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																		color: '#fff',
																	}}
																>
																	{__(
																		'Col 2',
																		'vk-blocks'
																	)}
																</div>
															</div>
															<div
																style={{
																	display:
																		'flex',
																	gap: '4px',
																}}
															>
																<div
																	style={{
																		background:
																			'var(--vk-color-primary)',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 2,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																		color: '#fff',
																	}}
																>
																	{__(
																		'Col 1',
																		'vk-blocks'
																	)}
																</div>
																<div
																	style={{
																		background:
																			'var(--vk-color-primary)',
																		padding:
																			'8px',
																		borderRadius:
																			'4px',
																		flex: 2,
																		textAlign:
																			'center',
																		fontSize:
																			'10px',
																		color: '#fff',
																	}}
																>
																	{__(
																		'Col 2',
																		'vk-blocks'
																	)}
																</div>
															</div>
														</div>
														<div
															style={{
																marginTop:
																	'8px',
																fontSize:
																	'11px',
																color: '#757575',
																textAlign:
																	'center',
															}}
														>
															{__(
																'Unified to max width',
																'vk-blocks'
															)}
														</div>
													</div>
												</div>
											</BaseControl>
										)}
									</HorizontalScrollControls>
								)}
							</PanelBody>
						)}
					</InspectorControls>
				</>
			);
		}
		return <BlockEdit {...props} />;
	};
}, 'addMyCustomBlockControls');

addFilter('editor.BlockEdit', 'vk-blocks/group-style', addBlockControl);

/**
 * Define the save function for the group block, including link settings.
 *
 * @param {Object} props The block properties.
 * @return {JSX.Element} The saved content.
 */
const save = (props) => {
	const { attributes = {} } = props;
	const {
		linkUrl,
		linkTarget,
		relAttribute,
		linkDescription,
		className = '',
		tagName: CustomTag = 'div',
		scrollable,
		scrollBreakpoint,
		showScrollMessage,
		iconOutputLeft,
		iconOutputRight,
		textNoWrap,
		tableMode,
		layout,
	} = attributes;

	// スクロール関連のクラスと属性を組み立て
	const classNames = [];
	if (linkUrl) {
		classNames.push(className, 'has-link');
	} else {
		classNames.push(className);
	}

	// scrollableが明示的にtrueの場合のみクラスを追加
	if (scrollable === true) {
		classNames.push('is-style-vk-group-scrollable');
	}

	// Use block properties, setting className to include has-link if linkUrl is present
	const baseBlockProps = useBlockProps.save({
		className: classNames.filter(Boolean).join(' ').trim(),
	});

	// スクロール関連の属性を追加（scrollableが明示的にtrueの場合のみ）
	// scrollableがfalseまたはundefinedの場合、属性を追加しない
	if (scrollable === true && scrollBreakpoint) {
		baseBlockProps['data-scroll-breakpoint'] = scrollBreakpoint;
	}
	if (scrollable === true) {
		if (!baseBlockProps.role) {
			baseBlockProps.role = 'region';
		}
		if (baseBlockProps.tabIndex === undefined) {
			baseBlockProps.tabIndex = 0;
		}
		if (!baseBlockProps['aria-label']) {
			baseBlockProps['aria-label'] = __(
				'Horizontal scroll area',
				'vk-blocks'
			);
		}
	}
	if (showScrollMessage === true) {
		baseBlockProps['data-output-scroll-hint'] = 'true';
	}
	if (iconOutputLeft === true && showScrollMessage === true) {
		baseBlockProps['data-icon-output-left'] = 'true';
	}
	if (iconOutputRight === true && showScrollMessage === true) {
		baseBlockProps['data-icon-output-right'] = 'true';
	}
	// グリッド/フレックスレイアウトまたはテーブルモードの場合は data-text-nowrap を設定しない
	const layoutType = layout?.type;
	const isGridOrFlexLayout = layoutType === 'grid' || layoutType === 'flex';
	if (
		scrollable === true &&
		textNoWrap !== false &&
		!(tableMode === true) &&
		!isGridOrFlexLayout
	) {
		baseBlockProps['data-text-nowrap'] = 'true';
	}
	if (scrollable === true && tableMode === true) {
		baseBlockProps['data-table-mode'] = 'true';
	}

	const blockProps = baseBlockProps;

	// Extract prefix for custom link class
	const prefix = 'wp-block-group';

	return (
		<CustomTag {...blockProps}>
			<InnerBlocks.Content />
			{linkUrl && (
				<a
					href={linkUrl}
					{...(linkTarget ? { target: linkTarget } : {})}
					{...(relAttribute ? { rel: relAttribute } : {})}
					className={`${prefix}-vk-link`}
				>
					<span className="screen-reader-text">
						{linkDescription
							? linkDescription
							: __('Group link', 'vk-blocks')}
					</span>
				</a>
			)}
		</CustomTag>
	);
};

// Support for existing group blocks and version management
import { assign } from 'lodash';

/**
 * Override block settings to include custom save function and attributes.
 *
 * @param {Object} settings          The block settings.
 * @param {string} name              The block name.
 * @param {Object} currentDeprecated
 * @return {Object} The modified block settings.
 */
const overrideBlockSettings = (settings, name, currentDeprecated) => {
	if (name !== 'core/group') {
		return settings;
	}

	// layout の値を取得
	const layoutValue =
		settings.supports && 'layout' in settings.supports
			? settings.supports.layout
			: {};

	let newSettings = assign({}, settings, {
		supports: {
			...settings.supports,
			layout: layoutValue,
		},
	});

	// deprecated は currentDeprecated === null のときだけマージする
	if (currentDeprecated === null) {
		const newDeprecated = [...(settings.deprecated || [])];
		const sorted = [...(Array.isArray(deprecated) ? deprecated : [])].sort(
			(a, b) =>
				(b.targetVersion || newDeprecated.length) -
				(a.targetVersion || newDeprecated.length)
		);
		sorted.forEach((item) => {
			const index = item.targetVersion || newDeprecated.length;
			const copy = { ...item };
			delete copy.targetVersion;
			newDeprecated.splice(index, 0, copy);
		});
		newSettings = {
			...newSettings,
			deprecated: newDeprecated,
			save,
		};
	}

	newSettings.attributes = {
		...(newSettings.attributes || {}),
		linkUrl: { type: 'string', default: '' },
		linkTarget: { type: 'string', default: '' },
		relAttribute: { type: 'string', default: '' },
		linkDescription: { type: 'string', default: '' },
		tagName: { type: 'string', default: 'div' },
	};

	return newSettings;
};

addFilter(
	'blocks.registerBlockType',
	'vk-blocks/group-save',
	overrideBlockSettings
);

// 保存時に追加のプロパティを設定
const addExtraProps = (saveElementProps, blockType, attributes) => {
	if (isValidBlockType(blockType.name)) {
		// save関数で既にクラスと属性が設定されているため、ここでは追加しない
		// scrollableがfalseの場合のみ、不要なクラスや属性を削除（他のプラグインなどで追加された場合の対策）
		if (!attributes.scrollable) {
			// scrollableがfalseの場合、不要なクラスや属性を削除
			if (saveElementProps.className) {
				saveElementProps.className = saveElementProps.className
					.replace('is-style-vk-group-scrollable', '')
					.replace(/\s+/g, ' ')
					.trim();
			}
			delete saveElementProps['data-scroll-breakpoint'];
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

		// textNoWrap が false でない場合のみ属性を追加
		// （tableMode が有効な場合、またはグリッド/フレックスレイアウトの場合は除外）
		const layoutType = attributes?.layout?.type;
		const isGridOrFlexLayout =
			layoutType === 'grid' || layoutType === 'flex';
		if (
			attributes.scrollable &&
			attributes.textNoWrap !== false &&
			!(attributes.tableMode === true) &&
			!isGridOrFlexLayout
		) {
			saveElementProps['data-text-nowrap'] = 'true';
		} else {
			delete saveElementProps['data-text-nowrap'];
		}

		// tableMode が true の場合のみ属性を追加
		if (attributes.scrollable && attributes.tableMode === true) {
			saveElementProps['data-table-mode'] = 'true';
		} else {
			delete saveElementProps['data-table-mode'];
		}
		if (attributes.scrollable) {
			if (!saveElementProps.role) {
				saveElementProps.role = 'region';
			}
			if (saveElementProps.tabIndex === undefined) {
				saveElementProps.tabIndex = 0;
			}
			if (!saveElementProps['aria-label']) {
				saveElementProps['aria-label'] = __(
					'Horizontal scroll area',
					'vk-blocks'
				);
			}
		}
	} else {
		// 他のブロックでは不要な属性を削除
		delete saveElementProps['data-scroll-breakpoint'];
		delete saveElementProps['data-output-scroll-hint'];
		delete saveElementProps['data-icon-output-left'];
		delete saveElementProps['data-icon-output-right'];
		delete saveElementProps['data-text-nowrap'];
		delete saveElementProps['data-table-mode'];
	}

	return saveElementProps;
};
addFilter(
	'blocks.getSaveContent.extraProps',
	'vk-blocks/group-style',
	addExtraProps
);
