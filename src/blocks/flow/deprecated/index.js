import save1_8_0 from './1.8.0/save';


const blockAttributes =  {
	heading: {
		type: 'string',
		source: 'html',
		selector: 'dt',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: 'dd',
	},
	arrowFlag: {
		type: 'string',
		default: 'vk_flow-arrow-on',
	},
	insertImage: {
		type: 'string',
		default: null, // no image by default!
	},
}

/*
// v1.8.1 画像alt属性の追加に伴う属性の追加
const blockAttributes2 = {
	...blockAttributes,
	insertImageAlt: {
		type: 'string',
		default: null,
	},
}
*/

const deprecated = [
	{
		attributes: blockAttributes,
		save: save1_8_0,
	},
];
export default deprecated;
