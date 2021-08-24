import { ReactComponent as Icon } from './icon.svg';
import { __ } from '@wordpress/i18n';
import { registerFormatType, insert } from '@wordpress/rich-text';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarItem, DropdownMenu } from '@wordpress/components';

const breakPoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

// 改行を挿入する
const insertBR = (value, onChange, breakPoint) => {
	onChange(insert(value, `[br-${breakPoint}]`, value.start, value.end));
};

registerFormatType(`vk-blocks/responsive-br`, {
	title: __(`Responsive Br`, 'vk-blocks'),
	tagName: 'br',
	className: null,
	edit: (props) => {
		const { onChange, value } = props;

		return (
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarItem>
						{(toggleProps) => (
							<DropdownMenu
								icon={
									<svg
										width="24"
										height="24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M20 2v7.59H6.78l3.2 3.2-.48.5h-.88c.07-.83-.5-1.79-1.6-1.79h-.38L4 8.86 8.96 3.9 10 4.93l-3.21 3.2H18.5V2H20zM10.89 14.78H7.62a.11.11 0 00-.1.08l-.25.72c-.02.08.03.16.1.16h1.27c.1 0 .15.12.08.19L6.7 18.1l1.05 3.4c.02.07-.03.14-.1.14H6.63a.1.1 0 01-.1-.08L6 19.83c-.03-.1-.17-.1-.2 0l-.43 1.22a.1.1 0 000 .06l.39 1.49c.01.04.06.08.1.08h3.29c.07 0 .12-.08.1-.14l-1.33-4.28c-.01-.04 0-.09.03-.12l3.02-3.17c.07-.07.01-.2-.08-.2z"
											fill="#000"
										/>
										<path
											d="M7.02 13H5.03a.11.11 0 00-.1.08l-.26.73c-.03.07.03.15.1.15h.84c.08 0 .13.07.1.15l-2.37 6.72a.1.1 0 01-.2 0l-1.7-4.85a.11.11 0 01.1-.15h.86c.04 0 .09.03.1.07l.62 1.75c.03.1.17.1.2 0l.96-2.72a.11.11 0 00-.1-.15H.1c-.08 0-.13.07-.1.15l3.12 9c.04.1.17.1.2 0l3.8-10.78c.02-.07-.03-.15-.1-.15z"
											fill="#D8141C"
										/>
									</svg>
								}
								toggleProps={toggleProps}
								label={__(`Responsive BR`, 'vk-blocks')}
								controls={breakPoints.map((breakPoint) => {
									return {
										title:
											__(`Responsive BR `, 'vk-blocks') +
											`( ${breakPoint} )`,
										icon: <Icon />,
										onClick: () => {
											insertBR(
												value,
												onChange,
												breakPoint
											);
										},
									};
								})}
							/>
						)}
					</ToolbarItem>
				</ToolbarGroup>
			</BlockControls>
		);
	},
});
