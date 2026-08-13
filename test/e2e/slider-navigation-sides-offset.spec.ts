import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { saveDraftThenPublishViaRest } from './utils/publish';
import { registerPostCleanup } from './utils/post-cleanup';
import {
	waitForSwiperInit,
	waitForAutoplayRunning,
	stopAutoplay,
	getRealIndex,
	waitForRealIndexChange,
} from './utils/swiper';
import { measureHitAreaGeometry } from './utils/hit-area';

/**
 * スライダーブロック（本体）: 矢印ボタンの左右オフセット (#3069 / PR #3070)
 *
 * 【背景】
 *   Swiper の `--swiper-navigation-sides-offset` の既定値が v11 の 10px から
 *   v14 で 4px に変わったため、バージョンアップだけで矢印の左右位置が 6px 端寄りになり、
 *   停止/再生ボタン（`.swiper-pause-button` の `top:10px; right:10px`）と
 *   端からの距離がずれていた。common.scss で 10px に固定して従来の位置に戻している。
 *
 * このスペックで確認すること:
 *   1. PC 幅・モバイル幅の両方で、前矢印の左端・次矢印の右端がスライダーの端から 10px
 *   2. 停止/再生ボタンの右端も同じく 10px（＝矢印と揃っている）
 *   3. 44px の当たり判定（::before）が矢印・停止ボタンの見た目を変えていない
 *      （描画サイズは 2.4rem 相当のまま）
 *   4. PC 幅・モバイル幅の両方で、描画ボックスの外・当たり判定の内側をクリックしても
 *      次矢印でスライドが進み、停止/再生ボタンで自動再生が停止・再開すること
 *
 * flaky 防止のため固定待機（waitForTimeout）は使わず、要素の出現待機で確認する。
 */

const SLIDER = 'vk-blocks/slider';

const PC_VIEWPORT = { width: 1200, height: 900 };
const MOBILE_VIEWPORT = { width: 375, height: 900 };

// Swiper v11 と同じ左右オフセット
const EXPECTED_SIDES_OFFSET = 10;

// PC 幅・モバイル幅の両方で確認する。両ループで同じ組み合わせを使うため 1 箇所にまとめる
const VIEWPORT_CASES = [
	['PC 幅 1200px', PC_VIEWPORT],
	['モバイル幅 375px', MOBILE_VIEWPORT],
] as const;

const createdPostIds = registerPostCleanup();

/**
 * 矢印・停止ボタン・bullets をすべて表示するスライダーを公開する。
 *
 * @param admin        Admin フィクスチャ
 * @param editor       Editor フィクスチャ
 * @param page         Page フィクスチャ
 * @param requestUtils RequestUtils フィクスチャ
 * @return 公開した投稿の ID
 */
const publishSliderWithPauseButton = async (
	admin: Admin,
	editor: Editor,
	page: Page,
	requestUtils: RequestUtils
): Promise<number> => {
	await admin.createNewPost();
	await editor.insertBlock({
		name: SLIDER,
		attributes: {
			// モバイルでもスライダーの高さを確保し、矢印の位置比較を安定させる
			pc: 300,
			tablet: 300,
			mobile: 300,
			unit: 'px',
			navigationPosition: 'center', // PC・モバイルとも矢印を上下中央に置き、位置比較を単純にする
			pagination: 'bullets',
			autoPlay: true,
			pauseButton: true,
		},
		innerBlocks: [
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
			{ name: 'vk-blocks/slider-item' },
		],
	});
	const postId = await saveDraftThenPublishViaRest(
		page,
		requestUtils,
		createdPostIds
	);
	return postId;
};

/**
 * フロントの投稿を開き、Swiper の初期化を待ってから矢印・停止ボタンの
 * スライダー端からの距離と描画サイズを計測する。
 *
 * @param page   Page フィクスチャ
 * @param postId 表示する投稿 ID
 * @return 矢印・停止ボタンのスライダー端からの距離（`prevLeft` / `nextRight` /
 *   `pauseRight` / `pauseTop`）と、当たり判定を含まない描画サイズ（`arrowWidth` /
 *   `arrowHeight` / `pauseWidth`）。いずれも px
 */
