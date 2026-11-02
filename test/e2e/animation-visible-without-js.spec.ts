import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Browser, Locator, Page } from '@playwright/test';
import { registerPostCleanup } from './utils/post-cleanup';

/**
 * アニメーション（Pro）：JavaScript が使えない環境と「視差効果を減らす」設定での表示（#3262）。
 * Animation (Pro): display without JavaScript and with "Reduce motion" (#3262).
 *
 * 【背景】
 *   登場型の効果（フェードイン・スライド）は、CSS が最初に透明・ずらした位置にし、
 *   view.js が IntersectionObserver で画面に入ったことを検知して vk_animation-active を
 *   付けると表示される。このため JavaScript が動かない環境では、ずっと透明のまま
 *   表示されなかった。また「視差効果を減らす」設定を見ておらず、通常設定と同じ動きをしていた。
 *
 * 【Background】
 *   The entrance effects (fade-in / slide) start transparent and offset in CSS, and view.js
 *   shows them by adding vk_animation-active once an IntersectionObserver reports them in the
 *   viewport. Without JavaScript they therefore stayed transparent forever. The block also
 *   ignored "Reduce motion" and moved exactly as it does with the default setting.
 *
 * 【修正後の仕様】
 *   - JavaScript なし: 登場型は最初から最終状態（不透明・位置ずれなし）で表示される。
 *     ループ型（trembling など）は今まで通り動く
 *   - 視差効果を減らす: 登場型は動かず最初から表示され、ループ型 6 効果はすべて止まる
 *   - 通常設定（JavaScript あり・視差効果の指定なし）: 今まで通り、画面に入ると現れる
 *   - 上記の上書きは登場型の 5 効果だけに当たる。ループ型に追加 CSS クラスで付けた
 *     位置・不透明度は、「視差効果を減らす」設定でも JavaScript なしでも上書きされず残る
 *   - 登場型の位置は、効果が実際に動かす 1 辺だけを 0 にする。その効果が動かさない辺に
 *     追加 CSS クラスで付けた位置も、同じく上書きされず残る
 *
 * 【Behaviour after the fix】
 *   - Without JavaScript: entrance effects show their final state (opaque, not offset) from the
 *     start. Looping effects (trembling etc.) keep moving as before
 *   - Reduce motion: entrance effects show from the start without moving, and all 6 looping
 *     effects stop
 *   - Default settings (JavaScript on, no motion preference): entrance effects still appear
 *     when they scroll into view
 *   - The override applies to the 5 entrance effects only. The position and opacity a user gave
 *     a looping block through an additional CSS class stay as they are, with "Reduce motion"
 *     and without JavaScript
 *   - For the entrance effects, only the one side each effect actually moves is set to 0. A
 *     position a user set through an additional CSS class on a side the effect does not move
 *     also stays as it is
 *
 * ⚠️ @wordpress/scripts の Playwright 既定コンテキストは reducedMotion: 'reduce' なので、
 * 何も指定しなければ視差効果を減らす側になる。どのケースも reducedMotion を明示する。
 * 特に「JavaScript なし」のケースを 'reduce' のままにすると、視差効果側のルールで表示されて
 * しまい、JavaScript なし用のルールを検証したことにならない。
 *
 * ⚠️ The default Playwright context of @wordpress/scripts uses reducedMotion: 'reduce', so
 * leaving it unset means "Reduce motion". Every case sets it explicitly. In particular, leaving
 * the no-JavaScript case on 'reduce' would show the content through the reduced-motion rule and
 * never exercise the no-JavaScript rule.
 */

const createdPostIds = registerPostCleanup();

// 登場型のスライド 4 方向と、動く距離（range）の 3 段階。距離ごとに既存のルールがあるため、
// 全組み合わせを置いて、どれでも最終状態のルールが勝つことを確かめる。
// The 4 slide directions of the entrance effects and the 3 range steps. Each range has its own
// existing rule, so every combination is placed to check the final-state rule wins over all of them.
const SLIDE_EFFECTS = ['slide-up', 'slide-down', 'slide-left', 'slide-right'];
const RANGES = ['short', 'normal', 'long'];

