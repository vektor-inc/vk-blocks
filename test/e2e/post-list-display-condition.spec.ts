import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * 投稿リスト / 投稿リストスライダーブロックの「表示条件」パネルにある
 * タクソノミー（カテゴリー）チェックボックスの操作が、ブロック属性へ
 * 即座に反映されることを確認する回帰テスト。
 *
 * かつて display-condition の state→属性 同期 useEffect が失われたことで、
 * AdvancedCheckboxControl の onChange が古いクロージャの値で属性を上書きし、
 * チェック操作が「1操作遅れて」反映される（チェックが外せない／プレビューに
 * 反映されない）デグレが発生した。本テストはその再発を検知する。
 *
 * テーマ非依存にするため、クリーンな wp-env に必ず存在する既定カテゴリー
 * 「Uncategorized」を対象にする（投稿タイプ post は既定で選択済みのため
 * カテゴリーのチェックボックスが表示される）。
 *
 * @see https://github.com/vektor-inc/vk-blocks-pro/pull/3008#issuecomment-4668810785
 */

// 検証対象のブロック（UI・クエリを共有しているため両方を確認する）
const TARGET_BLOCKS = [
	{ name: 'vk-blocks/post-list', label: '投稿リスト' },
	{ name: 'vk-blocks/post-list-slider', label: '投稿リストスライダー' },
];

test.describe('Post list display condition checkbox', () => {
	for (const block of TARGET_BLOCKS) {
		test(`${block.label}: タクソノミーのチェック操作が属性へ即座に反映される`, async ({
			admin,
			editor,
			page,
		}) => {
			// 新規投稿を作成し、対象ブロックを挿入する
			await admin.createNewPost();
			await editor.insertBlock({ name: block.name });

			// ドキュメント設定サイドバーを開く
			await editor.openDocumentSettingsSidebar();

			// 「表示条件」パネルを開く（initialOpen=false のため明示的に展開する）
			await page
				.getByRole('button', { name: 'Display conditions' })
				.click();

			// 対象ブロックの属性を読み出すヘルパー。
			// 属性は JSON 文字列（ターム ID の配列）で保持されるためパースして返す。
			const readTermAttr = async (attr: string) => {
				const blocks = await editor.getBlocks();
				return JSON.parse(blocks[0].attributes[attr] || '[]');
			};

			// 「Uncategorized」チェックボックスは絞り込み用・除外用の 2 つが
			// この順で描画される（先＝絞り込み / 後＝除外）。
			const filterCheckbox = page
				.getByRole('checkbox', { name: 'Uncategorized' })
				.first();
			const excludeCheckbox = page
				.getByRole('checkbox', { name: 'Uncategorized' })
				.last();

			// --- 絞り込み（isCheckedTerms） ---
			// チェックを入れる → 属性に即座にターム ID が追加される
			await filterCheckbox.click();
			await expect(filterCheckbox).toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('isCheckedTerms')).length)
				.toBeGreaterThan(0);

			// チェックを外す → 属性が即座に空に戻る（「外せない」デグレの検知）
			await filterCheckbox.click();
			await expect(filterCheckbox).not.toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('isCheckedTerms')).length)
				.toBe(0);

			// --- 除外（exclusionTerms） ---
			// チェックを入れる → 除外属性に即座にターム ID が追加される
			await excludeCheckbox.click();
			await expect(excludeCheckbox).toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('exclusionTerms')).length)
				.toBeGreaterThan(0);

			// チェックを外す → 除外属性が即座に空に戻る
			await excludeCheckbox.click();
			await expect(excludeCheckbox).not.toBeChecked();
			await expect
				.poll(async () => (await readTermAttr('exclusionTerms')).length)
				.toBe(0);
		});
	}
});
