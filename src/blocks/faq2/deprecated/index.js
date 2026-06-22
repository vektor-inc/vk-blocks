import save1_3_9 from './1.3.9/save';
import save1_76_2 from './1.76.2/save';
const blockAttributes = {
	heading: {
		type: 'string',
		source: 'html',
		selector: 'dt',
	},
	content: {
		type: 'string',
	},
};

/*
// v1.60.0 質問・回答の表示切替の追加に伴う属性の追加
const blockAttributes2 = {
	...blockAttributes,
	showContent: {
		type: 'string',
		default: 'default',
	},
}
*/

const deprecated = [
	{
		attributes: blockAttributes,
		save: save1_76_2,
	},
	{
		attributes: blockAttributes,
		save: save1_3_9,
	}
];
export default deprecated;
