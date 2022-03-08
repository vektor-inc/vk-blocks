import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import parse from 'html-react-parser';

const renderTitle = (level, contents, tStyle, headingStyle) => {
	switch (level) {
		case 1:
			return (
				<h1 style={tStyle} className={headingStyle}>
					{contents}
				</h1>
			);
		case 2:
			return (
				<h2 style={tStyle} className={headingStyle}>
					{contents}
				</h2>
			);
		case 3:
			return (
				<h3 style={tStyle} className={headingStyle}>
					{contents}
				</h3>
			);
		case 4:
			return (
				<h4 style={tStyle} className={headingStyle}>
					{contents}
				</h4>
			);
		case 5:
			return (
				<h5 style={tStyle} className={headingStyle}>
					{contents}
				</h5>
			);
		case 6:
			return (
				<h6 style={tStyle} className={headingStyle}>
					{contents}
				</h6>
			);
	}
};

export default (props) => {
	const { attributes, setAttributes, for_ } = props;
	let {
		level,
		align,
		title,
		titleColor,
		titleSize,
		subText,
		subTextFlag,
		subTextColor,
		subTextSize,
		titleStyle,
		titleMarginBottom,
		outerMarginBottom,
		fontAwesomeIconBefore,
		fontAwesomeIconAfter,
		fontAwesomeIconColor,
	} = attributes;
	const containerClass = `vk_heading vk_heading-style-${titleStyle}`;
	let cStyle;
	let tStyle;

	//containerのマージンを切り替え
	if (outerMarginBottom) {
		cStyle = { marginBottom: outerMarginBottom + `rem` };
	}

	//titleのマージンを切り替え
	if (titleMarginBottom) {
		tStyle = {
			color: titleColor,
			fontSize: titleSize + 'rem',
			marginBottom: titleMarginBottom + 'rem',
			textAlign: align,
		};
	} else {
		tStyle = {
			color: titleColor,
			fontSize: titleSize + 'rem',
			textAlign: align,
		};
	}

	const headingStyle = `vk_heading_title vk_heading_title-style-${titleStyle}`;
	const subTextStyle = {
		color: subTextColor,
		fontSize: subTextSize + 'rem',
		textAlign: align,
	};
	const subTextClass = `vk_heading_subtext vk_heading_subtext-style-${titleStyle}`;

	let iconBefore = '';
	let iconAfter = '';
	if (fontAwesomeIconBefore) {
		//for recovering block
		fontAwesomeIconColor = fontAwesomeIconColor
			? fontAwesomeIconColor
			: '#000000';

		//add inline css
		const faIconFragmentBefore = fontAwesomeIconBefore.split('<i');
		faIconFragmentBefore[0] =
			faIconFragmentBefore[0] +
			`<i style="color:${fontAwesomeIconColor};" `;
		iconBefore = faIconFragmentBefore.join('');
	}
	if (fontAwesomeIconAfter) {
		//for recovering block
		fontAwesomeIconColor = fontAwesomeIconColor
			? fontAwesomeIconColor
			: '#000000';

		//add class and inline css
		const faIconFragmentAfter = fontAwesomeIconAfter.split('<i');
		faIconFragmentAfter[0] =
			faIconFragmentAfter[0] +
			`<i style="color:${fontAwesomeIconColor};" `;
		iconAfter = faIconFragmentAfter.join('');
	}

	if (for_ === 'edit') {
		const titleContent = (
			<>
				{parse(iconBefore)}
				<RichText
					tagName={'span'}
					value={title}
					onChange={(value) => {
						setAttributes({ title: value });
					}}
					placeholder={__('Input title…', 'vk-blocks')}
				/>
				{parse(iconAfter)}
			</>
		);

		let subtextContent;
		if (subTextFlag === 'on') {
			subtextContent = (
				<RichText
					tagName={'p'}
					value={subText}
					onChange={(value) => setAttributes({ subText: value })}
					style={subTextStyle}
					className={subTextClass}
					placeholder={__('Input sub text…', 'vk-blocks')}
				/>
			);
		}

		return (
			<div className={containerClass} style={cStyle}>
				{renderTitle(level, titleContent, tStyle, headingStyle)}
				{subtextContent}
			</div>
		);
	} else if (for_ === 'save') {
		const titleContent = (
			<>
				{parse(iconBefore)}
				<RichText.Content tagName={'span'} value={title} />
				{parse(iconAfter)}
			</>
		);

		let subtextContent;
		if (subTextFlag === 'on') {
			subtextContent = (
				<RichText.Content
					tagName={'p'}
					value={subText}
					style={subTextStyle}
					className={subTextClass}
				/>
			);
		}
		return (
			<div className={containerClass} style={cStyle}>
				{renderTitle(level, titleContent, tStyle, headingStyle)}
				{subtextContent}
			</div>
		);
	}
};