// ループ型（常に動き続ける）6 効果。動く距離は効果ごとに変えて、止めるルールが
// 距離ごとの既存ルールにも勝つことを確かめる。
// The 6 looping effects (always moving). The range differs per effect so the rule that stops
// them is checked against the existing per-range rules too.
const LOOP_EFFECTS = [
	{ effect: 'trembling-x', range: 'short' },
	{ effect: 'trembling-y', range: 'normal' },
	{ effect: 'left-right', range: 'long' },
	{ effect: 'up-down', range: 'short' },
	{ effect: 'pounding', range: 'normal' },
	{ effect: 'shaking', range: 'long' },
];

// 利用者が追加 CSS クラスで付けた調整。ループ型のブロックには位置と不透明度（USER_CLASS）、
// 登場型のブロックには「その効果が動かさない辺」の位置（userSideClass）を付ける。
// Adjustments a user makes through additional CSS classes: position and opacity on the looping
// blocks (USER_CLASS), and the position of a side the effect does not move on the entrance
// blocks (userSideClass).
const USER_CLASS = 'e2e-user-adjust';
const USER_SIDE_VALUE = '10px';

// 登場型の効果ごとに、追加 CSS クラスで位置を付ける辺。どれもその効果が動かさない辺。
// fade-in はどの辺も動かさない。
// The side given a position through an additional CSS class, per entrance effect. Each is a side
// the effect does not move (slide-up moves top, slide-right left, slide-left right, slide-down
// bottom; fade-in moves none).
const ENTRANCE_USER_ADJUSTMENTS = [
	{ effect: 'fade-in', side: 'top' },
	{ effect: 'slide-up', side: 'left' },
	{ effect: 'slide-right', side: 'bottom' },
	{ effect: 'slide-left', side: 'top' },
	{ effect: 'slide-down', side: 'right' },
];

/**
 * 辺に位置を付ける追加 CSS クラスの名前を返す。
 * Returns the name of the additional CSS class that positions a side.
 *
 * @param side top / right / bottom / left
 */
const userSideClass = (side: string): string => `e2e-user-${side}`;

/**
 * 登場型のスライドのブロックの識別子（blockId）を返す。
 * Returns the blockId of an entrance slide block.
 *
 * @param effect スライドの効果名
 * @param range  動く距離
 */
const slideId = (effect: string, range: string): string =>
	`e2e-${effect}-${range}`;

/**
 * ループ型のブロックの識別子（blockId）を返す。
 * Returns the blockId of a looping block.
 *
 * @param effect ループ型の効果名
 */
const loopId = (effect: string): string => `e2e-loop-${effect}`;

/**
 * 追加 CSS クラスで位置を付けた登場型のブロックの識別子（blockId）を返す。
 * Returns the blockId of an entrance block positioned through an additional CSS class.
 *
 * @param effect 登場型の効果名
 */
const userEntranceId = (effect: string): string => `e2e-user-${effect}`;

// ブロックごとの識別子（blockId）。ブロックのクラス `vk_animation-<blockId>` で 1 件に絞る。
// 効果名のクラス（`vk_animation-fade-in` など）とは別の名前にして、取り違えないようにしている。
// Per-block identifier (blockId). The class `vk_animation-<blockId>` narrows to one block. It is
// named apart from the effect classes (e.g. `vk_animation-fade-in`) so they are not mixed up.
const BLOCK_IDS = {
	// 画面内（スペーサーより上）に置くブロック。JavaScript が実行されたことの目印に使う
	// Placed in the viewport (above the spacer). Used as a sign that JavaScript has run
	top: 'e2e-top',
	fadeIn: 'e2e-fade-in',
	// speed / range のクラスを持たない古い保存形式（1.34.1 より前）
	// Old saved format without the speed / range classes (before 1.34.1)
	legacy: 'e2e-legacy',
	// スマホでアニメーションを無効にする設定のブロック
	// Block with the "disable animation on mobile" setting
	mobileOff: 'e2e-mobile-off',
};

