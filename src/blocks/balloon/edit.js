import {
	RichText,
	InspectorControls,
	MediaUpload,
	InnerBlocks,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	PanelBody,
	Button,
	SelectControl,
	BaseControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { AdvancedColorPalette } from '@vkblocks/components/advanced-color-palette';
/*globals vk_blocks_params */

// eslint-disable-next-line camelcase,no-undef
const defaultAvatar =
	typeof img_path !== 'undefined' && !!img_path.full_path // eslint-disable-line no-undef
		? img_path.full_path // eslint-disable-line no-undef
		: '';

export default function BalloonEdit(props) {
	const { attributes, setAttributes } = props;
	const {
		content,
		balloonName,
		balloonType,
		balloonBorder,
		balloonFullWidth,
		balloonIconDisplay,
		balloonImageBorder,
		balloonBorderColor,
		balloonBgColor,
		balloonAlign,
		IconImage,
		balloonImageType,
		balloonAnimation,
	} = attributes;

	const blockMeta = vk_blocks_params.balloon_meta_lists;
	let defautIconButtons;
	if (blockMeta) {
		defautIconButtons = Object.keys(blockMeta).map((index) => {
			const defaultIcon = blockMeta[index];

			let contentIcon = '';

			if (defaultIcon.src) {
				contentIcon = (
					<div key={index}>
						<Button
							onClick={() => {
								setAttributes({
									IconImage: defaultIcon.src,
								});
								setAttributes({
									balloonName: defaultIcon.name,
								});
							}}
							className={'button button-large components-button'}
						>
							<img
								className={'icon-image'}
								src={defaultIcon.src}
								alt={defaultIcon.name}
							/>
						</Button>
					</div>
				);
			}
			return contentIcon;
		});
	}

	if ('type-serif' === balloonType) {
		setAttributes({ balloonType: 'type-speech' });
	}

	if (balloonImageType === null || balloonImageType === undefined) {
		setAttributes({ balloonImageType: 'normal' });
	}

	if (balloonAnimation === null || balloonAnimation === undefined) {
		setAttributes({ balloonAnimation: 'none' });
	}

	if (balloonBorder === null || balloonBorder === undefined) {
		setAttributes({ balloonBorder: false });
	}

	if (balloonImageBorder === null || balloonImageBorder === undefined) {
		setAttributes({ balloonImageBorder: false });
	}

	let BorderSetting;
	let contentBorderClass = '';
	let iconImageBorderClass = '';
	let contentBackgroundClass = '';
	let iconImageColorStyle = {};
	let contentColorStyle = {};
	let triangleBorderColorBeforeClass = '';
	let triangleBorderColorAfterClass = '';
	let triangleBorderColorBeforeStyle = {};
	let triangleBorderColorAfterStyle = {};

	// 後方互換 (カスタムカラー選択時 インラインcssをcontentとiconに分ける)
	const colorStyle = {};
	if (colorStyle) {
		contentColorStyle = colorStyle;
		iconImageColorStyle = colorStyle;
	}
	if ('background' in iconImageColorStyle) {
		delete iconImageColorStyle.background;
	}

	//吹き出しに枠線を追加オン
	if (balloonBorder === true) {
		BorderSetting = (
			<BaseControl>
				<p className={'mb-1 block-prop-title'}>
					{__('Border', 'vk-blocks')}{' '}
				</p>
				<ToggleControl
					label={__('Add border to balloon', 'vk-blocks')}
					checked={balloonBorder}
					onChange={(checked) =>
						setAttributes({ balloonBorder: checked })
					}
				/>

				<p className={'mb-1 block-prop-title'}>
					{__('Image Border', 'vk-blocks')}
				</p>
				<ToggleControl
					label={__('Add border to image', 'vk-blocks')}
					className={'mb-1'}
					checked={balloonImageBorder}
					onChange={(checked) =>
						setAttributes({ balloonImageBorder: checked })
					}
				/>
				<p>
					{__(
						'* You can change border width on Setting > VK Blocks',
						'vk-blocks'
					)}{' '}
				</p>

				<p className={'mb-1 block-prop-title'}>
					{__('Border color of speech balloon', 'vk-blocks')}
				</p>
				<AdvancedColorPalette
					enableAlpha={false}
					schema={'balloonBorderColor'}
					{...props}
				/>
			</BaseControl>
		);

		contentBorderClass += 'vk_balloon_content-border-true';

		if (balloonImageBorder === true) {
			iconImageBorderClass += 'vk_balloon_icon_image-border-true';
		} else {
			iconImageBorderClass = '';
		}

		//iconImageBorderClass
		//contentBorderClass
		if (balloonBorderColor !== undefined) {
			iconImageBorderClass += ` has-text-color`;
			contentBorderClass += ` has-text-color`;
			//カラーパレットの時
			if (!isHexColor(balloonBorderColor)) {
				iconImageBorderClass += ` has-${balloonBorderColor}-color`;
				contentBorderClass += ` has-${balloonBorderColor}-color`;
			}
		}

		//contentColorStyle
		//iconImageColorStyle
		//カスタム*パレット
		if (isHexColor(balloonBorderColor) && !isHexColor(balloonBgColor)) {
			contentColorStyle = {
				borderColor: `${balloonBorderColor}`,
			};
			iconImageColorStyle = {
				borderColor: `${balloonBorderColor}`,
			};
			//パレット*カスタム
		} else if (
			!isHexColor(balloonBorderColor) &&
			isHexColor(balloonBgColor)
		) {
			contentColorStyle = {
				background: `${balloonBgColor}`,
			};
			//カスタム*カスタム
		} else if (
			isHexColor(balloonBorderColor) &&
			isHexColor(balloonBgColor)
		) {
			contentColorStyle = {
				borderColor: `${balloonBorderColor}`,
				background: `${balloonBgColor}`,
			};
			iconImageColorStyle = {
				borderColor: `${balloonBorderColor}`,
			};
		}

		// 吹き出しの配置 左
		if (balloonAlign === 'position-left') {
			// 吹き出しの矢印 Class
			// カラーパレットの時
			// 吹き出しの時
			if ('type-speech' === balloonType) {
				if (balloonBgColor !== undefined) {
					triangleBorderColorBeforeClass += ` has-text-color`;
					if (!isHexColor(balloonBgColor)) {
						triangleBorderColorBeforeClass += ` has-${balloonBgColor}-color`;
					}
				}
				if (balloonBorderColor !== undefined) {
					triangleBorderColorAfterClass += ` has-text-color`;
					if (!isHexColor(balloonBorderColor)) {
						triangleBorderColorAfterClass += ` has-${balloonBorderColor}-color`;
					}
				}
				//もくもくの時
			} else if ('type-think' === balloonType) {
				if (balloonBorderColor !== undefined) {
					triangleBorderColorBeforeClass += ` has-text-color`;
					if (!isHexColor(balloonBorderColor)) {
						triangleBorderColorBeforeClass += ` has-${balloonBorderColor}-color`;
					}
				}
				if (balloonBorderColor !== undefined) {
					triangleBorderColorAfterClass += ` has-text-color`;
					if (!isHexColor(balloonBorderColor)) {
						triangleBorderColorAfterClass += ` has-${balloonBorderColor}-color`;
					}
				}
			}

			//吹き出しの矢印 Style
			//カスタムカラーの時
			if (isHexColor(balloonBorderColor)) {
				triangleBorderColorAfterStyle = {
					borderColor: `transparent transparent transparent ${balloonBgColor}`,
				};
			}
			if (isHexColor(balloonBgColor)) {
				triangleBorderColorBeforeStyle = {
					borderColor: `transparent ${balloonBgColor} transparent transparent`,
				};
			}

			// 吹き出しの配置 右
		} else if (balloonAlign === 'position-right') {
			// 吹き出しの時
			// カラーパレットの時
			if ('type-speech' === balloonType) {
				if (balloonBgColor !== undefined) {
					triangleBorderColorBeforeClass += ` has-text-color`;
					if (!isHexColor(balloonBgColor)) {
						triangleBorderColorBeforeClass += ` has-${balloonBgColor}-color`;
					}
				}
				if (balloonBorderColor !== undefined) {
					triangleBorderColorAfterClass += ` has-text-color`;
					if (!isHexColor(balloonBorderColor)) {
						triangleBorderColorAfterClass += ` has-${balloonBorderColor}-color`;
					}
				}
				// もくもくの時
				// カラーパレットの時
			} else if ('type-think' === balloonType) {
				if (balloonBorderColor !== undefined) {
					triangleBorderColorBeforeClass += ` has-text-color`;
					triangleBorderColorAfterClass += ` has-text-color`;
					if (!isHexColor(balloonBorderColor)) {
						triangleBorderColorBeforeClass += ` has-${balloonBorderColor}-color`;
						triangleBorderColorAfterClass += ` has-${balloonBorderColor}-color`;
					}
				}
			}

			//吹き出しの矢印 Style
			//カスタムカラーの時
			if (isHexColor(balloonBorderColor)) {
				triangleBorderColorAfterStyle = {
					borderColor: `transparent ${balloonBorderColor} transparent transparent`,
				};
			}
			if (isHexColor(balloonBgColor)) {
				triangleBorderColorBeforeStyle = {
					borderColor: `transparent transparent transparent ${balloonBgColor}`,
				};
			}
		}

		//吹き出しに枠線を追加オフ
	} else {
		BorderSetting = (
			<BaseControl>
				<p className={'mb-1 block-prop-title'}>
					{__('Border', 'vk-blocks')}
				</p>
				<ToggleControl
					label={__('Add border to balloon', 'vk-blocks')}
					checked={balloonBorder}
					onChange={(checked) =>
						setAttributes({ balloonBorder: checked })
					}
				/>
			</BaseControl>
		);

		iconImageBorderClass = '';

		// 吹き出しの背景色 Style
		if (balloonBgColor !== undefined) {
			//カスタムカラーの時
			if (isHexColor(balloonBgColor)) {
				contentColorStyle = {
					background: `${balloonBgColor}`,
				};
			}
		}

		if (balloonAlign === 'position-left') {
			// 吹き出しの矢印 Class
			// カラーパレットの時
			// 吹き出しの時
			if ('type-speech' === balloonType) {
				if (balloonBgColor !== undefined) {
					triangleBorderColorBeforeClass += ` has-text-color`;
					if (!isHexColor(balloonBgColor)) {
						triangleBorderColorBeforeClass += ` has-${balloonBgColor}-color`;
					}
				}
			}

			//吹き出しの矢印 Style
			//カスタムカラーの時
			if (isHexColor(balloonBorderColor)) {
				triangleBorderColorAfterStyle = {
					borderColor: `transparent transparent transparent ${balloonBgColor}`,
				};
			}
			if (isHexColor(balloonBgColor)) {
				triangleBorderColorBeforeStyle = {
					borderColor: `transparent ${balloonBgColor} transparent transparent`,
				};
			}
		} else if (balloonAlign === 'position-right') {
			// 吹き出しの矢印 Class
			// カラーパレットの時
			// 吹き出しの時
			if ('type-speech' === balloonType) {
				if (balloonBgColor !== undefined) {
					triangleBorderColorBeforeClass += ` has-text-color`;
					if (!isHexColor(balloonBgColor)) {
						triangleBorderColorBeforeClass += ` has-${balloonBgColor}-color`;
					}
				}
			}

			//吹き出しの矢印 Style
			//カスタムカラーの時
			if (isHexColor(balloonBgColor)) {
				triangleBorderColorBeforeStyle = {
					borderColor: `transparent transparent transparent ${balloonBgColor}`,
				};
			}
		}
	}

	// 吹き出しの背景色 Class
	if (balloonBgColor !== undefined) {
		contentBackgroundClass += ` has-background-color`;
		//カラーパレットの時
		if (!isHexColor(balloonBgColor)) {
			contentBackgroundClass += ` has-${balloonBgColor}-background-color`;
		}
	}

	// 吹き出しの幅 Class
	if (!!balloonFullWidth) {
		contentBorderClass += ` vk_balloon_content_fullwidth`;
	}

	const blockProps = useBlockProps({
		className: `vk_balloon vk_balloon-${balloonAlign} vk_balloon-${balloonType} vk_balloon-animation-${balloonAnimation}`,
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Balloon setting', 'vk-blocks')}>
					<p className={'mb-1 block-prop-title'}>
						{__('Position', 'vk-blocks')}
					</p>
					<p className={'mb-1'}>
						{__(
							'Please specify the layout of the balloon.',
							'vk-blocks'
						)}{' '}
					</p>
					<ToggleGroupControl
						value={balloonAlign}
						onChange={(value) =>
							setAttributes({ balloonAlign: value })
						}
						isBlock
					>
						<ToggleGroupControlOption
							value="position-left"
							label={__('Left', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="position-right"
							label={__('Right', 'vk-blocks')}
						/>
					</ToggleGroupControl>

					<p className={'mb-1 block-prop-title'}>
						{__('Type', 'vk-blocks')}
					</p>
					<p className={'mb-1'}>
						{__('Please select the type of balloon.', 'vk-blocks')}{' '}
					</p>
					<ToggleGroupControl
						value={balloonType}
						onChange={(value) =>
							setAttributes({ balloonType: value })
						}
						isBlock
					>
						<ToggleGroupControlOption
							value="type-speech"
							label={__('Speech', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="type-think"
							label={__('Thinking', 'vk-blocks')}
						/>
					</ToggleGroupControl>

					<p className={'mb-1 block-prop-title'}>
						{__('Image Style', 'vk-blocks')}
					</p>
					<ToggleGroupControl
						value={balloonImageType}
						onChange={(value) =>
							setAttributes({ balloonImageType: value })
						}
						isBlock
					>
						<ToggleGroupControlOption
							value="normal"
							label={__('Normal', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="rounded"
							label={__('Rounded', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="circle"
							label={__('Circle', 'vk-blocks')}
						/>
					</ToggleGroupControl>

					<BaseControl>
						<p className={'mb-1 block-prop-title'}>
							{__('Width', 'vk-blocks')}
						</p>
						<ToggleControl
							label={__('100%', 'vk-blocks')}
							checked={balloonFullWidth}
							onChange={(checked) =>
								setAttributes({ balloonFullWidth: checked })
							}
						/>
					</BaseControl>

					<BaseControl>
						<p className={'mb-1 block-prop-title'}>icon display</p>
						<ToggleControl
							label={'display'}
							checked={balloonIconDisplay}
							onChange={(checked) =>
								setAttributes({ balloonIconDisplay: checked })
							}
						/>
					</BaseControl>

					{BorderSetting}

					<p className={'mb-1 block-prop-title'}>
						{__('Background color of speech balloon', 'vk-blocks')}
					</p>
					<AdvancedColorPalette
						enableAlpha={false}
						schema={'balloonBgColor'}
						{...props}
					/>
				</PanelBody>
				<PanelBody title={__('Default Icon Setting', 'vk-blocks')}>
					<div className="icon-image-list mb-2">
						{defautIconButtons}
					</div>
					<div>
						{__(
							'You can register default icons from Settings > VK Blocks in Admin.',
							'vk-blocks'
						)}
					</div>
				</PanelBody>
				<PanelBody title={__('Animation setting', 'vk-blocks')}>
					<p className={'mb-1'}>
						{__(
							'Please select the type of animation.',
							'vk-blocks'
						)}{' '}
					</p>
					<SelectControl
						value={balloonAnimation}
						onChange={(value) =>
							setAttributes({ balloonAnimation: value })
						}
						options={[
							{
								value: 'none',
								label: __('None', 'vk-blocks'),
							},
							{
								value: 'trembling',
								label: __('Trembling', 'vk-blocks'),
							},
							{
								value: 'trembling-x',
								label: __('Trembling X', 'vk-blocks'),
							},
							{
								value: 'pounding',
								label: __('Pounding', 'vk-blocks'),
							},
							{
								value: 'shaking',
								label: __('Shaking', 'vk-blocks'),
							},
						]}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				{balloonIconDisplay ||
				(balloonIconDisplay === 'undefined' && IconImage) ? (
					<div className={`vk_balloon_icon`}>
						<MediaUpload
							onSelect={(value) =>
								setAttributes({
									IconImage: value.sizes.full.url,
								})
							}
							type="image"
							className={`vk_balloon_icon_image vk_balloon_icon_image-type-${balloonImageType} ${iconImageBorderClass}`}
							value={IconImage}
							render={({ open }) => (
								<Button onClick={open} className="image-button">
									<img
										className={`vk_balloon_icon_image vk_balloon_icon_image-type-${balloonImageType} ${iconImageBorderClass}`}
										style={iconImageColorStyle}
										src={
											IconImage
												? IconImage
												: defaultAvatar
										}
										alt={__('Upload image', 'vk-blocks')}
									/>
								</Button>
							)}
						/>
						<RichText
							tagName="figcaption"
							className={'vk_balloon_icon_name'}
							onChange={(value) =>
								setAttributes({ balloonName: value })
							}
							value={balloonName}
							placeholder={__('Icon Name', 'vk-blocks')}
						/>
					</div>
				) : (
					''
				)}

				<div className={`vk_balloon_content_outer`}>
					<div
						className={`vk_balloon_content ${contentBackgroundClass} ${contentBorderClass}`}
						style={contentColorStyle}
					>
						<span
							className={`vk_balloon_content_before ${triangleBorderColorBeforeClass}`}
							style={triangleBorderColorBeforeStyle}
						></span>
						<span
							className={`vk_balloon_content_after ${triangleBorderColorAfterClass}`}
							style={triangleBorderColorAfterStyle}
						></span>
						<InnerBlocks
							templateLock={false}
							template={[['core/paragraph', { content }]]}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
