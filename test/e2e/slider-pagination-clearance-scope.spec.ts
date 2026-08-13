import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { saveDraftThenPublishViaRest } from './utils/publish';
import { registerPostCleanup } from './utils/post-cleanup';
import { waitForSwiperInit } from './utils/swiper';
import { measureArrowHitInnerEdge } from './utils/hit-area';

/**
 * スライダーブロック（本体）: ページネーションの左右クリアランス・モバイルの bullet 幅の適用範囲。
 *
 * 【背景 / #3069】
 *   旧セレクタ `.swiper-container-horizontal > .swiper-pagination-bullets` は Swiper v8 の
 *   クラス名変更以降ずっと不発だった。これを `.vk_slider` 起点に貼り直したが、その際に
 *   投稿リストスライダー（Pro）まで対象に含めると、Pro 側は pagination が
 *   `position: inherit`（通常フロー）で配置構造が異なるうえ、モバイル幅で bullet 幅が
 *   30px → 20px に変わるという意図しない見た目の変更が入ってしまう。
 *   そのため本体スライダー（`.vk_slider`）だけに限定している。
 *
 * このスペックで確認すること（モバイル幅 375px）:
 *   1. スライダー本体（mobile-bottom）は bullets に左右クリアランスが入り、bullet 幅は 20px
 *   2. スライダー本体（always-bottom）もモバイル幅では mobile-bottom と同じ扱い
 *   3. スライダー本体（hide / center）は矢印が bullets と並ばないため、
 *      左右クリアランス 0・bullet 幅 30px のまま
 *   4. 投稿リストスライダー（Pro）は左右クリアランス 0・bullet 幅 30px のまま（現状維持）
 *   5. 共通の端オフセット（`--vk-slider-edge-offset`）を上げると、矢印とページネーションが
 *      揃って下端から離れる。既定値では従来の位置から動かず、単位なしの不正値を
 *      指定しても既定の 10px にフォールバックしてレイアウトが壊れない
 *   6. bullets のポインタターゲット（不可視の `::before`）は、粗いポインタ（タッチ）でのみ
 *      高さだけ 24px に広がり、幅は描画サイズのまま。マウス（精細ポインタ）では広げない
 *      （スライド側のクリックを奪う副作用だけが残るため）。Pro は対象外
 *      （通常フローに置くため前後のコンテンツへ食い込む）
 *   7. bullets・矢印・停止/再生ボタンのフォーカスリングが同じ見た目で、
 *      テーマが `--vk-color-text-body` に明るい色を入れてもリングが白くならない
 *
 * flaky 防止のため固定待機（waitForTimeout）は使わず、要素の出現待機で確認する。
 */

const SLIDER = 'vk-blocks/slider';
const POST_LIST_SLIDER = 'vk-blocks/post-list-slider';

// 375px は PR の確認で基準にしているモバイル幅（bullets の収容数を測った幅）
const MOBILE_VIEWPORT = { width: 375, height: 900 };

// 位置の比較に使う許容幅（姉妹スペックと同じ ±2px）
const TOLERANCE_PX = 2;

const createdPostIds = registerPostCleanup();

/**
 * bullets 表示のスライダーブロックを公開する。矢印の位置は引数で切り替える。
 *
 * @param admin              Admin フィクスチャ
 * @param editor             Editor フィクスチャ
 * @param page               Page フィクスチャ
 * @param requestUtils       RequestUtils フィクスチャ
 * @param navigationPosition 矢印の位置（既定は mobile-bottom）
 * @param pagination         ページネーションの種類（既定は bullets）
 */
