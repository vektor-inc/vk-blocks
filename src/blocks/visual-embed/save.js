import { useBlockProps } from '@wordpress/block-editor';

export default function save({ attributes }) {
	const { iframeCode } = attributes;

	const updatedIframeCode = iframeCode.replace(/<a /g, '<a rel="noopener" ');

	const blockProps = useBlockProps.save({
		className: 'vk-visual-embed',
	});

	return (
		<div {...blockProps}>
			{iframeCode && (
				<div
					className="vk-visual-embed-preview"
					dangerouslySetInnerHTML={{ __html: updatedIframeCode }}
				/>
			)}
		</div>
	);
}
