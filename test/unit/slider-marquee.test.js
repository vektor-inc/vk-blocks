/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// スライダーの「等速ループ（マーキー）」（#3053）の単体テスト。
// - marquee.js の純粋な計算・複製スライドの加工・停止/一時停止の状態管理
// - save の出力（等速ループのときだけ新しいキー・クラス・CSS 変数・停止ボタンを出す）
// - view.js が等速ループでは Swiper を初期化せず marquee.js に任せること
//
// Unit tests for the slider's "Continuous loop" (marquee) mode (#3053):
// - marquee.js's pure calculations, clone preparation and pause / temporary-pause state
// - the save output (new keys, class, CSS variables and the pause button only in marquee mode)
// - view.js handing marquee sliders to marquee.js instead of initializing Swiper

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vkBlocksSliderMarquee } from '../../src/blocks/slider/marquee';
import save from '../../src/blocks/slider/save';

// 翻訳関数はそのまま文字列を返すようにモックする
// Mock the translation function to return the source string as-is.
jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

// save が依存する block-editor のコンポーネントを最小実装に差し替える。
// 等速ループでは style（CSS 変数）も出すため、className と style をそのまま渡す。
// Replace the block-editor pieces save depends on with minimal stand-ins. Marquee mode also
// emits a style (CSS variables), so className and style are both passed through.
jest.mock('@wordpress/block-editor', () => {
	const Content = () => <div data-testid="inner" />;
	return {
		InnerBlocks: { Content },
		useBlockProps: {
			save: ({ className, style }) => ({
				className: className?.trim(),
				style,
			}),
		},
	};
});

const getDom = (markup) => new DOMParser().parseFromString(markup, 'text/html');

// スライダーの基本属性（block.json の既定値相当）
// Base slider attributes (equivalent to block.json's defaults).
const baseAttributes = {
	blockId: 'test',
	pagination: 'bullets',
	navigationPosition: 'mobile-bottom',
	autoPlay: true,
	autoPlayStop: true,
	autoPlayDelay: 2500,
	pauseButton: false,
	loop: true,
	effect: 'slide',
	speed: 500,
	direction: 'rtl',
	slidesPerViewMobile: 1,
	slidesPerViewTablet: 2,
	slidesPerViewPC: 3.5,
	slidesPerGroup: 'one-by-one',
	centeredSlides: false,
	zoomAnimation: false,
	zoomInitialScale: 1,
	zoomFinalScale: 1.25,
	playbackMode: 'default',
	marqueeSpeed: 60,
};

const renderSave = (attributes) =>
	getDom(renderToStaticMarkup(save({ attributes })));

