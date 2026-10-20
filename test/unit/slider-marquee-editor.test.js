/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// エディタのプレビュー（edit-slider.js）で、ノードが削除されたときの等速ループ（#3053）の扱い。
// - 通常方式のスライダーからスライドを削除しても、何もしない（選択表示を付け直さない）
// - 等速ループのプレビュー中に原本のスライドを削除したら、複製を組み直す
// - スライダーブロックごと削除されたら、マーキーを片付ける（リスナー等を残さない）
//
// How the editor preview (edit-slider.js) treats removed nodes for the continuous loop (#3053):
// - removing a slide from a standard slider does nothing (no selection highlight reset)
// - removing an original slide during the marquee preview rebuilds the clones
// - removing the whole slider block cleans up its marquee (no leftover listeners etc.)

import {
	LaunchSwiperAll,
	handleRemovedNodes,
} from '../../src/blocks/slider/edit-slider';

jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

// edit-slider.js は Swiper を import するが、このテストでは使わない
// edit-slider.js imports Swiper, which these tests do not use.
jest.mock('swiper/bundle', () => jest.fn());

/**
 * エディタ上のスライダーブロックと同じ入れ子の DOM を作る。
 * Builds the same nested DOM as a slider block in the editor.
 *
 * @param {Object} attributes data-vkb-slider に入れる値 / values for data-vkb-slider.
 * @param {number} slideCount スライドの枚数 / number of slides.
 * @return {Object} ルートとスライドの並び / the root and the slide track.
 */
const buildEditorSlider = (attributes, slideCount = 3) => {
	document.body.innerHTML = `
		<div class="editor-root">
			<div class="vk_slider" data-vkb-slider='${JSON.stringify(attributes)}'>
				<div class="vk_slider_wrapper"><div><div class="block-editor-inner-blocks">
					<div class="block-editor-block-list__layout">
						${Array.from(
							{ length: slideCount },
							(_, i) =>
								`<div class="vk_slider_item${i === 1 ? ' is-selected' : ''}">slide ${i}</div>`
						).join('')}
					</div>
				</div></div></div>
			</div>
		</div>`;
	const root = document.querySelector('.vk_slider');
	return {
		editorRoot: document.querySelector('.editor-root'),
		root,
		track: root.querySelector('.block-editor-block-list__layout'),
	};
};

// 原本のスライドを1枚削除し、MutationObserver が渡すのと同じ形の記録を作る
// Removes one original slide and returns a record shaped like a MutationObserver one.
const removeSlide = (track, index) => {
	const slide = track.querySelectorAll(
		':scope > .vk_slider_item:not([data-vk-slider-marquee-clone])'
	)[index];
	slide.remove();
	return { removedNodes: [slide], target: track };
};

describe('エディタ: 削除されたノードの扱い / editor: handling removed nodes', () => {
	let animations;
	let originalRect;

	beforeEach(() => {
		// jsdom にはレイアウトと Web Animations API が無いため最小限に差し替える
		// jsdom has neither layout nor the Web Animations API, so stub both minimally.
		animations = [];
		originalRect = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function () {
			const parent = this.parentElement;
			const index = parent
				? Array.from(parent.children).indexOf(this)
				: 0;
			return { left: index * 100, right: index * 100 + 100, width: 100 };
		};
		HTMLElement.prototype.animate = function () {
			const animation = {
				playState: 'running',
				play() {
					this.playState = 'running';
				},
				pause() {
					this.playState = 'paused';
				},
				cancel() {
					this.playState = 'idle';
				},
				effect: {
					getComputedTiming: () => ({ progress: 0 }),
					setKeyframes() {},
					updateTiming() {},
				},
			};
			animations.push(animation);
			return animation;
		};
	});

	afterEach(() => {
		Element.prototype.getBoundingClientRect = originalRect;
		delete HTMLElement.prototype.animate;
		document.body.innerHTML = '';
	});

	it('通常方式ではスライドを削除しても選択表示を付け直さない / standard sliders are left alone', () => {
		const { track } = buildEditorSlider({
			editorMode: 'default',
			blockId: 'standard',
		});
		const record = removeSlide(track, 2);

		handleRemovedNodes(record);

		// 選択されていた2枚目の表示がそのまま残る。LaunchSwiper が呼ばれると、
		// 全スライドから外して先頭に付け直してしまう（レビューで見つかった退行）
		// The selected second slide keeps its highlight. Calling LaunchSwiper would strip it
		// from every slide and put it on the first one (the regression found in review).
		const slides = track.querySelectorAll('.vk_slider_item');
		expect(slides[0].classList.contains('is-selected')).toBe(false);
		expect(slides[1].classList.contains('is-selected')).toBe(true);
		expect(animations).toHaveLength(0);
	});

	it('等速ループのプレビュー中に原本を削除すると複製を組み直す / marquee preview rebuilds the clones', () => {
		const { editorRoot, track } = buildEditorSlider({
			editorMode: 'slide',
			playbackMode: 'marquee',
			blockId: 'marquee-rebuild',
		});
		LaunchSwiperAll(editorRoot);
		const cloneSelector = '[data-vk-slider-marquee-clone]';
		expect(track.querySelectorAll(cloneSelector)).toHaveLength(3);

		handleRemovedNodes(removeSlide(track, 0));

		// 原本2枚に対して複製も2枚
		// Two originals, two clones.
		expect(track.querySelectorAll(cloneSelector)).toHaveLength(2);
	});

	it('スライダーブロックごと削除するとマーキーを片付ける / removing the block cleans up the marquee', () => {
		const { editorRoot, root, track } = buildEditorSlider({
			editorMode: 'slide',
			playbackMode: 'marquee',
			blockId: 'marquee-remove',
		});
		LaunchSwiperAll(editorRoot);
		const animation = animations[animations.length - 1];
		expect(animation.playState).toBe('running');

		// ブロックごと削除（MutationObserver から見ると、親から .vk_slider が外れる）
		// Remove the whole block (to the MutationObserver, .vk_slider leaves its parent).
		root.remove();
		handleRemovedNodes({ removedNodes: [root], target: editorRoot });

		expect(animation.playState).toBe('idle');
		expect(
			track.querySelectorAll('[data-vk-slider-marquee-clone]')
		).toHaveLength(0);
		expect(root.classList.contains('is-vk-slider-marquee-active')).toBe(
			false
		);
	});
});
