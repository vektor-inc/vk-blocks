/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';

/**
 * WordPress dependencies
 */
const {__} = wp.i18n; // Import __() from wp.i18n
const { Fragment } = wp.element;
const { PanelBody } = wp.components;
const { createBlock } = wp.blocks;
const { RichText, BlockControls, InspectorControls, AlignmentToolbar } = wp.editor;

export default function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	insertBlocksAfter,
	onReplace,
	className,
} ) {
	const { align, content, level, placeholder } = attributes;
		const tagName = 'h' + level;

	return (
		<Fragment>
			<BlockControls>
				<HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Heading Settings' ) }>
					<p>{ __( 'Level' ) }</p>
					<HeadingToolbar minLevel={ 1 } maxLevel={ 7 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
					<p>{ __( 'Text Alignment' ) }</p>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<RichText
				identifier="content"
				wrapperClassName="wp-block-heading"
				tagName={ tagName }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				unstableOnSplit={
					insertBlocksAfter ?
						( before, after, ...blocks ) => {
							setAttributes( { content: before } );
							insertBlocksAfter( [
								...blocks,
								createBlock( 'core/paragraph', { content: after } ),
							] );
						} :
						undefined
				}
				onRemove={ () => onReplace( [] ) }
				style={ { textAlign: align } }
				className={ className }
				placeholder={ placeholder || __( 'Write heading…' ) }
			/>
		</Fragment>
	);
}
