import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * issue #2556 の回帰テスト: blockId churn による「編集していないのに変更扱い」の防止
 *
 * 【背景】
 *   blockId churn 対応ブロックの edit.js は、再利用ブロック外では「リロードのたびに」
 *   blockId を新しい clientId へ上書き（churn）していた。blockId は block.json 登録属性で
 *   ブロックのデリミタコメントに serialize されるため、churn すると保存済み HTML と食い違い、
 *   何も編集していなくても投稿が dirty 化していた（離脱時に「変更が保存されない」警告）。
 *
 * 【修正】
 *   共通 util shouldUpdateBlockId（真の衝突検出版）に集約し、
 *   「blockId 未確定」または「再利用ブロック外で実際に blockId が衝突（複製）」のときだけ
 *   再採番するようにした。通常リロードでは blockId を据え置き（dirty 化しない）、
 *   複製時は衝突検出で再採番（CSS-ID 衝突回避という当初目的を維持）。
 *
 * 【このテストで確認すること】
 *   1. Outer / Button を配置→保存→リロードしても dirty=false（blockId が churn しない）
 *   2. Outer を複製すると blockId が再採番され、複製元と衝突しない
 *
 * 認証・baseURL は標準 e2e ハーネス（global-setup / playwright.config）に従う。
 * flaky 防止のため固定待機（waitForTimeout）は使わず、状態待機（waitForFunction）で待つ。
 */

// 指定ブロックの最初のインスタンスに blockId が付与される（= 補完 useEffect が走り切る）まで待つ。
// blockId 補完は clientId 確定後の useEffect で setAttributes されるため、これが完了の指標になる。
async function waitForBlockId(page, blockName) {
	await page.waitForFunction((name) => {
		const blocks = window.wp.data.select('core/block-editor').getBlocks();
		return blocks.some((b) => b.name === name && !!b.attributes?.blockId);
	}, blockName);
}

test.describe('issue #2556: blockId churn によるリロード時の dirty 化防止', () => {
	// 配置→保存→リロードしても dirty 化しないことを、対象ブロックの代表 2 種で確認する。
	// 残りのブロックは共通 util と unit テストでロジックを担保している。
	for (const { label, name } of [
		{ label: 'Outer', name: 'vk-blocks/outer' },
		{ label: 'Button', name: 'vk-blocks/button' },
	]) {
		test(`${label} を配置→保存→リロードしても dirty 化しない`, async ({
			admin,
			editor,
			page,
		}) => {
			// 新規投稿を作成し、対象ブロックを挿入する
			await admin.createNewPost();
			await editor.insertBlock({ name });

			// blockId 補完の useEffect が走り blockId が付与されるまで待ってから保存する。
			// publishPost の UI フロー（公開確認パネル）は WP のバージョン差で不安定なため、
			// ストア API で直接下書き保存する。
			await waitForBlockId(page, name);
			await page.evaluate(async () => {
				await window.wp.data.dispatch('core/editor').savePost();
			});
			await page.waitForFunction(
				() => !window.wp.data.select('core/editor').isSavingPost()
			);

			// 保存された投稿 ID を取得し、編集画面を開き直す（クリーンなリロード）
			const postId = await page.evaluate(() =>
				window.wp.data.select('core/editor').getCurrentPostId()
			);
			await admin.editPost(postId);

			// リロード後のマウントで blockId 補完 useEffect が走り切る（blockId が再付与される）まで待つ。
			// もし churn していれば、この effect 内の setAttributes で投稿が dirty 化する。
			await waitForBlockId(page, name);

			// 何も編集していないので dirty 化していないこと（= #2556 修正確認）。
			// 補完 effect が走った後に判定するため、churn があれば確実に dirty=true を捕捉できる。
			const dirty = await page.evaluate(() =>
				window.wp.data.select('core/editor').isEditedPostDirty()
			);
			expect(
				dirty,
				`#2556: 何も編集していない ${label} はリロードしても dirty 化しない`
			).toBe(false);
		});
	}

	// 複製時の当初目的（CSS-ID 衝突回避）が壊れていないことを Outer 代表で確認する。
	test('Outer を複製すると blockId が再採番され、複製元と衝突しない', async ({
		admin,
		editor,
		page,
	}) => {
		// 新規投稿に Outer を 1 つ挿入し、blockId が付与されるまで待つ
		await admin.createNewPost();
		await editor.insertBlock({ name: 'vk-blocks/outer' });
		await waitForBlockId(page, 'vk-blocks/outer');

		// 1 つ目の Outer を複製する
		await page.evaluate(async () => {
			const be = window.wp.data.select('core/block-editor');
			const { duplicateBlocks } =
				window.wp.data.dispatch('core/block-editor');
			const original = be
				.getBlocks()
				.find((b) => b.name === 'vk-blocks/outer');
			await duplicateBlocks([original.clientId]);
		});

		// 複製先の blockId 補完 useEffect（衝突検出 → 再採番）が完了するまで状態待機する。
		// 条件: Outer が 2 個・両方に blockId が付与済み・2 つの blockId が互いに異なる。
		await page.waitForFunction(
			() => {
				const outers = window.wp.data
					.select('core/block-editor')
					.getBlocks()
					.filter((b) => b.name === 'vk-blocks/outer');
				if (outers.length !== 2) {
					return false;
				}
				const [a, b] = outers.map((o) => o.attributes?.blockId);
				return !!a && !!b && a !== b;
			},
			undefined,
			{ timeout: 5000 }
		);

		// 最終状態を取得して明示的にアサートする
		const result = await page.evaluate(() => {
			const outers = window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.filter((b) => b.name === 'vk-blocks/outer');
			return {
				count: outers.length,
				blockIds: outers.map((b) => b.attributes.blockId),
			};
		});
		// Outer が 2 つに増えている
		expect(result.count).toBe(2);
		// 2 つの blockId は互いに異なる（複製で再採番され衝突していない）
		expect(result.blockIds[0]).not.toBe(result.blockIds[1]);
		// どちらの blockId も空でない
		result.blockIds.forEach((blockId) => expect(blockId).toBeTruthy());
	});
});
