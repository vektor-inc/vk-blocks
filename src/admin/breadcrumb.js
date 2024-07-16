import { useState, useContext, useEffect } from '@wordpress/element';
import { TextControl } from '@wordpress/components'; // TextControl を追加
import { __ } from '@wordpress/i18n';
import { AdminContext } from '@vkblocks/admin/index';

export default function AdminBreadcrumb() {
	const { vkBlocksOption, setVkBlocksOption } = useContext( AdminContext );

	const [ separatorPrev, setSeparatorPrev ] = useState(
		vkBlocksOption.vk_blocks_pro_breadcrumb_separator || '/'
	);

	useEffect( () => {
		// vkBlocksOption.vk_blocks_pro_breadcrumb_separator の値を監視して、変更があれば setSeparatorPrev にセット
		setSeparatorPrev(
			vkBlocksOption.vk_blocks_pro_breadcrumb_separator || '/'
		);
	}, [ vkBlocksOption.vk_blocks_pro_breadcrumb_separator ] );

	return (
		<>
			<section className="breadcrumb">
				<h3 id="breadcrumb-setting">
					{ __( 'Breadcrumb Setting', 'vk-blocks' ) }
				</h3>
				<h4>{ __( 'Separator Setting', 'vk-blocks' ) }</h4>
				<p>
					{ __(
						'Please input the text you want to use as the separator.',
						'vk-blocks'
					) }
					<span style={ { marginLeft: '1em' } }>
						{ __( 'Ex: / , > , ≫', 'vk-blocks' ) }
					</span>
				</p>
				<div className="flex-col">
					<TextControl
						id="breadcrumb-selector"
						className="separator_input"
						name="vk_blocks_options[breadcrumb_separator_design]"
						value={
							! vkBlocksOption.vk_blocks_pro_breadcrumb_separator
								? ''
								: vkBlocksOption.vk_blocks_pro_breadcrumb_separator
						}
						onChange={ ( newValue ) => {
							newValue = newValue.trim();
							setVkBlocksOption( {
								...vkBlocksOption,
								vk_blocks_pro_breadcrumb_separator: newValue,
							} );
						} }
					/>
					<div className="preview_area">
						{ __( 'HOME', 'vk-blocks' ) } { separatorPrev }{ ' ' }
						{ __( 'Parent page', 'vk-blocks' ) } { separatorPrev }{ ' ' }
						{ __( 'Child page', 'vk-blocks' ) }
					</div>
				</div>
			</section>
		</>
	);
}
