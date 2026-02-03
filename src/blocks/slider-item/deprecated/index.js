/* eslint camelcase: 0 */
import save1_115_2 from './1.115.2/save';
import save1_115_1 from './1.115.1/save';
import save1_115_0 from './1.115.0/save';
import save1_9_2 from './1.9.2/save';
import save1_22_1 from './1.22.1/save';
import save1_27_7 from './1.27.7/save';
import save1_34_1 from './1.34.1/save';
import save1_73_0 from './1.73.0/save';
import save1_76_0 from './1.76.0/save';
import save1_94_0 from './1.94.0/save';
const migrateLegacyPadding = (attributes) => {
	const { padding_left_and_right, style } = attributes;
	const spacingPadding = style?.spacing?.padding;
	if (
		padding_left_and_right === undefined ||
		spacingPadding?.left !== undefined ||
		spacingPadding?.right !== undefined
	) {
		return attributes;
	}

	// Legacy mapping: '0'/'...-none' = no padding + content width,
	// '1' keeps existing behavior, '2' forces no padding but keeps full width.
	const isNoPadding =
		padding_left_and_right === '0' ||
		padding_left_and_right === 'vk_slider_item-paddingLR-none';

	let paddingValue;
	if (isNoPadding) {
		paddingValue = '0';
	} else if (padding_left_and_right === '1') {
		paddingValue = undefined;
	} else if (padding_left_and_right === '2') {
		paddingValue = '0';
	}

	const nextAttributes = {
		...attributes,
		contentWidth: isNoPadding,
	};

	if (paddingValue === undefined) {
		return nextAttributes;
	}

	return {
		...nextAttributes,
		style: {
			...style,
			spacing: {
				...style?.spacing,
				padding: {
					...style?.spacing?.padding,
					left: paddingValue,
					right: paddingValue,
				},
			},
		},
	};
};

const blockAttributes = {
	style: {
		type: 'object',
	},
	verticalAlignment: {
		type: 'string',
		default: 'center',
	},
	bgColor: {
		type: 'string',
		default: '#ffffff',
	},
	bgImage: {
		type: 'string',
		default: null,
	},
	bgImageTablet: {
		type: 'string',
		default: null,
	},
	bgImageMobile: {
		type: 'string',
		default: null,
	},
	opacity: {
		type: 'number',
		default: 0.5,
	},
	bgSize: {
		type: 'string',
		default: 'repeat',
	},
	padding_left_and_right: {
		type: 'string',
		default: '0',
	},
	padding_top_and_bottom: {
		type: 'string',
		default: '1',
	},
	clientId: {
		type: 'string',
		default: null,
	},
};

const blockAttributes2 = {
	...blockAttributes,
	col_xs: {
		type: 'number',
		default: 1,
	},
	col_sm: {
		type: 'number',
		default: 1,
	},
	col_md: {
		type: 'number',
		default: 1,
	},
	col_lg: {
		type: 'number',
		default: 1,
	},
	col_xl: {
		type: 'number',
		default: 1,
	},
}
const blockAttributes3 = {
	...blockAttributes,
	clientId: {
		type: 'string',
	},
}

const blockAttributes4 = {
	...blockAttributes3,
	bgColor: {
		type: 'string',
	},
}


// 1.34.1 で blockId を追加
const blockAttributes5 = {
	...blockAttributes4,
	blockId: {
		type: 'string',
	},
}

// 1.73.0 で linkUrl, linkTarget を追加
const blockAttributes6 = {
	...blockAttributes5,
	linkUrl: {
		type: 'string'
	},
	linkTarget: {
		type: 'string',
		default: ''
	},
}

// 1.73.0 で linkUrl, linkTarget を追加
const blockAttributes7 = {
	...blockAttributes6,
	relAttribute: {
		type: 'string',
		default: ''
	},
	linkDescription: {
		type: 'string',
		default: ''
	},
}

// 1.115.1 から width を追加
const blockAttributes8 = {
	...blockAttributes7,
	contentWidth: {
		type: 'boolean',
		default: false,
	},
}

export default [
	{
		attributes: blockAttributes8,
		save: save1_115_2,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes7,
		save: save1_115_1,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes7,
		save: save1_115_0,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes7,
		save: save1_94_0,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes6,
		save: save1_76_0,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes5,
		save: save1_73_0,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes4,
		save: save1_34_1,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes4,
		save: save1_27_7,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes3,
		save: save1_22_1,
		migrate: migrateLegacyPadding,
	},
	{
		attributes: blockAttributes,
		save: save1_9_2,
		migrate: migrateLegacyPadding,
	},
];
