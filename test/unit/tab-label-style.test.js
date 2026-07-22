/* eslint-env jest */
import {
	getTabLabelStyleVars,
	getTabWrapperStyleVars,
} from '../../src/blocks/_pro/tab/tabLabelStyle';

describe('getTabLabelStyleVars', () => {
	it('属性が未設定の場合は空オブジェクトを返す', () => {
		// 引数なし
		expect(getTabLabelStyleVars()).toEqual({});
		// 全て空文字
		expect(
			getTabLabelStyleVars({
				tabLabelPaddingVertical: '',
				tabLabelPaddingHorizontal: '',
				tabLabelBorderRadiusTopLeft: '',
				tabLabelBorderRadiusTopRight: '',
			})
		).toEqual({});
	});

	it('上下パディングのみ設定した場合は該当 CSS変数のみ返す', () => {
		expect(
			getTabLabelStyleVars({ tabLabelPaddingVertical: '0.8rem' })
		).toEqual({
			'--vk-tab-label-padding-vertical': '0.8rem',
		});
	});

	it('左右パディングのみ設定した場合は該当 CSS変数のみ返す', () => {
		expect(
			getTabLabelStyleVars({ tabLabelPaddingHorizontal: '10px' })
		).toEqual({
			'--vk-tab-label-padding-horizontal': '10px',
		});
	});

	it('角丸（左上・右上）を設定した場合はそれぞれの CSS変数を返す', () => {
		expect(
			getTabLabelStyleVars({
				tabLabelBorderRadiusTopLeft: '1rem',
				tabLabelBorderRadiusTopRight: '2rem',
			})
		).toEqual({
			'--vk-tab-label-border-radius-top-left': '1rem',
			'--vk-tab-label-border-radius-top-right': '2rem',
		});
	});

	it('全ての値を設定した場合は全ての CSS変数を返す', () => {
		expect(
			getTabLabelStyleVars({
				tabLabelPaddingVertical: '0.8rem',
				tabLabelPaddingHorizontal: '0.5rem',
				tabLabelBorderRadiusTopLeft: '1rem',
				tabLabelBorderRadiusTopRight: '1rem',
			})
		).toEqual({
			'--vk-tab-label-padding-vertical': '0.8rem',
			'--vk-tab-label-padding-horizontal': '0.5rem',
			'--vk-tab-label-border-radius-top-left': '1rem',
			'--vk-tab-label-border-radius-top-right': '1rem',
		});
	});

	it('無関係な属性は無視する', () => {
		expect(
			getTabLabelStyleVars({
				blockId: 'abc',
				tabSizeSp: 'fitText',
				tabLabelPaddingVertical: '5px',
			})
		).toEqual({
			'--vk-tab-label-padding-vertical': '5px',
		});
	});
});

describe('getTabWrapperStyleVars', () => {
	it('何も設定が無い場合は空オブジェクトを返す', () => {
		expect(getTabWrapperStyleVars()).toEqual({});
		expect(getTabWrapperStyleVars({}, { hasScroll: false })).toEqual({});
	});

	it('ラベルのパディング・角丸の CSS変数を含める', () => {
		expect(
			getTabWrapperStyleVars(
				{ tabLabelPaddingVertical: '0.8rem' },
				{ hasScroll: false }
			)
		).toEqual({
			'--vk-tab-label-padding-vertical': '0.8rem',
		});
	});

	it('スクロール無効時はスクロールバー配色を出力しない', () => {
		expect(
			getTabWrapperStyleVars(
				{ scrollbarColor: '#f00', scrollbarTrackColor: '#0f0' },
				{ hasScroll: false }
			)
		).toEqual({});
	});

	it('スクロール有効かつ配色指定時のみスクロールバー用 CSS変数を出力する', () => {
		expect(
			getTabWrapperStyleVars(
				{ scrollbarColor: '#f00', scrollbarTrackColor: '#0f0' },
				{ hasScroll: true }
			)
		).toEqual({
			'--vk-scrollbar-color': '#f00',
			'--vk-scrollbar-track-color': '#0f0',
		});
	});

	it('ラベル設定とスクロールバー設定を同時にまとめる', () => {
		expect(
			getTabWrapperStyleVars(
				{
					tabLabelPaddingVertical: '0.8rem',
					tabLabelBorderRadiusTopLeft: '1rem',
					scrollbarColor: '#f00',
				},
				{ hasScroll: true }
			)
		).toEqual({
			'--vk-tab-label-padding-vertical': '0.8rem',
			'--vk-tab-label-border-radius-top-left': '1rem',
			'--vk-scrollbar-color': '#f00',
		});
	});
});