// 登場型（画面に入ると現れる）のうち、画面外に置くもの
// The entrance blocks placed below the fold
const BELOW_FOLD_ENTRANCE_IDS = [
	BLOCK_IDS.fadeIn,
	...SLIDE_EFFECTS.flatMap((effect) =>
		RANGES.map((range) => slideId(effect, range))
	),
	BLOCK_IDS.legacy,
];

// ループ型のブロックの識別子（6 効果すべて）
// Identifiers of the looping blocks (all 6 effects)
const LOOP_IDS = LOOP_EFFECTS.map(({ effect }) => loopId(effect));

// 画面に入れたときの表示（transition）を確かめるブロック
// The block used to check the transition when it scrolls into view
const TRANSITION_CHECK_ID = slideId('slide-left', 'long');

type AnimationBlockOptions = {
	id: string;
	text: string;
	effect?: string;
	speed?: string;
	range?: string;
	disableOnMobile?: boolean;
	className?: string;
};

/**
 * 現行の保存形式のアニメーションブロックのマークアップを組み立てる。
 *
 * クラスの並びは save.js の出力（test/e2e-tests/fixtures/blocks/vk-blocks__animation.html と
 * 同じ形。追加 CSS クラスは WordPress が末尾に足す）に揃えている。このスペックが見るのは
 * フロントのクラスと算出値だけで、ブロック検証は対象外。保存形式そのものは fixture の往復
 * テスト（npm run test-unit）が守っている。
 * 既定値（slide-up / fast / short）は、block.json の既定値と同じ扱いでコメントの属性 JSON に書かない。
 *
 * Builds the markup of an animation block in the current saved format. The class order follows
 * the output of save.js (additional CSS classes are appended last by WordPress). This spec only
 * looks at front-end classes and computed values, not block validation; the saved format itself
 * is guarded by the fixture round-trip test (npm run test-unit). Default values (slide-up /
 * fast / short) are left out of the attribute JSON, as with the defaults in block.json.
 *
 * @param options                 ブロックの設定
 * @param options.id              blockId
 * @param options.text            中に入れる段落の文字
 * @param options.effect          効果名（既定 slide-up）
 * @param options.speed           速さ（既定 fast）
 * @param options.range           動く距離（既定 short）
 * @param options.disableOnMobile スマホでアニメーションを無効にするか
 * @param options.className       追加 CSS クラス
 */
const buildAnimationBlock = ({
	id,
	text,
	effect = 'slide-up',
	speed = 'fast',
	range = 'short',
	disableOnMobile = false,
	className = '',
}: AnimationBlockOptions): string => {
	const attributes = {
		...(effect !== 'slide-up' && { effect }),
		...(speed !== 'fast' && { speed }),
		...(range !== 'short' && { range }),
		...(disableOnMobile && { disableOnMobile: true }),
		...(className && { className }),
		blockId: id,
	};
	const classes = [
		'wp-block-vk-blocks-animation',
		'vk_animation',
		`vk_animation-${effect}`,
		`vk_animation-speed-${speed}`,
		`vk_animation-range-${range}`,
		`vk_animation-${id}`,
		...(className ? [className] : []),
	].join(' ');
	const dataAttribute = disableOnMobile
		? ' data-disable-on-mobile="true"'
		: '';

	return [
		`<!-- wp:vk-blocks/animation ${JSON.stringify(attributes)} -->`,
		`<div class="${classes}"${dataAttribute}><!-- wp:paragraph -->`,
		`<p>${text}</p>`,
		'<!-- /wp:paragraph --></div>',
		'<!-- /wp:vk-blocks/animation -->',
	].join('\n');
};

