/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AdminContext } from '@vkblocks/admin/index';

export default function AdminNewFaq() {
	const { vkBlocksOption, setVkBlocksOption } = useContext(AdminContext);

	return (
		<>
			<section>
				<h3 id="faq-setting">{__('FAQ Block Setting', 'vk-blocks')}</h3>
				<SelectControl
					name="vk_blocks_options[new_faq_accordion]"
					className="vk_admin_selectControl"
					value={vkBlocksOption.new_faq_accordion}
					onChange={(newValue) => {
						setVkBlocksOption({
							...vkBlocksOption,
							new_faq_accordion: newValue,
						});
					}}
					options={[
						{
							label: __('Disable accordion', 'vk-blocks'),
							value: 'disable',
						},
						{
							label: __(
								'Enable accordion and default open',
								'vk-blocks'
							),
							value: 'open',
						},
						{
							label: __(
								'Enable accordion and default close',
								'vk-blocks'
							),
							value: 'close',
						},
					]}
				/>
			</section>
		</>
	);
}
