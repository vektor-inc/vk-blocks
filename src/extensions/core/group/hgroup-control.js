/**
 * グループブロックの「見出しグループ（hgroup）」スイッチ
 *
 * 本体の「HTML 要素」セレクトには hgroup の選択肢が無く、プラグイン側から
 * 選択肢を足す手段も無い。そのためスイッチを別に置き、tagName を直接切り替える。
 * 新しい属性は作らず、ON/OFF の表示は tagName === 'hgroup' で決める。
 *
 * @package
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { Notice, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Fragment, useMemo } from '@wordpress/element';
import { VkPanelIcon } from '@vkblocks/components/vk-icon';

// hgroup のときに保存する tagName と、OFF にしたときに戻す tagName
const HGROUP_TAG_NAME = 'hgroup';
const DEFAULT_TAG_NAME = 'div';

// hgroup の直下に置ける本体のブロック名
const HEADING_BLOCK_NAME = 'core/heading';
const PARAGRAPH_BLOCK_NAME = 'core/paragraph';

// 警告をスイッチの付属物として近づけるための上マージン。
// サイドバーは縦に並ぶ要素へ一律 16px の下マージンを付ける（スイッチ・警告とも）ため、
// そのままではスイッチ → 警告の間隔がグループ間（警告 → 次の項目）と同じ幅になってしまう。
// 負のマージンで詰め、グループ内 < グループ間にする（警告の箱の内側の余白は変えない）。
const FIRST_NOTICE_MARGIN_TOP = '-10px';
const FOLLOWING_NOTICE_MARGIN_TOP = '-8px';

// ラベルとアイコンを同じ行で縦中央にそろえる（アイコンは 24px で行より高い）
const LABEL_WITH_ICON_STYLE = {
	display: 'inline-flex',
	alignItems: 'center',
};

// パネル見出しでは本体の CSS が線の色を文字色にそろえるが、スイッチのラベルの中では効かず、
// ON の黒地で線が黒くなる。そのため線の色を文字色（ON のときは白）に指定する
const ICON_FILL_STYLE = { fill: 'currentColor' };

// 中身が空のときに useSelect が返す配列（毎回同じ参照を返して再描画を避ける）
const EMPTY_BLOCKS = [];

/**
 * hgroup の直下のブロックが HTML の仕様に合っているかを判定する。
 * 見出しブロックがちょうど 1 つで、ほかは段落ブロックだけなら true。
 * 中身が空のときは判定の対象外として true を返す。
 *
 * @param {Array} blocks グループ直下のブロックの配列
 * @return {boolean} 仕様に合っていれば true
 */
export const isValidHgroupContent = (blocks) => {
	if (!Array.isArray(blocks) || blocks.length === 0) {
		return true;
	}

	// 見出し・段落以外のブロックがあれば NG
	const hasOtherBlock = blocks.some(
		(block) =>
			block.name !== HEADING_BLOCK_NAME &&
			block.name !== PARAGRAPH_BLOCK_NAME
	);
	if (hasOtherBlock) {
		return false;
	}

	// 見出しブロックはちょうど 1 つ
	const headingCount = blocks.filter(
		(block) => block.name === HEADING_BLOCK_NAME
	).length;
	return headingCount === 1;
};

/**
 * 1 文ずつ翻訳した文を、間に空白を挟んで 1 つの文章にする。
 *
 * @param {...string} sentences 翻訳済みの文
 * @return {string} 連結した文章
 */
const joinSentences = (...sentences) => sentences.join(' ');

/**
 * グループブロックのサイドバー「高度な設定」に出す hgroup のスイッチと警告。
 *
 * @param {Object}   props               props
 * @param {string}   props.clientId      グループブロックの clientId
 * @param {Object}   props.attributes    グループブロックの属性
 * @param {Function} props.setAttributes 属性の更新関数
 * @return {JSX.Element} スイッチと警告
 */
export default function HgroupControl({ clientId, attributes, setAttributes }) {
	const { tagName, linkUrl, linkToPost } = attributes || {};
	const isHgroup = tagName === HGROUP_TAG_NAME;

	// hgroup が ON のときだけ、グループ直下のブロックを購読する
	const innerBlocks = useSelect(
		(select) =>
			isHgroup
				? select('core/block-editor').getBlocks(clientId)
				: EMPTY_BLOCKS,
		[clientId, isHgroup]
	);

	const hasInvalidContent = useMemo(
		() => isHgroup && !isValidHgroupContent(innerBlocks),
		[isHgroup, innerBlocks]
	);

	// リンクは a 要素を内側に足すため、hgroup とは併用できない
	const hasLink = isHgroup && !!(linkUrl || linkToPost);

	return (
		<InspectorControls group="advanced">
			<ToggleControl
				__nextHasNoMarginBottom
				label={
					<span style={LABEL_WITH_ICON_STYLE}>
						{__(
							'Mark up as a heading group (<hgroup>)',
							'vk-blocks'
						)}
						{/* アイコンは飾りなので、チェックボックスの名前には含めない */}
						<span aria-hidden="true" style={LABEL_WITH_ICON_STYLE}>
							<VkPanelIcon
								isActive={isHgroup}
								customStyle={ICON_FILL_STYLE}
							/>
						</span>
					</span>
				}
				help={joinSentences(
					__(
						'Marks a heading and its subtitle or tagline as one unit in HTML.',
						'vk-blocks'
					),
					__(
						'The "HTML element" field keeps showing "Default" while this is on.',
						'vk-blocks'
					)
				)}
				checked={isHgroup}
				onChange={(checked) =>
					setAttributes({
						tagName: checked ? HGROUP_TAG_NAME : DEFAULT_TAG_NAME,
					})
				}
			/>
			{(hasInvalidContent || hasLink) && (
				<Fragment>
					{hasInvalidContent && (
						<div style={{ marginTop: FIRST_NOTICE_MARGIN_TOP }}>
							<Notice status="warning" isDismissible={false}>
								{__(
									'<hgroup> can only contain one Heading block and Paragraph blocks, such as a subtitle.',
									'vk-blocks'
								)}
							</Notice>
						</div>
					)}
					{hasLink && (
						<div
							style={{
								marginTop: hasInvalidContent
									? FOLLOWING_NOTICE_MARGIN_TOP
									: FIRST_NOTICE_MARGIN_TOP,
							}}
						>
							<Notice status="warning" isDismissible={false}>
								{__(
									'Group links cannot be used with <hgroup>.',
									'vk-blocks'
								)}
							</Notice>
						</div>
					)}
				</Fragment>
			)}
		</InspectorControls>
	);
}