/**
 * 古い保存形式（speed / range のクラスが無い、1.34.1 より前）のアニメーションブロックの
 * マークアップを返す。この形式は style.scss の先頭の「deprecated block 用」ルールが効く。
 * 現行の save では作れないため、HTML を直接書く。
 *
 * Returns the markup of an animation block in the old saved format (no speed / range classes,
 * before 1.34.1). That format relies on the "deprecated block" rules at the top of style.scss.
 * The current save cannot produce it, so the HTML is written directly.
 *
 * @param id   clientId 相当の識別子
 * @param text 中に入れる段落の文字
 */
const buildLegacyAnimationBlock = (id: string, text: string): string =>
	[
		`<!-- wp:vk-blocks/animation {"clientId":"${id}"} -->`,
		`<div class="wp-block-vk-blocks-animation vk_animation vk_animation-slide-up vk_animation-${id}"><!-- wp:paragraph -->`,
		`<p>${text}</p>`,
		'<!-- /wp:paragraph --></div>',
		'<!-- /wp:vk-blocks/animation -->',
	].join('\n');

// 利用者が追加 CSS クラスに書いた調整を、本文に埋め込む。
//   - ループ型: 位置（position: relative / top: -10px）と不透明度（.5）
//   - 登場型: 効果が動かさない辺の位置（辺ごとのクラス）
// セレクタを `div.` 付き（詳細度 (0,1,1)）にしているのは、プラグインの CSS が本文より後に
// 出力される場合（分割読み込み）でも、単一クラスの既存ルール（(0,1,0)）に確実に勝たせ、
// どちらの読み込み方式でも同じ表示になるようにするため。一方、(0,2,0) の上書きルールには
// 負けるので、上書きがその辺・不透明度に当たっていれば値が変わって検出できる。
//
// Embeds the adjustments a user wrote for additional CSS classes into the post: position
// (position: relative / top: -10px) and opacity (.5) on the looping blocks, and a per-side
// position on the entrance blocks. The selector carries `div.` (specificity (0,1,1)) so it beats
// the existing single-class rules (0,1,0) whatever order the plugin CSS is printed in (separate
// loading may print it after the post body), giving the same result with either loading mode. It
// still loses to the (0,2,0) override, so a value changes if the override reaches that side or
// the opacity, which is how a regression is detected.
const USER_ADJUST_STYLE_BLOCK = [
	'<!-- wp:html -->',
	`<style>div.${USER_CLASS}{position:relative;top:-10px;opacity:.5}${ENTRANCE_USER_ADJUSTMENTS.map(
		({ side }) => `div.${userSideClass(side)}{${side}:${USER_SIDE_VALUE}}`
	).join('')}</style>`,
	'<!-- /wp:html -->',
].join('\n');

// 画面外に出すためのスペーサー。ビューポートの高さ（700px）を十分に超える
// A spacer that pushes blocks below the fold. It is well over the viewport height (700px)
const SPACER_BLOCK = [
	'<!-- wp:spacer {"height":"2500px"} -->',
	'<div style="height:2500px" aria-hidden="true" class="wp-block-spacer"></div>',
	'<!-- /wp:spacer -->',
].join('\n');

/**
 * スペーサーの上に 1 つ（画面内）、下に登場型・ループ型・スマホ無効のブロックを並べた
 * 投稿の本文を返す。
 * Returns the post content: one block above the spacer (in the viewport), and the entrance,
 * looping and disabled-on-mobile blocks below it.
 */
