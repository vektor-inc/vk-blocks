import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Admin, RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { registerPostCleanup } from './utils/post-cleanup';

/**
 * スライダーブロック: 旧クラス `swiper-container` を含む保存済みコンテンツの移行挙動（#3069）。
 *
 * 【背景】
 *   Swiper が v8 で `swiper-container` を `swiper` にリネームしたため、save 出力から旧クラスを
 *   削除した。旧形式（〜1.124.0）は deprecated/save/1.124.0 + isEligible で救済しており、
 *   ブロックは valid のまま、旧クラスは「追加 CSS クラス」に混入しない。
 *
 * 【このスペックで固定する挙動】
 *   1. 旧形式の投稿をエディタで開いてもリカバリーが不要（isValid）で、className に
 *      `swiper-container` が入らない。かつ投稿は dirty にならない
 *      （= 開くだけで「変更あり」にしない。issue #2556 と同じ方針）
 *   2. 何も編集せずに更新した場合、post_content は書き換わらず旧クラスは残る。
 *      `savePost()` は `content: getEditedPostContent()` を必ず edits に含めるが、
 *      この selector はブロックが編集されている時だけ直列化する（`record.blocks` が
 *      無い場合は元の `record.content` をそのまま返す）ため、未編集なら元のマークアップが
 *      そのまま送られる。deprecated の migrate 結果を「編集」として扱わないのは仕様。
 *      旧クラスは Swiper からも CSS からも参照されない（初期化は data-vkb-slider 属性、
 *      スタイルは .vk_slider 起点）ので、残っていても表示・動作は現行形式と同じ。
 *   3. ブロックを実際に編集して更新した場合も旧クラスが除去され、ユーザーが設定した
 *      追加 CSS クラスは維持される。
 *   4. 停止/再生ボタン付き・ズーム有効といった派生（save 出力が異なる）でも同じく
 *      救済され、それぞれの属性が失われない。かつ 1. と同じく dirty にならない。
 *   5. ユーザーが自分で「追加 CSS クラス」に `swiper-container` を入れていた場合は、
 *      isEligible が false になりこの deprecated を適用しないため、編集して
 *      直列化し直してもそのクラスは維持される（勝手に削らない）。
 *
 * flaky 防止のため固定待機（waitForTimeout）は使わず、状態待機で確認する。
 */

const SLIDER = 'vk-blocks/slider';
const LEGACY_CLASS = 'swiper-container';

// 旧形式（1.124.0 まで）の保存済みマークアップ。fixture を実データとして再利用する。
// 実行時のカレントディレクトリに依存しないよう、このファイルの位置から解決する
const FIXTURE_DIR = path.join(
	__dirname,
	'..',
	'e2e-tests',
	'fixtures',
	'blocks'
);
const readFixture = (name: string): string =>
	readFileSync(path.join(FIXTURE_DIR, name), 'utf8');

const createdPostIds = registerPostCleanup();

/**
 * 旧形式のマークアップをそのまま content に持つ公開済み投稿を作る。
 *
 * @param requestUtils RequestUtils フィクスチャ
 * @param fixtureName  fixture のファイル名
 * @param title        投稿タイトル
 */
const createLegacyPost = async (
	requestUtils: RequestUtils,
	fixtureName: string,
	title: string
): Promise<number> => {
	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: {
			title,
			content: readFixture(fixtureName),
			status: 'publish',
		},
	});
	createdPostIds.push(post.id);
	return post.id;
};

/**
 * 投稿をエディタで開き、スライダーブロックがパース（＝自動 migrate）されるまで待つ。
 *
 * @param admin  Admin フィクスチャ
 * @param page   Page フィクスチャ
 * @param postId 開く投稿 ID
 */
const openPostWithSlider = async (
	admin: Admin,
	page: Page,
	postId: number
): Promise<void> => {
	await admin.editPost(postId);
	await page.waitForFunction(
		(blockName) =>
			window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.some((block) => block.name === blockName),
		SLIDER
	);
};

/**
 * 保存が完了する（isSavingPost が false になる）まで待つ。
 *
 * `savePost()` を await した時点では通常もう false なので、多くの場合この待機は
 * 1 回目のポーリングで即座に抜ける。それでも残しているのは、保存が既に進行中
 * （オートセーブ等）だと `savePost()` が自分の保存を待たずに解決し得るためで、
 * 「保存が終わってから REST で content を読む」という後続の前提を
 * dispatch の戻りではなくストアの状態で担保したいから。
 * 消すと保存中の content を読んでしまう経路が開く。
 *
 * @param page Page フィクスチャ
 */
const waitForSaveDone = async (page: Page): Promise<void> => {
	await page.waitForFunction(
		() => !window.wp.data.select('core/editor').isSavingPost()
	);
};

