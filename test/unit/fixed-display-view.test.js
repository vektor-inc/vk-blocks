/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */

// 固定表示ブロックのフロント用スクリプト（view.js）の単体テスト。
// Unit tests for the Fixed Display block frontend script (view.js).

const VIEW_SCRIPT_PATH = '../../src/blocks/_pro/fixed-display/view.js';
const ORIGINAL_SCROLL_Y = Object.getOwnPropertyDescriptor(window, 'scrollY');

// view.js が window に登録したリスナーと、BroadcastChannel の代役を控える。
// Keep track of the listeners view.js adds to window and of the fake BroadcastChannel instances.
let registeredListeners = [];
let broadcastChannels = [];

/**
 * save.js の出力（クラス・data 属性）に合わせた固定表示ブロックを body に追加する。
 * Append a fixed display block whose classes and data attributes match save.js.
 *
 * @param {Object}  options
 * @param {string}  options.mode                表示タイプ / display type
 * @param {string}  options.blockId             ブロック ID / block ID
 * @param {number}  options.displayAfterSeconds 表示するまでの秒数 / seconds until display
 * @param {number}  options.hideAfterSeconds    非表示にするまでの秒数 / seconds until hide
 * @param {boolean} options.dontShowAgain       ブラウザを閉じるまで再表示しない / do not show again
 * @param {boolean} options.showCloseButton     閉じるボタン / close button
 * @return {HTMLElement} 追加したブロック / the appended block
 */
function renderBlock({
	mode = 'display-hide-after-time',
	blockId = 'timed-block',
	displayAfterSeconds = 1,
	hideAfterSeconds = 5,
	dontShowAgain = true,
	showCloseButton = false,
} = {}) {
	const classes = [
		'wp-block-vk-blocks-fixed-display',
		'vk_fixed-display',
		'vk_fixed-display-position-right',
		`vk_fixed-display-${blockId}`,
	];
	const attributes = { 'data-block-id': blockId };

	// 表示タイプごとのクラス・data 属性を組み立てる
	if (mode === 'show-on-scroll') {
		attributes['data-scroll-timing'] = '100';
		attributes['data-scroll-timing-unit'] = 'px';
		classes.push('vk_fixed-display-mode-show-on-scroll');
	} else if (mode === 'always-visible') {
		classes.push('vk_fixed-display-mode-always-visible');
	} else {
		attributes['data-display-after-seconds'] = String(displayAfterSeconds);
		if (hideAfterSeconds > 0) {
			attributes['data-hide-after-seconds'] = String(hideAfterSeconds);
		}
		classes.push(
			'is-timed-display',
			'vk_fixed-display-mode-display-hide-after-time'
		);
	}
	if (dontShowAgain) {
		attributes['data-dont-show-again'] = 'true';
	}
	if (showCloseButton) {
		attributes['data-show-close-button'] = 'true';
	}

	const block = document.createElement('div');
	block.className = classes.join(' ');
	Object.keys(attributes).forEach((name) => {
		block.setAttribute(name, attributes[name]);
	});
	if (showCloseButton) {
		block.innerHTML = `<button class="vk_fixed-display-close-button" type="button" data-block-id="${blockId}"></button>`;
	}
	document.body.appendChild(block);

	return block;
}

/**
 * view.js を読み込み、即時実行関数の init() を走らせる。
 * Load view.js so that its self-invoking init() runs.
 */
function loadViewScript() {
	jest.isolateModules(() => {
		require(VIEW_SCRIPT_PATH);
	});
}

/**
 * ページ読み込みのイベントを発火する。
 * Fire the page load events.
 */
function fireDomContentLoaded() {
	window.dispatchEvent(new Event('DOMContentLoaded'));
}

function fireLoad() {
	window.dispatchEvent(new Event('load'));
}

/**
 * window.scrollY を差し替える。
 * Override window.scrollY.
 *
 * @param {number} value
 */
function setScrollY(value) {
	Object.defineProperty(window, 'scrollY', {
		configurable: true,
		value,
	});
}

/**
 * 直近に生成された BroadcastChannel の代役を返す。
 * Return the most recently created fake BroadcastChannel.
 *
 * @return {Object} 他タブ連携用チャンネル / the tab-sync channel
 */
function getChannel() {
	return broadcastChannels[broadcastChannels.length - 1];
}