const buildPostContent = (): string =>
	[
		USER_ADJUST_STYLE_BLOCK,
		buildAnimationBlock({ id: BLOCK_IDS.top, text: '画面内のブロック' }),
		SPACER_BLOCK,
		buildAnimationBlock({
			id: BLOCK_IDS.fadeIn,
			effect: 'fade-in',
			text: 'フェードイン',
		}),
		// 4 方向 × 3 段階の距離。位置のずれが残っていれば算出値で見分けられる
		// 4 directions x 3 ranges. A leftover offset shows up in the computed values
		...SLIDE_EFFECTS.flatMap((effect) =>
			RANGES.map((range) =>
				buildAnimationBlock({
					id: slideId(effect, range),
					effect,
					range,
					text: `${effect} / ${range}`,
				})
			)
		),
		buildLegacyAnimationBlock(BLOCK_IDS.legacy, '古い保存形式'),
		// 登場型 5 効果。どれも追加 CSS クラスで、その効果が動かさない辺に位置を付けている
		// The 5 entrance effects, each with a position on a side it does not move, through an
		// additional CSS class
		...ENTRANCE_USER_ADJUSTMENTS.map(({ effect, side }) =>
			buildAnimationBlock({
				id: userEntranceId(effect),
				effect,
				className: userSideClass(side),
				text: `${effect} + ${side}`,
			})
		),
		// ループ型 6 効果。どれも追加 CSS クラスで位置と不透明度を調整している
		// The 6 looping effects, each with position and opacity adjusted through an additional
		// CSS class
		...LOOP_EFFECTS.map(({ effect, range }) =>
			buildAnimationBlock({
				id: loopId(effect),
				effect,
				range,
				className: USER_CLASS,
				text: `ループ型 ${effect}`,
			})
		),
		buildAnimationBlock({
			id: BLOCK_IDS.mobileOff,
			disableOnMobile: true,
			text: 'スマホでは無効',
		}),
	].join('\n\n');

let postId: number;

/**
 * ブロックの識別子から、フロントの要素を 1 件に絞って返す。
 * Returns a locator that narrows the front end down to one block by its identifier.
 *
 * @param page Page
 * @param id   ブロックの識別子（blockId）
 */
const blockLocator = (page: Page, id: string): Locator =>
	page.locator(`.vk_animation-${id}`);

/**
 * 登場型のブロックが「最初から最終状態」で表示されていることを確かめる。
 * 不透明で、位置のずれ（上下左右）が無いこと。
 * 効果が動かさない辺は指定が無く auto だが、position: relative の要素では算出値が 0px に
 * 解決されるため、4 辺とも 0px で確かめられる。
 *
 * Checks that an entrance block is shown in its final state from the start: opaque and not
 * offset on any side. A side the effect does not move is auto, but on a position: relative
 * element it resolves to 0px, so all 4 sides can be checked against 0px.
 *
 * @param block 対象のブロック
 * @param id    失敗時にどのブロックか分かるようにするための識別子
 */
const expectShownFromStart = async (
	block: Locator,
	id: string
): Promise<void> => {
	// 失敗時に、どのブロックの何が違ったのかが分かるようメッセージに識別子を入れる
	// The identifier goes into the message so a failure shows which block differs and how
	await expect(block, `${id}: opacity`).toHaveCSS('opacity', '1');
	for (const side of ['top', 'right', 'bottom', 'left']) {
		await expect(block, `${id}: ${side}`).toHaveCSS(side, '0px');
	}
};

/**
 * ループ型のブロックに、利用者が追加 CSS クラスで付けた位置・不透明度が残っていることを確かめる。
 * 上書きが当たっていれば、不透明度は 1、上の位置は 0px に変わる。
 *
 * Checks that the position and opacity a user gave a looping block through an additional CSS
 * class are kept. If the override reached it, opacity would become 1 and top would become 0px.
 *
 * @param block 対象のブロック
 * @param id    失敗時にどのブロックか分かるようにするための識別子
 */
const expectUserAdjustmentKept = async (
	block: Locator,
	id: string
): Promise<void> => {
	await expect(block, `${id}: opacity`).toHaveCSS('opacity', '0.5');
	await expect(block, `${id}: position`).toHaveCSS('position', 'relative');
	await expect(block, `${id}: top`).toHaveCSS('top', '-10px');
};