/**
 * 「更新」を押した時と同じ保存を実行し、完了まで待つ。
 *
 * @param page Page フィクスチャ
 */
const savePostAndWait = async (page: Page): Promise<void> => {
	await page.evaluate(async () => {
		await window.wp.data.dispatch('core/editor').savePost();
	});
	await waitForSaveDone(page);
};

/**
 * スライダーブロックの属性を 1 つ変更し、「変更あり」になってから保存する。
 *
 * 実際の編集操作の代わりに属性を変更する（保存対象になる最小の変更）。
 * 編集がブロックエディタからエディタへ伝わるのは同期的とは限らないため、
 * dirty を待たずに保存すると編集前の content がそのまま保存され得る。
 *
 * 渡した値が現在値と同じだと updateBlockAttributes は何も変えず、dirty にならないため
 * 下の待機が「何を待っていたのか分からないタイムアウト」で落ちる。fixture の値が
 * 変わって指定値と一致した時にそれと分かるよう、変更にならない場合はその場で落とす。
 *
 * @param page       Page フィクスチャ
 * @param attributes 変更する属性
 */
const editBlockThenSave = async (
	page: Page,
	attributes: Record<string, unknown>
): Promise<void> => {
	await page.evaluate(
		([blockName, attrs]) => {
			const { select, dispatch } = window.wp.data;
			const slider = select('core/block-editor')
				.getBlocks()
				.find((block) => block.name === blockName);
			// 見つからないまま属性を読むと「undefined のプロパティ」という
			// 何のブロックの話か分からない例外になるため、先に名指しで落とす
			if (!slider) {
				throw new Error(
					`${blockName} ブロックが見つかりません（openPostWithSlider で待ってから呼んでください）`
				);
			}
			const unchanged = Object.entries(
				attrs as Record<string, unknown>
			).every(([key, value]) => slider.attributes[key] === value);
			if (unchanged) {
				throw new Error(
					`ブロックの属性が変更になりません（現在値と同じ）: ${JSON.stringify(
						attrs
					)}。fixture の値を確認してください`
				);
			}
			dispatch('core/block-editor').updateBlockAttributes(
				slider.clientId,
				attrs
			);
		},
		[SLIDER, attributes] as [string, Record<string, unknown>]
	);
	await page.waitForFunction(() =>
		window.wp.data.select('core/editor').isEditedPostDirty()
	);
	await savePostAndWait(page);
};

/**
 * エディタで開いたスライダーブロックの状態を読む。
 *
 * `isDirty` は投稿全体の「変更あり」状態（ブロックの属性ではない）。旧形式を開いた時に
 * migrate が走っても「編集」として扱われないことを確認するために、同じ 1 回の evaluate で
 * まとめて読む。
 *
 * @param page          Page フィクスチャ
 * @param attributeName あわせて読みたい属性名。不要な場合は省略する
 * @return ブロックの `isValid` / `className`、投稿の `isDirty`、および指定した属性の値
 *   （`attributeName` を省略した場合は `attributeValue` は null）
 */
const readSliderState = async (page: Page, attributeName?: string) =>
	page.evaluate(
		([blockName, attribute]) => {
			const { select } = window.wp.data;
			const slider = select('core/block-editor')
				.getBlocks()
				.find((block) => block.name === blockName);
			// editBlockThenSave と同じく、見つからない場合は名指しで落とす
			if (!slider) {
				throw new Error(
					`${blockName} ブロックが見つかりません（openPostWithSlider で待ってから呼んでください）`
				);
			}
			return {
				isValid: slider.isValid,
				className: slider.attributes.className ?? null,
				isDirty: select('core/editor').isEditedPostDirty(),
				attributeValue: attribute
					? (slider.attributes[attribute] ?? null)
					: null,
			};
		},
		[SLIDER, attributeName ?? null]
	);

/**
 * REST API で保存済みの post_content を取得する。
 *
 * @param requestUtils RequestUtils フィクスチャ
 * @param postId       取得する投稿 ID
 */
const getSavedContent = async (
	requestUtils: RequestUtils,
	postId: number
): Promise<string> => {
	const post = await requestUtils.rest({
		// `context` は `path` ではなく `params` で渡す。理由は
		// test/e2e/utils/post-cleanup.ts のコメントを参照。
		// `context` goes through `params`, not `path`.
		// See test/e2e/utils/post-cleanup.ts for why.
		path: `/wp/v2/posts/${postId}`,
		params: { context: 'edit' },
	});
	return post.content.raw as string;
};

