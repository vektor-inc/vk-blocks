import { expect, test } from '@wordpress/e2e-test-utils-playwright';

/**
 * スペックが作成した投稿を、スペック終了時にまとめて削除する仕組みを登録する。
 *
 * 返された配列に作成した投稿 ID を push しておくと、`test.afterAll` で
 * 強制削除（`force=true`）される。ゴミ箱に残すと後続スペックの一覧取得などに
 * 影響し得るため、通常の削除ではなく強制削除にしている。
 * 1 件でも削除に失敗したらスペックの失敗として報告する。消し残しは後続スペックの
 * 一覧取得や検索結果を汚し、原因の分かりにくい失敗を生むため握りつぶさない。
 * ただし 1 件目の失敗で中断すると取りこぼしが増えるので、全件試してから報告する。
 *
 * 呼び出し側はモジュールのトップレベルで実行すること
 * （`test.afterAll` の登録がスペックの収集時に行われる必要があるため）。
 *
 * @return 作成した投稿 ID を push する配列
 */
export const registerPostCleanup = (): number[] => {
	const createdPostIds: number[] = [];

	test.afterAll(async ({ requestUtils }) => {
		const failedIds: number[] = [];

		// 既に存在しない投稿への DELETE は 404 になるが、片付けの目的は「残さないこと」
		// なので達成済みとして扱う。ここを失敗にすると、他の要因で先に消えていただけで
		// テストが緑のままスペックが赤くなってしまう。
		//
		// requestUtils.rest() が投げるのは Error ではなく REST のエラーレスポンスを
		// そのまま持つオブジェクト（`{ code, message, data: { status } }`）なので、
		// message ではなく code で判定する。
		const isAlreadyGone = (error: unknown): boolean => {
			if (typeof error !== 'object' || error === null) {
				return false;
			}
			// status だけを見ると REST やプラグイン由来の無関係な 404 でも
			// 「消えている」と誤判定してしまうため、投稿 ID 不正のコードだけを見る。
			const { code } = error as { code?: string };
			return code === 'rest_post_invalid_id';
		};

		const deletePost = async (id: number): Promise<void> => {
			const request = async () =>
				requestUtils.rest({
					path: `/wp/v2/posts/${id}?force=true`,
					method: 'DELETE',
				});

			try {
				await request();
			} catch (error) {
				if (isAlreadyGone(error)) {
					return;
				}
				// 一時的な失敗で赤くならないよう 1 度だけやり直す。
				// 間を置かずに叩き直しても同じ状態を引くだけなので少し待つ
				await new Promise((resolve) => setTimeout(resolve, 300));
				try {
					await request();
				} catch (retryError) {
					if (isAlreadyGone(retryError)) {
						return;
					}
					failedIds.push(id);
				}
			}
		};

		// ID として使えない値（null / undefined / NaN / 0 以下 / 非整数 / 桁あふれ）は先に除く。
		// 配列の型は number[] だが、呼び出し側の ID は型の付いていない
		// `requestUtils.rest()` の戻り（`post.id` 等）や `as number` のキャスト経由で
		// 入ってくるため、TypeScript では取り違えを止められない。そのまま渡すと
		// `/wp/v2/posts/undefined?force=true` という壊れたパスを叩き、
		// 実在しない投稿の削除失敗として報告されてしまう。
		// 投稿 ID は 1 以上の整数なので、そこまで絞る。Number.isFinite だけだと
		// 0 / 負値 / 1.5 のような値も通り、`/wp/v2/posts/0` のような無効なパスを叩く。
		const validIds = createdPostIds.filter(
			(id): id is number => Number.isSafeInteger(id) && id > 0
		);
		const invalidIdCount = createdPostIds.length - validIds.length;

		// 同じ ID が二重に push されていても DELETE は 1 回で済ませる。
		// 1 件ごとに独立した処理なので並列に投げ、allSettled で全件の決着を待つ
		// （1 件失敗しても残りの削除は続き、取りこぼしを最小にできる）
		await Promise.allSettled(
			[...new Set(validIds)].map((id) => deletePost(id))
		);

		// 並列実行では push の順序が実行順に左右されるため、メッセージは昇順に正規化する
		// soft にするのは、ここで中断すると下の invalidIdCount の確認まで届かず、
		// 「消し残しの原因が 2 種類ある」場合に片方しか報告されないため。
		// soft でもスペックは失敗するので、見逃しにはならない。
		const sortedFailedIds = [...failedIds].sort((a, b) => a - b);
		expect
			.soft(
				sortedFailedIds,
				`投稿の削除に失敗しました（消し残しが後続スペックを汚します）: ${sortedFailedIds.join(
					', '
				)}`
			)
			.toEqual([]);

		// 除いた分は黙って捨てない。ID が取れていない＝その投稿は片付けられておらず
		// 消し残っているため、有効な ID の片付けを済ませたうえで事実として報告する
		// （このファイルの方針どおり、消し残しは握りつぶさない）。
		expect(
			invalidIdCount,
			`投稿 ID として使えない値が ${invalidIdCount} 件記録されていました（その投稿は削除できていません。ID の取得箇所を確認してください）`
		).toBe(0);
	});

	return createdPostIds;
};
