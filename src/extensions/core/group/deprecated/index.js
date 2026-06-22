import save1_95_2 from './1.95.2/save';

/*
// 将来 deprecated を追加する際の予約 snapshot 用メモ。
// extensions/core/group は core/group ブロックに属性を inject する構造のため、
// 通常ブロックのような連番 blockAttributesN を持たない。
// 以降、style.js で inject された属性が追加された場合は、ここに type/default を控えておく。
//
// v1.114.2 スクロール対応機能の追加に伴う属性の追加
//   scrollable: { type: 'boolean' },
//   scrollBreakpoint: { type: 'string', default: 'group-scrollable-mobile' },
//   showScrollMessage: { type: 'boolean', default: false },
//   scrollMessageText: { type: 'string', default: __( 'You can scroll', 'vk-blocks' ) },
//   scrollIconLeft: { type: 'string', default: 'fa-solid fa-caret-left' },
//   scrollIconRight: { type: 'string', default: 'fa-solid fa-caret-right' },
//   iconOutputLeft: { type: 'boolean', default: true },
//   iconOutputRight: { type: 'boolean', default: true },
// v1.115.0 折返し・テーブル表示モードの追加に伴う属性の追加
//   textNoWrap: { type: 'boolean', default: true },
//   tableMode: { type: 'boolean', default: false },
// v1.116.0 スクロール自動無効化フラグの追加に伴う属性の追加
//   scrollableAutoDisabled: { type: 'boolean', default: false },
// v1.117.0 横スクロールのスクロールバー設定追加（PR #2874）に伴う属性の追加
//   scrollbarVisible: { type: 'boolean', default: true },
//   scrollbarColor: { type: 'string', default: '' },
//   scrollbarTrackColor: { type: 'string', default: '' },
// v1.117.0 投稿リンク機能の追加に伴う属性の追加
//   linkToPost: { type: 'boolean', default: false },
*/

const deprecated = [
	{
		targetVersion: 5,
		attributes: {
			color: { type: 'string', default: '' },
			linkUrl: { type: 'string', default: '' },
			linkTarget: { type: 'string', default: '' },
			tagName: { type: 'string', default: 'div' },
		},
		migrate: (attributes) => {
			return {
				...attributes,
				relAttribute: attributes.relAttribute || '',
				linkDescription: attributes.linkDescription || '',
			};
		},
		save: save1_95_2
	},
];

export default deprecated;
