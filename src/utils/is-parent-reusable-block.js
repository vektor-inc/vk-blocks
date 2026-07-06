import { select } from '@wordpress/data';

export const isParentReusableBlock = (clientId) => {
	const blockEditor = select('core/block-editor');
	const parents = blockEditor?.getBlockParentsByBlockName?.(clientId, [
		'core/block',
		'core/template-part',
	]);
	return Array.isArray(parents) && parents.length ? true : false;
};

/**
 * エディタ内に、自分以外で同じ blockId を持つブロックが存在するか（= blockId 衝突）を調べる。
 *
 * blockId はブロック複製時に複製元と同じ値がコピーされるため、複製直後は
 * 「自分以外に同一 blockId のブロックがある」状態になる。この状態を衝突として検出する。
 * 通常のリロード（複製ではない）では同一 blockId のブロックは自分だけなので衝突しない。
 *
 * @param {string} clientId 判定対象ブロックの clientId
 * @param {string} blockId  判定対象ブロックの現在の blockId 属性値
 * @return {boolean} 自分以外に同一 blockId のブロックがあれば true
 */
export const hasBlockIdCollision = (clientId, blockId) => {
	// blockId が未確定なら衝突判定の対象外（呼び出し側で undefined を別途処理する）
	if (!blockId) {
		return false;
	}
	const blockEditor = select('core/block-editor');
	// エディタ内の全ブロック（ネスト含む）の clientId を取得
	const allClientIds = blockEditor?.getClientIdsWithDescendants?.() ?? [];
	// 自分以外で blockId が一致するブロックがあれば衝突
	return allClientIds.some((id) => {
		if (id === clientId) {
			return false;
		}
		const attrs = blockEditor?.getBlockAttributes?.(id);
		return attrs?.blockId === blockId;
	});
};

/**
 * blockId を clientId に更新（再採番）すべきかどうかを判定する純粋関数。
 *
 * issue #2556 対応:
 *   従来は「再利用ブロック外なら毎回更新」していたため、通常リロードのたびに
 *   blockId が新しい clientId へ churn し、デリミタコメントの差分で投稿が dirty 化していた。
 *   そこで「複製による実衝突があるときだけ再採番する」案 A（真の衝突検出）に変更する。
 *
 * 再採番する条件:
 *   - blockId が未確定（undefined）、または
 *   - 再利用ブロック外 かつ エディタ内に同一 blockId を持つ自分以外のブロックがある（実衝突）
 *
 * 再利用ブロック（同期パターン）内では複数インスタンスが同じ blockId を共有するのが正常なので、
 * 衝突検出は適用しない（= 再利用ブロック内では undefined のときのみ採番する）。
 * これにより複製時の CSS-ID 衝突回避という当初目的を保ちつつ、通常リロードでの
 * dirty 化を防ぐ。
 *
 * @param {Object}           params
 * @param {string|undefined} params.blockId           ブロックに保存済みの blockId 属性値
 * @param {boolean}          params.isInReusableBlock 再利用ブロック内かどうか（isParentReusableBlock の結果）
 * @param {boolean}          params.hasCollision      自分以外に同一 blockId のブロックがあるか（実衝突）
 * @return {boolean} true なら setAttributes({ blockId: clientId }) を呼ぶべき
 */
export const shouldUpdateBlockId = ({
	blockId,
	isInReusableBlock,
	hasCollision,
}) => {
	if (blockId === undefined) {
		return true;
	}
	// 再利用ブロック内では衝突検出しない（共有 blockId が正常なため）
	if (isInReusableBlock) {
		return false;
	}
	// 再利用ブロック外では、実際に blockId が衝突しているときだけ再採番する
	return hasCollision === true;
};
