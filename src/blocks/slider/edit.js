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
import {
	isParentReusableBlock,
	hasBlockIdCollision,
	shouldUpdateBlockId,
	shouldDefaultShowActualSlideCountOn,
} from '@vkblocks/utils/is-parent-reusable-block';
import { editSliderLaunch } from './edit-slider';
import { MultiItemSetting } from './edit-multiItem';
import { PauseButton } from './pause-button';
import { getEffectiveLoop } from './loop-min-slides';
import { vkBlocksSliderMarquee } from './marquee';
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
		pauseButton,
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
		showActualSlideCount,
		playbackMode,
		marqueeSpeed,
	} = attributes;

	// 再生方式が等速ループ（マーキー）かどうか（#3053）
	// Whether the playback mode is the continuous loop (marquee) (#3053).
	const isMarquee = vkBlocksSliderMarquee.isMarqueeMode(attributes);
	// 直前の描画で等速ループだったか（ズームと表示枚数の効果の制御に使う）
	// Whether the previous render was in the continuous loop (used by the zoom effects).
	const wasMarqueeRef = useRef(isMarquee);

	// インナーブロックを取得
	const innerBlocks = useSelect((select) =>
		select('core/block-editor').getBlocks(clientId)
	);

	// このブロックが「たった今」挿入されたものかどうか（#3080）。
	// blockId の有無だけでは判定できない。blockId 属性は、この属性が導入される
	// 前に保存された古いブロックでも undefined になり得るため（issue #2556の
	// shouldUpdateBlockId/hasBlockIdCollisionが、まさにこの「blockIdが無い古い
	// ブロック」を救済するために存在する）、blockId === undefined だけを新規
	// 判定に使うと、古い投稿をエディタで開いただけで意図せず新規挿入と誤判定
	// されてしまう（CodeRabbit指摘）。@wordpress/block-editor の
	// wasBlockJustInserted はブロックが実際に挿入された直後かどうかを判定する
	// 標準セレクターで、この用途に使う。
	//
	// Whether this block was *just* inserted (#3080). blockId presence alone
	// cannot tell this apart: the blockId attribute can be undefined even on
	// old blocks saved before this attribute existed (issue #2556's
	// shouldUpdateBlockId/hasBlockIdCollision exist precisely to rescue such
	// "no blockId" legacy blocks), so using blockId === undefined alone as the
	// "just inserted" signal misfires when merely opening an old post in the
	// editor (CodeRabbit feedback). @wordpress/block-editor's
	// wasBlockJustInserted is the standard selector for detecting a genuine,
	// just-now insertion, so it is used here instead.
	const wasJustInserted = useSelect(
		(select) => select('core/block-editor').wasBlockJustInserted(clientId),
		[clientId]
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
			const rafId = requestAnimationFrame(() => {
				timerId = setTimeout(() => {
					editSliderLaunch();
				}, 50);
			});

			return () => {
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

		// issue #2556: blockId を毎リロードで上書きすると dirty 化するため、
		// 「未確定」または「再利用ブロック外での実衝突（複製）」のときだけ再採番する。
		if (
			shouldUpdateBlockId({
				blockId,
				isInReusableBlock: isParentReusableBlock(clientId),
				hasCollision: hasBlockIdCollision(clientId, blockId),
			})
		) {
			const blockIdUpdates = { blockId: clientId };
			// 「blockId が undefined」かつ「たった今挿入された」の両方を満たす
			// 時だけ、実スライド数表示を ON始まりにする（#3080 decision-record）。
			// blockId === undefined だけでは、blockId 属性導入前の古い投稿を
			// 開いただけでも真になってしまうため、wasBlockJustInserted と
			// 組み合わせて「本当に新規挿入されたブロックか」を判定する
			// （CodeRabbit指摘）。複製時は blockId が複製元からコピーされ
			// undefined ではないため、この分岐には入らず複製元の値を維持する。
			// Only turn the default display on when the block's blockId is
			// undefined AND it was just inserted (#3080 decision-record).
			// blockId === undefined alone would also be true simply from
			// opening an old post saved before this attribute existed, so it
			// is combined with wasBlockJustInserted to detect a genuine new
			// insertion (CodeRabbit feedback). Duplicating a block copies its
			// blockId from the source (so it is not undefined), so a
			// duplicate does not hit this branch and keeps the source's value.
			if (
				shouldDefaultShowActualSlideCountOn({
					blockId,
					wasJustInserted,
				})
			) {
				blockIdUpdates.showActualSlideCount = true;
			}
			setAttributes(blockIdUpdates);
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

		// pauseButton 追加前のブロックでは未定義なので互換設定を追加
		if (pauseButton === undefined) {
			setAttributes({ pauseButton: false });
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

	// 等速ループ（#3053）と、以下の3つの効果の関係:
	// - 等速ループ中は3つとも動かさない。ズーム等は隠しているだけなので保存値を書き換えず、
	//   表示枚数は小数も含めて自由に設定できるようにするため
	// - 等速ループから通常へ戻した描画では、3つの代わりに最後の効果がまとめて整える。
	//   3つが同じ描画で別々に働くと、古い値どうしで打ち消し合い、ズームと表示枚数の
	//   両方が初期化されてしまうため
	// How the continuous loop (#3053) relates to the three effects below:
	// - None of them runs in the continuous loop: zoom etc. are only hidden, so their saved
	//   values are left alone, and slides per view (decimals included) can be set freely.
	// - On the render that returns from the continuous loop to standard, the last effect
	//   reconciles everything instead. If the three ran separately on that render they
	//   would undo each other with stale values and reset both zoom and slides per view.
	const isReturningFromMarquee = !isMarquee && wasMarqueeRef.current;

	// 複数枚表示が設定されている場合に拡大機能を無効化
	useEffect(() => {
		if (isMarquee || isReturningFromMarquee) {
			return;
		}
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
		isMarquee,
	]);

	// 拡大機能が有効になった場合に複数枚表示設定を1にリセット
	useEffect(() => {
		if (isMarquee || isReturningFromMarquee) {
			return;
		}
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
		isMarquee,
	]);

	// 複数枚動かすときに sliderPerView が小数だと微妙なので対処
	useEffect(() => {
		if (isMarquee || isReturningFromMarquee) {
			return;
		}
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

	// 等速ループから通常へ戻したときに、通常方式の決まりに合わせて表示枚数を整える（#3053）。
	// 隠していたズームの設定を優先し、ズームが ON なら表示枚数を 1 に戻す。
	// そうでなく「表示枚数ごと」に切り替える設定なら、等速ループで入れた小数を整数にする。
	// When returning from the continuous loop to standard, bring slides per view in line
	// with the standard mode's rules (#3053). The hidden zoom setting wins: with zoom on,
	// slides per view goes back to 1. Otherwise, with "Same as the number of items to
	// display", decimals entered in the continuous loop are rounded down to integers.
	useEffect(() => {
		if (isReturningFromMarquee) {
			const values = {
				slidesPerViewPC,
				slidesPerViewTablet,
				slidesPerViewMobile,
			};
			const nextValues = {};
			Object.keys(values).forEach((key) => {
				if (zoomAnimation) {
					if (values[key] > 1) {
						nextValues[key] = 1;
					}
				} else if (slidesPerGroup === 'slides-per-view') {
					nextValues[key] = parseInt(Number(values[key]), 10);
				}
			});
			if (Object.keys(nextValues).length > 0) {
				setAttributes(nextValues);
			}
		}
		// 次の描画のために、今の方式を覚えておく
		// Remember the current mode for the next render.
		wasMarqueeRef.current = isMarquee;
	}, [isMarquee]);

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
		pauseButton,
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
		showActualSlideCount,
		playbackMode,
		marqueeSpeed,
	};

	// 「実際のスライド数で表示」トグルの表示条件に使う実効loop状態（#3080）。
	// 保存された loop 属性ではなく、view.js の needsLoopDisable と同じ計算で
	// スライド枚数不足時の強制OFFを反映した値を使う。保存された loop だけを
	// 見ると、スライド枚数が少なすぎてSwiperのループが実際には機能しない
	// ケースで判定がずれ、トグル自体が表示されなくなってしまう
	// （Claude Code code-review指摘）。
	// The effective loop state used for the "Show actual slide count" toggle's
	// visibility (#3080). Uses the same calculation as view.js's
	// needsLoopDisable, reflecting the forced-off state when there are too few
	// slides, rather than the raw saved loop attribute. Using the raw
	// attribute alone misses this case and hides the toggle when there are too
	// few slides for Swiper's loop mode to actually work (found via Claude
	// Code code-review).
	const effectiveLoop = getEffectiveLoop({
		loop,
		slideCount: innerBlocks ? innerBlocks.length : 0,
		effect,
		slidesPerView,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		slidesPerGroup,
		centeredSlides,
	});

	// ページネーションの HTML
	// 等速ループでは矢印・ページネーションを使わないため出力しない（#3053。save と同じ）
	// No arrows or pagination in the continuous loop (#3053, same as save).
	let pagination_html = '';
	if (!isMarquee && pagination !== 'hide') {
		pagination_html = (
			<div
				className={`swiper-pagination swiper-pagination-${pagination}`}
			></div>
		);
	}

	// ナビゲーションの HTML
	let navigation_next_html = '';
	let navigation_prev_html = '';
	if (!isMarquee && navigationPosition !== 'hide') {
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

	// 停止/再生ボタンの HTML（プレビュー(slide)モードで Swiper が初期化される時のみ意味を持つため、
	// editorMode === 'slide' かつ自動再生が有効かつ表示設定が ON の時だけ出力）
	// エディタの出力は保存されないため、ここでは withLabels でラベルを付けてよい。
	// フロント側のラベルは PHP が描画時に付与する（save 側は withLabels を渡さない）。
	// The editor output is never saved, so labels can safely be rendered here via
	// withLabels. On the front end the labels are added by PHP at render time, which is
	// why save does not pass withLabels.
	// 等速ループでは保存値に関係なく常に出力する（#3053。save と同じ条件）。
	// Always output in the continuous loop regardless of the saved values (#3053, same
	// condition as save).
	const pause_button_html =
		editorMode === 'slide' && ((autoPlay && pauseButton) || isMarquee) ? (
			<PauseButton withLabels />
		) : (
			''
		);

	const blockRef = useRef(null);

	// 高さ・ズーム用の CSS は blockId をキーに生成される（index.js / save.js と共通）。
	// issue #2556 以降 blockId は編集時に clientId と一致しなくなったため、ラッパーの
	// クラスも blockId で揃えないと編集画面だけ CSS が当たらず表示が崩れる。
	// The height/zoom CSS is keyed on blockId (shared with index.js / save.js).
	// Since issue #2556, blockId no longer equals clientId in the editor, so the
	// wrapper class must also use blockId; otherwise the CSS misses only in the
	// editor and the slider renders broken.
	// 等速ループでは save と同じく目印のクラスと画面幅ごとの表示枚数（CSS 変数）を付ける
	// （プレビューでのスライド幅の計算に使う。#3053）
	// In the continuous loop, add the same marker class and per-viewport slides per view
	// (CSS variables) as save (used to size the slides in the preview, #3053).
	const blockProps = useBlockProps({
		className: `vk_slider vk_swiper vk_slider_editorMode--${editorMode} vk_slider_${blockId}${alignClass}${isMarquee ? ' vk_slider--marquee' : ''}`,
		style: isMarquee
			? vkBlocksSliderMarquee.getSlidesPerViewStyle(attributes)
			: undefined,
		ref: blockRef,
	});

	// スライドの方向（通常方式では自動再生が ON のとき、等速ループでは常に表示する）
	// Slide direction (shown when autoplay is on in the standard mode, always in the loop).
	const directionControl = (
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
				onChange={(value) => setAttributes({ direction: value })}
			/>
		</BaseControl>
	);

	// 等速ループ専用の設定（#3053）。通常方式の項目は隠し、保存値はそのまま残す
	// Settings for the continuous loop only (#3053). The standard mode's controls are hidden
	// and their saved values are kept.
	const marqueeSettings = (
		<>
			<RangeControl
				label={__('Flow speed (px/s)', 'vk-blocks')}
				help={`${__('Larger values make the slides flow faster.', 'vk-blocks')} ${__('Around 60 gives a gentle pace.', 'vk-blocks')}`}
				value={marqueeSpeed}
				onChange={(value) =>
					setAttributes({
						marqueeSpeed:
							vkBlocksSliderMarquee.normalizeSpeed(value),
					})
				}
				min={vkBlocksSliderMarquee.MIN_SPEED}
				max={vkBlocksSliderMarquee.MAX_SPEED}
				step={5}
				allowReset
				resetFallbackValue={vkBlocksSliderMarquee.DEFAULT_SPEED}
			/>
			{directionControl}
			{/* 訪問者が動きを止められるよう、等速ループでは停止/再生ボタンを常に表示する。
				保存値の pauseButton は書き換えず、操作できない状態で ON として見せる
				The continuous loop always shows the pause / play button so visitors can stop
				the motion. The saved pauseButton is not rewritten; it is shown as ON and disabled. */}
			<ToggleControl
				label={__('Display pause / play button', 'vk-blocks')}
				help={__(
					'In continuous loop mode, this button is always displayed so that visitors can stop the motion.',
					'vk-blocks'
				)}
				checked={true}
				disabled
				onChange={() => {}}
			/>
		</>
	);

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
					{/* 再生方式（#3053）。方式によって使う設定がまったく変わるため、パネルの先頭に置く
						Playback mode (#3053). It changes which settings apply entirely, so it
						comes first in the panel. */}
					<ToggleGroupControl
						label={__('Playback mode', 'vk-blocks')}
						help={
							isMarquee
								? `${__('Slides keep flowing at a constant speed without stopping.', 'vk-blocks')} ${__('Settings that do not apply, such as arrows and pagination, are hidden.', 'vk-blocks')}`
								: __(
										'Slides change one after another at set intervals.',
										'vk-blocks'
									)
						}
						value={isMarquee ? 'marquee' : 'default'}
						onChange={(value) =>
							setAttributes({ playbackMode: value })
						}
						isBlock
					>
						<ToggleGroupControlOption
							value="default"
							label={__('Standard', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="marquee"
							label={__('Continuous loop', 'vk-blocks')}
						/>
					</ToggleGroupControl>
					{isMarquee && marqueeSettings}
					{!isMarquee && (
						<>
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
							{autoPlay && directionControl}
							<BaseControl
								label={__(
									'Stop AutoPlay when swipe',
									'vk-blocks'
								)}
								id={`vk_slider-autoPlay`}
							>
								<AdvancedToggleControl
									initialFixedTable={autoPlayStop}
									schema={'autoPlayStop'}
									{...props}
								/>
							</BaseControl>
							{/* 停止/再生ボタンは自動再生が有効な時のみ意味を持つため、autoPlay が ON の時だけ表示 */}
							{autoPlay && (
								<BaseControl
									label={__(
										'Display pause / play button',
										'vk-blocks'
									)}
									id={`vk_slider-pauseButton`}
									help={
										<>
											{__(
												'Displays a button on the front end that lets visitors pause and resume the autoplay.',
												'vk-blocks'
											)}{' '}
											{__(
												'When this is off, autoplay keeps running even for visitors whose device requests reduced motion, since there is no button to pause it.',
												'vk-blocks'
											)}
										</>
									}
								>
									<AdvancedToggleControl
										initialFixedTable={pauseButton}
										schema={'pauseButton'}
										{...props}
									/>
								</BaseControl>
							)}
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
												speed: parseInt(
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
											label: __(
												'Number of slides',
												'vk-blocks'
											),
											value: 'fraction',
										},
									]}
									onChange={(value) =>
										setAttributes({ pagination: value })
									}
								/>
							</BaseControl>
							{/* ループOFF（実効状態）・「スライドの枚数」・複数枚表示（PC/タブレット/
						モバイルのいずれかで2枚以上）の組み合わせのときだけ表示する（#3080）。
						ループONや全ブレークポイントで1枚ずつ表示では、トグルをONにしても
						表示が変わらない（従来通り単一数値(current / total)のまま）ため、
						無意味な設定を見せないよう非表示にする。ここでの「ループOFF」判定は
						保存された loop 属性ではなく effectiveLoop（実効loop状態）を使う。
						スライド枚数不足でSwiperのループが実際には機能しないケースでも、
						保存値だけを見るとトグル自体が表示されなくなってしまうため
						（Claude Code code-review指摘）。effect が 'fade' のときは
						slidesPerView の設定に関わらず視覚的に1枚ずつしか表示されない
						（view.js が config.slidesPerView 自体を設定しない）ため、
						この場合もトグルを見せない（CodeRabbit指摘）。 */}
							{pagination === 'fraction' &&
								!effectiveLoop &&
								effect !== 'fade' &&
								[
									slidesPerViewMobile,
									slidesPerViewTablet,
									slidesPerViewPC,
								].some((v) => Number(v) > 1) && (
									// BaseControl で ToggleControl を包むと、label・help が
									// ToggleControl の実際の input 要素と正しく関連付けられない
									// ため（CodeRabbit指摘）、包まずに label・help を
									// ToggleControl へ直接渡す。
									// Wrapping ToggleControl in BaseControl does not correctly
									// associate the label/help with ToggleControl's actual input
									// element (CodeRabbit feedback), so the label/help are passed
									// directly to ToggleControl instead of wrapping it.
									<ToggleControl
										label={__(
											'Show actual slide count',
											'vk-blocks'
										)}
										help={`${__('Turn this on to show the real slide count and the range currently visible (e.g. "1–3 / 6").', 'vk-blocks')} ${__("When it's off, the total can look smaller than the real number of slides if multiple slides are shown at once.", 'vk-blocks')}`}
										checked={!!showActualSlideCount}
										onChange={(value) =>
											setAttributes({
												showActualSlideCount: value,
											})
										}
									/>
								)}
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
										{
											label: __(
												'Bottom on all devices',
												'vk-blocks'
											),
											value: 'always-bottom',
										},
									]}
									onChange={(value) =>
										setAttributes({
											navigationPosition: value,
										})
									}
								/>
							</BaseControl>
						</>
					)}
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
				{/* 等速ループではズームが成立しないため、パネルごと隠す（保存値は残す。#3053）
					Zoom cannot work in the continuous loop, so the whole panel is hidden (the
					saved values are kept, #3053). */}
				{!isMarquee && (
					<PanelBody
						title={__(
							'Background Image Zoom Animation',
							'vk-blocks'
						)}
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
				)}
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
				{pause_button_html}
			</div>
		</>
	);
}