/**
 * 保存済み content からスライダーブロックのブロックコメントの属性を取り出す。
 *
 * `content.includes('swiper-container')` だけでは、**ルート要素の class に旧クラスが
 * 残っている場合**（＝ deprecated が旧クラスを除去できていない状態）でも通ってしまい、
 * 「ユーザーが設定した追加 CSS クラスが維持された」ことの検証にならない。属性として
 * どこに入っているかを見分けるため、ブロックコメントの JSON を実際にパースする。
 *
 * @param content 保存済みの post_content
 * @return ブロックコメントの属性オブジェクト
 */
const parseSliderBlockAttributes = (
	content: string
): Record<string, unknown> => {
	const match = content.match(
		new RegExp(`<!--\\s*wp:${SLIDER}\\s+(\\{[\\s\\S]*?\\})\\s*-->`)
	);
	if (!match) {
		throw new Error(
			`保存済み content に ${SLIDER} のブロックコメント（属性付き）が見つかりません`
		);
	}
	return JSON.parse(match[1]) as Record<string, unknown>;
};

/**
 * ブロックコメントの `className` 属性をクラス名の配列として返す。
 *
 * @param content 保存済みの post_content
 */
const getSavedClassNames = (content: string): string[] => {
	const className = parseSliderBlockAttributes(content).className;
	return typeof className === 'string'
		? className.split(/\s+/).filter(Boolean)
		: [];
};