const openAndMeasureOffsets = async (page: Page, postId: number) => {
	await page.goto(`/?p=${postId}`);
	await page.locator('.vk_slider .swiper-button-next').waitFor();
	await page.locator('.vk_slider .swiper-pause-button').waitFor();
	// 要素の出現だけでは初期化完了にならないため、Swiper の初期化を待ってから測る
	// （理由は waitForSwiperInit の JSDoc を参照）
	await waitForSwiperInit(page);

	return await page.evaluate(() => {
		const slider = document.querySelector('.vk_slider') as HTMLElement;
		const sliderRect = slider.getBoundingClientRect();
		const rectOf = (selector: string) =>
			(
				slider.querySelector(selector) as HTMLElement
			).getBoundingClientRect();

		const prev = rectOf('.swiper-button-prev');
		const next = rectOf('.swiper-button-next');
		const pause = rectOf('.swiper-pause-button');

		return {
			prevLeft: prev.left - sliderRect.left,
			nextRight: sliderRect.right - next.right,
			pauseRight: sliderRect.right - pause.right,
			pauseTop: pause.top - sliderRect.top,
			// 描画サイズ（当たり判定 ::before を含まないボタン自身のボックス）
			arrowWidth: next.width,
			arrowHeight: next.height,
			pauseWidth: pause.width,
		};
	});
};

