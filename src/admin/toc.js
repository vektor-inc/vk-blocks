/*globals vkBlocksObject */
import { __ } from '@wordpress/i18n';
import { useContext, useMemo, useCallback } from '@wordpress/element';
import { AdminContext } from './index';
import { SelectControl, CheckboxControl } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import classnames from 'classnames';
import {
	generateHeadingLevels,
	getCurrentMaxLevel,
} from '@vkblocks/utils/heading-level-utils';

function AdminToc({ borderBoxBlockType }) {
	const instanceId = useInstanceId(AdminToc);
	const { vkBlocksOption, setVkBlocksOption } = useContext(AdminContext);

	// blockJsonのtitleがあったらblockTypesのtitleがあれば
	const getBlockTitle = useCallback((name, blockTypeTitle) => {
		// vkBlocksObjectが利用可能な場合
		if (
			typeof vkBlocksObject !== 'undefined' &&
			vkBlocksObject.blockJsonLists
		) {
			const blockJsonList = vkBlocksObject.blockJsonLists.find(
				(item) => item.name === name
			);
			return blockJsonList && blockJsonList.title
				? blockJsonList.title
				: blockTypeTitle;
		}
		return blockTypeTitle;
	}, []);

	// 枠線ブロックのタイトルをメモ化
	const borderBoxTitle = useMemo(() => {
		return getBlockTitle(
			'vk-blocks/border-box',
			__('Border Box', 'vk-blocks')
		);
	}, [getBlockTitle]);

	// ブロックマネージャーと同じ構造のトグル関数
	const toggleBorderBoxInclusion = useCallback(
		(nextIsChecked) => {
			setVkBlocksOption({
				...vkBlocksOption,
				toc_include_border_box: nextIsChecked,
			});
		},
		[vkBlocksOption, setVkBlocksOption]
	);

	const handleMaxLevelChange = (maxLevel) => {
		const levels = generateHeadingLevels(maxLevel);

		setVkBlocksOption({
			...vkBlocksOption,
			toc_heading_levels: levels,
		});
	};

	// 現在の最大レベルを取得
	const getCurrentMaxLevelForAdmin = () => {
		return getCurrentMaxLevel(vkBlocksOption.toc_heading_levels);
	};

	return (
		<section className="vk_admin_page_section" id="toc-setting">
			<h3>{__('Table of Contents Setting', 'vk-blocks')}</h3>
			<p>
				{__(
					'Please specify a common heading level setting to be used across the site.',
					'vk-blocks'
				)}
			</p>
			<SelectControl
				name="vk_blocks_options[toc_heading_levels]"
				className="vk_admin_selectControl"
				value={getCurrentMaxLevelForAdmin()}
				options={[
					{ label: 'H2', value: 'h2' },
					{ label: 'H3', value: 'h3' },
					{ label: 'H4', value: 'h4' },
					{ label: 'H5', value: 'h5' },
					{ label: 'H6', value: 'h6' },
				]}
				onChange={(value) => handleMaxLevelChange(value)}
			/>
			<p className="description">
				{__(
					'Headings from H2 up to the selected level will be included.',
					'vk-blocks'
				)}
			</p>
			<div style={{ marginTop: '1rem' }}>
				<h4>{__('Include in Table of Contents', 'vk-blocks')}</h4>
				<div
					role="group"
					aria-labelledby={`toc-block-integration-title-${instanceId}`}
					className={classnames(
						'block-manager__category',
						'blockManagerList'
					)}
				>
					<ul className="block-manager__checklist block-manager__checklist--no-parent">
						<li className="block-manager__checklist-item block-manager__checklist-item--no-parent">
							<CheckboxControl
								__nextHasNoMarginBottom
								label={
									<>
										{borderBoxTitle}
										{borderBoxBlockType && (
											<BlockIcon
												icon={borderBoxBlockType.icon}
											/>
										)}
									</>
								}
								checked={
									!!vkBlocksOption?.toc_include_border_box
								}
								onChange={toggleBorderBoxInclusion}
								name="vk_blocks_options[toc_include_border_box]"
							/>
						</li>
					</ul>
				</div>
				<p className="description">
					{__(
						'When enabled, headings within Border Box blocks will be included in the Table of Contents.',
						'vk-blocks'
					)}
				</p>
			</div>
		</section>
	);
}

export default withSelect((select) => {
	const { getBlockType } = select('core/blocks');

	return {
		borderBoxBlockType: getBlockType('vk-blocks/border-box'),
	};
})(AdminToc);