test.describe('スライダー: 旧クラス swiper-container の移行 (#3069)', () => {
	test('旧形式を開いてもリカバリー不要・追加CSSクラスに混入しない・投稿は dirty にならない', async ({
		admin,
		page,
		requestUtils,
	}) => {
		const postId = await createLegacyPost(
			requestUtils,
			'vk-blocks__slider__deprecated-1-124-0.html',
			'legacy swiper-container: plain'
		);
		await openPostWithSlider(admin, page, postId);

		const state = await readSliderState(page);

		expect(state.isValid).toBe(true);
		expect(state.className).toBeNull();
		// 開くだけでは「変更あり」にしない（離脱警告・意図しないリビジョンを出さない）
		expect(state.isDirty).toBe(false);
	});

	// 旧形式には停止/再生ボタン付き・ズーム有効といった派生があり、それぞれ save 出力
	// （＝deprecated の照合対象）が違う。どちらも 1.124.0 の deprecated で救済され、
	// 属性が保たれたまま旧クラスだけが落ちることを固定する。
	for (const { fixture, attribute } of [
		{ fixture: 'pause-button', attribute: 'pauseButton' },
		{ fixture: 'zoom', attribute: 'zoomAnimation' },
	]) {
		test(`旧形式(${fixture}): リカバリー不要で ${attribute} が保たれ、追加CSSクラスに旧クラスが混入しない`, async ({
			admin,
			page,
			requestUtils,
		}) => {
			const postId = await createLegacyPost(
				requestUtils,
				`vk-blocks__slider__deprecated-1-124-0-${fixture}.html`,
				`legacy swiper-container: ${fixture}`
			);
			await openPostWithSlider(admin, page, postId);

			const state = await readSliderState(page, attribute);

			expect(state.isValid).toBe(true);
			expect(state.className).toBeNull();
			// 派生ごとの属性が deprecated 経路を通っても失われないこと
			expect(state.attributeValue).toBe(true);
			// 派生（save 出力が異なる＝別の照合経路）でも、開くだけでは「変更あり」に
			// しない契約は同じ。素の旧形式だけで固定していると、派生の deprecated が
			// migrate を伴う形に変わった時に離脱警告・意図しないリビジョンが出るように
			// なっても気付けない。
			expect(
				state.isDirty,
				`旧形式(${fixture}) を開いただけで投稿が「変更あり」になっています`
			).toBe(false);
		});
	}

	// ユーザーが自分で「追加 CSS クラス」に swiper-container を入れていた場合は、
	// 上の移行ケースとは逆に**維持する**のが仕様。isEligible はクラスの出どころで
	// 区別しており、ブロックコメントに既にあるならユーザー自身のクラスなので
	// この deprecated を適用しない（deprecated/save/index.js の isLegacySwiperContainerMarkup）。
	// ここが落ちるとユーザーが設定したクラスを勝手に削っていることになる。
	test('ユーザー自身が追加CSSクラスに入れた swiper-container は維持される', async ({
		admin,
		page,
		requestUtils,
	}) => {
		const postId = await createLegacyPost(
			requestUtils,
			'vk-blocks__slider__deprecated-1-124-0-explicit-legacy-classname.html',
			'legacy swiper-container: user set the class'
		);
		const before = await getSavedContent(requestUtils, postId);
		await openPostWithSlider(admin, page, postId);

		const state = await readSliderState(page);
		expect(state.isValid).toBe(true);
		// この deprecated を通っていれば旧クラスは className から取り除かれる。
		// 残っている＝ isEligible が false で適用されなかった、ということなので、
		// この 1 つで経路を区別できる。
		expect(state.className).toBe(LEGACY_CLASS);

		// 未編集のまま保存すると元の content がそのまま送られるため（別テストで固定）、
		// クラスが残ったのか元マークアップが返っただけなのか区別できない。
		// 実際に編集して直列化を走らせてから確かめる。
		await editBlockThenSave(page, { speed: 600 });

		// 直列化し直された content でもユーザーのクラスは残る。
		// content 全体の文字列検索では、ルート要素の class に旧クラスが残っているだけの
		// 状態（＝ deprecated が除去しそこねた場合）でも通ってしまうため、
		// ブロックコメントの className 属性そのものを見る。
		const after = await getSavedContent(requestUtils, postId);
		expect(after).not.toBe(before);
		expect(
			getSavedClassNames(after),
			'ユーザーが設定した追加 CSS クラスが className 属性から失われています'
		).toContain(LEGACY_CLASS);
	});

	test('何も編集せず更新した場合は post_content が書き換わらない（旧クラスは残るが表示は同じ）', async ({
		admin,
		page,
		requestUtils,
	}) => {
		const postId = await createLegacyPost(
			requestUtils,
			'vk-blocks__slider__deprecated-1-124-0.html',
			'legacy swiper-container: save without editing'
		);
		const before = await getSavedContent(requestUtils, postId);
		expect(before).toContain(LEGACY_CLASS);

		await openPostWithSlider(admin, page, postId);
		// savePost() が解決しただけでは保存が走ったとは言えない（未編集だと何もせずに
		// 解決し得る）。そうなると content の比較が「保存していないだけ」でも通り得るため、
		// 実際に更新が走ったことを捕まえてから content を比べる。
		// リクエストではなくレスポンスを待つのは、4xx / 5xx で保存に失敗した場合も
		// 「リクエストは飛んだ」で通ってしまい、content が不変なのは保存が失敗したから、
		// という取り違えが起きるため。ステータスまで確認する。
		// 既定のタイムアウトのまま待つと、飛ばなかった場合に何を待っていたのか
		// 分からないエラーになるため、明示的な待ち時間とメッセージを付ける。
		const updateResponse = page
			.waitForResponse(
				(response) =>
					['POST', 'PUT'].includes(response.request().method()) &&
					new RegExp(`posts(/|%2F)${postId}(\\?|$|&)`).test(
						response.url()
					),
				{ timeout: 15000 }
			)
			.catch(() => null);
		await savePostAndWait(page);
		const response = await updateResponse;
		expect(
			response,
			'「更新」で投稿の保存リクエストが飛びませんでした（保存が走らないと post_content の比較が意味を持たない）'
		).not.toBeNull();
		expect(
			response!.ok(),
			`投稿の保存が失敗しました（HTTP ${response!.status()}）。content が不変なのは保存が失敗したからであり、この検証の前提が崩れている`
		).toBe(true);

		// savePost() は `content: getEditedPostContent()` を必ず送るが、この selector は
		// ブロックが編集されている時だけ直列化する（`record.blocks` が無ければ元の
		// `record.content` をそのまま返す）ため、未編集では元のマークアップが送られて
		// content は不変。旧クラスは Swiper（data-vkb-slider で初期化）も
		// CSS（.vk_slider 起点）も参照しないため、残っていても表示・動作は変わらない。
		expect(await getSavedContent(requestUtils, postId)).toBe(before);
	});

	test('ブロックを編集して更新すると旧クラスが除去され、追加CSSクラスは維持される', async ({
		admin,
		page,
		requestUtils,
	}) => {
		const postId = await createLegacyPost(
			requestUtils,
			'vk-blocks__slider__deprecated-1-124-0-custom-classname.html',
			'legacy swiper-container: save after editing'
		);
		await openPostWithSlider(admin, page, postId);

		await editBlockThenSave(page, { speed: 600 });

		// 旧クラスは content のどこにも残らない（ルート要素の class も含めて除去される）。
		// ユーザーのクラスは className 属性として維持されることを、属性を直接見て確かめる
		// （content の文字列検索だと、className から落ちてルート要素の class にだけ
		// 残っている状態でも通ってしまう）。
		const after = await getSavedContent(requestUtils, postId);
		expect(after).not.toContain(LEGACY_CLASS);
		expect(
			getSavedClassNames(after),
			'ユーザーが設定した追加 CSS クラスが className 属性から失われています'
		).toContain('my-custom-class');
		expect(
			getSavedClassNames(after),
			'旧クラスが className 属性に取り込まれています'
		).not.toContain(LEGACY_CLASS);
	});
});
