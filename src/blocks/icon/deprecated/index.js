import save1_13_2 from './1.13.2/save';
import save1_16_1 from './1.16.1/save';

const blockAttributes = {
	faIcon: {
		type: 'string',
		default: '<i class="fas fa-user"></i>',
	},
	iconSize: {
		type: 'number',
		default: 36,
	},
	iconSizeUnit: {
		type: 'string',
		default: 'px',
	},
	iconMargin: {
		type: 'number',
		default: 22,
	},
	iconMarginUnit: {
		type: 'string',
		default: 'px',
	},
	iconRadius: {
		type: 'number',
		default: 50,
	},
	iconAlign: {
		type: 'string',
		default: 'left',
	},
	iconType: {
		type: 'string',
		default: '0'
	},
	iconColor: {
		type: 'string',
		default: 'undefined',
	},
	iconUrl: {
		type: 'string',
		default: "",
	},
	iconTarget: {
		type: 'Boolean',
		default: false,
	},
};

const blockAttributes2 = {
	...blockAttributes,
	iconColor: {
		type: 'string',
	},
	iconUrl: {
		type: 'string',
	},
}

export const deprecated = [
	{
		attributes: blockAttributes2,
		save: save1_16_1,
	},
	{
		attributes: blockAttributes,
		save: save1_13_2,
	},
];