/**
 * 登場型のブロックに、利用者が追加 CSS クラスで「効果が動かさない辺」に付けた位置が
 * 残っていることを確かめる（5 効果すべて）。上書きがその辺に当たっていれば 0px に変わる。
 *
 * Checks that the position a user gave each entrance block through an additional CSS class, on a
 * side the effect does not move, is kept (all 5 effects). If the override reached that side it
 * would become 0px.
 *
 * @param page Page
 */
const expectEntranceUserSidesKept = async (page: Page): Promise<void> => {
	for (const { effect, side } of ENTRANCE_USER_ADJUSTMENTS) {
		const id = userEntranceId(effect);
		await expect(blockLocator(page, id), `${id}: ${side}`).toHaveCSS(
			side,
			USER_SIDE_VALUE
		);
	}
};

/**
 * フロントの投稿ページを、視差効果の設定を明示して開く。
 * emulateMedia は goto より前に呼ぶ必要がある（順序をこのヘルパーで固定する）。
 *
 * Opens the front-end post with the motion preference stated explicitly. emulateMedia must be
 * called before goto, and this helper fixes that order.
 *
 * @param page          Page
 * @param reducedMotion エミュレートする prefers-reduced-motion の値
 */
const visitFrontend = async (
	page: Page,
	reducedMotion: 'reduce' | 'no-preference'
): Promise<void> => {
	await page.emulateMedia({ reducedMotion });
	await page.goto(`/?p=${postId}`);
};

/**
 * JavaScript を無効にしたコンテキストで投稿ページを開く。
 * 呼び出し側は、検証が終わったら必ず close() を呼ぶこと（try / finally で囲む）。
 *
 * `browser` フィクスチャの newContext() は playwright.config.ts の use を継承する。
 * 継承される reducedMotion: 'reduce' のままだと視差効果側のルールで表示されてしまうため、
 * ここで 'no-preference' に上書きする（上書きしたキーは継承より優先される）。
 *
 * Opens the post in a context with JavaScript disabled. The caller must call close() when done
 * (wrap it in try / finally).
 *
 * newContext() on the `browser` fixture inherits `use` from playwright.config.ts. The
 * inherited reducedMotion: 'reduce' would make the reduced-motion rule show the content,
 * so it is overridden with 'no-preference' here (explicit keys win over inherited ones).
 *
 * @param browser Browser
 * @return 開いたページと、コンテキストを閉じる関数
 */
const openWithoutJavaScript = async (
	browser: Browser
): Promise<{ page: Page; close: () => Promise<void> }> => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		reducedMotion: 'no-preference',
	});
	const close = (): Promise<void> => context.close();
	try {
		const page = await context.newPage();
		await page.goto(`/?p=${postId}`);

		// 前提: このコンテキストが「JavaScript なし」として扱われている。
		// 扱われていなければ、以降の結果が何のルールによるものか分からなくなる
		// Precondition: this context counts as "no JavaScript". Otherwise it would be unclear
		// which rule produces the results below.
		expect(
			await page.evaluate(
				() => window.matchMedia('(scripting: none)').matches
			),
			'scripting: none に一致していない'
		).toBe(true);

		return { page, close };
	} catch (error) {
		// 前提の確認に失敗したときも、コンテキストを残さない
		// Do not leave the context open when the precondition fails either
		await close();
		throw error;
	}
};

