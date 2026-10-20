import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	BaseControl,
	TextControl,
	RadioControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getMinSlidesForLoop } from './loop-min-slides';
import { vkBlocksSliderMarquee } from './marquee';

export const MultiItemSetting = (props) => {
	const { attributes, setAttributes, clientId } = props;
	const {
		slidesPerGroup,
		slidesPerViewMobile,
		slidesPerViewTablet,
		slidesPerViewPC,
		loop,
		effect,
		centeredSlides,
		zoomAnimation,
	} = attributes;

	// 等速ループ（#3053）では「一度に切り替える枚数」「中央寄せ」・ループ関連の警告を使わない。
	// 表示枚数は保存済みの slidesPerGroup に関係なく小数（刻み 0.1）を受け付ける
	// The continuous loop (#3053) does not use "items to change", centering, or the
	// loop-related warnings, and accepts decimal slides per view (step 0.1) regardless of
	// the saved slidesPerGroup.
	const isMarquee = vkBlocksSliderMarquee.isMarqueeMode(attributes);
	// 表示枚数を整数に丸めるのは、通常方式で「表示枚数ごと」に切り替えるときだけ
	// Slides per view is rounded to an integer only in the standard mode with
	// "Same as the number of items to display".
	const isIntegerSlidesPerView =
		!isMarquee && slidesPerGroup === 'slides-per-view';

	// インナーブロックを取得
	const innerBlocks = useSelect((select) =>
		select('core/block-editor').getBlocks(clientId)
	);

	// １スライドあたりの表示枚数がスライダーの総枚数の約数出なかったときに表示するアラート
	const slidesPerViewAlert = (
		<div className="text-danger font-size-11px">
			{__(
				'Enter integer divisors for the number of placed slide items for each display size.',
				'vk-blocks'
			)}
		</div>
	);

	const isNotDivisor = (value) => {
		if (value === null || value === undefined || value === '') {
			return false;
		}
		const n = parseInt(value, 10);
		return !Number.isNaN(n) && innerBlocks.length % n !== 0;
	};

	const slidesPerViewMobileAlert =
		isIntegerSlidesPerView && isNotDivisor(slidesPerViewMobile)
			? slidesPerViewAlert
			: '';
	const slidesPerViewTabletAlert =
		isIntegerSlidesPerView && isNotDivisor(slidesPerViewTablet)
			? slidesPerViewAlert
			: '';
	const slidesPerViewPCAlert =
		isIntegerSlidesPerView && isNotDivisor(slidesPerViewPC)
			? slidesPerViewAlert
			: '';

	const makeLoopAlert = (spv, spg) => {
		const minRequired = getMinSlidesForLoop(spv, spg, !!centeredSlides);
		if (innerBlocks.length >= minRequired) {
			return '';
		}
		return (
			<div className="alert alert-danger font-size-11px">
				{sprintf(
					/* translators: %d: minimum number of slides required for loop mode */
					__(
						'Loop mode requires at least %d slides with the current slider settings. Please add more slides or disable loop.',
						'vk-blocks'
					),
					minRequired
				)}
			</div>
		);
	};

	// toSpv: spv を最低 1 にクランプする（小数はそのまま保持し getMinSlidesForLoop 側で正規化）。
	// toSpg: spv を正整数に正規化する。null/undefined/'' または有限数でない場合は undefined を返す。
	const toSpv = (spv) => Math.max(1, spv);
	const toSpg = (spv) => {
		if (spv === null || spv === undefined || spv === '') {
			return undefined;
		}
		const n = Number(spv);
		return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : undefined;
	};

	/* ループ時のアラート */
	// 等速ループはスライドを複製して常にループするため、必要枚数の警告は出さない
	// The continuous loop always loops by cloning slides, so no minimum-slides warning.
	const slidesPerViewMobileLoopAlert =
		!isMarquee && loop
			? makeLoopAlert(
					toSpv(slidesPerViewMobile || 1),
					slidesPerGroup === 'slides-per-view'
						? (toSpg(slidesPerViewMobile || 1) ?? 1)
						: 1
				)
			: '';
	const slidesPerViewTabletLoopAlert =
		!isMarquee &&
		loop &&
		slidesPerViewTablet !== null &&
		slidesPerViewTablet !== undefined &&
		slidesPerViewTablet !== ''
			? makeLoopAlert(
					toSpv(slidesPerViewTablet),
					slidesPerGroup === 'slides-per-view'
						? (toSpg(slidesPerViewTablet) ?? 1)
						: 1
				)
			: '';
	const slidesPerViewPCLoopAlert =
		!isMarquee &&
		loop &&
		slidesPerViewPC !== null &&
		slidesPerViewPC !== undefined &&
		slidesPerViewPC !== ''
			? makeLoopAlert(
					toSpv(slidesPerViewPC),
					slidesPerGroup === 'slides-per-view'
						? (toSpg(slidesPerViewPC) ?? 1)
						: 1
				)
			: '';

	// 複数枚表示設定
	let multiItemSetting = '';

	// フェードエフェクトでない場合の設定UI
	// 等速ループではエフェクトの保存値に関係なく表示枚数を設定できる（#3053）
	// In the continuous loop, slides per view can be set regardless of the saved effect (#3053).
	const multiItemUI =
		isMarquee || effect !== 'fade' ? (
			<>
				<BaseControl
					label={__(
						'Number of Items to display per view',
						'vk-blocks'
					)}
					id={`vk_slider-MultiItem`}
				>
					<p className="font-size-11px">
						{__(
							'Enter the number of slide items to display on each device.',
							'vk-blocks'
						)}
					</p>
					{/* 以下の説明は通常方式の「一度に切り替える枚数」「中央寄せ」「ループ」に関するもので、
						等速ループでは使わない設定のため隠す（#3053）
						These notes are about the standard mode's "items to change", centering and
						loop, which the continuous loop does not use, so they are hidden (#3053). */}
					{!isMarquee && (
						<>
							<p className="font-size-11px">
								{__(
									'In one-by-one mode, you can set decimals (e.g. 1.5). If you specify a decimal, please enable "Centering the active slide".',
									'vk-blocks'
								)}
							</p>
							<p className="font-size-11px">
								{__(
									'In slides-per-view mode, enter a divisor of the total number of placed slides. If the number is not a divisor, the sliding behavior will be unnatural.',
									'vk-blocks'
								)}
							</p>
							<p className="font-size-11px">
								{__(
									'When "Centering the active slide" is enabled and the number of items to display is even, it is automatically treated as the next odd number internally. This may increase the minimum number of slides required for loop mode.',
									'vk-blocks'
								)}
							</p>
						</>
					)}
					<TextControl
						type={'number'}
						label={__('PC', 'vk-blocks')}
						value={slidesPerViewPC}
						onChange={(value) => {
							if (
								Number.isNaN(Number(value)) ||
								Number(value) < 1
							) {
								setAttributes({
									slidesPerViewPC: 1,
								});
							} else if (isIntegerSlidesPerView) {
								setAttributes({
									slidesPerViewPC: parseInt(
										Number(value),
										10
									),
								});
							} else {
								setAttributes({
									slidesPerViewPC: parseFloat(Number(value)),
								});
							}
						}}
						min={1}
						step={isIntegerSlidesPerView ? 1 : 0.1}
					/>
					{slidesPerViewPCAlert}
					{slidesPerViewPCLoopAlert}
					<TextControl
						type={'number'}
						label={__('Tablet', 'vk-blocks')}
						value={slidesPerViewTablet}
						onChange={(value) => {
							if (
								Number.isNaN(Number(value)) ||
								Number(value) < 1
							) {
								setAttributes({
									slidesPerViewTablet: 1,
								});
							} else if (isIntegerSlidesPerView) {
								setAttributes({
									slidesPerViewTablet: parseInt(
										Number(value),
										10
									),
								});
							} else {
								setAttributes({
									slidesPerViewTablet: parseFloat(
										Number(value)
									),
								});
							}
						}}
						min={1}
						step={isIntegerSlidesPerView ? 1 : 0.1}
					/>
					{slidesPerViewTabletAlert}
					{slidesPerViewTabletLoopAlert}
					<TextControl
						type={'number'}
						label={__('Mobile', 'vk-blocks')}
						value={slidesPerViewMobile}
						onChange={(value) => {
							if (
								Number.isNaN(Number(value)) ||
								Number(value) < 1
							) {
								setAttributes({
									slidesPerViewMobile: 1,
								});
							} else if (isIntegerSlidesPerView) {
								setAttributes({
									slidesPerViewMobile: parseInt(
										Number(value),
										10
									),
								});
							} else {
								setAttributes({
									slidesPerViewMobile: parseFloat(
										Number(value)
									),
								});
							}
						}}
						min={1}
						step={isIntegerSlidesPerView ? 1 : 0.1}
					/>
					{slidesPerViewMobileAlert}
					{slidesPerViewMobileLoopAlert}
				</BaseControl>
				{/* 「一度に切り替える枚数」「中央寄せ」は等速ループでは使わないため隠す（保存値は残す）
					"Items to change" and centering are unused in the continuous loop, so they are
					hidden (the saved values are kept). */}
				{!isMarquee && (
					<>
						<BaseControl
							label={__(
								'Number of items to change in a transition',
								'vk-blocks'
							)}
							id={`vk_slider-slidesPerGroup`}
						>
							<RadioControl
								selected={slidesPerGroup}
								className={'vk-radioControl'}
								options={[
									{
										label: __('One by One', 'vk-blocks'),
										value: 'one-by-one',
									},
									{
										label: __(
											'Same as the number of items to display',
											'vk-blocks'
										),
										value: 'slides-per-view',
									},
								]}
								onChange={(value) => {
									const attrs = { slidesPerGroup: value };
									if (value === 'slides-per-view') {
										const pcVal = toSpg(slidesPerViewPC);
										if (pcVal !== undefined) {
											attrs.slidesPerViewPC = pcVal;
										}
										const tabletVal =
											toSpg(slidesPerViewTablet);
										if (tabletVal !== undefined) {
											attrs.slidesPerViewTablet =
												tabletVal;
										}
										const mobileVal =
											toSpg(slidesPerViewMobile);
										if (mobileVal !== undefined) {
											attrs.slidesPerViewMobile =
												mobileVal;
										}
									}
									setAttributes(attrs);
								}}
							/>
						</BaseControl>
						<BaseControl id={`vk_slider-slidesPerGroup`}>
							<ToggleControl
								label={__(
									'Centering the active slide',
									'vk-blocks'
								)}
								className={'mb-1'}
								checked={centeredSlides}
								onChange={(checked) =>
									setAttributes({ centeredSlides: checked })
								}
								help={__(
									'If you specify the center, you can display items that are cut off on the left and right.',
									'vk-blocks'
								)}
							/>
						</BaseControl>
					</>
				)}
			</>
		) : null;

	// 複数枚表示設定が無効な場合のアラート
	// 等速ループではフェード・ズームを使わないため、この警告は出さない（#3053）
	// The continuous loop uses neither fade nor zoom, so this warning is not shown (#3053).
	const getDisabledReason = () => {
		if (isMarquee) {
			return null;
		}
		if (zoomAnimation) {
			return __('Background Image Zoom Animation', 'vk-blocks');
		} else if (effect === 'fade') {
			return __('Fade', 'vk-blocks') + ' ' + __('Effect', 'vk-blocks');
		}
		return null;
	};

	const disabledReason = getDisabledReason();
	const disabledAlert = disabledReason ? (
		<div className="alert alert-warning font-size-11px">
			{sprintf(
				/* translators: %s: name of the feature that is enabled (e.g. "Fade Effect" or "Background Image Zoom Animation") */
				__(
					'%s is enabled, so multi-item settings cannot be configured.',
					'vk-blocks'
				),
				disabledReason
			)}
		</div>
	) : null;

	multiItemSetting = (
		<PanelBody
			title={__('Multi-item Display Setting', 'vk-blocks')}
			initialOpen={false}
		>
			{disabledAlert}
			{(isMarquee || !zoomAnimation) && multiItemUI}
		</PanelBody>
	);
	return multiItemSetting;
};
