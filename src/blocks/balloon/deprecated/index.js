import save1_20_5 from './1.20.5/save';
import save1_20_7 from './1.20.7/save';

const blockAttributes = {
	content: {
		source: 'html',
		selector: 'p',
	},
	balloonName: {
		source: 'html',
		selector: 'figcaption',
	},
	balloonType: {
		type: 'string',
		default: 'type-serif',
	},
	balloonBgColor: {
		type: 'string',
	},
	balloonAlign: {
		type: 'string',
		default: 'position-left',
	},
	IconImage: {
		type: 'string',
		default: null, // no image by default!
	},
};

const blockAttributes2 = {
	...blockAttributes,
	balloonImageType: {
		type: 'string',
		default: 'normal',
	},
}

const blockAttributes3 = {
	...blockAttributes2,
	balloonImageType: {
		type: 'string',
		default: 'normal', // no image by default!
	},
	balloonAnimation: {
		type: 'string',
		default: 'none', // no image by default!
	},
}

const blockAttributes4 = {
	...blockAttributes3,
	balloonImageType: {
		type: 'string',
		default: 'normal', // no image by default!
	},
	balloonAnimation: {
		type: 'string',
		default: 'none', // no image by default!
	},
	balloonBorder: {
		type: 'boolean',
		default: false,
	},
	balloonImageBorder: {
		type: 'boolean',
		default: false,
	},
	balloonBorderWidth: {
		type: 'string',
		default: 'thin',
	},
	balloonBorderColor: {
		type: 'string',
		default: null,
	},
	// balloonTypeのdefaultがtype-serifからtype-speechにver 0.56.0で変更された調整
	balloonType: {
		type: 'string',
		default: 'type-speech',
	},
}

const blockAttributes5 = {
	...blockAttributes4,
	balloonBorderColor: {
		type: 'string',
		default: "#cccccc",
	},
	balloonBgColor: {
		type: 'string',
		default: "#f5f5f5",
	},
}

/* 次回対応おねがいします
const blockAttributes6 = {
	...blockAttributes5,
	"balloonFullWidth": {
		"type": "boolean",
		"default": false
	},
}
*/

const deprecated = [
	{
		attributes: blockAttributes5,
		save: save1_20_7,
	},
	{
		attributes: blockAttributes5,
		save: save1_20_5,
	},
];
export default deprecated;
