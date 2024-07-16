/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';

export const SCOPE_OPTIONS = [
	{
		name: 'inserter',
		label: __( 'Inserter', 'vk-blocks' ),
		help: createInterpolateElement(
			__(
				'Displayed on the inserter. <Link>Learn more about inserters</Link>.',
				'vk-blocks'
			),
			{
				Link: (
					<ExternalLink
						href={ __(
							'https://wordpress.org/documentation/article/adding-a-new-block/#what-is-the-inserter',
							'vk-blocks'
						) }
					/>
				),
			}
		),
	},
	{
		name: 'block',
		label: __( 'Block', 'vk-blocks' ),
		help: __( 'It will appear in the variation picker.', 'vk-blocks' ),
	},
	{
		name: 'transform',
		label: __( 'Transform', 'vk-blocks' ),
		help: __( 'Displayed in block variation transformation.', 'vk-blocks' ),
	},
];
