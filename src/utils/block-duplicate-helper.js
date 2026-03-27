/**
 * ブロックID重複検出の共通ユーティリティ関数
 * ブロックIDの生成、重複検出、再帰的なブロック取得などの共通処理
 */

/**
 * ユニークなブロックIDを生成
 * @return {string} ユニークなID
 */
export const generateUniqueBlockId = () => {
	return (
		Math.random().toString(36).substring(2, 11) +
		'-' +
		Math.random().toString(36).substring(2, 6) +
		'-' +
		Math.random().toString(36).substring(2, 6) +
		'-' +
		Math.random().toString(36).substring(2, 6) +
		'-' +
		Math.random().toString(36).substring(2, 14)
	);
};

/**
 * ブロックを再帰的に取得（ネストされたブロックも含む）
 * @param {Array} blocks - ブロック配列
 * @return {Array} すべてのブロック（ネストされたものも含む）
 */
export const getAllBlocksRecursively = (blocks) => {
	let allBlocks = [];
	blocks.forEach((block) => {
		allBlocks.push(block);
		if (block.innerBlocks && block.innerBlocks.length > 0) {
			allBlocks = allBlocks.concat(
				getAllBlocksRecursively(block.innerBlocks)
			);
		}
	});
	return allBlocks;
};

/**
 * 重複検出を遅延実行するヘルパー
 * @param {Function} checkFn - 実行する関数
 * @param {number}   delay   - 遅延時間（ミリ秒）
 * @return {Function} クリーンアップ関数
 */
export const scheduleDuplicateCheck = (checkFn, delay = 100) => {
	checkFn(); // 即座に実行
	const timeoutId = setTimeout(checkFn, delay); // 遅延実行
	return () => clearTimeout(timeoutId); // クリーンアップ関数を返す
};

/**
 * 複製されたブロックを判定する
 * @param {Array}  allBlocks       - すべてのブロック配列
 * @param {string} blockName       - 検索するブロック名
 * @param {string} blockId         - 検索するブロックID
 * @param {string} currentClientId - 現在のブロックのクライアントID
 * @return {boolean} 現在のブロックが複製された方の場合true
 */
export const isCurrentBlockDuplicate = (
	allBlocks,
	blockName,
	blockId,
	currentClientId
) => {
	const duplicateBlocks = allBlocks.filter(
		(block) =>
			block.name === blockName &&
			block.attributes &&
			block.attributes.blockId === blockId
	);

	if (duplicateBlocks.length <= 1) {
		return false; // 重複なし
	}

	// 複数のブロックが同じIDを持っている場合
	// ブロックの配置順序で判定（より後に配置されたブロックが複製された方）
	const currentBlock = duplicateBlocks.find(
		(block) => block.clientId === currentClientId
	);
	const otherBlocks = duplicateBlocks.filter(
		(block) => block.clientId !== currentClientId
	);

	if (!currentBlock || otherBlocks.length === 0) {
		return false;
	}

	// 現在のブロックが他のブロックより後に配置されている場合、複製された方
	// ブロックの配置順序は、DOM内での位置で判定
	const currentBlockIndex = allBlocks.findIndex(
		(block) => block.clientId === currentClientId
	);
	const otherBlockIndices = otherBlocks
		.map((block) =>
			allBlocks.findIndex((b) => b.clientId === block.clientId)
		)
		.filter((index) => index !== -1);

	// 現在のブロックが他のブロックより後に配置されている場合、複製された方
	return otherBlockIndices.some(
		(otherIndex) => currentBlockIndex > otherIndex
	);
};

/**
 * WordPressのブロックエディタからすべてのブロックを取得
 * @return {Array|null} すべてのブロック配列、取得できない場合はnull
 */
export const getAllBlocksFromEditor = () => {
	if (typeof window !== 'undefined' && window.wp && window.wp.data) {
		const { select } = window.wp.data;
		const { getBlocks } = select('core/block-editor');

		if (getBlocks) {
			const rootBlocks = getBlocks();
			return getAllBlocksRecursively(rootBlocks);
		}
	}
	return null;
};
