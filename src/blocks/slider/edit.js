import { AdvancedToggleControl } from '@vkblocks/components/advanced-toggle-control';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	BlockAlignmentToolbar,
	InnerBlocks,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	BaseControl,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	SelectControl,
	ToolbarGroup,
	ToolbarDropdownMenu,
	Dashicon,
	ToggleControl,
	RangeControl,
} from '@wordpress/components';
import { isParentReusableBlock } from '@vkblocks/utils/is-parent-reusable-block';
import { editSliderLaunch } from './edit-slider';
import { MultiItemSetting } from './edit-multiItem';
import ResponsiveSizeControl, {
	getMaxByUnit,
} from '@vkblocks/components/responsive-size-control';
import { useSelect } from '@wordpress/data';

// eslint-disable no-shadow
export default function SliderEdit(props) {
	const { attributes, setAttributes, clientId } = props;
	const {
		editorMode,
		pc,
		tablet,
		mobile,
		autoPlay,
		autoPlayStop,
		autoPlayDelay,
		pagination,
		width,
		loop,
		effect,
		speed,
		slidesPerView,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		centeredSlides,
		navigationPosition,
		direction,
		unit,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		blockId,
	} = attributes;

	// インナーブロックを取得
	const innerBlocks = useSelect((select) =>
		select('core/block-editor').getBlocks(clientId)
	);

	// editorMode と innerBlocks の順序をログ出力
	useEffect(() => {
		// 編集モード（default）に戻す時に DOM 要素を正しい順序に復元
		if (editorMode === 'default') {
			const sliderElement = blockRef.current;

			if (sliderElement) {
				const wrapper = sliderElement.querySelector(
					'.block-editor-block-list__layout'
				);

				if (wrapper && innerBlocks && innerBlocks.length > 0) {
					// 現在の DOM 順序を取得
					const currentOrder = Array.from(
						wrapper.querySelectorAll('.vk_slider_item')
					)
						.map((el) => {
							const classMatch = el.className.match(
								/vk_slider_item-([a-f0-9\-]+)/
							);
							return classMatch ? classMatch[1] : null;
						})
						.filter((id) => id !== null);

					// 期待される順序
					const expectedOrder = innerBlocks.map(
						(b) => b.attributes.blockId || b.clientId
					);

					// 順序が同じなら何もしない（不要な DOM 操作を避ける）
					if (
						JSON.stringify(currentOrder) ===
						JSON.stringify(expectedOrder)
					) {
						return;
					}

					// 順序が異なる場合のみ並べ替え
					// innerBlocks の順序に従って slider-item を並べ替え
					let previousElement = null;
					innerBlocks.forEach((block) => {
						const blockIdToUse =
							block.attributes.blockId || block.clientId;
						const element = wrapper.querySelector(
							`.vk_slider_item-${blockIdToUse}`
						);
						if (!element) {
							return;
						}

						if (previousElement) {
							// 前の要素の次に挿入
							if (previousElement.nextSibling) {
								wrapper.insertBefore(
									element,
									previousElement.nextSibling
								);
							} else {
								wrapper.appendChild(element);
							}
						} else if (element !== wrapper.firstChild) {
							// 最初の要素が先頭にない場合のみ移動
							wrapper.insertBefore(element, wrapper.firstChild);
						}

						previousElement = element;
					});
				}
			}
		}
	}, [editorMode, innerBlocks, clientId]);

	// プレビューモードに戻す時に、Swiper インスタンスをリセットして確実に再初期化
	useEffect(() => {
		if (editorMode === 'slide') {
			// requestAnimationFrame で React のレンダリングが完了するのを待ってから初期化
			let timerId;
			// eslint-disable-next-line no-undef
			const rafId = requestAnimationFrame(() => {
				timerId = setTimeout(() => {
					editSliderLaunch();
				}, 50);
			});
			// eslint-disable-next-line no-undef
			return () => {
				// eslint-disable-next-line no-undef
				cancelAnimationFrame(rafId);
				if (timerId) {
					clearTimeout(timerId);
				}
			};
		}
	}, [editorMode]);

	useEffect(() => {
		// attributes の clientId は使わなくなったので削除
		if (attributes.clientId !== undefined) {
			setAttributes({ clientId: undefined });
		}

		// blockID が定義されていない場合は blockID に clientID を挿入
		// 再利用ブロックのインナーブロックではない場合 blockID を更新
		if (
			blockId === undefined ||
			isParentReusableBlock(clientId) === false
		) {
			setAttributes({ blockId: clientId });
		}

		// 1.49 以前では slidesPerViewMobile が定義されていないので互換設定を追加
		if (slidesPerViewMobile === undefined) {
			setAttributes({
				slidesPerViewMobile: 1,
			});
		}

		// 1.49 以前では slidesPerViewTablet が定義されていないので互換設定を追加
		if (slidesPerViewTablet === undefined) {
			setAttributes({
				slidesPerViewTablet: 1,
			});
		}

		// 1.49 以前では slidesPerViewPC が定義されていないので互換設定を追加
		if (slidesPerViewPC === undefined) {
			if (slidesPerView !== undefined) {
				setAttributes({
					slidesPerViewPC: slidesPerView,
				});
			} else {
				setAttributes({
					slidesPerViewPC: 1,
				});
			}
		}

		// 1.49 以前では slidesPerView が定義されていないので互換設定を追加
		if (slidesPerView === undefined) {
			setAttributes({
				slidesPerView: 1,
			});
		}

		// @since 1.50
		// 1.49 までは slidesPerGroup は 数字での保存のみだったため、
		// 1 の場合は one-by-one に、 1 以外の数字指定だった場合は slides-per-view になるように
		if (
			slidesPerGroup === undefined ||
			slidesPerGroup === null ||
			slidesPerGroup === '' ||
			slidesPerGroup === 1 ||
			slidesPerGroup === 'one-by-one'
		) {
			setAttributes({
				slidesPerGroup: 'one-by-one',
			});
		} else {
			setAttributes({
				slidesPerGroup: 'slides-per-view',
			});
		}

		// 1.51 以前では centeredSlides が定義されていないので互換設定を追加
		if (centeredSlides === undefined) {
			setAttributes({ centeredSlides: false });
		}

		// 1.49 以前では pagination はブール型だったが文字列型になっための互換処理
		if (pagination === false) {
			setAttributes({ pagination: 'hide' });
		}
		if (pagination === true) {
			setAttributes({ pagination: 'bullets' });
		}

		// 1.49 以前では autoPlayStop が定義されていないので互換設定を追加
		if (autoPlayStop === undefined) {
			setAttributes({ autoPlayStop: false });
		}

		// 1.49 以前では navigationPosition が定義されていないので互換設定を追加
		if (navigationPosition === undefined) {
			setAttributes({ navigationPosition: 'mobile-bottom' });
		}

		// 1.67 以前では editorMode が定義されていないので互換設定を追加
		if (editorMode === undefined) {
			setAttributes({ editorMode: 'default' });
		}

		// ズームアニメーション設定の初期化
		if (zoomAnimation === undefined) {
			setAttributes({ zoomAnimation: false });
		}
		if (zoomInitialScale === undefined) {
			setAttributes({ zoomInitialScale: 1 });
		}
		if (zoomFinalScale === undefined) {
			setAttributes({ zoomFinalScale: 1.25 });
		}

		// 1.68 以前では direction が定義されていないので互換設定を追加
		if (direction === undefined) {
			setAttributes({ direction: 'rtl' });
		}
	}, [clientId]);

	// 複数枚表示が設定されている場合に拡大機能を無効化
	useEffect(() => {
		if (
			slidesPerViewPC > 1 ||
			slidesPerViewTablet > 1 ||
			slidesPerViewMobile > 1
		) {
			if (zoomAnimation) {
				setAttributes({ zoomAnimation: false });
			}
		}
	}, [
		slidesPerViewPC,
		slidesPerViewTablet,
		slidesPerViewMobile,
		zoomAnimation,
	]);

	// 拡大機能が有効になった場合に複数枚表示設定を1にリセット
	useEffect(() => {
		if (zoomAnimation) {
			if (slidesPerViewPC > 1) {
				setAttributes({ slidesPerViewPC: 1 });
			}
			if (slidesPerViewTablet > 1) {
				setAttributes({ slidesPerViewTablet: 1 });
			}
			if (slidesPerViewMobile > 1) {
				setAttributes({ slidesPerViewMobile: 1 });
			}
		}
	}, [
		zoomAnimation,
		slidesPerViewPC,
		slidesPerViewTablet,
		slidesPerViewMobile,
	]);

	// 複数枚動かすときに sliderPerView が小数だと微妙なので対処
	useEffect(() => {
		if (slidesPerGroup === 'slides-per-view') {
			setAttributes({
				slidesPerViewPC: parseInt(Number(slidesPerViewPC), 10),
			});
			setAttributes({
				slidesPerViewTablet: parseInt(Number(slidesPerViewTablet), 10),
			});
			setAttributes({
				slidesPerViewMobile: parseInt(Number(slidesPerViewMobile), 10),
			});
		}
	}, [slidesPerGroup]);

	const containerClass = ' vk_grid-column';
	const ALLOWED_BLOCKS = ['vk-blocks/slider-item'];
	const TEMPLATE = [['vk-blocks/slider-item']];

	// 幅のクラス名変更
	let alignClass = '';
	if ('full' === width) {
		alignClass = ' alignfull';
	} else if ('wide' === width) {
		alignClass = ' alignwide';
	}

	// JS に渡す値の構造体
	const sliderData = {
		editorMode,
		autoPlay,
		autoPlayStop,
		autoPlayDelay,
		pagination,
		blockId,
		width,
		loop,
		effect,
		speed,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		centeredSlides,
		zoomAnimation,
		zoomInitialScale,
		zoomFinalScale,
		direction,
	};

	// ページネーションの HTML
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

	const blockRef = useRef(null);

	const blockProps = useBlockProps({
		className: `vk_slider vk_swiper vk_slider_editorMode--${editorMode} vk_slider_${clientId}${alignClass}`,
		ref: blockRef,
	});

	return (
		<>
			<BlockControls>
				<BlockAlignmentToolbar
					value={width}
					onChange={(nextWidth) =>
						setAttributes({ width: nextWidth })
					}
					controls={['wide', 'full']}
				/>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={
							editorMode === 'default' ? (
								<Dashicon icon="edit" />
							) : (
								<Dashicon icon="visibility" />
							)
						}
						label={__('Change Slide Editor Mode', 'vk-blocks')}
						controls={[
							{
								title: __(
									'Edit ( Stacked Layout ) Mode',
									'vk-blocks'
								),
								icon: <Dashicon icon="edit" />,
								isActive: editorMode === 'default',
								onClick: () =>
									setAttributes({ editorMode: 'default' }),
							},
							{
								title: __(
									'Preview ( Slide ) Mode',
									'vk-blocks'
								),
								icon: <Dashicon icon="visibility" />,
								isActive: editorMode === 'slide',
								onClick: () =>
									setAttributes({ editorMode: 'slide' }),
							},
						]}
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={__('Editor Setting', 'vk-blocks')}
					initialOpen={true}
				>
					<BaseControl
						label={__('Editor Mode', 'vk-blocks')}
						id={`vk_slider-effect`}
					>
						<ToggleGroupControl
							value={editorMode}
							onChange={(value) =>
								setAttributes({ editorMode: value })
							}
							isBlock
							help={__(
								'In edit mode, the elements are stacked vertically. In preview mode, the slides actually animate.',
								'vk-blocks'
							)}
						>
							<ToggleGroupControlOption
								value="default"
								label={__('Edit', 'vk-blocks')}
							/>
							<ToggleGroupControlOption
								value="slide"
								label={__('Preview', 'vk-blocks')}
							/>
						</ToggleGroupControl>
					</BaseControl>
				</PanelBody>
				<PanelBody
					title={__('Slider Settings', 'vk-blocks')}
					initialOpen={false}
				>
					<BaseControl
						label={__('Effect', 'vk-blocks')}
						id={`vk_slider-effect`}
					>
						<SelectControl
							value={effect}
							onChange={(value) =>
								setAttributes({ effect: value })
							}
							options={[
								{
									label: __('Slide', 'vk-blocks'),
									value: 'slide',
								},
								{
									label: __('Fade', 'vk-blocks'),
									value: 'fade',
								},
							]}
						/>
					</BaseControl>
					<BaseControl
						label={__('Loop', 'vk-blocks')}
						id={`vk_slider-loop`}
					>
						<AdvancedToggleControl
							initialFixedTable={loop}
							schema={'loop'}
							{...props}
						/>
					</BaseControl>
					<BaseControl
						label={__('AutoPlay', 'vk-blocks')}
						id={`vk_slider-autoPlay`}
					>
						<AdvancedToggleControl
							initialFixedTable={autoPlay}
							schema={'autoPlay'}
							{...props}
						/>
					</BaseControl>

					{/* Slide Direction is only available when AutoPlay is enabled because reverseDirection is an autoplay-specific setting in Swiper.js */}
					{autoPlay && (
						<BaseControl
							label={__('Slide Direction', 'vk-blocks')}
							id={`vk_slider-direction`}
						>
							<SelectControl
								value={direction}
								options={[
									{
										label: __('Right to Left', 'vk-blocks'),
										value: 'rtl',
									},
									{
										label: __('Left to Right', 'vk-blocks'),
										value: 'ltr',
									},
								]}
								onChange={(value) =>
									setAttributes({ direction: value })
								}
							/>
						</BaseControl>
					)}
					<BaseControl
						label={__('Stop AutoPlay when swipe', 'vk-blocks')}
						id={`vk_slider-autoPlay`}
					>
						<AdvancedToggleControl
							initialFixedTable={autoPlayStop}
							schema={'autoPlayStop'}
							{...props}
						/>
					</BaseControl>
					<BaseControl
						label={__('Display Time', 'vk-blocks')}
						id={`vk_slider-autoPlay`}
					>
						<TextControl
							type={'number'}
							value={autoPlayDelay}
							onChange={(value) => {
								if (
									Number.isNaN(Number(value)) ||
									Number(value) < 0
								) {
									setAttributes({
										autoPlayDelay: 0,
									});
								} else {
									setAttributes({
										autoPlayDelay: parseInt(
											Number(value),
											10
										),
									});
								}
							}}
							min={0}
						/>
					</BaseControl>
					<BaseControl
						label={__('Change Speed', 'vk-blocks')}
						id={`vk_slider-changeSpeed`}
					>
						<TextControl
							type={'number'}
							value={speed}
							onChange={(value) => {
								if (
									Number.isNaN(Number(value)) ||
									Number(value) < 0
								) {
									setAttributes({
										speed: 0,
									});
								} else {
									setAttributes({
										speed: parseInt(Number(value), 10),
									});
								}
							}}
							min={0}
						/>
					</BaseControl>
					<BaseControl
						label={__('Pagination Type', 'vk-blocks')}
						id={`vk_slider-displayPagination`}
					>
						<SelectControl
							value={pagination}
							options={[
								{
									label: __('Hide', 'vk-blocks'),
									value: 'hide',
								},
								{
									label: __('Default', 'vk-blocks'),
									value: 'bullets',
								},
								{
									label: __('Number of slides', 'vk-blocks'),
									value: 'fraction',
								},
							]}
							onChange={(value) =>
								setAttributes({ pagination: value })
							}
						/>
					</BaseControl>
					<BaseControl
						label={__('Navigation Position', 'vk-blocks')}
						id={`vk_slider-navigationPosition`}
					>
						<SelectControl
							value={navigationPosition}
							options={[
								{
									label: __('Hide', 'vk-blocks'),
									value: 'hide',
								},
								{
									label: __('Center', 'vk-blocks'),
									value: 'center',
								},
								{
									label: __(
										'Bottom on Mobile device',
										'vk-blocks'
									),
									value: 'mobile-bottom',
								},
							]}
							onChange={(value) =>
								setAttributes({ navigationPosition: value })
							}
						/>
					</BaseControl>
				</PanelBody>
				<MultiItemSetting {...props} />
				<PanelBody
					title={__('Height', 'vk-blocks')}
					initialOpen={false}
				>
					<ResponsiveSizeControl
						label={__('Slide Height for each device', 'vk-blocks')}
						valuePC={pc}
						valueTablet={tablet}
						valueMobile={mobile}
						unit={unit}
						onChangePC={(value) => setAttributes({ pc: value })}
						onChangeTablet={(value) =>
							setAttributes({ tablet: value })
						}
						onChangeMobile={(value) =>
							setAttributes({ mobile: value })
						}
						onChangeUnit={(value) => setAttributes({ unit: value })}
						maxPC={getMaxByUnit(unit)}
						maxTablet={getMaxByUnit(unit)}
						maxMobile={getMaxByUnit(unit)}
					/>
				</PanelBody>
				<PanelBody
					title={__('Background Image Zoom Animation', 'vk-blocks')}
					initialOpen={false}
				>
					{effect !== 'fade' &&
					(slidesPerViewPC > 1 ||
						slidesPerViewTablet > 1 ||
						slidesPerViewMobile > 1) ? (
						<div className="alert alert-warning font-size-11px">
							{__(
								'When multiple items are set in "Multi-item Display Setting", zoom settings here will be disabled. Please set all to "1".',
								'vk-blocks'
							)}
						</div>
					) : (
						<>
							<ToggleControl
								label={__('Enable', 'vk-blocks')}
								checked={zoomAnimation}
								onChange={(value) =>
									setAttributes({ zoomAnimation: value })
								}
								help={__(
									'Enabling this will apply a zoom animation to the slide background image.',
									'vk-blocks'
								)}
							/>
							<div className="alert alert-info font-size-11px">
								{__(
									'We recommend using the Fade effect together with Background image Zoom Animation.',
									'vk-blocks'
								)}
							</div>
							{zoomAnimation && (
								<>
									<RangeControl
										label={__(
											'Initial Background Scale',
											'vk-blocks'
										)}
										value={zoomInitialScale}
										onChange={(value) =>
											setAttributes({
												zoomInitialScale: value,
											})
										}
										min={1}
										max={3}
										step={0.05}
									/>
									<RangeControl
										label={__(
											'Final Background Scale',
											'vk-blocks'
										)}
										value={zoomFinalScale}
										onChange={(value) =>
											setAttributes({
												zoomFinalScale: value,
											})
										}
										min={1}
										max={3}
										step={0.05}
									/>
									<p className="vk_slider_zoomAnimation_help">
										{__(
											'1 means original size. Larger values will zoom in the background image.',
											'vk-blocks'
										)}
									</p>
								</>
							)}
						</>
					)}
				</PanelBody>
			</InspectorControls>
			<div {...blockProps} data-vkb-slider={JSON.stringify(sliderData)}>
				<div className={`vk_slider_wrapper`}>
					<div>
						<InnerBlocks
							//編集画面の追加タグ用に2回目のClassを挿入
							className={`${containerClass} row`}
							template={TEMPLATE}
							allowedBlocks={ALLOWED_BLOCKS}
						/>
					</div>
				</div>
				{navigation_next_html}
				{navigation_prev_html}
				{pagination_html}
			</div>
		</>
	);
}