describe('marquee.js の計算 / marquee.js calculations', () => {
	it('等速ループの判定 / detects marquee mode', () => {
		expect(
			vkBlocksSliderMarquee.isMarqueeMode({ playbackMode: 'marquee' })
		).toBe(true);
		expect(
			vkBlocksSliderMarquee.isMarqueeMode({ playbackMode: 'default' })
		).toBe(false);
		// 属性追加前に保存されたブロック（キーが無い）は通常方式
		// Blocks saved before the attribute existed (no key) are the standard mode.
		expect(vkBlocksSliderMarquee.isMarqueeMode({})).toBe(false);
		expect(vkBlocksSliderMarquee.isMarqueeMode(undefined)).toBe(false);
	});

	it('流れる速さを既定値・範囲内に正規化する / normalizes the flow speed', () => {
		expect(vkBlocksSliderMarquee.normalizeSpeed(120)).toBe(120);
		expect(vkBlocksSliderMarquee.normalizeSpeed('85')).toBe(85);
		// 不正な値は既定値（60）
		// Invalid values fall back to the default (60).
		expect(vkBlocksSliderMarquee.normalizeSpeed(undefined)).toBe(60);
		expect(vkBlocksSliderMarquee.normalizeSpeed('abc')).toBe(60);
		expect(vkBlocksSliderMarquee.normalizeSpeed(0)).toBe(60);
		// 範囲外は 10〜300 に収める
		// Out-of-range values are clamped to 10–300.
		expect(vkBlocksSliderMarquee.normalizeSpeed(3)).toBe(10);
		expect(vkBlocksSliderMarquee.normalizeSpeed(1000)).toBe(300);
	});

	it('表示幅を埋める複製の組数を求める / computes how many clone sets fill the view', () => {
		// 1組が表示幅以上なら1組で足りる
		// One set is enough when a set is at least as wide as the view.
		expect(vkBlocksSliderMarquee.getCloneSetCount(900, 1800)).toBe(1);
		expect(vkBlocksSliderMarquee.getCloneSetCount(900, 900)).toBe(1);
		// スライドが少なく1組が短いときは、表示幅を埋めるだけ複製する
		// With few slides (a short set), enough sets are cloned to fill the view.
		expect(vkBlocksSliderMarquee.getCloneSetCount(900, 600)).toBe(2);
		expect(vkBlocksSliderMarquee.getCloneSetCount(900, 250)).toBe(4);
		// 測れないときも最低1組
		// At least one set even when nothing can be measured.
		expect(vkBlocksSliderMarquee.getCloneSetCount(0, 0)).toBe(1);
	});

	it('1周の時間は距離÷速さで、表示幅に依存しない / one lap takes distance / speed', () => {
		expect(vkBlocksSliderMarquee.getDurationMs(1800, 60)).toBe(30000);
		expect(vkBlocksSliderMarquee.getDurationMs(600, 120)).toBe(5000);
	});

	it('画面幅ごとの表示枚数を CSS 変数にする / turns the slides per view into CSS variables', () => {
		expect(
			vkBlocksSliderMarquee.getSlidesPerViewStyle({
				slidesPerViewMobile: 1,
				slidesPerViewTablet: 2,
				slidesPerViewPC: 3.5,
			})
		).toEqual({
			'--vk-slider-marquee-spv-mobile': '1',
			'--vk-slider-marquee-spv-tablet': '2',
			'--vk-slider-marquee-spv-pc': '3.5',
		});
		// 不正な値は出力せず CSS 側のフォールバックに任せる
		// Invalid values are left out so the CSS fallback applies.
		expect(
			vkBlocksSliderMarquee.getSlidesPerViewStyle({
				slidesPerViewMobile: 2,
				slidesPerViewTablet: undefined,
				slidesPerViewPC: 0,
			})
		).toEqual({ '--vk-slider-marquee-spv-mobile': '2' });
	});
});

describe('複製スライドの加工 / clone preparation', () => {
	const buildSlide = () => {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = `
			<div class="vk_slider_item swiper-slide" id="slide-1">
				<a href="#a" id="link">link</a>
				<button type="button">button</button>
				<label for="choice-a">A</label>
				<input type="radio" name="choice" id="choice-a" form="contact" checked>
				<select name="pick"><option>1</option></select>
				<textarea name="memo"></textarea>
				<div tabindex="0" id="focusable">focusable</div>
				<span id="nested"><span id="deep">deep</span></span>
			</div>`;
		return wrapper.firstElementChild;
	};

	it('読み上げ・キーボード操作の対象から外し、マウスでは押せるようにする / hidden from AT and the keyboard, still clickable', () => {
		const clone = vkBlocksSliderMarquee.prepareClone(
			buildSlide().cloneNode(true)
		);

		// 複製の目印と aria-hidden
		// The clone marker and aria-hidden.
		expect(clone.hasAttribute('data-vk-slider-marquee-clone')).toBe(true);
		expect(clone.getAttribute('aria-hidden')).toBe('true');
		// inert はクリックもできなくなるため使わない
		// inert is not used because it would also block clicks.
		expect(clone.hasAttribute('inert')).toBe(false);
		expect(clone.querySelector('[inert]')).toBeNull();

		// 子孫を含めて id を取り除く
		// ids are removed, descendants included.
		expect(clone.hasAttribute('id')).toBe(false);
		expect(clone.querySelector('[id]')).toBeNull();

		// リンク・ボタン・フォーム部品・tabindex 付きの要素は Tab で移動しない
		// Links, buttons, form controls and tabindex elements are skipped by Tab.
		['a', 'button', 'input', 'select', 'textarea', '[tabindex]'].forEach(
			(selector) => {
				clone.querySelectorAll(selector).forEach((element) => {
					expect(element.getAttribute('tabindex')).toBe('-1');
				});
			}
		);
	});

	it('原本のフォーム部品の状態を変えない / does not affect the original form controls', () => {
		const clone = vkBlocksSliderMarquee.prepareClone(
			buildSlide().cloneNode(true)
		);
		// name が重なると radio の選択が原本と連動するため外す
		// A shared name would tie the radio selection to the original, so it is removed.
		expect(clone.querySelector('[name]')).toBeNull();
		// label の for / 部品の form は id 参照なので外す
		// label's for and a control's form refer to ids, so they are removed.
		expect(clone.querySelector('label').hasAttribute('for')).toBe(false);
		expect(clone.querySelector('input').hasAttribute('form')).toBe(false);
	});
});