describe('fixed display frontend initialization', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		window.sessionStorage.clear();
		document.body.innerHTML = '';
		delete window.vkBlocksFixedDisplayAjax;
		registeredListeners = [];
		broadcastChannels = [];

		// 前のテストで読み込んだ view.js が、次のテストのイベントに反応しないよう記録しておく
		const originalAddEventListener = window.addEventListener;
		jest.spyOn(window, 'addEventListener').mockImplementation(
			function (type, listener, options) {
				registeredListeners.push({ type, listener, options });
				return originalAddEventListener.call(
					window,
					type,
					listener,
					options
				);
			}
		);

		window.BroadcastChannel = class {
			constructor(name) {
				this.name = name;
				this.onmessage = null;
				this.postMessage = jest.fn();
				broadcastChannels.push(this);
			}
		};
	});

	afterEach(() => {
		// 追加したリスナー・タイマー・差し替えを元に戻す
		registeredListeners.forEach(({ type, listener, options }) => {
			window.removeEventListener(type, listener, options);
		});
		jest.clearAllTimers();
		jest.useRealTimers();
		jest.restoreAllMocks();
		delete window.BroadcastChannel;
		delete global.fetch;
		if (ORIGINAL_SCROLL_Y) {
			Object.defineProperty(window, 'scrollY', ORIGINAL_SCROLL_Y);
		} else {
			delete window.scrollY;
		}
	});

	describe('timed display (display-hide-after-time)', () => {
		it('keeps a timed banner visible when load fires after its display timer (slow page load)', () => {
			const block = renderBlock();
			loadViewScript();

			// 読み込みが遅い: 表示タイマーが先に発火してから load が来る
			fireDomContentLoaded();
			jest.advanceTimersByTime(1000);

			expect(block.classList.contains('is-timed-visible')).toBe(true);
			expect(
				window.sessionStorage.getItem('dont_show_again_timed-block')
			).toBe('true');
			expect(getChannel().postMessage).toHaveBeenCalledTimes(1);
			expect(getChannel().postMessage).toHaveBeenCalledWith({
				type: 'dont_show_again',
				blockId: 'timed-block',
			});

			fireLoad();

			// load 後も表示したまま（いま表示したバナーを「記録あり」と見なして消さない）
			expect(block.classList.contains('is-timed-visible')).toBe(true);
			expect(block.classList.contains('is-hidden-by-session')).toBe(
				false
			);
		});

		it('hides the banner from the start when the same session loads the page again', () => {
			// 同じセッションで再読み込み: 前回のページで表示済みの記録がある
			window.sessionStorage.setItem(
				'dont_show_again_timed-block',
				'true'
			);
			const block = renderBlock();
			loadViewScript();

			expect(block.classList.contains('is-hidden-by-session')).toBe(true);

			fireDomContentLoaded();
			fireLoad();
			jest.advanceTimersByTime(10000);

			expect(block.classList.contains('is-hidden-by-session')).toBe(true);
			expect(block.classList.contains('is-timed-visible')).toBe(false);
			expect(jest.getTimerCount()).toBe(0);
		});

		it('shows the banner as before when load fires before its display timer (fast page load)', () => {
			const block = renderBlock();
			loadViewScript();

			// 読み込みが速い: load が表示タイマーより先に来る
			fireDomContentLoaded();
			fireLoad();

			expect(block.classList.contains('is-ready-to-show')).toBe(true);
			expect(block.classList.contains('is-timed-visible')).toBe(false);

			jest.advanceTimersByTime(1000);

			expect(block.classList.contains('is-timed-visible')).toBe(true);
			expect(block.classList.contains('is-hidden-by-session')).toBe(
				false
			);
			expect(
				window.sessionStorage.getItem('dont_show_again_timed-block')
			).toBe('true');
			expect(getChannel().postMessage).toHaveBeenCalledTimes(1);

			// 非表示までの秒数が過ぎたら消える
			jest.advanceTimersByTime(5000);

			expect(block.classList.contains('is-timed-visible')).toBe(false);
			expect(block.classList.contains('is-timed-hide')).toBe(true);
		});

		it('registers only one display timer and one hide timer per block', () => {
			renderBlock({ blockId: 'first-block' });
			renderBlock({ blockId: 'second-block' });
			loadViewScript();

			// DOMContentLoaded と load の両方で初期化されても、タイマーはブロックごとに 1 本
			fireDomContentLoaded();
			fireLoad();

			expect(jest.getTimerCount()).toBe(2);

			// 表示タイマーが発火すると、非表示タイマーがブロックごとに 1 本だけ入る
			jest.advanceTimersByTime(1000);

			expect(jest.getTimerCount()).toBe(2);
		});

		it('does not show a timed banner again when load fires after its hide timer (re-display setting off)', () => {
			const block = renderBlock({ dontShowAgain: false });
			loadViewScript();

			// 表示（1 秒）→ 非表示（その 5 秒後）が済んでから load が来る
			fireDomContentLoaded();
			jest.advanceTimersByTime(6000);

			expect(block.classList.contains('is-timed-visible')).toBe(false);
			expect(block.classList.contains('is-timed-hide')).toBe(true);

			// load の分の表示タイマーが（あれば）発火する時間まで進めても、再び出ない
			fireLoad();
			jest.advanceTimersByTime(1000);

			expect(block.classList.contains('is-timed-visible')).toBe(false);
			expect(block.classList.contains('is-timed-hide')).toBe(true);

			jest.advanceTimersByTime(10000);

			expect(block.classList.contains('is-timed-visible')).toBe(false);
			expect(block.classList.contains('is-timed-hide')).toBe(true);
		});

		it('does not write the flag nor broadcast when the re-display setting is off', () => {
			const block = renderBlock({ dontShowAgain: false });
			loadViewScript();

			fireDomContentLoaded();
			fireLoad();
			jest.advanceTimersByTime(1000);

			expect(block.classList.contains('is-timed-visible')).toBe(true);
			expect(block.classList.contains('is-ready-to-show')).toBe(false);
			expect(window.sessionStorage.length).toBe(0);
			expect(getChannel().postMessage).not.toHaveBeenCalled();
		});

		it('initializes on load when DOMContentLoaded never fires (script loaded late)', () => {
			const block = renderBlock();
			loadViewScript();

			// スクリプトが DOMContentLoaded の後に読み込まれた場合は load だけが来る
			fireLoad();

			expect(block.classList.contains('is-ready-to-show')).toBe(true);
			expect(jest.getTimerCount()).toBe(1);

			jest.advanceTimersByTime(1000);

			expect(block.classList.contains('is-timed-visible')).toBe(true);
		});

		it('still initializes a block added between DOMContentLoaded and load', () => {
			const firstBlock = renderBlock({ blockId: 'first-block' });
			loadViewScript();

			fireDomContentLoaded();
			const lateBlock = renderBlock({ blockId: 'late-block' });
			fireLoad();

			// 先に初期化した分は据え置き、後から入った分は load で初期化される
			expect(jest.getTimerCount()).toBe(2);

			jest.advanceTimersByTime(1000);

			expect(firstBlock.classList.contains('is-timed-visible')).toBe(
				true
			);
			expect(lateBlock.classList.contains('is-timed-visible')).toBe(true);
		});
	});

	describe('other display types', () => {
		it('shows a show-on-scroll block after scrolling past its timing', () => {
			const block = renderBlock({ mode: 'show-on-scroll' });
			loadViewScript();

			fireDomContentLoaded();
			fireLoad();

			expect(block.classList.contains('is-ready-to-show')).toBe(true);
			expect(block.classList.contains('is-visible')).toBe(false);
			expect(jest.getTimerCount()).toBe(0);

			// data-scroll-timing（100px）を超えるまでスクロールする
			setScrollY(200);
			window.dispatchEvent(new Event('scroll'));
			jest.advanceTimersByTime(16);

			expect(block.classList.contains('is-visible')).toBe(true);
		});

		it('removes a show-on-scroll block on scroll when the flag already exists', () => {
			window.sessionStorage.setItem(
				'dont_show_again_scroll-block',
				'true'
			);
			const block = renderBlock({
				mode: 'show-on-scroll',
				blockId: 'scroll-block',
			});
			loadViewScript();

			fireDomContentLoaded();
			fireLoad();

			expect(block.classList.contains('is-hidden-by-session')).toBe(true);

			setScrollY(200);
			window.dispatchEvent(new Event('scroll'));
			jest.advanceTimersByTime(16);

			expect(document.body.contains(block)).toBe(false);
		});

		it('keeps an always-visible block ready to show without timers', () => {
			const block = renderBlock({
				mode: 'always-visible',
				blockId: 'always-block',
			});
			loadViewScript();

			fireDomContentLoaded();
			fireLoad();
			jest.advanceTimersByTime(10000);

			expect(block.classList.contains('is-ready-to-show')).toBe(true);
			expect(block.classList.contains('is-hidden-by-session')).toBe(
				false
			);
			expect(window.sessionStorage.length).toBe(0);
			expect(jest.getTimerCount()).toBe(0);
		});

		it('hides an always-visible block from the start when the flag already exists', () => {
			window.sessionStorage.setItem(
				'dont_show_again_always-block',
				'true'
			);
			const block = renderBlock({
				mode: 'always-visible',
				blockId: 'always-block',
			});
			loadViewScript();

			fireDomContentLoaded();
			fireLoad();

			expect(block.classList.contains('is-hidden-by-session')).toBe(true);
		});
	});

	describe('close button and tab sync', () => {
		it.each([
			[
				true,
				'true',
				[[{ type: 'close_button', blockId: 'close-block' }]],
			],
			[false, null, []],
		])(
			'hides the block on close click (re-display setting: %s)',
			(dontShowAgain, expectedFlag, expectedBroadcasts) => {
				const block = renderBlock({
					mode: 'always-visible',
					blockId: 'close-block',
					dontShowAgain,
					showCloseButton: true,
				});
				loadViewScript();

				fireDomContentLoaded();
				fireLoad();
				block.querySelector('.vk_fixed-display-close-button').click();

				expect(
					block.classList.contains('is-hidden-by-close-button')
				).toBe(true);
				expect(
					window.sessionStorage.getItem('close_button_close-block')
				).toBe(expectedFlag);
				expect(getChannel().postMessage.mock.calls).toEqual(
					expectedBroadcasts
				);
			}
		);

		it('reflects dont_show_again and close_button messages from other tabs', () => {
			const remembered = renderBlock({
				mode: 'always-visible',
				blockId: 'shared-block',
			});
			const forgetful = renderBlock({
				mode: 'always-visible',
				blockId: 'shared-block',
				dontShowAgain: false,
			});
			loadViewScript();
			fireDomContentLoaded();
			fireLoad();

			// 他のタブで「再表示しない」記録が付いた
			getChannel().onmessage({
				data: { type: 'dont_show_again', blockId: 'shared-block' },
			});

			expect(
				window.sessionStorage.getItem('dont_show_again_shared-block')
			).toBe('true');
			expect(remembered.classList.contains('is-hidden-by-session')).toBe(
				true
			);
			expect(remembered.classList.contains('is-ready-to-show')).toBe(
				false
			);
			expect(forgetful.classList.contains('is-hidden-by-session')).toBe(
				false
			);

			// 他のタブで閉じるボタンが押された
			getChannel().onmessage({
				data: { type: 'close_button', blockId: 'shared-block' },
			});

			expect(
				window.sessionStorage.getItem('close_button_shared-block')
			).toBe('true');
			expect(
				remembered.classList.contains('is-hidden-by-close-button')
			).toBe(true);
			expect(
				forgetful.classList.contains('is-hidden-by-close-button')
			).toBe(true);
		});
	});

	describe('server sync', () => {
		it('sends the flag written by the display timer to the server on load', () => {
			window.vkBlocksFixedDisplayAjax = {
				ajaxurl: '/wp-admin/admin-ajax.php',
				nonce: 'test-nonce',
				isLoggedIn: true,
			};
			global.fetch = jest.fn();
			renderBlock();
			loadViewScript();

			// DOMContentLoaded の時点では記録がないので送らない
			fireDomContentLoaded();

			expect(global.fetch).not.toHaveBeenCalled();

			// 表示タイマーが記録を書いたあとの load で送られる
			jest.advanceTimersByTime(1000);
			fireLoad();

			expect(global.fetch).toHaveBeenCalledTimes(1);
			const [url, init] = global.fetch.mock.calls[0];
			expect(url).toBe('/wp-admin/admin-ajax.php');
			expect(init.body.get('block_ids')).toBe('["timed-block"]');
		});
	});
});
