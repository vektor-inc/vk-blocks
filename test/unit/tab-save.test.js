/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */
import { renderToStaticMarkup } from 'react-dom/server';
import save from '../../src/blocks/_pro/tab/save';

// save が依存する block-editor のコンポーネントを最小実装に差し替える
jest.mock('@wordpress/block-editor', () => {
	// jest はモックファクトリをファイル先頭（import より上）へ巻き上げるため、
	// 外部スコープの JSX/React を参照せず、ファクトリ内で React を require して生成する
	const React = require('react');
	const Content = () =>
		React.createElement('div', { 'data-testid': 'inner' });
	return {
		InnerBlocks: { Content },
		// 渡した props をそのまま返し、style をDOMに反映させる
		useBlockProps: {
			save: (props) => ({ ...props }),
		},
		RichText: {
			// 文字列を返す関数コンポーネント（React は文字列の子を許容する）
			Content: ({ value }) => value || null,
		},
	};
});

// タブブロックの基本属性（パディング・角丸は個別テストで上書きする）
const baseAttributes = {
	tabOptionJSON: JSON.stringify({
		listArray: [
			{ tabLabel: 'Tab 01', tabColor: '', blockId: 'aaa' },
			{ tabLabel: 'Tab 02', tabColor: '', blockId: 'bbb' },
		],
		tabLabelBackground: true,
		tabLabelBorderTop: false,
		tabBodyBorderTop: true,
	}),
	tabSizeSp: 'fitText',
	tabSizeTab: 'fitText',
	tabSizePc: 'fitText',
	firstActive: 0,
	blockId: 'test',
	className: '',
	tabDisplayOptionsSp: 'notSet',
	tabDisplayOptionsTab: 'notSet',
	tabDisplayOptionsPc: 'notSet',
	scrollbarVisible: true,
	scrollbarColor: '',
	scrollbarTrackColor: '',
	showScrollMessage: false,
	scrollMessageText: '',
	scrollIconLeft: '',
	scrollIconRight: '',
	iconOutputLeft: true,
	iconOutputRight: true,
	tabLabelPaddingVertical: '',
	tabLabelPaddingHorizontal: '',
	tabLabelBorderRadiusTopLeft: '',
	tabLabelBorderRadiusTopRight: '',
};

const getDom = (markup) => {
	const parser = new DOMParser();
	return parser.parseFromString(markup, 'text/html');
};

describe('tab save タブラベルのパディング・角丸出力', () => {
	it('パディング・角丸が未設定の場合は style 属性を付与しない', () => {
		const markup = renderToStaticMarkup(
			save({ attributes: { ...baseAttributes } })
		);
		const dom = getDom(markup);
		const tab = dom.querySelector('.vk_tab');
		expect(tab).not.toBeNull();
		// CSS変数のスタイルは出力されない（後方互換のため既存出力を変えない）
		expect(tab.getAttribute('style')).toBeNull();
	});

	it('パディングを設定すると CSS変数がラッパーに出力される', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					tabLabelPaddingVertical: '0.8rem',
					tabLabelPaddingHorizontal: '0.5rem',
				},
			})
		);
		const dom = getDom(markup);
		const tab = dom.querySelector('.vk_tab');
		const style = tab.getAttribute('style');
		expect(style).toContain('--vk-tab-label-padding-vertical:0.8rem');
		expect(style).toContain('--vk-tab-label-padding-horizontal:0.5rem');
	});

	it('角丸を設定すると CSS変数がラッパーに出力される', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					tabLabelBorderRadiusTopLeft: '1rem',
					tabLabelBorderRadiusTopRight: '2rem',
				},
			})
		);
		const dom = getDom(markup);
		const tab = dom.querySelector('.vk_tab');
		const style = tab.getAttribute('style');
		expect(style).toContain('--vk-tab-label-border-radius-top-left:1rem');
		expect(style).toContain('--vk-tab-label-border-radius-top-right:2rem');
	});
});