const publishSliderPost = async (
	admin: Admin,
	editor: Editor,
	page: Page,
	requestUtils: RequestUtils,
	navigationPosition:
		| 'mobile-bottom'
		| 'always-bottom'
		| 'hide'
		| 'center' = 'mobile-bottom',
	pagination: 'bullets' | 'fraction' = 'bullets'
): Promise<number> => {
	await admin.createNewPost();
	await editor.insertBlock({
		name: SLIDER,
		attributes: {
			// 高さの CSS はブレークポイントごとに出力されるため、pc だけ指定すると
			// 375px では高さが内容依存になり計測が不安定になる。姉妹スペック
			// `slider-navigation-sides-offset.spec.ts` と同じく 3 つとも指定する。
			pc: 300,
			tablet: 300,
			mobile: 300,
			unit: 'px',
			navigationPosition,
			pagination,
		},
		innerBlocks: [
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
 * bullets 表示・矢印は既定（mobile-bottom）の投稿リストスライダー（Pro）を公開する。
 * スライドに使う投稿も 2 件作成する。
 *
 * @param admin        Admin フィクスチャ
 * @param editor       Editor フィクスチャ
 * @param page         Page フィクスチャ
 * @param requestUtils RequestUtils フィクスチャ
 * @param pagination   ページネーションの種類（既定は bullets）
 */
const publishPostListSliderPost = async (
	admin: Admin,
	editor: Editor,
	page: Page,
	requestUtils: RequestUtils,
	pagination: 'bullets' | 'fraction' = 'bullets'
): Promise<number> => {
	for (const title of [
		'pagination scope post A',
		'pagination scope post B',
	]) {
		// requestUtils.rest() の戻りは型が付いていないため、publish.ts の
		// saveDraftThenPublishViaRest と同じように必要な形へ明示的にキャストする
		const seed = (await requestUtils.rest({
			path: '/wp/v2/posts',
			method: 'POST',
			data: { title, content: title, status: 'publish' },
		})) as { id: number };
		createdPostIds.push(seed.id);
	}

	await admin.createNewPost();
	await editor.insertBlock({
		name: POST_LIST_SLIDER,
		attributes: {
			navigationPosition: 'mobile-bottom',
			pagination,
		},
	});
	const postId = await saveDraftThenPublishViaRest(
		page,
		requestUtils,
		createdPostIds
	);
	return postId;
};

/**
 * モバイル幅でフロントの投稿を開き、計測できる状態になるまで待つ。
 *
 * 待つ対象を引数で受けるのは、bullets 表示では `.swiper-pagination-bullet`、
 * 枚数表示では `.swiper-pagination-fraction` と、Swiper が生成する要素が
 * ページネーションの種類で変わるため。
 *
 * @param page            Page フィクスチャ
 * @param postId          表示する投稿 ID
 * @param waitForSelector 出現を待つ要素のセレクタ
 */
const openSliderPageForMeasurement = async (
	page: Page,
	postId: number,
	waitForSelector: string
): Promise<void> => {
	await page.setViewportSize(MOBILE_VIEWPORT);
	await page.goto(`/?p=${postId}`);
	await page.locator(waitForSelector).first().waitFor();
	// 寸法確定前に測らないよう初期化完了も待つ（詳細は waitForSwiperInit の JSDoc）
	await waitForSwiperInit(page);
};

/**
 * フロントで bullets の左右 padding と bullet の幅を計測する。
 * Swiper が bullet を生成してから測るため、bullet の出現を待つ。
 *
 * `arrowHitInnerEdge` は前矢印（左）の当たり判定（不可視の ::before）の内端＝
 * bullets 側の端が、スライダーの左端から何 px の位置にあるかの実測値
 * （算出方法は measureArrowHitInnerEdge の JSDoc を参照）。
 * クリアランスはこの位置を下回ってはいけない（下回ると当たり判定が先頭 bullet の
 * タップを奪う）ため、「なぜこの余白が必要か」をそのまま検証できる基準として一緒に返す。
 * 矢印が無い（hide）場合は null を返す。
 *
 * @param page              Page フィクスチャ
 * @param postId            表示する投稿 ID
 * @param containerSelector スライダーコンテナのセレクタ
 */
const measurePagination = async (
	page: Page,
	postId: number,
	containerSelector: string
): Promise<{
	paddingLeft: number;
	paddingRight: number;
	bullet: number;
	gap: number;
	arrowHitInnerEdge: number | null;
}> => {
	await openSliderPageForMeasurement(
		page,
		postId,
		`${containerSelector} .swiper-pagination-bullet`
	);

	const arrowHitInnerEdge = await measureArrowHitInnerEdge(
		page,
		containerSelector,
		'.swiper-button-prev',
		'left'
	);

	const pagination = await page.evaluate((selector) => {
		const container = document.querySelector(selector) as HTMLElement;
		// 解決済みの container を起点にする
		const bullets = container.querySelector(
			'.swiper-pagination-bullets'
		) as HTMLElement;
		const items = bullets.querySelectorAll('.swiper-pagination-bullet');
		// 間隔は隣り合う 2 つの距離で測るため、2 枚以上ある前提を先に確かめる
		if (items.length < 2) {
			throw new Error(
				`${selector} の bullets が ${items.length} 枚しかありません（間隔を測るには 2 枚以上必要です）`
			);
		}
		const first = (items[0] as HTMLElement).getBoundingClientRect();
		const second = (items[1] as HTMLElement).getBoundingClientRect();
		const style = window.getComputedStyle(bullets);

		return {
			paddingLeft: parseFloat(style.paddingLeft),
			paddingRight: parseFloat(style.paddingRight),
			bullet: first.width,
			// 間隔はカスタムプロパティの値ではなく、隣り合う bullet の実距離で測る。
			// 変数を読むだけだと「変数が設定されていること」しか分からず、Swiper 側が
			// その変数を margin に使わなくなっても気付けない（間隔が実際に変わっても
			// テストは緑のまま通る）。Swiper は左右両方に margin を付けるため、
			// 実距離は変数の 2 倍になる。
			gap: second.left - first.right,
		};
	}, containerSelector);

	return { ...pagination, arrowHitInnerEdge };
};

/**
 * 端オフセット（`--vk-slider-edge-offset`）を `<style>` の挿入で指定する。
 *
 * 実ユーザーの指定経路はスタイルシートなので CSSOM の `setProperty` は使わない。
 * 登録済みカスタムプロパティへ文法違反の値を `setProperty` で渡すと、ブラウザに
 * よっては no-op になり前の値が残ってしまうためでもある。同じ id の `<style>` を
 * 使い回して `textContent` を丸ごと差し替えるので、呼ぶたびに値が積み上がらない。
 *
 * @param page  Page フィクスチャ
 * @param value 指定する値（不正値の検証で単位なしの文字列も渡す）
 */
const setEdgeOffset = async (page: Page, value: string) =>
	page.evaluate((v) => {
		const id = 'vk-edge-offset-test';
		const style =
			(document.getElementById(id) as HTMLStyleElement) ||
			document.head.appendChild(
				Object.assign(document.createElement('style'), { id })
			);
		style.textContent = `body { --vk-slider-edge-offset: ${v}; }`;
	}, value);

/**
 * 位置の比較を ±2px の許容幅で行う。
 *
 * サブピクセル描画の端数で落ちないようにするためで、許容幅は姉妹スペック
 * `slider-navigation-sides-offset.spec.ts` と揃えている。`toBeCloseTo` ではなく
 * 上下限で書くのは、失敗時のメッセージに実測値が出て切り分けが早くなるため。
 * bullet 幅や gap のような固定値の判定は端数が出ないので厳密比較のままにする。
 *
 * @param actual   実測値
 * @param expected 期待値
 * @param label    失敗時に何の比較か分かるようにするラベル
 */
const expectWithinTolerance = (
	actual: number,
	expected: number,
	label: string
) => {
	const message = `${label}（期待 ${expected}px ±${TOLERANCE_PX}px / 実測 ${actual}px）`;
	expect(actual, message).toBeGreaterThanOrEqual(expected - TOLERANCE_PX);
	expect(actual, message).toBeLessThanOrEqual(expected + TOLERANCE_PX);
};

/**
 * その実行のポインタ種別が期待どおりかを確かめる。
 *
 * bullets のポインタターゲットは `@media (any-pointer: coarse)` 限定なので、テストが
 * 前提しているポインタ種別が崩れると「広がらない／広がる」の判定が意味を失う。
 * とくにタッチ側は、`hasTouch: true` が効いていないと ::before が生成されないまま
 * 「広がっていない」ことを確認してしまい、静かに検証にならなくなる。
 * 前提が崩れたことをその場で名指しで落とすため、計測の前に確かめる。
 *
 * @param page     Page フィクスチャ
 * @param expected 期待するポインタ種別（true = 粗いポインタあり）
 */
const expectAnyPointerCoarse = async (page: Page, expected: boolean) => {
	const actual = await page.evaluate(
		() => window.matchMedia('(any-pointer: coarse)').matches
	);
	expect(
		actual,
		expected
			? 'このテストはタッチ環境（hasTouch: true）を前提にしています'
			: 'このテストは精細ポインタのみの環境（hasTouch: false）を前提にしています'
	).toBe(expected);
};

/**
 * computed の `bottom` を px の数値に解決する。
 *
 * `bottom` が `auto` に解決される（＝絶対配置でなくなり、下端からの距離という基準自体が
 * 成り立たない）と `parseFloat` は NaN を返す。そのまま許容幅の比較に渡すと「範囲外」と
 * しか報告されず配置が変わったことが読み取れないため、ここで数値であることを確かめて
 * 原因を名指しする。bullets と枚数表示の両方から呼ぶので、判定条件とメッセージが
 * 片方だけ変わることがないよう 1 箇所にまとめている。
 *
 * @param raw   `getComputedStyle(...).bottom` の実効値
 * @param label 失敗時に何の bottom か分かるようにするラベル
 */
const toResolvedBottom = (raw: string, label: string): number => {
	const value = parseFloat(raw);
	expect(
		Number.isNaN(value),
		`${label} の bottom が px に解決されていません（配置が変わっている可能性があります）: ${raw}`
	).toBe(false);
	return value;
};

test.describe('ページネーションのクリアランス適用範囲 (#3069)', () => {
	// mobile-bottom（既定）と always-bottom は、モバイル幅ではどちらも矢印が下部にあるため
	// 同じくクリアランス＋bullet 縮小が掛かる（両者で挙動が割れない）。
	// 期待値が完全に同じなので、hide / center と同じくループで 1 箇所にまとめる。
	for (const navigationPosition of [
		'mobile-bottom',
		'always-bottom',
	] as const) {
		test(`スライダー本体(矢印 ${navigationPosition}): モバイル幅で bullets に左右クリアランスが入り bullet は 20px になる`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const postId = await publishSliderPost(
				admin,
				editor,
				page,
				requestUtils,
				navigationPosition
			);
			const {
				paddingLeft,
				paddingRight,
				bullet,
				gap,
				arrowHitInnerEdge,
			} = await measurePagination(page, postId, '.vk_slider');

			// クリアランスが前矢印の当たり判定の内端（bullets 側の端）と一致していること。
			// 下限だけ（例 > 30）だと、端オフセットと当たり判定の半分だけで 32px に達するため
			// 式から矢印中心までの距離が抜け落ちても通ってしまい、この余白が存在する理由
			// （当たり判定が先頭 bullet のタップを奪わない）を検証できない。
			expect(arrowHitInnerEdge).not.toBeNull();
			expectWithinTolerance(
				paddingLeft,
				arrowHitInnerEdge as number,
				'paddingLeft'
			);
			expectWithinTolerance(
				paddingRight,
				arrowHitInnerEdge as number,
				'paddingRight'
			);
			// bullet は width: 20px の固定指定なので端数は出ない
			expect(bullet).toBe(20);
			// 間隔は Swiper が左右に付ける margin 4px の合計＝8px。
			// サブピクセル描画の端数を許容して比較する
			expectWithinTolerance(gap, 8, 'bullet の間隔');
		});
	}

	// hide / center は矢印が bullets と同じ高さに並ばないため、クリアランスも
	// モバイルの bullet 縮小も掛からず、通常の 30px のままであることを固定する。
	for (const navigationPosition of ['hide', 'center'] as const) {
		test(`スライダー本体(矢印 ${navigationPosition}): モバイル幅でもクリアランス 0・bullet 30px のまま`, async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const postId = await publishSliderPost(
				admin,
				editor,
				page,
				requestUtils,
				navigationPosition
			);
			const { paddingLeft, paddingRight, bullet, gap } =
				await measurePagination(page, postId, '.vk_slider');

			expect(paddingLeft).toBe(0);
			expect(paddingRight).toBe(0);
			// bullet は width: 30px の固定指定なので端数は出ない
			expect(bullet).toBe(30);
			// クリアランスが無いので間隔も縮めない（既定の margin 5px の合計＝10px）
			expectWithinTolerance(gap, 10, 'bullet の間隔');
		});
	}

	test('投稿リストスライダー(Pro): モバイル幅でもクリアランス 0・bullet 30px のまま（本 PR で変更しない）', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishPostListSliderPost(
			admin,
			editor,
			page,
			requestUtils
		);
		const { paddingLeft, paddingRight, bullet } = await measurePagination(
			page,
			postId,
			'.vk_post_list_slider'
		);

		expect(paddingLeft).toBe(0);
		expect(paddingRight).toBe(0);
		expect(bullet).toBe(30);
	});

	// 端オフセットは公開の CSS カスタムプロパティなので、テーマ・ユーザー CSS から
	// 指定された時に矢印とページネーションが揃って動くこと（矢印だけ下端から離れて bullets が
	// 取り残されないこと）と、単位なしの不正値でレイアウトが壊れないことを固定する。
	test('共通の端オフセットを変えると矢印とページネーションが揃って追従する', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils
		);
		await openSliderPageForMeasurement(
			page,
			postId,
			'.vk_slider .swiper-pagination-bullet'
		);

		// 矢印の下端からの距離（モバイル幅では mobile-bottom で下部に回り込む）と、
		// bullets の下端からの距離をまとめて測る
		const measure = async () => {
			// 次矢印（右）の当たり判定の内端＝bullets 側の端が、スライダーの右端から
			// 何 px の位置にあるか。クリアランスはこの値と一致していなければならない
			const arrowHitInnerEdge = await measureArrowHitInnerEdge(
				page,
				'.vk_slider',
				'.swiper-button-next',
				'right'
			);
			// 前段のテストと同じく、値を使う前に矢印が取れたことを確かめる
			// （null のまま比較に流すと「範囲外」としか報告されない）
			expect(
				arrowHitInnerEdge,
				'次矢印の当たり判定が取得できませんでした'
			).not.toBeNull();
			const rest = await page.evaluate(() => {
				const container = document.querySelector(
					'.vk_slider'
				) as HTMLElement;
				const next = container.querySelector(
					'.swiper-button-next'
				) as HTMLElement;
				const bullets = container.querySelector(
					'.swiper-pagination-bullets'
				) as HTMLElement;
				const containerRect = container.getBoundingClientRect();
				const style = window.getComputedStyle(bullets);

				return {
					arrowBottom:
						containerRect.bottom -
						next.getBoundingClientRect().bottom,
					// 数値化は呼び出し側で行う（auto を検出できるよう実効値のまま返す）
					paginationBottomRaw: style.bottom,
					paginationPaddingLeft: parseFloat(style.paddingLeft),
					paginationPaddingRight: parseFloat(style.paddingRight),
				};
			});
			const { paginationBottomRaw, ...metrics } = rest;
			return {
				...metrics,
				paginationBottom: toResolvedBottom(
					paginationBottomRaw,
					'bullets'
				),
				arrowHitInnerEdge: arrowHitInnerEdge!,
			};
		};

		// 既定: 矢印は端から 10px、bullets は下端から 8px。
		// この 8px は vk-blocks が common.scss で `--swiper-pagination-bottom` に
		// 設定している値（$swiper-pagination-bullets-bottom。Swiper 既定と同値にして
		// 既存の見た目を動かさない選択）で、実際に位置を決めているのは
		// Swiper CSS 側の `bottom: var(--swiper-pagination-bottom, 8px)` という宣言。
		// つまり「変数名」と「Swiper がその変数を bottom で読む」という契約に依存している。
		// どちらかが変わったらこのテストも一緒に直す必要がある。
		const initial = await measure();
		expectWithinTolerance(initial.arrowBottom, 10, 'initial.arrowBottom');
		expectWithinTolerance(
			initial.paginationBottom,
			8,
			'initial.paginationBottom'
		);
		const defaultPaddingLeft = initial.paginationPaddingLeft;
		expect(defaultPaddingLeft).toBeGreaterThan(0);

		// 30px に上げると、矢印は 30px、bullets も同じ 20px ぶん下端から離れて 28px になる
		// （＝矢印が bullet 列の上に来ない）
		await setEdgeOffset(page, '30px');
		const raised = await measure();
		expectWithinTolerance(raised.arrowBottom, 30, 'raised.arrowBottom');
		expectWithinTolerance(
			raised.paginationBottom,
			28,
			'raised.paginationBottom'
		);
		// 左右のクリアランスも同じぶん（20px）広がり、広がった後も矢印の当たり判定の
		// 内端と一致している（負値フェーズと同じ厚みで契約を確認する）
		expectWithinTolerance(
			raised.paginationPaddingLeft,
			defaultPaddingLeft + 20,
			'raised.paginationPaddingLeft: 既定から 20px 広がっている'
		);
		expectWithinTolerance(
			raised.paginationPaddingLeft,
			raised.arrowHitInnerEdge,
			'raised.paginationPaddingLeft: 矢印の当たり判定の内端と一致'
		);
		expectWithinTolerance(
			raised.paginationPaddingRight,
			raised.paginationPaddingLeft,
			'raised.paginationPaddingRight: paginationPaddingLeft と一致'
		);

		// 単位なしの不正値は @property の登録により既定の 10px に落ちる。
		// 登録が無いと padding だけが 0 になり bullets が矢印の下に潜る。
		await setEdgeOffset(page, '10');
		const invalid = await measure();
		expectWithinTolerance(invalid.arrowBottom, 10, 'invalid.arrowBottom');
		expectWithinTolerance(
			invalid.paginationBottom,
			8,
			'invalid.paginationBottom'
		);
		expectWithinTolerance(
			invalid.paginationPaddingLeft,
			defaultPaddingLeft,
			'invalid.paginationPaddingLeft'
		);

		// 負の値も <length> としては妥当なため通ってしまう。0 を下限にクランプして
		// いないとクリアランスが負になり padding が 0 に落ち、当たり判定が先頭 bullet の
		// タップを奪う状態（このオフセットが塞いだ穴）に戻る。
		await setEdgeOffset(page, '-30px');
		const negative = await measure();
		expectWithinTolerance(negative.arrowBottom, 0, 'negative.arrowBottom');
		expectWithinTolerance(
			negative.paginationBottom,
			8,
			'negative.paginationBottom'
		);
		// 「0 より大きい」だけだとクリアランスの式が崩れても通ってしまうため、
		// クランプ後も矢印の当たり判定の内端と一致していることまで確認する
		expectWithinTolerance(
			negative.paginationPaddingLeft,
			negative.arrowHitInnerEdge,
			'negative.paginationPaddingLeft'
		);
		expectWithinTolerance(
			negative.paginationPaddingRight,
			negative.arrowHitInnerEdge,
			'negative.paginationPaddingRight'
		);
	});

	// 枚数表示（fraction）の bottom 追従は本体スライダー限定。投稿リストスライダー（Pro）は
	// pagination を通常フローに置くため、追従させるとスライド側へ食い込んでしまう。
	test('スライド枚数表示の端オフセット追従は本体スライダーだけに効く', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		// 枚数表示の下端からの距離を読むだけのヘルパ（副作用は持たせない）。
		// px に解決されているかの確認は toResolvedBottom に任せる（bullets 側と共通）。
		const readFractionBottom = async (containerSelector: string) => {
			const bottom = await page.evaluate((selector) => {
				const fraction = document.querySelector(
					`${selector} .swiper-pagination-fraction`
				) as HTMLElement | null;
				// 見つからないまま getComputedStyle に渡すと TypeError になり、
				// どのコンテナの枚数表示が無かったのか読み取れない。
				// 近くの計測ヘルパーと同じく名指しで落とす。
				if (!fraction) {
					throw new Error(
						`${selector} .swiper-pagination-fraction が見つかりません`
					);
				}
				return window.getComputedStyle(fraction).bottom;
			}, containerSelector);
			return toResolvedBottom(bottom, `${containerSelector} の枚数表示`);
		};

		// 投稿の作成（エディタ操作）は既定の PC 幅のまま先に済ませる。
		// モバイル幅ではエディタ UI が切り替わり、ブロック挿入が不安定になり得るため
		const sliderPostId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'mobile-bottom',
			'fraction'
		);
		const proPostId = await publishPostListSliderPost(
			admin,
			editor,
			page,
			requestUtils,
			'fraction'
		);

		// 以降はフロントの計測のみ
		await openSliderPageForMeasurement(
			page,
			sliderPostId,
			'.vk_slider .swiper-pagination-fraction'
		);
		const sliderInitial = await readFractionBottom('.vk_slider');
		await setEdgeOffset(page, '30px');
		const sliderRaised = await readFractionBottom('.vk_slider');
		// 既定は従来どおり 5px、30px 指定で同じ 20px ぶん下端から離れる
		expectWithinTolerance(sliderInitial, 5, 'slider.initial');
		expectWithinTolerance(sliderRaised, 25, 'slider.raised');

		await openSliderPageForMeasurement(
			page,
			proPostId,
			'.vk_post_list_slider .swiper-pagination-fraction'
		);
		const proInitial = await readFractionBottom('.vk_post_list_slider');
		await setEdgeOffset(page, '30px');
		const proRaised = await readFractionBottom('.vk_post_list_slider');
		// Pro は端オフセットを上げても位置が変わらない
		expectWithinTolerance(proInitial, 5, 'pro.initial');
		expectWithinTolerance(proRaised, proInitial, 'pro.raised');
	});

	// マウス（精細ポインタ）では 24px のターゲットを出さない。bullet は positioned で
	// pointer-events: auto を保つため、広げるとスライド側のリンク・ボタンより手前に
	// 帯ができてクリックを奪う。指の縦ブレを吸収するという恩恵はタッチ環境のものなので、
	// マウスでは副作用だけが残る。既定のフィクスチャ（hasTouch: false）で確認する。
	test('マウス環境では bullets のポインタターゲットを広げない', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		const postId = await publishSliderPost(
			admin,
			editor,
			page,
			requestUtils
		);
		await openSliderPageForMeasurement(
			page,
			postId,
			'.vk_slider .swiper-pagination-bullet'
		);
		// 前提（この実行が精細ポインタのみであること）が崩れたら、それと分かるように落とす
		await expectAnyPointerCoarse(page, false);

		const before = await page.evaluate(() => {
			const bullet = document.querySelector(
				'.vk_slider > .swiper-pagination-bullets > .swiper-pagination-bullet'
			) as HTMLElement | null;
			if (!bullet) {
				throw new Error(
					'.vk_slider > .swiper-pagination-bullets > .swiper-pagination-bullet が見つかりません'
				);
			}
			const style = window.getComputedStyle(bullet, '::before');
			return {
				content: style.content,
				height: style.height,
			};
		});

		expect(
			before.height,
			`マウス環境で ::before が生成されています（content: ${before.content}）`
		).toBe('auto');
	});

	// bullets の描画バーは高さ 5px しかないため、不可視の ::before で縦だけ 24px の
	// ポインタターゲットを与えている。横に広げると隣の bullet のターゲットと、矢印のために
	// 空けたクリアランス（バーを 20px に縮めてまで確保したもの）を侵食するため、
	// 「縦だけ広い・横は描画サイズのまま」を固定する。
	// タッチ環境限定のルールなので hasTouch: true で実行する。
	test.describe('タッチ環境', () => {
		test.use({ hasTouch: true });

		test('bullets のポインタターゲットは高さだけ 24px に広がり、幅は描画サイズのまま', async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const postId = await publishSliderPost(
				admin,
				editor,
				page,
				requestUtils
			);
			await openSliderPageForMeasurement(
				page,
				postId,
				'.vk_slider .swiper-pagination-bullet'
			);
			// マウス側と対になる前提の確認。hasTouch が効いていないと ::before が
			// 生成されず、下の 24px の判定が「広がっていない」で落ちるだけになり、
			// 原因が CSS なのか実行環境なのか切り分けられない
			await expectAnyPointerCoarse(page, true);

			const target = await page.evaluate(() => {
				// 直下結合子で取るのは、CSS のルール自体が
				// `.vk_slider > .swiper-pagination-bullets > .swiper-pagination-bullet` に
				// 限定されているため（スライド内に入れ子にした Pro へ漏らさないための形）。
				// ルールが当たる要素そのものを測らないと、スコープが崩れても気付けない。
				// 待機は子孫セレクタなので、Swiper のマークアップ階層が変わると待機だけ
				// 成功してここが null になり得る。TypeError で理由が読めなくなるより、
				// 何が見つからなかったのかを名指しで落とす。
				const bullet = document.querySelector(
					'.vk_slider > .swiper-pagination-bullets > .swiper-pagination-bullet'
				) as HTMLElement | null;
				if (!bullet) {
					throw new Error(
						'.vk_slider > .swiper-pagination-bullets > .swiper-pagination-bullet が見つかりません（Swiper のマークアップ階層が変わり、CSS のスコープが当たらなくなっている可能性があります）'
					);
				}
				const before = window.getComputedStyle(bullet, '::before');
				return {
					painted: bullet.getBoundingClientRect(),
					beforeWidth: before.width,
					beforeHeight: before.height,
					// ::before が実際に当たり判定として働くには絶対配置である必要がある
					beforePosition: before.position,
				};
			});

			expect(target.beforePosition).toBe('absolute');
			// 縦は 24px（WCAG 2.2 SC 2.5.8）
			expect(parseFloat(target.beforeHeight)).toBeCloseTo(24, 1);
			// 横は描画バーと同じ（モバイル幅なのでクリアランスが効いて 20px）
			expect(target.painted.width).toBe(20);
			expect(parseFloat(target.beforeWidth)).toBeCloseTo(
				target.painted.width,
				1
			);
		});

		// Pro は pagination を通常フロー（position: inherit）に置くため、bullets を縦に広げると
		// スライドではなく前後のコンテンツへ食い込む。他のルールと同じく対象外であることを固定する。
		test('投稿リストスライダー(Pro): bullets のポインタターゲットは広げない', async ({
			admin,
			editor,
			page,
			requestUtils,
		}) => {
			const postId = await publishPostListSliderPost(
				admin,
				editor,
				page,
				requestUtils
			);
			await openSliderPageForMeasurement(
				page,
				postId,
				'.vk_post_list_slider .swiper-pagination-bullet'
			);
			// ここが最も前提に依存する。hasTouch が効いていないとルール自体が
			// 効かないため、Pro のスコープが崩れていても「広がっていない」で通ってしまう
			await expectAnyPointerCoarse(page, true);

			const before = await page.evaluate(() => {
				const bullet = document.querySelector(
					'.vk_post_list_slider .swiper-pagination-bullet'
				) as HTMLElement | null;
				if (!bullet) {
					throw new Error(
						'.vk_post_list_slider .swiper-pagination-bullet が見つかりません'
					);
				}
				const style = window.getComputedStyle(bullet, '::before');
				return { content: style.content, height: style.height };
			});

			// 「24px ではない」だけだと、将来 Pro に別の高さ（20px 等）のターゲットが足された時に
			// スコープが崩れてもテストが緑のまま通ってしまう。確かめたいのは「ルールが当たらず
			// ::before がそもそも生成されていない」ことなので、height が auto であることを見る
			// （`utils/hit-area.ts` も「auto = ::before が無い」という前提で作られている）。
			expect(
				before.height,
				`Pro の bullets に ::before が生成されています（content: ${before.content}）。ポインタターゲットのルールが Pro にも当たっています`
			).toBe('auto');
		});
	});

	// bullets だけにフォーカスリングを指定していた時期があり、矢印と停止/再生ボタンは
	// ブラウザ既定のリングのままだった。3 つで同じリングになっていることを固定する。
	// あわせて、リング色がテーマ変数ではなくリテラルであること（明るい本文色のテーマで
	// 「白いリング＋白いハロー」になってフォーカス表示が消えないこと）も固定する。
	test('bullets・矢印・停止/再生ボタンのフォーカスリングが揃い、テーマ色に影響されない', async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		await admin.createNewPost();
		await editor.insertBlock({
			name: SLIDER,
			attributes: {
				pc: 300,
				tablet: 300,
				mobile: 300,
				unit: 'px',
				navigationPosition: 'center',
				pagination: 'bullets',
				autoPlay: true,
				pauseButton: true,
			},
			innerBlocks: [
				{ name: 'vk-blocks/slider-item' },
				{ name: 'vk-blocks/slider-item' },
			],
		});
		const postId = await saveDraftThenPublishViaRest(
			page,
			requestUtils,
			createdPostIds
		);

		await openSliderPageForMeasurement(
			page,
			postId,
			'.vk_slider .swiper-pagination-bullet'
		);
		// bullets 以外の 2 つは openSliderPageForMeasurement の待機対象に含まれないため、
		// ここで明示的に出現を待つ。待たずに readFocusRing へ渡すと、要素が無い場合に
		// `el.focus()` の TypeError になり「何が無かったのか」が読み取れない。
		// 姉妹スペック `slider-navigation-sides-offset.spec.ts` と同じ待ち方に揃える。
		await page.locator('.vk_slider .swiper-button-prev').first().waitFor();
		await page.locator('.vk_slider .swiper-pause-button').first().waitFor();

		/**
		 * 対象要素にフォーカスを当て、リングの計算値を読む。
		 *
		 * `:focus-visible` はキーボード操作でしか立たないため、`click()` ではなく
		 * `focus()` で当てる（Chromium はスクリプトからのフォーカスでも
		 * `:focus-visible` を立てる。matches() で実際に立っていることも確認する）。
		 *
		 * @param selector 対象要素のセレクタ
		 */
		const readFocusRing = async (selector: string) =>
			page.evaluate((sel) => {
				const el = document.querySelector(sel) as HTMLElement;
				el.focus();
				const style = window.getComputedStyle(el);
				return {
					focusVisible: el.matches(':focus-visible'),
					outlineColor: style.outlineColor,
					outlineWidth: style.outlineWidth,
					outlineOffset: style.outlineOffset,
					boxShadow: style.boxShadow,
				};
			}, selector);

		const bullet = await readFocusRing(
			'.vk_slider .swiper-pagination-bullet'
		);
		const arrow = await readFocusRing('.vk_slider .swiper-button-prev');
		const pause = await readFocusRing('.vk_slider .swiper-pause-button');

		for (const [name, ring] of [
			['bullet', bullet],
			['arrow', arrow],
			['pause', pause],
		] as const) {
			expect(
				ring.focusVisible,
				`${name}: :focus-visible が立っていない`
			).toBe(true);
			// リング色はリテラル #333。テーマ変数を読んでいると白系になり得る
			expect(ring.outlineColor, `${name}: リング色`).toBe(
				'rgb(51, 51, 51)'
			);
			expect(ring.outlineWidth, `${name}: リングの太さ`).toBe('2px');
			expect(ring.outlineOffset, `${name}: リングのオフセット`).toBe(
				'2px'
			);
			// 外側の白ハローはリングの外端（offset 2px + width 2px = 4px）を越える必要がある
			expect(ring.boxShadow, `${name}: 白ハロー`).toContain('6px');
		}

		// 3 つのリングが同一であること（片方だけ直して見た目が分かれるのを防ぐ）
		expect(arrow.outlineColor).toBe(bullet.outlineColor);
		expect(arrow.boxShadow).toBe(bullet.boxShadow);
		expect(pause.outlineColor).toBe(bullet.outlineColor);
		expect(pause.boxShadow).toBe(bullet.boxShadow);

		// リングの内外どちらの色もテーマから動かせないことを固定する。
		// 片方でも変数を読んでいると「暗いリング＋暗いハロー」または「白リング＋白ハロー」に
		// なり得て、明暗どちらかの画像でフォーカス位置が消える（このリングが塞いだ穴の再現）。
		// 内側 1px だけは常時ヘアラインの再現なので変数のままが正しく、ここでは見ない。
		await page.evaluate(() => {
			const style = document.createElement('style');
			style.textContent =
				':root { --vk-color-text-body: #fff; --vk-color-background-white-translucent: rgba(0, 0, 0, 0.5); }';
			document.head.appendChild(style);
		});
		const bulletAfter = await readFocusRing(
			'.vk_slider .swiper-pagination-bullet'
		);
		expect(bulletAfter.outlineColor, 'リング色').toBe('rgb(51, 51, 51)');
		expect(bulletAfter.boxShadow, '外側の白ハロー').toContain(
			'rgba(255, 255, 255, 0.5) 0px 0px 0px 6px'
		);
	});
});
