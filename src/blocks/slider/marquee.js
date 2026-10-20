/**
 * スライダーブロック「等速ループ（マーキー）」の共通処理（#3053）。
 * Shared logic for the slider block's "Continuous loop" (marquee) mode (#3053).
 *
 * 公開画面（view.js）とエディタのプレビュー（edit-slider.js）の両方から使う。
 * Swiper は使わず、スライドを必要数だけ複製して並べ、Web Animations API で
 * 並び全体（トラック）を一定の速度で横に流し続ける。
 * Used by both the front end (view.js) and the editor preview (edit-slider.js). Instead of
 * Swiper, the slides are cloned as many times as needed and the whole track is moved
 * sideways at a constant speed with the Web Animations API.
 *
 * ⚠️ 読み込み方が2通りある:
 * - webpack（エディタ・save・テスト）: ES module として import する
 * - gulp（公開画面）: view.js の前に連結し、先頭の `export ` を取り除いたうえで
 *   グローバルの `vkBlocksSliderMarquee` として参照する（gulpfile.js の helper-js を参照）
 * そのため、このファイルが外に出す名前は `vkBlocksSliderMarquee` の1つだけにし、
 * それ以外の宣言はすべて下の即時関数の内側に閉じ込める（連結後にグローバルを汚さないため）。
 * import 文も書かない（gulp 側では解決できないため）。
 * ⚠️ This file is loaded in two ways:
 * - webpack (editor, save, tests): imported as an ES module
 * - gulp (front end): concatenated in front of view.js with the leading `export ` stripped,
 *   then referenced as the global `vkBlocksSliderMarquee` (see helper-js in gulpfile.js)
 * So the only name it exposes is `vkBlocksSliderMarquee`, and every other declaration stays
 * inside the IIFE below (so the concatenated file does not leak globals). It must not use
 * import statements either, since gulp cannot resolve them.
 */
