import {
	RichText,
	InspectorControls,
	MediaUpload,
	InnerBlocks,
	useBlockProps,
} from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import {
	ButtonGroup,
	PanelBody,
	Button,
	SelectControl,
	BaseControl,
	ToggleControl,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { AdvancedColorPalette } from '@vkblocks/components/advanced-color-palette';

export default function BalloonEdit(props) {
	const { attributes, setAttributes } = props;
	const {
		content,
		balloonName,
		balloonType,
		balloonBorder,
		balloonImageBorder,
		balloonBorderColor,
		balloonBgColor,
		balloonAlign,
		IconImage,
		balloonImageType,
		balloonAnimation,
	} = attributes;
	const [blockMeta, setBlockMeta] = useState(null);

	useEffect(() => {
		apiFetch({
			path: '/vk-blocks/v1/block-meta/balloon/',
			method: 'GET',
			parse: true,
		}).then((result) => {
			setBlockMeta(result);
		});
	}, []);

	let defautIconButtons;
	if (blockMeta && blockMeta.default_icons) {
		defautIconButtons = Object.keys(blockMeta.default_icons).map(
			(index) => {
				const defaultIcon = blockMeta.default_icons[index];

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
								className={
									'button button-large components-button'
								}
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
			}
		);
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
					{__(' Image Border', 'vk-blocks')}
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
					<ButtonGroup className="mb-3">
						<Button
							isSmall
							isPrimary={balloonAlign === 'position-left'}
							isSecondary={balloonAlign !== 'position-left'}
							onClick={() =>
								setAttributes({ balloonAlign: 'position-left' })
							}
						>
							{__('Left', 'vk-blocks')}
						</Button>
						<Button
							isSmall
							isPrimary={balloonAlign === 'position-right'}
							isSecondary={balloonAlign !== 'position-right'}
							onClick={() =>
								setAttributes({
									balloonAlign: 'position-right',
								})
							}
						>
							{__('Right', 'vk-blocks')}
						</Button>
					</ButtonGroup>

					<p className={'mb-1 block-prop-title'}>
						{__('Type', 'vk-blocks')}
					</p>
					<p className={'mb-1'}>
						{__('Please select the type of balloon.', 'vk-blocks')}{' '}
					</p>
					<ButtonGroup className="mb-3">
						<Button
							isSmall
							isPrimary={balloonType === 'type-speech'}
							isSecondary={balloonType !== 'type-speech'}
							onClick={() =>
								setAttributes({ balloonType: 'type-speech' })
							}
						>
							{__('Speech', 'vk-blocks')}
						</Button>
						<Button
							isSmall
							isPrimary={balloonType === 'type-think'}
							isSecondary={balloonType !== 'type-think'}
							onClick={() =>
								setAttributes({ balloonType: 'type-think' })
							}
						>
							{__('Thinking', 'vk-blocks')}
						</Button>
					</ButtonGroup>

					<p className={'mb-1 block-prop-title'}>
						{__('Image Style', 'vk-blocks')}
					</p>
					<ButtonGroup className="mb-3">
						<Button
							isSmall
							isPrimary={balloonImageType === 'normal'}
							isSecondary={balloonImageType !== 'normal'}
							onClick={() =>
								setAttributes({ balloonImageType: 'normal' })
							}
						>
							{__('Normal', 'vk-blocks')}
						</Button>
						<Button
							isSmall
							isPrimary={balloonImageType === 'rounded'}
							isSecondary={balloonImageType !== 'rounded'}
							onClick={() =>
								setAttributes({ balloonImageType: 'rounded' })
							}
						>
							{__('Rounded', 'vk-blocks')}
						</Button>
						<Button
							isSmall
							isPrimary={balloonImageType === 'circle'}
							isSecondary={balloonImageType !== 'circle'}
							onClick={() =>
								setAttributes({ balloonImageType: 'circle' })
							}
						>
							{__('Circle', 'vk-blocks')}
						</Button>
					</ButtonGroup>

					{BorderSetting}

					<p className={'mb-1 block-prop-title'}>
						{__('Background color of speech balloon', 'vk-blocks')}
					</p>
					<AdvancedColorPalette
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
				<div className={`vk_balloon_icon`}>
					<MediaUpload
						onSelect={(value) =>
							setAttributes({ IconImage: value.sizes.full.url })
						}
						type="image"
						className={`vk_balloon_icon_image vk_balloon_icon_image-type-${balloonImageType} ${iconImageBorderClass}`}
						value={IconImage}
						render={({ open }) => (
							<Button
								onClick={open}
								className={
									IconImage
										? 'image-button'
										: 'button button-large'
								}
							>
								{!IconImage ? (
									__('Select image', 'vk-blocks')
								) : (
									<img
										className={`vk_balloon_icon_image vk_balloon_icon_image-type-${balloonImageType} ${iconImageBorderClass}`}
										style={iconImageColorStyle}
										src={IconImage}
										alt={__('Upload image', 'vk-blocks')}
									/>
								)}
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
