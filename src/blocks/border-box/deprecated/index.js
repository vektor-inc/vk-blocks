import save1_21_0 from './1.21.0/save';
import save1_29_2 from './1.29.2/save';
import save1_75_0 from './1.75.0/save';
import save1_102_2 from './1.102.2/save';

const blockAttributes = {
	heading: {
		type: 'string',
		source: 'html',
		selector: 'h4',
	},
	color: {
		type: 'string',
		default: 'red',
	},
	faIcon: {
		type: 'string',
		default: '',
	},
	bgColor: {
		type: 'string',
		default: 'transparent',
	},
	borderColor: {
		type: 'string'
	},
};

const blockAttributes2 = {
	...blockAttributes,
	color: {
		type: 'string'
	},
};

const blockAttributes3 = {
	...blockAttributes2,
	bodyAlign: {
		type: 'string'
	}	
}

/* 次回対応おねがいします
// 1.102.2 からの変更で追加したもの
const blockAttributes4 = {
	...blockAttributes3,
	anchor: {
		type: 'string',
		source: 'attribute',
		attribute: 'id',
		selector: 'h3,h4,h5,h6'
	},
	includeInToc: {
		type: 'boolean',
		default: false
	}
};
*/

const deprecated = [
	{
		attributes: blockAttributes3,
		save: save1_102_2,
	},
	{
		attributes: blockAttributes3,
		save: save1_75_0,
	},
	{
		attributes: blockAttributes2,
		save: save1_29_2,
	},
	{
		attributes: blockAttributes,
		save: save1_21_0,
	}
];
export default deprecated;
