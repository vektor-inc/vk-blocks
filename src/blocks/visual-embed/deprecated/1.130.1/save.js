import { useBlockProps } from '@wordpress/block-editor';
import { migrateLegacyAttributes } from '../../utils/embed-attributes';

/**
 * Reproduce the markup saved by 1.130.1 and earlier.
 * 1.130.1 以前が保存したマークアップを再現する。
 *
 * `legacyPreview` is sourced from the saved preview HTML, so the output always matches what was saved:
 * an intact iframe, a preview emptied by KSES (users without unfiltered_html), or the error text the old
 * editor wrote into the preview. None of them shows a block validation error.
 * `legacyPreview` は保存済みプレビューの HTML から読むため、出力は常に保存内容と一致する。
 * iframe が残っているもの、KSES で空になったもの（unfiltered_html の無いユーザー）、旧エディタが
 * プレビューに書き込んだエラー文のいずれも、ブロック検証エラーにならない。
 *
 * @param {Object} props            Block props.
 * @param {Object} props.attributes Legacy attributes.
 * @return {JSX.Element} Saved markup.
 */
const save = ({ attributes }) => {
	const { legacyPreview } = attributes;

	return (
		<div {...useBlockProps.save({ className: 'vk-visual-embed' })}>
			{legacyPreview !== undefined && (
				<div
					className="vk-visual-embed-preview"
					dangerouslySetInnerHTML={{ __html: legacyPreview }}
				/>
			)}
		</div>
	);
};

/**
 * Move the legacy data into `embedAttributes` (see migrateLegacyAttributes()).
 * 旧データを `embedAttributes` へ移す（migrateLegacyAttributes() を参照）。
 *
 * @param {Object} attributes Legacy attributes.
 * @return {Object} Attributes for the current block version.
 */
const migrate = (attributes) => migrateLegacyAttributes(attributes);

export { save, migrate };
