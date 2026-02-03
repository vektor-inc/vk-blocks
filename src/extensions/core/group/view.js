/* eslint-env browser */

/**
 * Group Block Scrollable Extension - Frontend View
 *
 * @package
 */

(function () {
	'use strict';

	// 重複読み込み防止フラグ（より堅牢な初期化ガード）
	if (window.__vkGroupScrollableInit) {
		return;
	}
	window.__vkGroupScrollableInit = true;

	// 更新中フラグ（無限ループを防ぐ）
	let isUpdating = false;

	// 測定用コンテナ（1回だけ作成して再利用、パフォーマンス向上）
	let measurementContainer = null;

	/**
	 * 測定用のコンテナを取得（再利用）
	 * @return {HTMLElement} 測定用コンテナ要素
	 */
	function getMeasurementContainer() {
		if (!measurementContainer) {
			measurementContainer = document.createElement('div');
			// 測定用コンテナを非表示にする（レイアウトシフトを防ぐ）
			measurementContainer.style.cssText =
				'position: absolute; visibility: hidden; top: -9999px; left: -9999px;';
			document.body.appendChild(measurementContainer);
		}
		return measurementContainer;
	}

	/**
	 * カラムの幅を測定（バッチ処理でパフォーマンス向上）
	 * @param {HTMLElement[]} columns       - 測定対象のカラム要素の配列
	 * @param {HTMLElement}   tempContainer - 測定用コンテナ
	 * @return {number} 最大幅
	 */
	function measureColumnsWidth(columns, tempContainer) {
		const clones = [];
		let maxWidth = 0;

		// バッチ処理：すべてのクローンを一度に作成
		columns.forEach((column) => {
			if (!column) {
				return;
			}

			try {
				const columnClone = column.cloneNode(true);
				const computedStyle = window.getComputedStyle(column);

				// クローンに必要なスタイルを適用
				columnClone.style.cssText = `
					position: absolute;
					visibility: hidden;
					top: -9999px;
					left: -9999px;
					width: auto;
					max-width: none;
					min-width: auto;
					padding: ${computedStyle.padding};
					margin: ${computedStyle.margin};
					border: ${computedStyle.border};
					box-sizing: ${computedStyle.boxSizing};
					font-size: ${computedStyle.fontSize};
					font-family: ${computedStyle.fontFamily};
				`;

				tempContainer.appendChild(columnClone);
				clones.push(columnClone);
			} catch (error) {
				// エラーが発生した場合はスキップ
			}
		});

		// バッチ処理：すべてのクローンの幅を一度に測定
		clones.forEach((clone) => {
			const contentWidth = clone.scrollWidth || clone.offsetWidth;
			if (contentWidth > maxWidth) {
				maxWidth = contentWidth;
			}
		});

		// バッチ処理：すべてのクローンを一度に削除
		clones.forEach((clone) => {
			try {
				tempContainer.removeChild(clone);
			} catch (error) {
				// エラーが発生した場合はスキップ
			}
		});

		return maxWidth;
	}

	/**
	 * ブレークポイントに応じてテーブルモードを適用するかどうかを判定
	 * @param {HTMLElement} group - グループブロック要素
	 * @return {boolean} テーブルモードを適用するかどうか
	 */
	function shouldApplyTableMode(group) {
		const breakpoint = group.getAttribute('data-scroll-breakpoint');
		if (!breakpoint) {
			return false;
		}

		const windowWidth = window.innerWidth;
		const mobileBreakpoint = 575.98;
		const tabletBreakpoint = 991.98;

		// PCブレークポイントの場合：常に適用
		if (breakpoint === 'group-scrollable-pc') {
			return true;
		}

		// Tabletブレークポイントの場合：991.98px以下の場合のみ適用
		if (breakpoint === 'group-scrollable-tablet') {
			return windowWidth <= tabletBreakpoint;
		}

		// Mobileブレークポイントの場合：575.98px以下の場合のみ適用
		if (breakpoint === 'group-scrollable-mobile') {
			return windowWidth <= mobileBreakpoint;
		}

		return false;
	}

	/**
	 * スクロール可能なグループブロック内のカラムブロックの幅を統一する
	 * テーブルのように複数の行（.wp-block-columns）がある場合、同じ列位置のカラムを統一する
	 * リサイズ時やカスタムイベント時に使用（data-table-mode="true"のもののみ処理）
	 */
	function equalizeColumnWidths() {
		// テーブルモードが有効なスクロール可能なグループブロックを取得
		const scrollableGroups = document.querySelectorAll(
			'.wp-block-group.is-style-vk-group-scrollable[data-table-mode="true"]'
		);

		// 新しく追加されたグループブロックを監視対象に追加
		scrollableGroups.forEach((group) => {
			observeGroup(group);
		});

		// 各グループブロックを個別に処理（パフォーマンス向上）
		scrollableGroups.forEach((group) => {
			// ブレークポイントに応じてテーブルモードを適用するかどうかを判定
			if (shouldApplyTableMode(group)) {
				processGroupBlock(group);
			} else {
				// テーブルモードを適用しない場合は、min-widthを削除
				removeMinWidthFromColumns(group);
			}
		});
	}

	// 監視中のグループブロックを記録（重複監視を防ぐ）
	const observedGroups = new WeakSet();
	// Intersection Observerで監視中のグループブロックを記録
	const intersectionObservedGroups = new WeakSet();

	// MutationObserverで動的に追加された要素にも対応
	// attributesの変更（minWidthの設定）は無視する
	const observer = new MutationObserver((mutations) => {
		// 更新中は無視
		if (isUpdating) {
			return;
		}

		// attributesの変更は無視（minWidthの設定による再実行を防ぐ）
		const hasRelevantChanges = mutations.some((mutation) => {
			return (
				mutation.type === 'childList' &&
				(mutation.addedNodes.length > 0 ||
					mutation.removedNodes.length > 0)
			);
		});

		if (hasRelevantChanges) {
			// 変更があったグループブロックのみを処理（パフォーマンス向上）
			const groupsToProcess = new Set();
			const groupsToClean = new Set();
			mutations.forEach((mutation) => {
				let group = mutation.target;
				// 親要素を遡ってグループブロックを探す
				while (
					group &&
					(!group.classList ||
						!group.classList.contains('wp-block-group') ||
						!group.classList.contains(
							'is-style-vk-group-scrollable'
						))
				) {
					group = group.parentElement;
				}
				if (group) {
					// data-table-modeがtrueの場合は処理対象に追加
					if (group.getAttribute('data-table-mode') === 'true') {
						// ブレークポイントに応じてテーブルモードを適用するかどうかを判定
						if (shouldApplyTableMode(group)) {
							groupsToProcess.add(group);
						} else {
							// テーブルモードを適用しない場合はmin-width削除対象に追加
							groupsToClean.add(group);
						}
					} else {
						// data-table-modeがtrueでない場合はmin-width削除対象に追加
						groupsToClean.add(group);
					}
				}
			});
			// 変更があったグループブロックを処理（コンテンツ変更時は再処理が必要）
			groupsToProcess.forEach((group) => {
				// 非同期処理でブラウザをブロックしない
				requestAnimationFrame(() => {
					processGroupBlock(group);
				});
			});
			// data-table-modeがtrueでないグループブロックからmin-widthを削除
			groupsToClean.forEach((group) => {
				requestAnimationFrame(() => {
					removeMinWidthFromColumns(group);
				});
			});
		}
	});

	/**
	 * グループブロックを監視対象に追加
	 * @param {HTMLElement} group - 監視対象のグループブロック要素
	 */
	function observeGroup(group) {
		if (!observedGroups.has(group)) {
			observer.observe(group, {
				childList: true,
				subtree: true,
				attributes: false, // attributesの変更は無視
			});
			observedGroups.add(group);
		}
	}
	// 処理済みのグループブロックを記録（Intersection Observerで初回表示時のみ処理）
	const processedGroups = new WeakSet();

	// Intersection Observerで動的に追加されたグループブロックを自動検出
	// 表示領域に入った時に自動的に処理される
	const intersectionObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (
					entry.isIntersecting &&
					!processedGroups.has(entry.target)
				) {
					// 表示領域に入ったグループブロックを処理（同期的に処理）
					// ブレークポイントに応じてテーブルモードを適用するかどうかを判定
					if (shouldApplyTableMode(entry.target)) {
						processGroupBlock(entry.target);
					} else {
						// テーブルモードを適用しない場合は、min-widthを削除
						removeMinWidthFromColumns(entry.target);
					}
					processedGroups.add(entry.target);
					// 一度処理したら監視を解除（パフォーマンス向上）
					intersectionObserver.unobserve(entry.target);
				}
			});
		},
		{
			// 少し早めに検出（表示領域の10%が見えた時点）
			rootMargin: '10%',
		}
	);

	/**
	 * テーブルモードが無効なグループブロックからmin-widthを削除
	 * @param {HTMLElement} group - 処理対象のグループブロック要素
	 */
	function removeMinWidthFromColumns(group) {
		// 一度にすべてのカラムを取得（min-widthが設定されているもののみ）
		const columns = group.querySelectorAll(
			'.wp-block-columns .wp-block-column[style*="min-width"]'
		);

		// requestAnimationFrameでまとめて処理
		if (columns.length > 0) {
			requestAnimationFrame(() => {
				columns.forEach((column) => {
					column.style.minWidth = '';
				});
			});
		}
	}

	/**
	 * 単一のグループブロックを処理（パフォーマンス向上のため個別処理）
	 * @param {HTMLElement} group - 処理対象のグループブロック要素（data-table-mode="true"のもののみ）
	 */
	function processGroupBlock(group) {
		// 更新中フラグを設定
		isUpdating = true;

		// グループ内のすべてのカラムブロック（行）を取得
		const columnsContainers = Array.from(
			group.querySelectorAll('.wp-block-columns')
		);
		if (columnsContainers.length === 0) {
			isUpdating = false;
			return;
		}

		// 測定用コンテナを取得（再利用）
		const tempContainer = getMeasurementContainer();

		// 最大列数を取得
		let maxColumnCount = 0;
		columnsContainers.forEach((container) => {
			const columnCount =
				container.querySelectorAll('.wp-block-column').length;
			if (columnCount > maxColumnCount) {
				maxColumnCount = columnCount;
			}
		});

		// 各列位置ごとに最大幅を計算（バッチ処理でパフォーマンス向上）
		const columnMaxWidths = [];

		for (let colIndex = 0; colIndex < maxColumnCount; colIndex++) {
			// 同じ列位置にあるすべてのカラムを収集
			const columns = [];
			columnsContainers.forEach((container) => {
				const containerColumns = Array.from(
					container.querySelectorAll('.wp-block-column')
				);
				if (containerColumns[colIndex]) {
					columns.push(containerColumns[colIndex]);
				}
			});

			// バッチ処理で一度に測定
			columnMaxWidths[colIndex] = measureColumnsWidth(
				columns,
				tempContainer
			);
		}

		// 各列位置のカラムに同じ最小幅を設定
		columnsContainers.forEach((container) => {
			const columns = Array.from(
				container.querySelectorAll('.wp-block-column')
			);
			columns.forEach((column, colIndex) => {
				if (columnMaxWidths[colIndex] > 0) {
					column.style.minWidth = `${columnMaxWidths[colIndex]}px`;
				}
			});
		});

		// 更新中フラグを解除
		isUpdating = false;
	}

	/**
	 * 新しく追加されたグループブロックをIntersection Observerで監視
	 * @param {Node} node - チェック対象のノード
	 */
	function observeNewGroup(node) {
		// 追加されたノード自体がグループブロックか確認（data-table-mode="true"のもののみ）
		if (
			node.nodeType === Node.ELEMENT_NODE &&
			node.classList &&
			node.classList.contains('wp-block-group') &&
			node.classList.contains('is-style-vk-group-scrollable') &&
			node.getAttribute('data-table-mode') === 'true'
		) {
			if (!intersectionObservedGroups.has(node)) {
				intersectionObserver.observe(node);
				intersectionObservedGroups.add(node);
			}
		}

		if (
			node.nodeType === Node.ELEMENT_NODE &&
			node.classList &&
			node.classList.contains('wp-block-group') &&
			node.classList.contains('is-style-vk-group-scrollable')
		) {
			applyNestedGridScrollableStyle(node);
		}

		// 追加されたノードの子要素にグループブロックが含まれているか確認
		if (node.nodeType === Node.ELEMENT_NODE) {
			const nestedScrollableGroups = node.querySelectorAll(
				'.wp-block-group.is-style-vk-group-scrollable'
			);
			nestedScrollableGroups.forEach((group) => {
				applyNestedGridScrollableStyle(group);
			});

			// data-table-mode="true"のもののみIntersection Observerに追加
			const nestedGroups = node.querySelectorAll(
				'.wp-block-group.is-style-vk-group-scrollable[data-table-mode="true"]'
			);
			nestedGroups.forEach((group) => {
				if (!intersectionObservedGroups.has(group)) {
					intersectionObserver.observe(group);
					intersectionObservedGroups.add(group);
				}
			});
		}
	}

	// DOM変更を監視して、新しく追加されたグループブロックを検出（軽量版）
	// 追加されたノードのみをチェックして、パフォーマンスを最適化
	const checkNewGroupsObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (
				mutation.type === 'childList' &&
				mutation.addedNodes.length > 0
			) {
				mutation.addedNodes.forEach((node) => {
					observeNewGroup(node);
				});
			}
		});
	});

	/**
	 * 親要素のgrid-template-columnsからminimumColumnWidthを取得
	 * @param {HTMLElement} group - グループブロック要素
	 * @return {{kind: string, value: string}|null} minimumColumnWidthの値
	 */
	function getMinimumColumnWidth(group) {
		const extractMinimumColumnWidth = (gridTemplateColumns) => {
			if (!gridTemplateColumns) {
				return null;
			}
			// grid-template-columns: repeat(3, minmax(0, 1fr))
			const repeatMinmaxMatch = gridTemplateColumns.match(
				/repeat\(\s*(\d+)\s*,\s*minmax\(\s*0(?:px)?\s*,\s*1fr\s*\)\s*\)/i
			);
			if (repeatMinmaxMatch && repeatMinmaxMatch[1]) {
				return {
					kind: 'repeat-fr',
					value: repeatMinmaxMatch[1].trim(),
				};
			}
			// grid-template-columns: repeat(3, 1fr)
			const repeatFrMatch = gridTemplateColumns.match(
				/repeat\(\s*(\d+)\s*,\s*1fr\s*\)/i
			);
			if (repeatFrMatch && repeatFrMatch[1]) {
				return { kind: 'repeat-fr', value: repeatFrMatch[1].trim() };
			}
			// grid-template-columns: repeat(auto-fill, minmax(min(XXXpx, 100%), 1fr))
			const minMatch = gridTemplateColumns.match(
				/min\(([^,]+),\s*100%\)/i
			);
			if (minMatch && minMatch[1]) {
				return { kind: 'min', value: minMatch[1].trim() };
			}
			// grid-template-columns: repeat(3, minmax(0, 1fr))
			const minmaxMatch = gridTemplateColumns.match(
				/minmax\(\s*([^,]+)\s*,\s*([^)]+)\)/i
			);
			if (minmaxMatch && minmaxMatch[1] && minmaxMatch[2]) {
				const minValue = minmaxMatch[1].trim();
				const maxValue = minmaxMatch[2].trim();
				return {
					kind: 'minmax',
					value: `minmax(${minValue}, ${maxValue})`,
				};
			}
			return null;
		};
		// wp-container-core-group-is-layout-* クラスを持つ要素を検索
		// まずグループブロック自体をチェック
		let containerElement = null;
		let containerClassName = null;
		const groupClasses = Array.from(group.classList);
		const containerClass = groupClasses.find((cls) =>
			cls.includes('wp-container-core-group-is-layout-')
		);

		if (containerClass) {
			containerElement = group;
			containerClassName = containerClass;
		} else {
			// グループブロックの子要素を検索
			containerElement = group.querySelector(
				'[class*="wp-container-core-group-is-layout-"]'
			);
			if (containerElement) {
				const containerClasses = Array.from(containerElement.classList);
				containerClassName = containerClasses.find((cls) =>
					cls.includes('wp-container-core-group-is-layout-')
				);
			}
		}

		// スタイルシートから直接値を取得
		if (containerClassName) {
			// すべてのスタイルシートを検索
			for (let i = 0; i < document.styleSheets.length; i++) {
				try {
					const styleSheet = document.styleSheets[i];
					const rules = styleSheet.cssRules || styleSheet.rules;
					if (!rules) {
						continue;
					}

					for (let j = 0; j < rules.length; j++) {
						const rule = rules[j];
						if (
							rule.selectorText &&
							rule.selectorText.includes(containerClassName)
						) {
							const gridTemplateColumns =
								rule.style.gridTemplateColumns;

							const extracted =
								extractMinimumColumnWidth(gridTemplateColumns);
							if (extracted) {
								return extracted;
							}
						}
					}
				} catch (e) {
					// クロスオリジンのスタイルシートなどでエラーが発生する可能性がある
					// エラーは無視して次のスタイルシートをチェック
				}
			}
		}

		// デフォルト値（WordPressのデフォルトは12rem）
		return { kind: 'min', value: '12rem' };
	}

	/**
	 * ブレークポイントに応じてグリッドレイアウトの横スクロールを適用するかどうかを判定
	 * @param {string} breakpoint ブレークポイント
	 * @return {boolean} グリッドレイアウトの横スクロールを適用するかどうか
	 */
	function shouldApplyGridScrollableByBreakpoint(breakpoint) {
		if (!breakpoint) {
			return false;
		}

		const windowWidth = window.innerWidth;
		const mobileBreakpoint = 575.98;
		const tabletBreakpoint = 991.98;

		// PCブレークポイントの場合：常に適用
		if (breakpoint === 'group-scrollable-pc') {
			return true;
		}

		// Tabletブレークポイントの場合：991.98px以下の場合のみ適用
		if (breakpoint === 'group-scrollable-tablet') {
			return windowWidth <= tabletBreakpoint;
		}

		// Mobileブレークポイントの場合：575.98px以下の場合のみ適用
		if (breakpoint === 'group-scrollable-mobile') {
			return windowWidth <= mobileBreakpoint;
		}

		return false;
	}

	/**
	 * グリッドレイアウトの横スクロール設定を適用
	 * @param {HTMLElement} group      グループブロック要素
	 * @param {string}      breakpoint ブレークポイント
	 */
	function applyGridScrollableStyleWithBreakpoint(group, breakpoint) {
		if (!group.classList.contains('is-layout-grid')) {
			return;
		}

		// ブレークポイントに応じて適用するかどうかを判定
		if (!shouldApplyGridScrollableByBreakpoint(breakpoint)) {
			// 適用しない場合は、設定を削除
			group.style.gridTemplateColumns = '';
			group.style.gridAutoColumns = '';
			return;
		}

		const minimumColumnWidth = getMinimumColumnWidth(group);
		if (minimumColumnWidth) {
			// grid-template-columnsをnoneにして、grid-auto-columnsを設定
			group.style.gridTemplateColumns = 'none';
			if (minimumColumnWidth.kind === 'repeat-fr') {
				group.style.gridAutoColumns = `calc(100% / ${minimumColumnWidth.value})`;
			} else if (minimumColumnWidth.kind === 'minmax') {
				group.style.gridAutoColumns = minimumColumnWidth.value;
			} else {
				group.style.gridAutoColumns = `minmax(min(${minimumColumnWidth.value}, 100%), max-content)`;
			}
		} else {
			group.style.gridTemplateColumns = '';
			group.style.gridAutoColumns = '';
		}
	}

	function applyNestedGridScrollableStyle(group) {
		if (
			!group.classList.contains('wp-block-group') ||
			!group.classList.contains('is-style-vk-group-scrollable')
		) {
			return;
		}
		const breakpoint = group.getAttribute('data-scroll-breakpoint');
		if (!breakpoint) {
			return;
		}
		Array.from(group.children).forEach((child) => {
			if (
				child.classList &&
				child.classList.contains('wp-block-group') &&
				child.classList.contains('is-layout-grid')
			) {
				applyGridScrollableStyleWithBreakpoint(child, breakpoint);
			}
		});
	}

	/**
	 * 初期化処理
	 */
	function init() {
		const scrollableGroups = document.querySelectorAll(
			'.wp-block-group.is-style-vk-group-scrollable'
		);
		scrollableGroups.forEach((group) => {
			applyNestedGridScrollableStyle(group);
		});

		// 既存のグループブロックをIntersection Observerで監視（表示領域に入った時だけ処理）
		// data-table-mode="true"のもののみ処理することでパフォーマンスを向上
		const existingGroups = document.querySelectorAll(
			'.wp-block-group.is-style-vk-group-scrollable[data-table-mode="true"]'
		);
		existingGroups.forEach((group) => {
			if (!intersectionObservedGroups.has(group)) {
				intersectionObserver.observe(group);
				intersectionObservedGroups.add(group);
			}
		});

		// data-table-modeがtrueでないスクロール可能なグループブロックからmin-widthを削除
		const nonTableModeGroups = document.querySelectorAll(
			'.wp-block-group.is-style-vk-group-scrollable:not([data-table-mode="true"])'
		);
		nonTableModeGroups.forEach((group) => {
			removeMinWidthFromColumns(group);
		});

		// document.bodyを監視して、新しく追加されたグループブロックを検出
		checkNewGroupsObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	// DOMContentLoaded時に初期化
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	/**
	 * 要素が可視領域内にあるかチェック
	 * @param {HTMLElement} element - チェック対象の要素
	 * @return {boolean} 可視領域内にある場合true
	 */
	function isElementVisible(element) {
		const rect = element.getBoundingClientRect();
		return (
			rect.top < window.innerHeight &&
			rect.bottom > 0 &&
			rect.left < window.innerWidth &&
			rect.right > 0
		);
	}

	// リサイズ時にも再計算（可視領域内のみ、パフォーマンス向上）
	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			const scrollableGroups = document.querySelectorAll(
				'.wp-block-group.is-style-vk-group-scrollable'
			);
			scrollableGroups.forEach((group) => {
				if (isElementVisible(group)) {
					applyNestedGridScrollableStyle(group);
				}
			});

			// 可視領域内のテーブルモードが有効なグループブロックのみを処理
			const scrollableTableGroups = document.querySelectorAll(
				'.wp-block-group.is-style-vk-group-scrollable[data-table-mode="true"]'
			);
			scrollableTableGroups.forEach((group) => {
				if (isElementVisible(group)) {
					requestAnimationFrame(() => {
						// ブレークポイントに応じてテーブルモードを適用するかどうかを判定
						if (shouldApplyTableMode(group)) {
							processGroupBlock(group);
						} else {
							// テーブルモードを適用しない場合は、min-widthを削除
							removeMinWidthFromColumns(group);
						}
					});
				}
			});

			// data-table-modeがtrueでないスクロール可能なグループブロックからmin-widthを削除
			const nonTableModeGroups = document.querySelectorAll(
				'.wp-block-group.is-style-vk-group-scrollable:not([data-table-mode="true"])'
			);
			nonTableModeGroups.forEach((group) => {
				if (isElementVisible(group)) {
					removeMinWidthFromColumns(group);
				}
			});
		}, 250);
	});

	// カスタムイベントもサポート（明示的に呼び出したい場合、同期的に処理）
	window.addEventListener('vk-blocks-group-scrollable-update', () => {
		equalizeColumnWidths();
	});
})();
