/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ExportForm from './export-form';
import ImportForm from './import-form';
/*globals vkBlocksObject */

export const OPTION_DEFAULT_SETTINGS = [
	{
		groupTitle: __('License Key', 'vk-blocks'),
		options: [
			{
				name: 'vk_blocks_pro_license_key',
			},
		],
		isImport: !!vkBlocksObject.isLicenseSetting,
		isShow: !!vkBlocksObject.isLicenseSetting,
	},
	{
		groupTitle: __('Balloon Setting', 'vk-blocks'),
		options: [
			{
				name: 'balloon_border_width',
			},
			{
				name: 'balloon_meta_lists',
				isArray: true,
				importMethod: 'add',
			},
		],
		isImport: true,
	},
	{
		groupTitle: __('Custom Format Setting', 'vk-blocks'),
		options: [
			{
				name: 'custom_format_lists',
				isArray: true,
				uniqKey: 'class_name',
				importMethod: 'add',
			},
		],
		isImport: !!vkBlocksObject.isPro,
		isShow: !!vkBlocksObject.isPro,
	},
	{
		groupTitle: __('Custom Block Style Setting', 'vk-blocks'),
		options: [
			{
				name: 'custom_block_style_lists',
				isArray: true,
				uniqKey: 'property_name',
				importMethod: 'add',
			},
		],
		isImport: !!vkBlocksObject.isPro,
		isShow: !!vkBlocksObject.isPro,
	},
	{
		groupTitle: __('Margin Setting', 'vk-blocks'),
		options: [
			{
				name: 'margin_unit',
			},
			{
				name: 'margin_size',
			},
		],
		isImport: true,
	},
	{
		groupTitle: __('Load Separate Setting', 'vk-blocks'),
		options: [
			{
				name: 'load_separate_option',
			},
		],
		isImport: true,
	},
	{
		groupTitle: __('FAQ Block Setting', 'vk-blocks'),
		options: [
			{
				name: 'new_faq_accordion',
			},
		],
		isImport: !!vkBlocksObject.isPro,
		isShow: !!vkBlocksObject.isPro,
	},
	{
		groupTitle: __('Custom CSS Setting', 'vk-blocks'),
		options: [
			{
				name: 'show_custom_css_editor_flag',
			},
		],
		isImport: !!vkBlocksObject.isPro,
		isShow: !!vkBlocksObject.isPro,
	},
	{
		groupTitle: __('Block Manager Setting', 'vk-blocks'),
		options: [
			{
				name: 'disable_block_lists',
			},
		],
		isImport: true,
	},
	{
		groupTitle: __('Block Style Manager Setting', 'vk-blocks'),
		options: [
			{
				name: 'disable_block_style_lists',
			},
		],
		isImport: true,
	},
];

export default function AdminImportExport(props) {
	const { isChanged, setIsChanged } = props;
	return (
		<section>
			<h3 id="import-export-tool">
				{__('Import Export Tool', 'vk-blocks')}
			</h3>
			<ExportForm isChanged={isChanged} />
			<ImportForm isChanged={isChanged} setIsChanged={setIsChanged} />
		</section>
	);
}