export const vkBlocksSliderMarquee = (() => {
	// 流れる速さ（px/秒）の既定値と範囲。エディタの RangeControl もこの値を使う。
	// Default and range of the flow speed (px/s); the editor's RangeControl uses these too.
	const DEFAULT_SPEED = 60;
	const MIN_SPEED = 10;
	const MAX_SPEED = 300;

	// 複製スライドに付ける目印（エディタの MutationObserver が複製を無視するためにも使う）
	// Marker on cloned slides (also lets the editor's MutationObserver ignore them).
	const CLONE_ATTRIBUTE = 'data-vk-slider-marquee-clone';
	// マーキーが動いている間ルートに付ける目印のクラス。CSS はこのクラスに依存しない
	// （エディタでは React の再描画でルートのクラスが付け直され、消えることがあるため）。
	// Marker class on the root while the marquee runs. No CSS depends on it: in the editor,
	// React re-renders the root's classes and may drop it.
	const ROOT_ACTIVE_CLASS = 'is-vk-slider-marquee-active';
	// スライド1枚の幅（px）を入れる CSS カスタムプロパティ。style.scss と共通。
	// CSS custom property holding one slide's width in px; shared with style.scss.
	const SLIDE_WIDTH_PROPERTY = '--vk-slider-marquee-slide-width';
	// 画面幅ごとの表示枚数を CSS 側で解決した結果を読むカスタムプロパティ。style.scss と共通。
	// CSS custom property with the slides per view resolved for the viewport; shared with
	// style.scss.
	const SLIDES_PER_VIEW_PROPERTY = '--vk-slider-marquee-spv';

	// キーボード操作の対象になりうる要素（複製ではすべて tabindex="-1" にする）
	// Elements that can take keyboard focus (all get tabindex="-1" in clones).
	const FOCUSABLE_SELECTOR =
		'a[href], area[href], button, input, select, textarea, iframe, summary, audio[controls], video[controls], [contenteditable], [tabindex]';
	// name / form 属性を持ちうるフォーム部品
	// Form controls that can carry name / form attributes.
	const FORM_CONTROL_SELECTOR = 'input, select, textarea, button';

	// data-label-* が無い場合の最終フォールバック（view.js の停止ボタンと同じ原文）
	// Last-resort labels when data-label-* is missing (the same source text as view.js uses).
	const FALLBACK_LABEL_PAUSE = 'Pause slideshow';
	const FALLBACK_LABEL_PLAY = 'Play slideshow';

	/**
	 * 属性が等速ループ（マーキー）方式かどうかを判定する。
	 * Tells whether the attributes are in the continuous loop (marquee) mode.
	 *
	 * @param {Object} attributes ブロック属性（data-vkb-slider の JSON も可） / block attributes (or the data-vkb-slider JSON).
	 * @return {boolean} 等速ループなら true / true in marquee mode.
	 */
	const isMarqueeMode = (attributes) =>
		!!attributes && attributes.playbackMode === 'marquee';

	/**
	 * 流れる速さ（px/秒）を正規化する。数値でない・0以下なら既定値、範囲外は範囲内に収める。
	 * Normalizes the flow speed (px/s): non-numeric or non-positive values fall back to the
	 * default, and out-of-range values are clamped.
	 *
	 * @param {*} value 保存値 / the saved value.
	 * @return {number} 正規化した速さ（px/秒） / the normalized speed (px/s).
	 */
	const normalizeSpeed = (value) => {
		const numericValue = Number(value);
		if (!Number.isFinite(numericValue) || numericValue <= 0) {
			return DEFAULT_SPEED;
		}
		return Math.min(MAX_SPEED, Math.max(MIN_SPEED, numericValue));
	};

	/**
	 * 表示枚数を正規化する。数値でない・1未満なら 1（エディタの入力欄の下限と同じ）。
	 * Normalizes the slides per view: non-numeric or below 1 becomes 1 (the editor input's
	 * minimum).
	 *
	 * @param {*} value 保存値または CSS から読んだ値 / the saved value or the value read from CSS.
	 * @return {number} 1 以上の表示枚数（小数を含む） / slides per view, 1 or more (decimals allowed).
	 */
	const normalizeSlidesPerView = (value) => {
		const numericValue = Number(value);
		return Number.isFinite(numericValue) && numericValue >= 1
			? numericValue
			: 1;
	};

	/**
	 * 画面幅ごとの表示枚数を CSS カスタムプロパティとして返す（save / エディタで共通）。
	 * どの画面幅で何枚にするかの切り替えは style.scss のメディアクエリが行う。
	 * 不正な値は出力しない（CSS 側のフォールバックに任せる）。
	 * Returns the slides per view for each viewport as CSS custom properties (shared by save
	 * and the editor). style.scss's media queries pick the one for the current viewport.
	 * Invalid values are left out so the CSS fallback applies.
	 *
	 * @param {Object} attributes ブロック属性 / block attributes.
	 * @return {Object} style 属性に渡すオブジェクト（値は文字列） / an object for the style attribute (string values).
	 */
	const getSlidesPerViewStyle = (attributes) => {
		const style = {};
		const pairs = [
			['--vk-slider-marquee-spv-mobile', attributes.slidesPerViewMobile],
			['--vk-slider-marquee-spv-tablet', attributes.slidesPerViewTablet],
			['--vk-slider-marquee-spv-pc', attributes.slidesPerViewPC],
		];
		pairs.forEach(([property, value]) => {
			const numericValue = Number(value);
			if (Number.isFinite(numericValue) && numericValue >= 1) {
				// 数値のまま渡すと単位 px が補われる経路があるため、文字列で渡す
				// Pass a string: some paths append "px" to bare numbers.
				style[property] = String(numericValue);
			}
		});
		return style;
	};

	/**
	 * 表示範囲を埋めるのに必要な複製の組数を返す。
	 * 「原本1組 + 複製」の長さが「表示幅 + 1組分」以上あれば、どの位置で見ても隙間が出ない。
	 * Returns how many clone sets are needed to fill the view. When "the originals + the
	 * clones" is at least "the view width + one set" long, no gap shows at any position.
	 *
	 * @param {number} containerWidth 表示幅（px） / the view width (px).
	 * @param {number} setWidth       原本1組の長さ（px） / the length of one set of originals (px).
	 * @return {number} 複製の組数（1以上） / the number of clone sets (1 or more).
	 */
	const getCloneSetCount = (containerWidth, setWidth) => {
		if (!(setWidth > 0) || !(containerWidth > 0)) {
			return 1;
		}
		return Math.max(1, Math.ceil(containerWidth / setWidth));
	};

	/**
	 * 1周（原本1組分）を流すのにかかる時間（ミリ秒）を返す。
	 * Returns how long one lap (one set of originals) takes, in milliseconds.
	 *
	 * @param {number} distance 1周の距離（px） / the lap distance (px).
	 * @param {*}      speed    流れる速さ（px/秒） / the flow speed (px/s).
	 * @return {number} 1周の時間（ミリ秒） / the lap duration (ms).
	 */
	const getDurationMs = (distance, speed) =>
		(distance / normalizeSpeed(speed)) * 1000;

	/**
	 * トラックの先頭から offset px の位置にあるスライドを左端に合わせるための、
	 * 1周のうちの時刻の割合（0 以上 1 未満）を返す。
	 * 右から左: 時刻 t の移動量は -lap × t/D、左から右: -lap + lap × t/D。
	 * どちらも移動量が -offset になる時刻を求める。
	 * Returns the point within one lap (a ratio from 0 up to, not including, 1) that puts
	 * the slide at offset px from the start of the track at the left edge.
	 * Right to left: translation at time t is -lap × t/D; left to right it is
	 * -lap + lap × t/D. Each is solved for a translation of -offset.
	 *
	 * @param {number}  offset      トラックの先頭からスライドまでの距離（px） / distance from the track start to the slide (px).
	 * @param {number}  lapDistance 1周の距離（px） / the lap distance (px).
	 * @param {boolean} reverse     左から右へ流れるなら true / true when flowing left to right.
	 * @return {number} 時刻の割合（0 以上 1 未満） / the time ratio (0 ≤ ratio < 1).
	 */
	const getRevealTimeRatio = (offset, lapDistance, reverse) => {
		if (!(lapDistance > 0)) {
			return 0;
		}
		const ratio = reverse
			? (lapDistance - offset) / lapDistance
			: offset / lapDistance;
		return ((ratio % 1) + 1) % 1;
	};

	/**
	 * 複製したスライドを、読み上げ・キーボード操作の対象から外す。
	 * マウス・タップでは押せるようにするため inert は使わない。
	 * Takes a cloned slide out of screen readers and keyboard navigation. inert is not used,
	 * so the clone stays clickable and tappable.
	 *
	 * @param {Element} clone cloneNode(true) で作った複製 / a clone made with cloneNode(true).
	 * @return {Element} 加工後の複製（引数と同じ要素） / the prepared clone (the same element).
	 */
	const prepareClone = (clone) => {
		clone.setAttribute(CLONE_ATTRIBUTE, '');
		// 原本と同じ内容が繰り返し読み上げられないよう、複製まるごと読み上げ対象から外す
		// Hide the whole clone from screen readers so the same content is not read repeatedly.
		clone.setAttribute('aria-hidden', 'true');

		const elements = [clone, ...clone.querySelectorAll('*')];
		elements.forEach((element) => {
			// id はページ内で一意でなければならないため、子孫を含めて取り除く
			// ids must be unique in the page, so remove them, descendants included.
			element.removeAttribute('id');
			// label の for は id を参照する。残すと複製のラベルを押したときに
			// 原本のフォーム部品が操作されてしまうため外す
			// A label's for refers to an id; left in place, clicking the cloned label would
			// operate the original control.
			if (element.tagName === 'LABEL') {
				element.removeAttribute('for');
			}
			// aria-hidden の内側にフォーカスが入らないよう、Tab 移動の対象から外す
			// Keep focus out of the aria-hidden subtree by removing it from the Tab order.
			if (element.matches(FOCUSABLE_SELECTOR)) {
				element.setAttribute('tabindex', '-1');
			}
			if (element.matches(FORM_CONTROL_SELECTOR)) {
				// name が重なると、複製の radio を押したときに原本の選択が外れる。
				// 送信時に値が二重になるのも防ぐため、複製からは name を外す
				// A shared name would let a cloned radio uncheck the original and would
				// submit values twice, so the clone drops the name.
				element.removeAttribute('name');
				// form 属性も id 参照のため、原本のフォームに紐づかないよう外す
				// The form attribute is an id reference too; drop it so the clone is not
				// tied to that form.
				element.removeAttribute('form');
			}
		});
		return clone;
	};

	/**
	 * 要素の内容幅（padding を除いた幅）を返す。
	 * Returns an element's content width (excluding padding).
	 *
	 * @param {Element} element 対象要素 / the element.
	 * @return {number} 内容幅（px） / the content width (px).
	 */
	const getContentWidth = (element) => {
		if (!element) {
			return 0;
		}
		const view = element.ownerDocument.defaultView;
		const style = view.getComputedStyle(element);
		return (
			element.clientWidth -
			(parseFloat(style.paddingLeft) || 0) -
			(parseFloat(style.paddingRight) || 0)
		);
	};

	/**
	 * マーキーを開始する。
	 * Starts the marquee.
	 *
	 * @param {Object}   options                        設定 / options.
	 * @param {Element}  options.root                   スライダーのルート要素（.vk_slider） / the slider root (.vk_slider).
	 * @param {Element}  options.track                  スライドの並びを包む要素（公開画面は .swiper-wrapper） / the element wrapping the slides (.swiper-wrapper on the front end).
	 * @param {string}   [options.slideSelector]        原本スライドとみなす子要素のセレクタ / selector for the children treated as original slides.
	 * @param {*}        [options.speed]                流れる速さ（px/秒） / the flow speed (px/s).
	 * @param {string}   [options.direction]            'rtl'（右から左・既定）/ 'ltr'（左から右） / 'rtl' (right to left, default) or 'ltr' (left to right).
	 * @param {Element}  [options.pauseButton]          停止/再生ボタン / the pause / play button.
	 * @param {boolean}  [options.prefersReducedMotion] 「視差効果を減らす」が有効なら停止状態で始める / start paused when reduced motion is requested.
	 * @param {Function} [options.onClone]              複製ごとに呼ぶ追加の加工（エディタ用） / extra processing for each clone (for the editor).
	 * @return {Object|null} 操作用のオブジェクト。開始できない環境では null / a controller, or null where it cannot start.
	 */
	const setup = (options) => {
		const { root, track } = options;
		// Web Animations API が無い環境では何もしない（スライドは静止した横並びのまま）
		// Without the Web Animations API, do nothing (the slides stay in a still row).
		if (!root || !track || typeof track.animate !== 'function') {
			return null;
		}
		const view = root.ownerDocument.defaultView;
		const slideSelector = options.slideSelector || '*';
		const onClone =
			typeof options.onClone === 'function' ? options.onClone : null;

		let speed = normalizeSpeed(options.speed);
		let reverse = options.direction === 'ltr';
		let animation = null;
		let lastContainerWidth = -1;
		// 前回組み直したときの表示枚数（画面幅のブレークポイントをまたいだかの判定に使う）
		// Slides per view at the last rebuild (used to detect crossing a viewport breakpoint).
		let lastSlidesPerView = -1;
		// 1周の距離（px）。relayout で測る
		// The lap distance (px), measured by relayout.
		let lapDistance = 0;

		// 再生状態。userPaused は訪問者がボタンで止めたとき（と「視差効果を減らす」の初期状態）、
		// hovered / focused は一時的な停止で、ボタンの表示には反映しない
		// Play state. userPaused is set by the visitor's button (and initially by reduced
		// motion); hovered / focused are temporary pauses that never change the button.
		const state = {
			userPaused: !!options.prefersReducedMotion,
			hovered: false,
			focused: false,
		};

		root.classList.add(ROOT_ACTIVE_CLASS);

		// 原本のスライド（複製を除く）
		// The original slides (clones excluded).
		const getOriginals = () =>
			Array.from(track.children).filter(
				(element) =>
					!element.hasAttribute(CLONE_ATTRIBUTE) &&
					element.matches(slideSelector)
			);

		const removeClones = () => {
			Array.from(track.children).forEach((element) => {
				if (element.hasAttribute(CLONE_ATTRIBUTE)) {
					element.remove();
				}
			});
		};

		// 原本1組分の複製を末尾に追加し、追加した先頭要素を返す
		// Appends one set of clones and returns the first one added.
		const appendCloneSet = (originals) => {
			let firstClone = null;
			originals.forEach((original) => {
				const clone = prepareClone(original.cloneNode(true));
				if (onClone) {
					onClone(clone);
				}
				track.appendChild(clone);
				if (!firstClone) {
					firstClone = clone;
				}
			});
			return firstClone;
		};

		// 現在の状態に合わせて再生・停止を切り替える
		// Plays or pauses to match the current state.
		const syncPlayState = () => {
			if (!animation) {
				return;
			}
			const shouldRun =
				!state.userPaused && !state.hovered && !state.focused;
			if (shouldRun && animation.playState !== 'running') {
				animation.play();
			} else if (!shouldRun && animation.playState === 'running') {
				animation.pause();
			}
		};

		// 1周の距離と速さからアニメーションを作る（作成済みなら進み具合を保ったまま更新する）
		// Builds the animation from the lap distance and speed (an existing one is updated,
		// keeping its progress).
		const applyAnimation = (distance) => {
			const keyframes = [
				{ transform: 'translate3d(0, 0, 0)' },
				{ transform: `translate3d(${-distance}px, 0, 0)` },
			];
			if (reverse) {
				keyframes.reverse();
			}
			const duration = getDurationMs(distance, speed);

			if (!animation) {
				animation = track.animate(keyframes, {
					duration,
					iterations: Infinity,
					easing: 'linear',
				});
				// 「視差効果を減らす」などで止めた状態から始める場合は、最初のフレームより前に止める
				// When starting paused (reduced motion, etc.), pause before the first frame.
				syncPlayState();
				return;
			}

			// 幅や速さが変わっても、今見えている位置から続けて流れるようにする
			// Keep flowing from the current position when the width or speed changes.
			const progress = animation.effect.getComputedTiming().progress || 0;
			animation.effect.setKeyframes(keyframes);
			animation.effect.updateTiming({ duration });
			animation.currentTime = progress * duration;
			syncPlayState();
		};

		// 流すものが無い・測れないときは、アニメーションを止めて捨てる。複製を消したあとに
		// 古いキーフレームのまま動き続けると、ループの継ぎ目に空白が出るため。
		// 表示幅が戻れば ResizeObserver からの組み直しで作り直され、停止ボタンなどの
		// 状態（state）は保ったままなので、止めていた場合は止まった状態で作り直される。
		// When there is nothing to flow or it cannot be measured, cancel and drop the
		// animation: running on with stale keyframes after the clones are gone leaves a gap
		// at the loop seam. Once the width comes back, the ResizeObserver rebuild recreates
		// it; the play state (state) is kept, so a paused marquee is recreated paused.
		const discardAnimation = () => {
			removeClones();
			lapDistance = 0;
			if (animation) {
				animation.cancel();
				animation = null;
			}
		};

		// CSS のメディアクエリで決まった、今の画面幅での表示枚数を読む
		// Reads the slides per view resolved by the CSS media queries for the current viewport.
		const readSlidesPerView = () =>
			normalizeSlidesPerView(
				view
					.getComputedStyle(root)
					.getPropertyValue(SLIDES_PER_VIEW_PROPERTY)
			);

		// スライド幅・複製・アニメーションを今の表示幅で組み直す
		// Rebuilds the slide width, clones and animation for the current view width.
		const relayout = () => {
			const originals = getOriginals();
			removeClones();
			if (originals.length === 0) {
				discardAnimation();
				return;
			}

			const containerWidth = getContentWidth(track.parentElement);
			lastContainerWidth = containerWidth;
			const slidesPerView = readSlidesPerView();
			lastSlidesPerView = slidesPerView;
			// cqw が使えないブラウザ向けに、スライド幅は px でも渡す（CSS 側はこれを優先する）
			// Also pass the slide width in px for browsers without cqw (the CSS prefers it).
			if (containerWidth > 0) {
				track.style.setProperty(
					SLIDE_WIDTH_PROPERTY,
					`${containerWidth / slidesPerView}px`
				);
			}

			// まず1組だけ複製し、「原本の先頭 → 複製の先頭」の距離を1周の距離とする。
			// スライド同士の余白も含めて測れるため、原本の幅を足し合わせるより正確
			// Clone one set first and take "first original → first clone" as the lap
			// distance. It includes any gaps between slides, so it beats summing the widths.
			const firstClone = appendCloneSet(originals);
			const distance =
				firstClone.getBoundingClientRect().left -
				originals[0].getBoundingClientRect().left;
			if (!(distance > 0)) {
				discardAnimation();
				return;
			}
			lapDistance = distance;

			// 表示幅を埋めるのに足りない分の複製を追加する
			// Add the clones still needed to fill the view.
			const cloneSetCount = getCloneSetCount(containerWidth, distance);
			for (let i = 1; i < cloneSetCount; i++) {
				appendCloneSet(originals);
			}

			applyAnimation(distance);
		};

		// 停止/再生ボタン（訪問者が押したときだけ表示を切り替える）
		// The pause / play button (its look changes only when the visitor presses it).
		const pauseButton = options.pauseButton || null;
		const labelPause =
			(pauseButton && pauseButton.getAttribute('data-label-pause')) ||
			FALLBACK_LABEL_PAUSE;
		const labelPlay =
			(pauseButton && pauseButton.getAttribute('data-label-play')) ||
			FALLBACK_LABEL_PLAY;
		const updatePauseButton = () => {
			if (!pauseButton) {
				return;
			}
			pauseButton.classList.toggle('is-paused', state.userPaused);
			pauseButton.setAttribute(
				'aria-label',
				state.userPaused ? labelPlay : labelPause
			);
		};
		const onPauseButtonClick = () => {
			state.userPaused = !state.userPaused;
			updatePauseButton();
			syncPlayState();
		};

		// マウスが乗っている間は一時停止する。タッチでは pointerleave が来ないことがあり
		// 止まったままになるため、マウス操作に限る
		// Pause while the mouse is over the slides. Limited to the mouse: touch may never
		// send pointerleave and would stay paused.
		const onPointerEnter = (event) => {
			if (event.pointerType === 'mouse') {
				state.hovered = true;
				syncPlayState();
			}
		};
		const onPointerLeave = (event) => {
			if (event.pointerType === 'mouse') {
				state.hovered = false;
				syncPlayState();
			}
		};
		// フォーカスが入ったスライドが見えていなければ、そのスライドが左端に来る位置へ送る。
		// 原本のスライドは1周の範囲内にあるため、時刻の付け替えだけで必ず見える位置にできる。
		// When the slide that received focus is not fully visible, move the marquee so the
		// slide sits at the left edge. Original slides always lie within one lap, so simply
		// re-timing the animation can always bring them into view.
		const revealFocusedSlide = (target) => {
			if (!animation || !(lapDistance > 0)) {
				return;
			}
			// キーボードでのフォーカスに限る。マウスで押したときにも動かすと、押した位置と
			// 離した位置で別の要素になり、リンクのクリックが成立しなくなるため
			// Only for keyboard focus. Moving on a mouse press too would put a different
			// element under the pointer on release, so a link click would not complete.
			let isKeyboardFocus = false;
			try {
				isKeyboardFocus = target.matches(':focus-visible');
			} catch (error) {
				isKeyboardFocus = false;
			}
			if (!isKeyboardFocus) {
				return;
			}
			const slide = getOriginals().find((element) =>
				element.contains(target)
			);
			const viewport = track.parentElement;
			if (!slide || !viewport) {
				return;
			}
			const slideRect = slide.getBoundingClientRect();
			const viewportRect = viewport.getBoundingClientRect();
			if (
				slideRect.left >= viewportRect.left - 1 &&
				slideRect.right <= viewportRect.right + 1
			) {
				return;
			}
			// トラックの先頭からスライドまでの距離（移動量に左右されない並びの上の位置）
			// Distance from the start of the track to the slide (its layout position,
			// independent of the current translation).
			const offset = slideRect.left - track.getBoundingClientRect().left;
			animation.currentTime =
				getRevealTimeRatio(offset, lapDistance, reverse) *
				getDurationMs(lapDistance, speed);
		};

		// スライド内にフォーカスがある間は一時停止する（キーボード操作で読めるように）
		// Pause while focus is inside the slides (so keyboard users can read them).
		const onFocusIn = (event) => {
			state.focused = true;
			syncPlayState();
			revealFocusedSlide(event.target);
		};

		// フォーカスの移動などでブラウザがはみ出し部分を横スクロールさせると、停止ボタンまで
		// ずれて見えるため、スクロール位置を戻す（CSS の overflow: clip が効かない環境向け）
		// If the browser scrolls the clipped area sideways (e.g. to reveal a focused element),
		// even the pause button shifts, so undo the scroll (for browsers without
		// overflow: clip support in the CSS).
		const scrollContainers = [root, track.parentElement].filter(
			(element, index, list) => element && list.indexOf(element) === index
		);
		const onScroll = (event) => {
			if (event.currentTarget.scrollLeft !== 0) {
				event.currentTarget.scrollLeft = 0;
			}
		};
		const onFocusOut = (event) => {
			if (!event.relatedTarget || !track.contains(event.relatedTarget)) {
				state.focused = false;
				syncPlayState();
			}
		};

		track.addEventListener('pointerenter', onPointerEnter);
		track.addEventListener('pointerleave', onPointerLeave);
		track.addEventListener('focusin', onFocusIn);
		track.addEventListener('focusout', onFocusOut);
		scrollContainers.forEach((element) =>
			element.addEventListener('scroll', onScroll)
		);
		if (pauseButton) {
			pauseButton.addEventListener('click', onPauseButtonClick);
		}

		// 表示幅が変わったら組み直す（画面の回転・ウィンドウサイズの変更など）
		// Rebuild when the view width changes (rotation, window resize, ...).
		let resizeObserver = null;
		if (typeof view.ResizeObserver === 'function' && track.parentElement) {
			resizeObserver = new view.ResizeObserver(() => {
				const width = getContentWidth(track.parentElement);
				if (Math.abs(width - lastContainerWidth) > 0.5) {
					relayout();
				}
			});
			resizeObserver.observe(track.parentElement);
		}

		// 画面幅がブレークポイント（576px / 992px）をまたいで表示枚数だけが変わったときも組み直す。
		// 固定幅・max-width のコンテナでは幅が変わらず上の ResizeObserver が反応しないが、
		// JS が入れた px のスライド幅が CSS より優先されるため、そのままだと枚数が合わなくなる。
		// resize のたびに組み直すとスマホのアドレスバーの伸び縮みでも空回りするので、
		// 算出済みの表示枚数が前回と変わったときだけ組み直す。
		// Also rebuild when crossing a viewport breakpoint (576px / 992px) changes only the
		// slides per view. A fixed-width or max-width container keeps its width, so the
		// ResizeObserver above does not fire, yet the px slide width set by the JS overrides
		// the CSS and the count would no longer fit. Rebuilding on every resize would spin on
		// mobile address-bar show / hide, so it only rebuilds when the resolved slides per
		// view differs from last time.
		const onWindowResize = () => {
			if (readSlidesPerView() !== lastSlidesPerView) {
				relayout();
			}
		};
		view.addEventListener('resize', onWindowResize);

		updatePauseButton();
		relayout();

		return {
			// 組み直し（スライドの追加・削除の後など）
			// Rebuild (after slides are added or removed, etc.).
			relayout,
			// 速さ・向きを変える（今の位置から続けて流す）
			// Change the speed / direction (keeps flowing from the current position).
			update(nextOptions) {
				speed = normalizeSpeed(nextOptions.speed);
				reverse = nextOptions.direction === 'ltr';
				relayout();
			},
			// 今流れているかどうか（テスト・確認用）
			// Whether it is flowing right now (for tests and checks).
			isRunning() {
				return !!animation && animation.playState === 'running';
			},
			// 後片付け（エディタでプレビューをやめたときなど）
			// Clean up (e.g. when the editor leaves the preview).
			destroy() {
				if (resizeObserver) {
					resizeObserver.disconnect();
				}
				view.removeEventListener('resize', onWindowResize);
				track.removeEventListener('pointerenter', onPointerEnter);
				track.removeEventListener('pointerleave', onPointerLeave);
				track.removeEventListener('focusin', onFocusIn);
				track.removeEventListener('focusout', onFocusOut);
				scrollContainers.forEach((element) =>
					element.removeEventListener('scroll', onScroll)
				);
				if (pauseButton) {
					pauseButton.removeEventListener(
						'click',
						onPauseButtonClick
					);
				}
				if (animation) {
					animation.cancel();
					animation = null;
				}
				removeClones();
				track.style.removeProperty(SLIDE_WIDTH_PROPERTY);
				root.classList.remove(ROOT_ACTIVE_CLASS);
			},
		};
	};

	return {
		DEFAULT_SPEED,
		MIN_SPEED,
		MAX_SPEED,
		CLONE_ATTRIBUTE,
		isMarqueeMode,
		normalizeSpeed,
		normalizeSlidesPerView,
		getSlidesPerViewStyle,
		getCloneSetCount,
		getDurationMs,
		getRevealTimeRatio,
		prepareClone,
		setup,
	};
})();
