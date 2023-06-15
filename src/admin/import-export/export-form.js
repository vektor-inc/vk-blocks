/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, CheckboxControl } from '@wordpress/components';
import { download as downloadIcon } from '@wordpress/icons';
import { useContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AdminContext } from '@vkblocks/admin/index';
import { download } from './file';
import { OPTION_DEFAULT_SETTINGS } from './index';
/*globals vkBlocksObject */

export default function ExportForm() {
	const { vkBlocksOption } = useContext(AdminContext);
	const [exportOptionLists, setExportOptionLists] = useState(
		OPTION_DEFAULT_SETTINGS
	);

	async function handleExport(event) {
		event.preventDefault();

		// exportOptionListsからすべてのオプションプロパティー名を取得
		const allOptionNames = new Set();
		exportOptionLists.forEach((setting) => {
			setting.options.forEach((option) => {
				allOptionNames.add(option.name);
			});
		});

		// 一旦DBから全ての値をエクスポート対象の変数に入れる
		const exportVkBlocksOptions = { ...vkBlocksObject.options };

		// exportVkBlocksOptionsから、exportOptionListsに存在しないプロパティを削除します
		for (const key in exportVkBlocksOptions) {
			if (!allOptionNames.has(key)) {
				delete exportVkBlocksOptions[key];
			}
		}

		// ユーザーがエクスポート対象外にしたものを削除する
		exportOptionLists.forEach((setting) => {
			if (!setting.isExport) {
				setting.options.forEach(
					(option) => delete exportVkBlocksOptions[option.name]
				);
			}
		});

		const exportContents = {
			vkBlocksOptions: {
				...exportVkBlocksOptions,
			},
		};
		const fileContent = JSON.stringify(exportContents);
		const publishDate = new Date().toISOString().split('T')[0];
		const fileName = `vk-blocks-${publishDate}-export.json`;
		download(fileName, fileContent, 'application/json');
	}

	const isExportLists = exportOptionLists.filter((list) => !!list.isExport);
	let ariaChecked;
	if (isExportLists.length === exportOptionLists.length) {
		ariaChecked = 'true';
	} else if (isExportLists.length > 0) {
		ariaChecked = 'mixed';
	} else {
		ariaChecked = 'false';
	}

	const handleToggleAll = (value) => {
		const copyObj = JSON.parse(JSON.stringify(exportOptionLists));
		copyObj.forEach((list) => (list.isExport = value));
		setExportOptionLists(copyObj);
	};

	return (
		<div>
			<h4>{__('Export', 'vk-blocks')}</h4>
			<CheckboxControl
				label={__('Toggle all', 'vk-blocks')}
				checked={isExportLists.length === exportOptionLists.length}
				onChange={handleToggleAll}
				aria-checked={ariaChecked}
			/>
			{Object.keys(OPTION_DEFAULT_SETTINGS).map((key, index) => {
				const { groupTitle, isShow = true } =
					OPTION_DEFAULT_SETTINGS[key];
				const checked = exportOptionLists[index].isExport
					? true
					: false;
				const handleToggle = (value) => {
					const copyObj = JSON.parse(
						JSON.stringify(exportOptionLists)
					);
					copyObj[index].isExport = value;
					setExportOptionLists(copyObj);
				};
				return (
					isShow && (
						<CheckboxControl
							key={index}
							label={sprintf(
								// translators: Export %s
								__('Export %s', 'vk-blocks'),
								groupTitle
							)}
							checked={checked}
							onChange={(value) => handleToggle(value, index)}
						/>
					)
				);
			})}
			{vkBlocksObject.options !== vkBlocksOption && (
				<p>
					{__(
						'It seems that the changed settings are not saved. Export settings before change.',
						'vk-blocks'
					)}
				</p>
			)}
			<div className="submit">
				<Button
					variant="primary"
					icon={downloadIcon}
					onClick={handleExport}
					disabled={
						!exportOptionLists.some((list) => !!list.isExport)
					}
				>
					{__('Export', 'vk-blocks')}
				</Button>
			</div>
		</div>
	);
}