describe('マーキーの再生・一時停止 / playing and pausing the marquee', () => {
	// jsdom にはレイアウトと Web Animations API が無いため、どちらも最小限に差し替える。
	// 位置はトラック内の並び順 × 100px とし、1周の距離が「原本の枚数 × 100px」になるようにする。
	// jsdom has neither layout nor the Web Animations API, so both are stubbed minimally.
	// Each child is placed at (index × 100px) so one lap equals (original count × 100px).
	let animations;
	let originalRect;
	// スライド1枚の幅（px）。0 にすると「表示幅が 0（非表示の親の中など）」を再現できる
	// One slide's width (px). Setting it to 0 reproduces a zero-width view (e.g. a hidden parent).
	let slideWidth;

	beforeEach(() => {
		animations = [];
		slideWidth = 100;
		originalRect = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function () {
			const parent = this.parentElement;
			const index = parent
				? Array.from(parent.children).indexOf(this)
				: 0;
			return {
				left: index * slideWidth,
				width: slideWidth,
				top: 0,
				height: 100,
			};
		};
		HTMLElement.prototype.animate = function (keyframes, timing) {
			const animation = {
				keyframes,
				timing,
				playState: 'running',
				currentTime: 0,
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
					setKeyframes(next) {
						animation.keyframes = next;
					},
					updateTiming(next) {
						animation.timing = { ...animation.timing, ...next };
					},
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

	const buildSlider = (slideCount = 3) => {
		document.body.innerHTML = `
			<div class="vk_slider vk_slider--marquee">
				<div class="swiper-wrapper">
					${Array.from(
						{ length: slideCount },
						(_, i) =>
							`<div class="vk_slider_item swiper-slide"><a href="#s${i}">slide ${i}</a></div>`
					).join('')}
				</div>
				<button type="button" class="swiper-pause-button" aria-label="Pause slideshow" data-label-pause="Pause slideshow" data-label-play="Play slideshow"></button>
			</div>`;
		const root = document.querySelector('.vk_slider');
		return {
			root,
			track: root.querySelector('.swiper-wrapper'),
			button: root.querySelector('.swiper-pause-button'),
		};
	};

	it('複製を足して、1周の距離・速さどおりに流し始める / clones slides and starts at the given speed', () => {
		const { root, track } = buildSlider(3);
		const controller = vkBlocksSliderMarquee.setup({
			root,
			track,
			speed: 100,
		});

		expect(controller.isRunning()).toBe(true);
		// 原本3枚 + 複製1組（3枚）
		// 3 originals + one clone set (3 slides).
		expect(track.children).toHaveLength(6);
		expect(
			track.querySelectorAll('[data-vk-slider-marquee-clone]')
		).toHaveLength(3);
		// 1周 300px を 100px/秒 → 3秒、右から左へ
		// One 300px lap at 100px/s → 3s, right to left.
		const [animation] = animations;
		expect(animation.timing.duration).toBe(3000);
		expect(animation.timing.iterations).toBe(Infinity);
		expect(animation.timing.easing).toBe('linear');
		expect(animation.keyframes[1].transform).toBe(
			'translate3d(-300px, 0, 0)'
		);
		expect(root.classList.contains('is-vk-slider-marquee-active')).toBe(
			true
		);

		// 後片付けで複製・クラスが消える
		// Cleaning up removes the clones and classes.
		controller.destroy();
		expect(track.children).toHaveLength(3);
		expect(root.classList.contains('is-vk-slider-marquee-active')).toBe(
			false
		);
	});

	it('左から右では逆向きに流れる / flows the other way for left to right', () => {
		const { root, track } = buildSlider(3);
		vkBlocksSliderMarquee.setup({ root, track, direction: 'ltr' });
		expect(animations[0].keyframes[0].transform).toBe(
			'translate3d(-300px, 0, 0)'
		);
		expect(animations[0].keyframes[1].transform).toBe(
			'translate3d(0, 0, 0)'
		);
	});

	it('停止ボタンで止めて再開し、表示とラベルを切り替える / the button pauses and resumes', () => {
		const { root, track, button } = buildSlider(3);
		const controller = vkBlocksSliderMarquee.setup({
			root,
			track,
			pauseButton: button,
		});

		expect(button.classList.contains('is-paused')).toBe(false);
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');

		button.click();
		expect(controller.isRunning()).toBe(false);
		expect(button.classList.contains('is-paused')).toBe(true);
		expect(button.getAttribute('aria-label')).toBe('Play slideshow');

		button.click();
		expect(controller.isRunning()).toBe(true);
		expect(button.classList.contains('is-paused')).toBe(false);
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
	});

	it('ホバー・フォーカス中は一時停止するが、ボタンの表示は変えない / hover and focus pause without touching the button', () => {
		const { root, track, button } = buildSlider(3);
		const controller = vkBlocksSliderMarquee.setup({
			root,
			track,
			pauseButton: button,
		});

		// マウスが乗っている間だけ止まる
		// Paused only while the mouse is over it.
		const enter = new Event('pointerenter');
		enter.pointerType = 'mouse';
		track.dispatchEvent(enter);
		expect(controller.isRunning()).toBe(false);
		expect(button.classList.contains('is-paused')).toBe(false);
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
		const leave = new Event('pointerleave');
		leave.pointerType = 'mouse';
		track.dispatchEvent(leave);
		expect(controller.isRunning()).toBe(true);

		// タッチでは止めない（離れたイベントが来ず止まったままになるのを防ぐ）
		// Touch does not pause (it may never get a leave event and stay paused).
		const touch = new Event('pointerenter');
		touch.pointerType = 'touch';
		track.dispatchEvent(touch);
		expect(controller.isRunning()).toBe(true);

		// スライド内にフォーカスがある間だけ止まる
		// Paused only while focus is inside the slides.
		const link = track.querySelector('a');
		link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		expect(controller.isRunning()).toBe(false);
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
		link.dispatchEvent(
			new FocusEvent('focusout', { bubbles: true, relatedTarget: null })
		);
		expect(controller.isRunning()).toBe(true);
	});

	it('ボタンで止めた後はホバーが外れても止まったまま / stays paused by the button after hover ends', () => {
		const { root, track, button } = buildSlider(3);
		const controller = vkBlocksSliderMarquee.setup({
			root,
			track,
			pauseButton: button,
		});
		button.click();
		const enter = new Event('pointerenter');
		enter.pointerType = 'mouse';
		track.dispatchEvent(enter);
		const leave = new Event('pointerleave');
		leave.pointerType = 'mouse';
		track.dispatchEvent(leave);
		expect(controller.isRunning()).toBe(false);
	});

	it('「視差効果を減らす」では止まった状態で始まり、再生ボタンで流れ始める / starts paused for reduced motion', () => {
		const { root, track, button } = buildSlider(3);
		const controller = vkBlocksSliderMarquee.setup({
			root,
			track,
			pauseButton: button,
			prefersReducedMotion: true,
		});

		// 停止状態（animation: none ではなく一時停止）で、ボタンは「再生」
		// Paused (not animation: none), with the button offering "Play".
		expect(animations).toHaveLength(1);
		expect(controller.isRunning()).toBe(false);
		expect(button.classList.contains('is-paused')).toBe(true);
		expect(button.getAttribute('aria-label')).toBe('Play slideshow');

		button.click();
		expect(controller.isRunning()).toBe(true);
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
	});

	it('Web Animations API が無い環境では何もしない / does nothing without the Web Animations API', () => {
		delete HTMLElement.prototype.animate;
		const { root, track } = buildSlider(3);
		expect(vkBlocksSliderMarquee.setup({ root, track })).toBeNull();
		expect(track.children).toHaveLength(3);
	});

	it('幅が 0 になったらアニメーションを捨て、幅が戻ったら作り直す / drops the animation at zero width and recreates it', () => {
		// ResizeObserver の最小実装（コールバックをテストから呼べるようにする）
		// A minimal ResizeObserver whose callback the test can fire.
		let resizeCallback = null;
		window.ResizeObserver = class {
			constructor(callback) {
				resizeCallback = callback;
			}
			observe() {}
			disconnect() {}
		};
		try {
			const { root, track } = buildSlider(3);
			let width = 900;
			Object.defineProperty(root, 'clientWidth', { get: () => width });
			const controller = vkBlocksSliderMarquee.setup({ root, track });
			const cloneSelector = '[data-vk-slider-marquee-clone]';
			expect(animations[0].playState).toBe('running');
			// 表示幅 900px・1組 300px なので、複製は3組（9枚）
			// A 900px view and a 300px set need three clone sets (nine slides).
			expect(track.querySelectorAll(cloneSelector)).toHaveLength(9);

			// 非表示になり幅が 0 → 1周の距離が測れない。複製もアニメーションも残さない
			// Hidden, width 0 → the lap cannot be measured. No clones or animation remain.
			width = 0;
			slideWidth = 0;
			resizeCallback();
			expect(animations[0].playState).toBe('idle');
			expect(controller.isRunning()).toBe(false);
			expect(track.querySelectorAll(cloneSelector)).toHaveLength(0);

			// 幅が戻ると作り直して流れ始める
			// When the width comes back, it is recreated and flows again.
			width = 900;
			slideWidth = 100;
			resizeCallback();
			expect(animations).toHaveLength(2);
			expect(animations[1].playState).toBe('running');
			expect(track.querySelectorAll(cloneSelector)).toHaveLength(9);
		} finally {
			delete window.ResizeObserver;
		}
	});

	it('停止ボタンで止めていたら、幅が戻っても止まったまま / stays paused by the button after the width returns', () => {
		let resizeCallback = null;
		window.ResizeObserver = class {
			constructor(callback) {
				resizeCallback = callback;
			}
			observe() {}
			disconnect() {}
		};
		try {
			const { root, track, button } = buildSlider(3);
			let width = 900;
			Object.defineProperty(root, 'clientWidth', { get: () => width });
			vkBlocksSliderMarquee.setup({ root, track, pauseButton: button });
			button.click();

			width = 0;
			slideWidth = 0;
			resizeCallback();
			width = 900;
			slideWidth = 100;
			resizeCallback();

			expect(animations).toHaveLength(2);
			expect(animations[1].playState).toBe('paused');
			expect(button.classList.contains('is-paused')).toBe(true);
			expect(button.getAttribute('aria-label')).toBe('Play slideshow');

			// 再生ボタンで流れ始める
			// The play button starts it.
			button.click();
			expect(animations[1].playState).toBe('running');
		} finally {
			delete window.ResizeObserver;
		}
	});

	it('原本が無くなったらアニメーションを捨てる / drops the animation when no originals remain', () => {
		const { root, track } = buildSlider(3);
		const controller = vkBlocksSliderMarquee.setup({ root, track });
		expect(animations[0].playState).toBe('running');

		Array.from(track.children).forEach((element) => element.remove());
		controller.relayout();

		expect(animations[0].playState).toBe('idle');
		expect(controller.isRunning()).toBe(false);
	});

	describe('ブレークポイントをまたいだときの組み直し / rebuilding across breakpoints', () => {
		// コンテナ幅は 900px のまま変えず、CSS が決める表示枚数（--vk-slider-marquee-spv）だけを
		// 変えて window の resize を送る（固定幅・max-width のコンテナで画面幅だけ変わった状況）
		// Keep the container at 900px and change only the CSS-resolved slides per view
		// (--vk-slider-marquee-spv), then fire a window resize (a fixed-width or max-width
		// container while only the viewport changes).
		const setupFixedWidth = (slidesPerView) => {
			const { root, track } = buildSlider(3);
			Object.defineProperty(root, 'clientWidth', { value: 900 });
			root.style.setProperty('--vk-slider-marquee-spv', slidesPerView);
			const controller = vkBlocksSliderMarquee.setup({ root, track });
			const slideWidth = () =>
				track.style.getPropertyValue('--vk-slider-marquee-slide-width');
			const firstClone = () =>
				track.querySelector('[data-vk-slider-marquee-clone]');
			return { root, track, controller, slideWidth, firstClone };
		};

		it('幅が変わらず表示枚数だけ変わったら組み直す / rebuilds when only the slides per view changes', () => {
			const { root, slideWidth } = setupFixedWidth('3');
			expect(slideWidth()).toBe('300px');

			root.style.setProperty('--vk-slider-marquee-spv', '2');
			window.dispatchEvent(new Event('resize'));

			expect(slideWidth()).toBe('450px');
		});

		it('表示枚数が変わらない resize では組み直さない / ignores resizes that keep the slides per view', () => {
			const { slideWidth, firstClone } = setupFixedWidth('3');
			const cloneBefore = firstClone();

			// スマホのアドレスバーの伸び縮みなど、表示枚数が変わらない resize
			// A resize that keeps the slides per view (e.g. a mobile address bar showing / hiding).
			window.dispatchEvent(new Event('resize'));
			window.dispatchEvent(new Event('resize'));

			// 複製が作り直されていない（同じ要素のまま）
			// The clones were not rebuilt (still the same element).
			expect(firstClone()).toBe(cloneBefore);
			expect(cloneBefore.isConnected).toBe(true);
			expect(slideWidth()).toBe('300px');
		});

		it('destroy() で resize のリスナーが外れる / destroy() removes the resize listener', () => {
			const removeSpy = jest.spyOn(window, 'removeEventListener');
			try {
				const { root, controller, slideWidth } = setupFixedWidth('3');
				controller.destroy();

				expect(removeSpy).toHaveBeenCalledWith(
					'resize',
					expect.any(Function)
				);
				// 外れたので、表示枚数が変わっても組み直さない（スライド幅の値は消えたまま）
				// With it removed, a change in slides per view no longer rebuilds (the slide
				// width stays cleared).
				root.style.setProperty('--vk-slider-marquee-spv', '2');
				window.dispatchEvent(new Event('resize'));
				expect(slideWidth()).toBe('');
			} finally {
				removeSpy.mockRestore();
			}
		});
	});

	it('destroy() で後片付けが済む / destroy() cleans everything up', () => {
		// ResizeObserver は jsdom に無いため、observe / disconnect を記録する最小実装を置く
		// jsdom has no ResizeObserver, so install a minimal one that records observe / disconnect.
		const observers = [];
		window.ResizeObserver = class {
			constructor(callback) {
				this.callback = callback;
				this.observe = jest.fn();
				this.disconnect = jest.fn();
				observers.push(this);
			}
		};
		try {
			const { root, track, button } = buildSlider(3);
			// jsdom は幅を持たないため、表示幅を与えてスライド幅の CSS 変数が入るようにする
			// jsdom has no layout width; give one so the slide-width CSS variable gets set.
			Object.defineProperty(root, 'clientWidth', { value: 900 });
			const controller = vkBlocksSliderMarquee.setup({
				root,
				track,
				pauseButton: button,
			});
			const [animation] = animations;
			expect(observers).toHaveLength(1);
			expect(observers[0].observe).toHaveBeenCalledWith(root);
			expect(
				track.style.getPropertyValue('--vk-slider-marquee-slide-width')
			).not.toBe('');

			const removeSpy = jest.spyOn(root, 'removeEventListener');
			controller.destroy();

			// アニメーション・ResizeObserver・複製・CSS 変数・クラスが消える
			// The animation, ResizeObserver, clones, CSS variable and class are gone.
			expect(animation.playState).toBe('idle');
			expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
			expect(
				track.querySelectorAll('[data-vk-slider-marquee-clone]')
			).toHaveLength(0);
			expect(
				track.style.getPropertyValue('--vk-slider-marquee-slide-width')
			).toBe('');
			expect(root.classList.contains('is-vk-slider-marquee-active')).toBe(
				false
			);

			// リスナーも外れている: ボタン・ホバー・フォーカス・スクロールに反応しない
			// Listeners are gone too: no reaction to the button, hover, focus or scroll.
			button.click();
			expect(button.classList.contains('is-paused')).toBe(false);
			expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
			const enter = new Event('pointerenter');
			enter.pointerType = 'mouse';
			track.dispatchEvent(enter);
			track
				.querySelector('a')
				.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
			expect(animation.playState).toBe('idle');
			// スクロールの監視も外れている（jsdom はスクロール位置を持たないため呼び出しで確かめる）
			// The scroll listener is removed too (jsdom keeps no scroll position, so check the call).
			expect(removeSpy).toHaveBeenCalledWith(
				'scroll',
				expect.any(Function)
			);
		} finally {
			delete window.ResizeObserver;
		}
	});
});

describe('フォーカスしたスライドを見せる時刻 / time that reveals a focused slide', () => {
	it('右から左: 距離の割合がそのまま時刻の割合になる / right to left', () => {
		// 1周 900px のうち 300px 進んだ時刻で、先頭から 300px のスライドが左端に来る
		// After 300px of a 900px lap, the slide 300px from the start is at the left edge.
		expect(
			vkBlocksSliderMarquee.getRevealTimeRatio(300, 900, false)
		).toBeCloseTo(300 / 900);
		expect(vkBlocksSliderMarquee.getRevealTimeRatio(0, 900, false)).toBe(0);
	});

	it('左から右: 1周の残りの割合になる / left to right', () => {
		expect(
			vkBlocksSliderMarquee.getRevealTimeRatio(300, 900, true)
		).toBeCloseTo(600 / 900);
		// 先頭のスライドは 1周の終わり＝始まり（0）
		// The first slide sits at the end of the lap, i.e. its start (0).
		expect(vkBlocksSliderMarquee.getRevealTimeRatio(0, 900, true)).toBe(0);
	});

	it('範囲外の距離は 1周の範囲に収め、測れないときは 0 / wraps into one lap', () => {
		expect(
			vkBlocksSliderMarquee.getRevealTimeRatio(1200, 900, false)
		).toBeCloseTo(300 / 900);
		expect(
			vkBlocksSliderMarquee.getRevealTimeRatio(-300, 900, false)
		).toBeCloseTo(600 / 900);
		expect(vkBlocksSliderMarquee.getRevealTimeRatio(100, 0, false)).toBe(0);
	});

	it('計算した時刻で、スライドが実際に左端へ来る / the slide really reaches the left edge', () => {
		// 右から左・左から右それぞれ、キーフレームの移動量（線形）に時刻を当てはめて確かめる
		// For both directions, apply the time to the (linear) keyframe translation.
		const lap = 1200;
		const offset = 450;
		const translationAt = (ratio, reverse) =>
			reverse ? -lap + lap * ratio : -lap * ratio;
		[false, true].forEach((reverse) => {
			const ratio = vkBlocksSliderMarquee.getRevealTimeRatio(
				offset,
				lap,
				reverse
			);
			expect(translationAt(ratio, reverse)).toBeCloseTo(-offset);
		});
	});
});

describe('save の出力 / save output', () => {
	it('通常方式では新しいキー・クラス・CSS 変数を一切出さない / the standard mode emits nothing new', () => {
		const dom = renderSave({ ...baseAttributes, playbackMode: 'default' });
		const slider = dom.querySelector('.vk_slider');
		const sliderData = JSON.parse(slider.getAttribute('data-vkb-slider'));

		// 既存の保存済み投稿と同じ出力になる（キーが増えるとブロック検証で不一致になる）
		// Identical to existing saved posts (an extra key would fail block validation).
		expect(sliderData).not.toHaveProperty('playbackMode');
		expect(sliderData).not.toHaveProperty('marqueeSpeed');
		expect(slider.classList.contains('vk_slider--marquee')).toBe(false);
		expect(slider.hasAttribute('style')).toBe(false);
		// 停止ボタンは従来どおり autoPlay && pauseButton のときだけ
		// The pause button is still gated on autoPlay && pauseButton as before.
		expect(dom.querySelector('.swiper-pause-button')).toBeNull();
		expect(dom.querySelector('.swiper-button-next')).not.toBeNull();
		expect(dom.querySelector('.swiper-pagination')).not.toBeNull();
	});

	it('属性追加前に保存されたブロック（キーなし）も通常方式として出力が変わらない / blocks saved before the attributes existed are unchanged', () => {
		const { playbackMode, marqueeSpeed, ...legacyAttributes } =
			baseAttributes;
		const legacy = renderSave(legacyAttributes);
		const current = renderSave(baseAttributes);
		expect(legacy.body.innerHTML).toBe(current.body.innerHTML);
		// 分割代入した値は使わないため、存在だけ確認しておく
		// The destructured values are unused; just confirm they existed.
		expect(playbackMode).toBe('default');
		expect(marqueeSpeed).toBe(60);
	});

	it('等速ループでは新しいキー・目印・表示枚数・停止ボタンを出し、矢印とページネーションは出さない / marquee mode output', () => {
		const dom = renderSave({
			...baseAttributes,
			playbackMode: 'marquee',
			marqueeSpeed: 90,
			// 保存値が OFF でも停止ボタンは出す
			// The pause button is output even with these saved as off.
			autoPlay: false,
			pauseButton: false,
		});
		const slider = dom.querySelector('.vk_slider');
		const sliderData = JSON.parse(slider.getAttribute('data-vkb-slider'));

		expect(sliderData.playbackMode).toBe('marquee');
		expect(sliderData.marqueeSpeed).toBe(90);
		expect(slider.classList.contains('vk_slider--marquee')).toBe(true);
		const style = slider.getAttribute('style');
		expect(style).toContain('--vk-slider-marquee-spv-mobile:1');
		expect(style).toContain('--vk-slider-marquee-spv-tablet:2');
		expect(style).toContain('--vk-slider-marquee-spv-pc:3.5');

		const button = dom.querySelector('.swiper-pause-button');
		expect(button).not.toBeNull();
		// 停止ボタンはルート直下（view.js が :scope > で探すため）
		// The pause button is a direct child of the root (view.js looks it up with :scope >).
		expect(button.parentElement).toBe(slider);
		expect(dom.querySelector('.swiper-button-next')).toBeNull();
		expect(dom.querySelector('.swiper-button-prev')).toBeNull();
		expect(dom.querySelector('.swiper-pagination')).toBeNull();
		// 保存値の pauseButton は書き換えない
		// The saved pauseButton value is left untouched.
		expect(sliderData.pauseButton).toBe(false);
	});
});

describe('view.js の分岐 / view.js branching', () => {
	// view.js を実際に読み込み、window の load リスナーだけを呼ぶ（slider-view-actual-count.test.js と同じ方法）
	// Load view.js for real and call only its window load listener (same approach as
	// slider-view-actual-count.test.js).
	const runViewJs = () => {
		const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
		jest.resetModules();
		require('../../src/blocks/slider/view.js');
		const loadCall = addEventListenerSpy.mock.calls.find(
			([type]) => type === 'load'
		);
		addEventListenerSpy.mockRestore();
		const [, listener] = loadCall;
		listener();
		window.removeEventListener('load', listener);
	};

	afterEach(() => {
		delete global.Swiper;
		delete global.vkBlocksSliderMarquee;
		document.body.innerHTML = '';
	});

	it('等速ループは Swiper を初期化せず marquee.js に渡す / marquee sliders skip Swiper', () => {
		const attrs = {
			...baseAttributes,
			playbackMode: 'marquee',
			marqueeSpeed: 75,
			direction: 'ltr',
		};
		document.body.innerHTML = `
			<div data-vkb-slider='${JSON.stringify(attrs)}' class="swiper vk_slider vk_slider_test vk_slider--marquee">
				<div class="swiper-wrapper"><div class="swiper-slide"></div><div class="swiper-slide"></div></div>
				<button type="button" class="swiper-pause-button"></button>
			</div>`;
		global.Swiper = jest.fn(() => ({}));
		// gulp で連結されたときと同じく、グローバルの vkBlocksSliderMarquee として渡す
		// Expose it as the global vkBlocksSliderMarquee, as when concatenated by gulp.
		const setupSpy = jest.fn();
		global.vkBlocksSliderMarquee = {
			...vkBlocksSliderMarquee,
			setup: setupSpy,
		};

		runViewJs();

		expect(global.Swiper).not.toHaveBeenCalled();
		expect(setupSpy).toHaveBeenCalledTimes(1);
		const [options] = setupSpy.mock.calls[0];
		expect(options.root).toBe(document.querySelector('.vk_slider'));
		expect(options.track).toBe(document.querySelector('.swiper-wrapper'));
		expect(options.pauseButton).toBe(
			document.querySelector('.swiper-pause-button')
		);
		expect(options.speed).toBe(75);
		expect(options.direction).toBe('ltr');
	});

	it('通常方式は従来どおり Swiper を初期化する / standard sliders still use Swiper', () => {
		document.body.innerHTML = `
			<div data-vkb-slider='${JSON.stringify(baseAttributes)}' class="swiper vk_slider vk_slider_test">
				<div class="swiper-wrapper"><div class="swiper-slide"></div><div class="swiper-slide"></div></div>
			</div>`;
		global.Swiper = jest.fn(() => ({}));
		const setupSpy = jest.fn();
		global.vkBlocksSliderMarquee = {
			...vkBlocksSliderMarquee,
			setup: setupSpy,
		};

		runViewJs();

		expect(global.Swiper).toHaveBeenCalledTimes(1);
		expect(setupSpy).not.toHaveBeenCalled();
	});
});
