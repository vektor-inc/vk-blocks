import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BaseControl,
	TextControl,
	RadioControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

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

	// インナーブロックを取得
	const innerBlocks = useSelect((select) =>
		select('core/block-editor').getBlocks(clientId)
	);

	let demicalPointAlert = '';
	if (slidesPerGroup === 'one-by-one') {
		demicalPointAlert = (
			<p className="font-size-11px">
				{__(
					'If you specifying a numbers with decimals such as 1.5, Please set "Centering the active slide"',
					'vk-blocks'
				)}
			</p>
		);
	} else if (slidesPerGroup === 'slides-per-view') {
		demicalPointAlert = (
			<p>
				{__(
					'The decimal point can be set for the display number only when the display is switched one by one.',
					'vk-blocks'
				)}
			</p>
		);
	}

	// １スライドあたりの表示枚数がスライダーの総枚数の約数出なかったときに表示するアラート
	const slidesPerViewAlert = (
		<div className="text-danger font-size-11px">
			{__(
				'Enter integer divisors for the number of placed slide items for each display size.',
				'vk-blocks'
			)}
		</div>
	);

	// 上記アラートを表示するか否かのモバイル時の処理
	let slidesPerViewMobileAlert = '';
	if (
		innerBlocks.length % parseInt(slidesPerViewMobile) !== 0 &&
		slidesPerGroup === 'slides-per-view'
	) {
		slidesPerViewMobileAlert = slidesPerViewAlert;
	}

	// 上記アラートを表示するか否かのタブレット時の処理
	let slidesPerViewTabletAlert = '';
	if (
		innerBlocks.length % parseInt(slidesPerViewTablet) !== 0 &&
		slidesPerGroup === 'slides-per-view'
	) {
		slidesPerViewTabletAlert = slidesPerViewAlert;
	}

	// 上記アラートを表示するか否かの PC 時の処理
	let slidesPerViewPCAlert = '';
	if (
		innerBlocks.length % parseInt(slidesPerViewPC) !== 0 &&
		slidesPerGroup === 'slides-per-view'
	) {
		slidesPerViewPCAlert = slidesPerViewAlert;
	}

	// ループに関するアラート
	let sloderPerViewLoopAlert = '';
	if (slidesPerGroup === 'slides-per-view') {
		// 一度に遷移するスライドアイテムの数 : 表示アイテム数と同じ
		sloderPerViewLoopAlert = (
			<div className="alert alert-danger font-size-11px">
				{__(
					'If you want to loop slides, the number of placed slide items must be greater than or equal to twice the number of items you want to display per view.',
					'vk-blocks'
				)}
			</div>
		);
	} else if (slidesPerGroup !== 'slides-per-view') {
		// ↑ else だけだと lint でエラーにされてコミットさせてもらえないため...
		// 一度に遷移するスライドアイテムの数 : １つずつ
		if (attributes.centeredSlides) {
			// アクティブスライドを中央にする場合
			sloderPerViewLoopAlert = (
				<div className="alert alert-danger font-size-11px">
					{__(
						'If the active slide is in the center, the number of placed slide items must be greater than or equal to the number of items you want to display in one view + 2.',
						'vk-blocks'
					)}
				</div>
			);
		} else {
			sloderPerViewLoopAlert = (
				<div className="alert alert-danger font-size-11px">
					{__(
						'If you want to loop slides, the number of placed slide items must be greater than or equal to the number of items you want to display per view + 1.',
						'vk-blocks'
					)}
				</div>
			);
		}
	}

	/* ループ時のアラート */
	// モバイル
	let slidesPerViewMobileLoopAlert = '';
	// タブレット
	let slidesPerViewTabletLoopAlert = '';
	// PC
	let slidesPerViewPCLoopAlert = '';
	if (!!loop) {
		if (
			(slidesPerGroup === 'slides-per-view' &&
				innerBlocks.length / slidesPerViewMobile < 2) ||
			(slidesPerGroup === 'one-by-one' &&
				innerBlocks.length - (slidesPerViewMobile + 1) < 0 &&
				!attributes.centeredSlides) ||
			(slidesPerGroup === 'one-by-one' &&
				innerBlocks.length - (slidesPerViewMobile + 2) < 0 &&
				attributes.centeredSlides)
		) {
			slidesPerViewMobileLoopAlert = sloderPerViewLoopAlert;
		}
		if (
			(slidesPerGroup === 'slides-per-view' &&
				innerBlocks.length / slidesPerViewTablet < 2) ||
			(slidesPerGroup === 'one-by-one' &&
				innerBlocks.length - (slidesPerViewTablet + 1) < 0 &&
				!attributes.centeredSlides) ||
			(slidesPerGroup === 'one-by-one' &&
				innerBlocks.length - (slidesPerViewTablet + 2) < 0 &&
				attributes.centeredSlides)
		) {
			slidesPerViewTabletLoopAlert = sloderPerViewLoopAlert;
		}

		if (
			(slidesPerGroup === 'slides-per-view' &&
				innerBlocks.length / slidesPerViewPC < 2) ||
			(slidesPerGroup === 'one-by-one' &&
				innerBlocks.length - (slidesPerViewPC + 1) < 0 &&
				!attributes.centeredSlides) ||
			(slidesPerGroup === 'one-by-one' &&
				innerBlocks.length - (slidesPerViewPC + 2) < 0 &&
				attributes.centeredSlides)
		) {
			slidesPerViewPCLoopAlert = sloderPerViewLoopAlert;
		}
	}

	// 複数枚表示設定
	let multiItemSetting = '';

	// フェードエフェクトでない場合の設定UI
	const multiItemUI =
		effect !== 'fade' ? (
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
							'Enter divisors for the number of placed slide items for each display size.',
							'vk-blocks'
						)}
						{__(
							'If the number is not divisible, the sliding behavior will be unnatural',
							'vk-blocks'
						)}
					</p>
					{demicalPointAlert}
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
							} else if (slidesPerGroup === 'slides-per-view') {
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
						step={slidesPerGroup === 'slides-per-view' ? 1 : 0.1}
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
							} else if (slidesPerGroup === 'slides-per-view') {
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
						step={slidesPerGroup === 'slides-per-view' ? 1 : 0.1}
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
							} else if (slidesPerGroup === 'slides-per-view') {
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
						step={slidesPerGroup === 'slides-per-view' ? 1 : 0.1}
					/>
					{slidesPerViewMobileAlert}
					{slidesPerViewMobileLoopAlert}
				</BaseControl>
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
						onChange={(value) =>
							setAttributes({
								slidesPerGroup: value,
							})
						}
					/>
				</BaseControl>
				<BaseControl id={`vk_slider-slidesPerGroup`}>
					<ToggleControl
						label={__('Centering the active slide', 'vk-blocks')}
						className={'mb-1'}
						checked={centeredSlides} //eslint-disable-line camelcase
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
		) : null;

	// 複数枚表示設定が無効な場合のアラート
	const getDisabledReason = () => {
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
			{__(
				'%s is enabled, so multi-item settings cannot be configured.',
				'vk-blocks'
			).replace('%s', disabledReason)}
		</div>
	) : null;

	multiItemSetting = (
		<PanelBody
			title={__('Multi-item Display Setting', 'vk-blocks')}
			initialOpen={false}
		>
			{disabledAlert}
			{!zoomAnimation && multiItemUI}
		</PanelBody>
	);
	return multiItemSetting;
};
