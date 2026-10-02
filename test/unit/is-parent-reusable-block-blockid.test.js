/* eslint-env jest */
/**
 * issue #2556 — 「編集していないのに『行った変更が保存されない』と出る」の修正テスト
 *
 * 【問題（修正前）】
 *   各ブロックの useEffect 内にあった次のパターン:
 *     if ( blockId === undefined || isParentReusableBlock(clientId) === false ) {
 *         setAttributes({ blockId: clientId });
 *     }
 *   により、再利用ブロック外では「リロードのたびに」blockId が新しい clientId へ
 *   上書き（churn）されていた。blockId は block.json 登録属性でデリミタコメントに
 *   serialize されるため、churn すると保存済み HTML と食い違い、何も編集していなくても
 *   投稿が dirty 化 → 離脱時に警告が出ていた（実機 e2e で真因確定）。
 *
 * 【修正（案A: 真の衝突検出）】
 *   再採番するのは次のときだけにする:
 *     - blockId が未確定（undefined）、または
 *     - 再利用ブロック外 かつ エディタ内に同一 blockId を持つ自分以外のブロックがある（複製による実衝突）
 *   再利用ブロック（同期パターン）内では複数インスタンスが blockId を共有するのが
 *   正常なので衝突検出は適用せず、undefined のときのみ採番する。
 *   これで通常リロードでは blockId 据え置き（dirty 化しない）、複製時は衝突検出で
 *   再採番（CSS-ID 衝突回避という当初目的を維持）となる。
 *
 * 対象は blockId churn を持つ 9 ブロック共通（button / slider / slider-item / card /
 * outer / animation / post-list-slider / fixed-display / gridcolcard）。各 edit.js の
 * blockId 更新ロジックを、この共通 util の shouldUpdateBlockId 呼び出しに集約している。
 */

// @wordpress/data の select はモックする
jest.mock('@wordpress/data', () => ({
	select: jest.fn(),
}));

import { select } from '@wordpress/data';
import {
	isParentReusableBlock,
	hasBlockIdCollision,
	shouldUpdateBlockId,
	shouldDefaultShowActualSlideCountOn,
} from '../../src/utils/is-parent-reusable-block';

// ── ヘルパー: モックの組み立て ───────────────────────────────────────────────

/**
 * getBlockParentsByBlockName が指定の結果を返すように @wordpress/data をセットアップする。
 *
 * @param {Array} parents - 返す親ブロック配列（通常ページなら []、再利用ブロック内なら ['some-id']）
 */
function setupParentsMock(parents) {
	select.mockReturnValue({
		getBlockParentsByBlockName: jest.fn().mockReturnValue(parents),
	});
}

/**
 * getClientIdsWithDescendants / getBlockAttributes を差し込んで、
 * エディタ内のブロック構成（clientId → blockId のマップ）をモックする。
 *
 * @param {Object} blockIdByClientId - { clientId: blockId } のマップ
 */
function setupBlocksMock(blockIdByClientId) {
	select.mockReturnValue({
		getClientIdsWithDescendants: jest
			.fn()
			.mockReturnValue(Object.keys(blockIdByClientId)),
		getBlockAttributes: jest.fn((id) => ({
			blockId: blockIdByClientId[id],
		})),
	});
}

// ── isParentReusableBlock の基本動作確認 ────────────────────────────────────

describe('isParentReusableBlock', () => {
	it('通常ページ（親が空配列）では false を返す', () => {
		setupParentsMock([]);
		expect(isParentReusableBlock('client-abc')).toBe(false);
	});

	it('再利用ブロック内（親に core/block が存在）では true を返す', () => {
		setupParentsMock(['reusable-parent-id']);
		expect(isParentReusableBlock('client-abc')).toBe(true);
	});
});

// ── hasBlockIdCollision の動作確認 ──────────────────────────────────────────

describe('hasBlockIdCollision', () => {
	it('自分だけが その blockId を持つ（通常リロード）→ 衝突なし false', () => {
		setupBlocksMock({
			'client-self': 'block-1',
			'client-other': 'block-2',
		});
		expect(hasBlockIdCollision('client-self', 'block-1')).toBe(false);
	});

	it('自分以外に同一 blockId のブロックがある（複製直後）→ 衝突あり true', () => {
		// 複製直後: 複製元 client-origin と複製先 client-clone が同じ block-1 を共有
		setupBlocksMock({
			'client-origin': 'block-1',
			'client-clone': 'block-1',
		});
		expect(hasBlockIdCollision('client-clone', 'block-1')).toBe(true);
	});

	it('blockId が未確定（undefined）なら衝突判定の対象外 → false', () => {
		setupBlocksMock({ 'client-self': undefined });
		expect(hasBlockIdCollision('client-self', undefined)).toBe(false);
	});

	it('blockId が空文字なら衝突判定の対象外 → false', () => {
		// 空文字は falsy なので未確定扱い。他ブロックも空文字でも衝突とみなさない。
		setupBlocksMock({ 'client-self': '', 'client-other': '' });
		expect(hasBlockIdCollision('client-self', '')).toBe(false);
	});
});

// ── shouldUpdateBlockId: 修正後ロジック（4ケース） ──────────────────────────