test.describe('スライダー: 矢印の左右オフセット (#3069)', () => {
	for (const [label, viewport] of VIEWPORT_CASES) {
		test(`${label}: 矢印が左右 10px・停止ボタンと端からの距離が揃う`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const postId = await publishSliderWithPauseButton(
				admin,
				editor,
				page,
				requestUtils
			);
			await page.setViewportSize(viewport);
			const m = await openAndMeasureOffsets(page, postId);

			// サブピクセル描画の端数で落ちないよう ±2px の範囲で判定する。
			// Math.abs(...) 形式ではなく上下限で書くのは、失敗時のメッセージに
			// 実測値が出て回帰の切り分けが早くなるため。
			// 境界は含める（ちょうど ±2px を許容範囲外にしない）。
			const min = EXPECTED_SIDES_OFFSET - 2;
			const max = EXPECTED_SIDES_OFFSET + 2;

			// 1. 矢印の左右オフセットが Swiper v11 と同じ 10px
			expect(m.prevLeft).toBeGreaterThanOrEqual(min);
			expect(m.prevLeft).toBeLessThanOrEqual(max);
			expect(m.nextRight).toBeGreaterThanOrEqual(min);
			expect(m.nextRight).toBeLessThanOrEqual(max);

			// 2. 停止/再生ボタンも同じ 10px（＝矢印と端からの距離が揃っている）
			expect(m.pauseRight).toBeGreaterThanOrEqual(min);
			expect(m.pauseRight).toBeLessThanOrEqual(max);
			expect(m.pauseTop).toBeGreaterThanOrEqual(min);
			expect(m.pauseTop).toBeLessThanOrEqual(max);
			expect(m.nextRight).toBeGreaterThanOrEqual(m.pauseRight - 2);
			expect(m.nextRight).toBeLessThanOrEqual(m.pauseRight + 2);

			// 3. 44px の当たり判定を付けても描画サイズは 2.4rem 相当のまま
			//    （ルート 16px 想定で 38.4px。テーマによる rem 差を見込み範囲判定）。
			//    上限の 44px は「2.4rem が当たり判定の 44px に達する境界」でもある
			//    （2.4rem = 44px になるのはルート font-size が約 18.3px のとき）。
			//    それ以上のルート値では描画ボックスが当たり判定に並ぶため、
			//    この判定は「描画サイズを大きくしていない」ことの確認として成立しなくなる。
			expect(m.arrowWidth).toBeGreaterThan(30);
			expect(m.arrowWidth).toBeLessThan(44);
			expect(m.arrowHeight).toBeGreaterThan(30);
			expect(m.arrowHeight).toBeLessThan(44);
			expect(m.pauseWidth).toBeGreaterThan(30);
			expect(m.pauseWidth).toBeLessThan(44);
		});
	}

	for (const [label, viewport] of VIEWPORT_CASES) {
		test(`${label}: 当たり判定は 44px 以上に広がり、矢印・停止/再生ボタンが実際に押せる`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const postId = await publishSliderWithPauseButton(
				admin,
				editor,
				page,
				requestUtils
			);
			await page.setViewportSize(viewport);
			// wp-scripts の Playwright 既定は prefers-reduced-motion: reduce で、
			// その場合 view.js は初期化直後に自動再生を止める（#3044。停止/再生ボタンが
			// 再開手段になる）。ここでは通常環境の挙動＝再生中からの停止／再開を確認したいので
			// 明示的に no-preference にする（reduce 側の挙動は
			// slider-autoplay-reduced-motion.spec.ts が担当）。
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.goto(`/?p=${postId}`);
			// 計測対象の出現を先に待つ。openAndMeasureOffsets と同じ待ち方に揃える。
			// 待たずに measureHitAreaGeometry へ渡すと、まだ描画されていないだけなのに
			// 「セレクタが見つからない」という別の失敗として報告されてしまう。
			await page.locator('.vk_slider .swiper-button-next').waitFor();
			await page.locator('.vk_slider .swiper-pause-button').waitFor();
			await waitForSwiperInit(page);

			// 当たり判定の中心・サイズの算出は utils/hit-area.ts に集約している。
			// 姉妹スペック `slider-pagination-clearance-scope.spec.ts` がクリアランスの
			// 基準に使うのと同じ計測なので、判定基準がずれないよう共有している。
			// top / left / transform が % のままだと中心の算出が静かに狂うため、
			// px に解決されていない場合は measureHitAreaGeometry がどの値が % かを
			// 示して例外にする（以前はここで expect していた検証）。
			const measureHit = async (selector: string) => {
				const hitArea = await measureHitAreaGeometry(
					page,
					'.vk_slider',
					selector
				);
				expect(
					hitArea,
					`${selector} が見つかりませんでした`
				).not.toBeNull();
				return hitArea!;
			};
			const hit = {
				next: await measureHit('.swiper-button-next'),
				pause: await measureHit('.swiper-pause-button'),
			};

			expect(hit.next.width).toBeGreaterThanOrEqual(44);
			expect(hit.next.height).toBeGreaterThanOrEqual(44);
			expect(hit.pause.width).toBeGreaterThanOrEqual(44);
			expect(hit.pause.height).toBeGreaterThanOrEqual(44);

			// 当たり判定の下端から 1px 内側の座標。ここが描画ボックスの外にあることを
			// 先に固定する。当たり判定は 44px 固定・描画ボックスは 2.4rem なので、
			// この前提が成り立つのはルートの font-size が約 18.3px 未満のとき。それを
			// 超えると描画ボックスが当たり判定に追いつき、以降の assert が落ちる
			// （テストの前提が壊れた合図）。座標を固定値で書くと、ルートの font-size 次第で
			// 描画ボックスの内側に入り、検証にならないまま通ってしまうため実測値から導出する。
			// 当たり判定が描画ボックスと同心である前提も置かず、実測した中心のずれを足す。
			const outerClickPoint = async (
				selector: string,
				hitArea: {
					height: number;
					centerOffsetX: number;
					centerOffsetY: number;
				}
			) => {
				// boundingBox() は要素が非表示だと null を返す。measureHit と同じく
				// 参照前に明示的に確かめて、どのセレクタで取れなかったかを出す
				const box = await page
					.locator(`.vk_slider ${selector}`)
					.boundingBox();
				expect(
					box,
					`${selector}: 描画ボックスが取得できませんでした（非表示の可能性があります）`
				).not.toBeNull();
				const rect = box!;
				// 描画ボックスの中心から当たり判定の下端 1px 内側までの距離
				const offsetY = hitArea.centerOffsetY + hitArea.height / 2 - 1;
				// 2 要素から呼ばれるため、どちらで前提が崩れたか分かるようにする。
				// 当たり判定がずれて描画ボックスからはみ出していない場合もここで落ちる
				expect(
					offsetY,
					`${selector}: 当たり判定が描画ボックスの外まで広がっている前提（中心のずれ ${hitArea.centerOffsetY}px）`
				).toBeGreaterThan(rect.height / 2);
				return {
					x: rect.x + rect.width / 2 + hitArea.centerOffsetX,
					y: rect.y + rect.height / 2 + offsetY,
				};
			};

			// 算出した座標が本当に対象へ届くかを、クリックする前に確認する。
			// 当たり判定は不可視の ::before なので、座標がずれていたり別の要素
			// （bullets 等）が重なっていても「押したのに何も起きない」だけになり、
			// 失敗が「自動再生が止まらない」「index が変わらない」というタイムアウトに
			// 化けて原因が分からなくなる。実際に当たった要素を名指しして落とす。
			// elementFromPoint が返すのは疑似要素ではなくそれを持つ要素なので、
			// closest() で対象そのものか、その子要素（注入された SVG 等）かを見る。
			const expectClickReaches = async (
				selector: string,
				point: { x: number; y: number }
			) => {
				const scoped = `.vk_slider ${selector}`;
				const topmost = await page.evaluate(
					({ x, y, sel }) => {
						const el = document.elementFromPoint(x, y);
						if (!el) {
							return null;
						}
						return {
							matched: !!el.closest(sel),
							tag: el.tagName.toLowerCase(),
							// SVG 要素の className は文字列ではないため属性から読む
							className: el.getAttribute('class') ?? '',
						};
					},
					{ x: point.x, y: point.y, sel: scoped }
				);
				const where = `(${Math.round(point.x)}, ${Math.round(point.y)})`;
				expect(
					topmost,
					`${selector}: クリック座標 ${where} に要素がありません`
				).not.toBeNull();
				expect(
					topmost!.matched,
					`${selector}: クリック座標 ${where} が別の要素に当たっています（実際: ${topmost!.tag}.${topmost!.className}）`
				).toBe(true);
			};

			// 1. 停止/再生ボタン: 描画ボックスの外・当たり判定の内側をクリックして
			//    自動再生が止まり、もう一度押すと再開すること（回帰: 実際に押せる）
			const pauseButton = page.locator('.vk_slider .swiper-pause-button');
			// 自動再生が始まってから測る（初期状態が running であることを前提にしない）
			await waitForAutoplayRunning(page, true);
			const pausePoint = await outerClickPoint(
				'.swiper-pause-button',
				hit.pause
			);

			await expectClickReaches('.swiper-pause-button', pausePoint);
			await page.mouse.click(pausePoint.x, pausePoint.y);
			await waitForAutoplayRunning(page, false);
			// 停止中は再生アイコン（is-paused）に切り替わる
			await expect(pauseButton).toHaveClass(/is-paused/);

			// 1 回目のクリックで is-paused が付きアイコンが入れ替わるため、当たり判定も
			// 座標も使い回さず取り直す（表示が変わって寸法・位置がずれても追従できるように）
			const resumePoint = await outerClickPoint(
				'.swiper-pause-button',
				await measureHit('.swiper-pause-button')
			);
			await expectClickReaches('.swiper-pause-button', resumePoint);
			await page.mouse.click(resumePoint.x, resumePoint.y);
			await waitForAutoplayRunning(page, true);
			await expect(pauseButton).not.toHaveClass(/is-paused/);

			// 2. 次矢印: 同じく当たり判定の内側をクリックしてスライドが進むこと。
			//    自動再生が index を動かすと判定がぶれるので止めてからクリックする。
			//    当たり判定は停止/再生ボタン側と同じく「使う直前に測る」で揃える。
			//    冒頭の hit.next は、クリック操作と自動再生の停止・再開を挟んだ時点で
			//    古い値になっている。使い回すには「その間に矢印の寸法が変わっていない」
			//    ことを毎回確かめる必要があるため、その前提をコード側に持たせない
			//    （現状は変わらないが、確認の手間を将来に残さない）。
			await stopAutoplay(page);
			const nextPoint = await outerClickPoint(
				'.swiper-button-next',
				await measureHit('.swiper-button-next')
			);
			const before = await getRealIndex(page);
			await expectClickReaches('.swiper-button-next', nextPoint);
			await page.mouse.click(nextPoint.x, nextPoint.y);
			await waitForRealIndexChange(page, before);
		});
	}
});
