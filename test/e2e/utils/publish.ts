import { expect } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

/**
 * エディタで下書き保存した投稿を、REST API で直接 `publish` ステータスに切り替える。
 *
 * `editor.publishPost()` はこの環境で「Publishing...」のまま止まることがあるため、
 * 公開の UI フローに依存せず REST で直接切り替えたいスペックはこの方式を使う。
 * （`editor.publishPost()` を使っているスペックも残っているので、
 * 「スライダー系はすべてこの方式」と読めないようにしている）
 *
 * ⚠️ 呼び出し後にエディタ側から保存し直さないこと。公開したのは REST 経由なので
 * エディタが持つ投稿レコードは下書きのままで、そのあと `savePost()` を実行すると
 * 古い状態を基準に保存が走る。status がエディタ側の編集として乗っていれば下書きに
 * 差し戻されるため、公開後の確認はフロント（`/?p=${postId}`）で行う。
 *
 * 作成した投稿 ID は下書き保存に成功した直後（公開を試みる前）に createdPostIds へ
 * 登録する。公開に失敗した場合でも下書きは既に DB に残っているため、登録が公開の後
 * だと消し残りになり、後続スペックの一覧取得や検索結果を汚してしまう。
 *
 * @param page           Page フィクスチャ
 * @param requestUtils   RequestUtils フィクスチャ
 * @param createdPostIds registerPostCleanup() が返す削除対象の配列
 * @return 公開した投稿の ID
 */
export const saveDraftThenPublishViaRest = async (
	page: Page,
	requestUtils: RequestUtils,
	createdPostIds: number[]
): Promise<number> => {
	await page.evaluate(async () => {
		await window.wp.data.dispatch('core/editor').savePost();
	});
	await page.waitForFunction(
		() => !window.wp.data.select('core/editor').isSavingPost()
	);

	// savePost() は保存が失敗しても解決するため、まず成功したかを確認する。
	// 失敗したまま進むと、この後の REST 公開や `/?p=${postId}` の組み立てが
	// 原因の分かりにくい失敗になる。
	const { saved, postId } = await page.evaluate(() => {
		const { select } = window.wp.data;
		return {
			saved: select('core/editor').didPostSaveRequestSucceed(),
			postId: select('core/editor').getCurrentPostId(),
		};
	});
	expect(saved, '下書き保存のリクエストが失敗しました').toBe(true);
	// 保存前だと getCurrentPostId() は ID を返さないので、null だけでなく
	// undefined（状態が未設定）も弾く必要があるため真値で判定する。
	expect(
		postId,
		'投稿 ID が取得できませんでした（保存されていない）'
	).toBeTruthy();
	// 公開の前に登録する。この時点で下書きは既に DB にあるため、以降で落ちても
	// afterAll の片付け対象になる。
	createdPostIds.push(postId as number);
	// requestUtils.rest() は HTTP エラー時に例外を投げるが、200 で返りつつ
	// 実際には publish になっていない（権限不足で pending に落ちる等）ことがある。
	// その場合に気づかず進むと、フロント側で「ブロックが出ない」だけの
	// 原因の分かりにくい失敗になるため、返ってきたステータスを確認する。
	const published = (await requestUtils.rest({
		path: `/wp/v2/posts/${postId}`,
		method: 'POST',
		data: { status: 'publish' },
	})) as { status?: string };
	expect(
		published?.status,
		`投稿の公開に失敗しました: ${JSON.stringify(published)}`
	).toBe('publish');
	return postId as number;
};