test.describe('アニメーション（Pro）JavaScript なし・視差効果を減らす設定での表示 (#3262)', () => {
	test.beforeAll(async ({ requestUtils }) => {
		// 本文を REST で直接入れて公開する。登場型・ループ型・古い形式を 1 つの投稿に並べる
		// Publish the content directly through REST, with the entrance, looping and old-format
		// blocks side by side in one post
		const post = await requestUtils.rest({
			path: '/wp/v2/posts',
			method: 'POST',
			data: {
				title: 'animation visible without js (#3262)',
				content: buildPostContent(),
				status: 'publish',
			},
		});
		createdPostIds.push(post.id);
		postId = post.id as number;
	});

	test('JavaScript なし（視差効果の指定なし）: 登場型は最初から表示され、ループ型は動き続ける', async ({
		browser,
	}) => {
		const { page, close } = await openWithoutJavaScript(browser as Browser);
		try {
			// 画面内のブロックも画面外のブロックも、最初から最終状態で表示される。
			// JavaScript が無いので、画面に入ったことを検知して表示することはできない
			// Blocks in and out of the viewport all show their final state from the start.
			// Without JavaScript nothing can detect them entering the viewport.
			for (const id of [BLOCK_IDS.top, ...BELOW_FOLD_ENTRANCE_IDS]) {
				await expectShownFromStart(blockLocator(page, id), id);
			}

			// ループ型は JavaScript が無くても動いていた。今回のルールで止めない
			// Looping effects moved without JavaScript too; the new rules must not stop them
			for (const id of LOOP_IDS) {
				await expect(
					blockLocator(page, id),
					`${id}: ループ型が止まっている`
				).not.toHaveCSS('animation-name', 'none');
			}
		} finally {
			await close();
		}
	});

	test('視差効果を減らす（JavaScript あり）: 画面外の登場型もスクロール前から表示され、ループ型 6 効果はすべて止まる', async ({
		page,
	}) => {
		await visitFrontend(page, 'reduce');

		for (const id of BELOW_FOLD_ENTRANCE_IDS) {
			const block = blockLocator(page, id);
			// 画面外のブロックは view.js が vk_animation-active を付けない。
			// 付いていないのに表示されていれば、CSS だけで表示されている
			// view.js does not add vk_animation-active to blocks below the fold. If one is shown
			// without it, CSS alone is showing it.
			await expect(block, `${id}: active`).not.toHaveClass(
				/vk_animation-active/
			);
			await expectShownFromStart(block, id);
		}

		// ループ型は 6 効果すべて止まる
		// All 6 looping effects stop
		for (const id of LOOP_IDS) {
			await expect(
				blockLocator(page, id),
				`${id}: ループ型が動いている`
			).toHaveCSS('animation-name', 'none');
		}
	});

	test('通常設定（JavaScript あり・視差効果の指定なし）: 画面外の登場型は透明のまま、画面に入ると表示される', async ({
		page,
	}) => {
		await visitFrontend(page, 'no-preference');

		// 画面内のブロックが表示されるまで待つ。表示されれば view.js が実行されている。
		// これを待たないと、view.js の実行前で透明なだけの状態を「画面外は透明」と読み違える
		// Wait until the block in the viewport is shown, which means view.js has run. Without this,
		// a block that is merely transparent before view.js runs would be read as "hidden below
		// the fold".
		await expect(blockLocator(page, BLOCK_IDS.top)).toHaveCSS(
			'opacity',
			'1'
		);

		// 画面外の登場型は、スクロールするまで透明のまま。位置もずれたまま
		// Entrance blocks below the fold stay transparent and offset until scrolled into view
		for (const id of BELOW_FOLD_ENTRANCE_IDS) {
			await expect(
				blockLocator(page, id),
				`${id}: 画面外なのに表示されている`
			).toHaveCSS('opacity', '0');
		}
		await expect(
			blockLocator(page, TRANSITION_CHECK_ID),
			`${TRANSITION_CHECK_ID}: 位置のずれが無い`
		).not.toHaveCSS('right', '0px');

		// ループ型は通常設定では動き続け、追加 CSS クラスで付けた位置・不透明度が効いている。
		// 登場型にも、動かさない辺に付けた位置が効いている。どちらも、「視差効果を減らす」・
		// JavaScript なしのケースが何と比べて「残っている」と言えるのかの前提（この本文なら
		// 通常設定でこの値になる）
		// Looping blocks keep moving and the position and opacity from the additional CSS class
		// apply; entrance blocks have their position on the unmoved side applied too. This is
		// what the "Reduce motion" and no-JavaScript cases compare against to say a value was
		// "kept" (this content gives these values under the default settings).
		for (const id of LOOP_IDS) {
			const block = blockLocator(page, id);
			await expect(block, `${id}: ループ型が止まっている`).not.toHaveCSS(
				'animation-name',
				'none'
			);
			await expectUserAdjustmentKept(block, id);
		}
		await expectEntranceUserSidesKept(page);

		// 画面に入れると表示される。transition（遅延込みで 1 秒前後）が終わるまで待つ
		// It is shown once scrolled into view. Wait for the transition (about 1 second with the
		// delay) to finish.
		const slideLeft = blockLocator(page, TRANSITION_CHECK_ID);
		await slideLeft.scrollIntoViewIfNeeded();
		await expect(slideLeft).toHaveCSS('opacity', '1', { timeout: 10_000 });
		await expect(slideLeft).toHaveCSS('right', '0px');
		await expect(slideLeft).toHaveClass(/vk_animation-active/);
	});

	test('視差効果を減らす: ループ型に追加 CSS クラスで付けた位置・不透明度は上書きされず残る', async ({
		page,
	}) => {
		await visitFrontend(page, 'reduce');

		for (const id of LOOP_IDS) {
			await expectUserAdjustmentKept(blockLocator(page, id), id);
		}
	});

	test('JavaScript なし: ループ型に追加 CSS クラスで付けた位置・不透明度は上書きされず残る', async ({
		browser,
	}) => {
		const { page, close } = await openWithoutJavaScript(browser as Browser);
		try {
			for (const id of LOOP_IDS) {
				await expectUserAdjustmentKept(blockLocator(page, id), id);
			}
		} finally {
			await close();
		}
	});

	test('視差効果を減らす: 登場型に追加 CSS クラスで付けた「効果が動かさない辺」の位置は上書きされず残る', async ({
		page,
	}) => {
		await visitFrontend(page, 'reduce');

		await expectEntranceUserSidesKept(page);
	});

	test('JavaScript なし: 登場型に追加 CSS クラスで付けた「効果が動かさない辺」の位置は上書きされず残る', async ({
		browser,
	}) => {
		const { page, close } = await openWithoutJavaScript(browser as Browser);
		try {
			await expectEntranceUserSidesKept(page);
		} finally {
			await close();
		}
	});

	test('スマホでアニメーションを無効にする設定: スマホ幅では画面外でもスクロール前から表示される（既存の動き）', async ({
		page,
	}) => {
		// 既存のスマホ無効の経路（data 属性＋メディアクエリ）の回帰ガード。このケースは今回の
		// 変更前から通る。今回足したルール（scripting: none と prefers-reduced-motion: reduce）は、
		// この条件（JavaScript あり・視差効果の指定なし）では一致しない。
		//
		// A regression guard for the existing disable-on-mobile path (data attribute + media
		// query). This case passed before this change too. The rules added now (scripting: none and
		// prefers-reduced-motion: reduce) do not match under these conditions (JavaScript on, no
		// motion preference).
		await page.setViewportSize({ width: 375, height: 700 });
		await visitFrontend(page, 'no-preference');

		// view.js の実行を待つ（画面内のブロックが表示されれば実行済み）
		// Wait for view.js to run (it has once the block in the viewport is shown)
		await expect(blockLocator(page, BLOCK_IDS.top)).toHaveCSS(
			'opacity',
			'1'
		);

		await expectShownFromStart(
			blockLocator(page, BLOCK_IDS.mobileOff),
			BLOCK_IDS.mobileOff
		);

		// 設定のないブロックは、同じ画面幅でも画面外では透明のまま。
		// 全体が表示されてしまっているのではなく、スマホ無効の設定だけが効いていることの確認
		// A block without the setting stays transparent below the fold at the same width. This
		// confirms that only the setting is in effect, not that everything is shown.
		await expect(
			blockLocator(page, BLOCK_IDS.fadeIn),
			'設定のないブロックまで表示されている'
		).toHaveCSS('opacity', '0');
	});
});