describe('shouldUpdateBlockId — 修正後（真の衝突検出）', () => {
	// ① 通常リロード相当: blockId 確定・衝突なし・再利用ブロック外 → 更新しない
	it('① 通常リロード（blockId 確定・衝突なし・再利用ブロック外）→ 更新しない false', () => {
		expect(
			shouldUpdateBlockId({
				blockId: 'saved-block-id',
				isInReusableBlock: false,
				hasCollision: false,
			})
		).toBe(false);
	});

	// ② 複製相当: 他ブロックが同一 blockId・再利用ブロック外 → 更新する
	it('② 複製（実衝突あり・再利用ブロック外）→ 再採番する true', () => {
		expect(
			shouldUpdateBlockId({
				blockId: 'duplicated-block-id',
				isInReusableBlock: false,
				hasCollision: true,
			})
		).toBe(true);
	});

	// ③ 初回配置相当: blockId === undefined → 更新する
	it('③ 初回配置（blockId === undefined）→ 採番する true', () => {
		expect(
			shouldUpdateBlockId({
				blockId: undefined,
				isInReusableBlock: false,
				hasCollision: false,
			})
		).toBe(true);
	});

	// ④ 再利用ブロック内: 衝突があっても更新しない（共有 blockId が正常なため）
	it('④ 再利用ブロック内（blockId 確定）→ 衝突有無に関わらず更新しない false', () => {
		expect(
			shouldUpdateBlockId({
				blockId: 'shared-block-id',
				isInReusableBlock: true,
				hasCollision: true, // 同期パターンでは共有が正常なので無視されるべき
			})
		).toBe(false);
	});

	// 補足: 再利用ブロック内でも blockId 未確定なら採番する（最低限の初期化は必要）
	it('補足: 再利用ブロック内でも blockId === undefined なら採番する true', () => {
		expect(
			shouldUpdateBlockId({
				blockId: undefined,
				isInReusableBlock: true,
				hasCollision: false,
			})
		).toBe(true);
	});

	// 空文字: undefined ではないので採番条件①は満たさず、空文字は衝突判定の対象外
	// （hasBlockIdCollision が false を返す）ため、更新しない false が正。
	it('空文字（blockId === ""）・再利用ブロック外・衝突なし → 更新しない false', () => {
		expect(
			shouldUpdateBlockId({
				blockId: '',
				isInReusableBlock: false,
				hasCollision: false,
			})
		).toBe(false);
	});
});

// ── shouldDefaultShowActualSlideCountOn: #3080 CodeRabbit指摘の回帰テスト ──
//
// 「実際のスライド数で表示」トグルを新規挿入時だけ ON 始まりにする判定
// （src/blocks/slider/edit.js・src/blocks/_pro/post-list-slider/edit.js）が、
// blockId === undefined だけを見ていたため、blockId 属性導入前に保存された
// 古いブロックをエディタで開いただけでも新規挿入と誤判定してしまっていた
// （CodeRabbitレビューで指摘）。wasBlockJustInserted と組み合わせた修正後の
// 判定を検証する。
//
// shouldDefaultShowActualSlideCountOn: #3080 CodeRabbit feedback regression
// tests. The "default the 'Show actual slide count' toggle on for new
// insertions only" logic (in slider/edit.js and post-list-slider/edit.js) used
// to look only at blockId === undefined, which misfired when merely opening
// an old block saved before the blockId attribute existed (found via
// CodeRabbit review). These tests verify the fixed logic that combines it
// with wasBlockJustInserted.
describe('shouldDefaultShowActualSlideCountOn — #3080 CodeRabbit指摘の回帰テスト', () => {
	// 最重要の回帰ケース: blockId 属性導入前に保存された古いブロックを開くと、
	// blockId は undefined になるが、挿入し直したわけではないので
	// wasBlockJustInserted は false のはず。この組み合わせで誤って ON に
	// ならないことを確認する。
	it('古い投稿の既存ブロックを開いた場合（blockId未設定・新規挿入ではない）→ ON にしない false', () => {
		expect(
			shouldDefaultShowActualSlideCountOn({
				blockId: undefined,
				wasJustInserted: false,
			})
		).toBe(false);
	});

	// 新規挿入相当: blockId 未確定かつ、たった今挿入された → ON にする
	it('新規に挿入した場合（blockId未設定・たった今挿入された）→ ON にする true', () => {
		expect(
			shouldDefaultShowActualSlideCountOn({
				blockId: undefined,
				wasJustInserted: true,
			})
		).toBe(true);
	});

	// 複製相当: blockId は複製元からコピーされるため確定済み。たった今挿入された
	// 扱いにはなるが、blockId が undefined ではないため ON にしない
	// （複製元の showActualSlideCount の値を維持する）。
	it('複製した場合（blockIdは複製元からコピー済み・たった今挿入された）→ ON にしない false', () => {
		expect(
			shouldDefaultShowActualSlideCountOn({
				blockId: 'copied-from-source',
				wasJustInserted: true,
			})
		).toBe(false);
	});

	// 通常のリロード: blockId 確定済み・新規挿入でもない → ON にしない
	it('通常のリロード（blockId確定済み・新規挿入ではない）→ ON にしない false', () => {
		expect(
			shouldDefaultShowActualSlideCountOn({
				blockId: 'saved-block-id',
				wasJustInserted: false,
			})
		).toBe(false);
	});
});
