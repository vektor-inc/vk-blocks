/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Notice,
	Snackbar,
	Modal,
	Flex,
	FlexItem,
	RadioControl,
	CheckboxControl,
} from '@wordpress/components';
import { upload } from '@wordpress/icons';
import { useContext, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AdminContext } from '@vkblocks/admin/index';
import { importOptions, readFile } from './import';
import { OPTION_DEFAULT_SETTINGS } from './index';

export default function ImportForm(props) {
	const { setIsChanged } = props;
	const { vkBlocksOption, setVkBlocksOption } = useContext(AdminContext);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isImportSuccess, setIsImportSuccess] = useState(false);
	const [error, setError] = useState(null);
	const [file, setFile] = useState(null);
	const [uploadedVkBlocksOptions, setUploadedVkBlocksOptions] =
		useState(null);
	const [importSettings, setImportSettings] = useState(
		OPTION_DEFAULT_SETTINGS
	);

	const openModal = () => {
		readFile(file)
			.then((uploadedOption) => {
				setUploadedVkBlocksOptions(uploadedOption.vkBlocksOptions);
				setIsModalOpen(true);
			})
			.catch((errors) => {
				let uiMessage;
				switch (errors.message) {
					case 'Invalid JSON file':
						uiMessage = __('Invalid JSON file', 'vk-blocks');
						break;
					default:
						uiMessage = __('Unknown error', 'vk-blocks');
				}
				setError(uiMessage);
			});
	};

	const closeModal = () => {
		setUploadedVkBlocksOptions(null);
		setImportSettings(OPTION_DEFAULT_SETTINGS);
		setIsModalOpen(false);
	};

	const onChangeFile = (event) => {
		setFile(event.target.files[0]);
		setError(null);
	};

	const getUpdateVkBlocksOptions = (
		_uploadedVkBlocksOptions,
		_vkBlocksOption,
		_importSettings
	) => {
		// isImportがfalseだったらuploadedOptionの該当のオプションを削除する(インポートしない)
		_importSettings.forEach((setting) => {
			if (!setting.isImport || ('isShow' in setting && !setting.isShow)) {
				setting.options.forEach(
					(option) => delete _uploadedVkBlocksOptions[option.name]
				);
			}
		});

		const updateVkBlocksOptions = _vkBlocksOption;
		// importMethodがaddだったら追加する
		_importSettings.forEach(({ options, isImport }) => {
			options.forEach(({ name, uniqKey, importMethod }, id) => {
				if (!!isImport) {
					if (importMethod === 'add') {
						if ('uniqKey' in options[id]) {
							// 識別子が被っていないもののみ追加する
							const addOption = [];
							if (
								_uploadedVkBlocksOptions[name] &&
								_uploadedVkBlocksOptions[name].length > 0 &&
								_vkBlocksOption[name]
							) {
								_uploadedVkBlocksOptions[name].forEach(
									(uploadedOptionElement) => {
										let isDuplicate = false;
										_vkBlocksOption[name].forEach(
											(vkBlocksOptionElement) => {
												if (
													uploadedOptionElement[
														uniqKey
													] ===
													vkBlocksOptionElement[
														uniqKey
													]
												) {
													isDuplicate = true;
												}
											}
										);
										if (!isDuplicate) {
											addOption.push(
												uploadedOptionElement
											);
										}
									}
								);
							}
							updateVkBlocksOptions[name].push(...addOption);
						} else {
							updateVkBlocksOptions[name].push(
								..._uploadedVkBlocksOptions[name]
							);
						}
					} else {
						// 上書きする
						updateVkBlocksOptions[name] =
							_uploadedVkBlocksOptions[name];
					}
				}
			});
		});
		return updateVkBlocksOptions;
	};

	const onSubmit = (event) => {
		event.preventDefault();
		if (!uploadedVkBlocksOptions) {
			return;
		}
		// アップデートするオプション値updateOptionを作る
		const updateVkBlocksOptions = getUpdateVkBlocksOptions(
			uploadedVkBlocksOptions,
			vkBlocksOption,
			importSettings
		);
		importOptions(updateVkBlocksOptions)
			.then((importResponse) => {
				closeModal();
				setIsImportSuccess(true);
				setFile(null);
				setVkBlocksOption({
					...vkBlocksOption,
					...importResponse.updateOption,
				});
				setIsChanged(false);
			})
			.catch((errors) => {
				let uiMessage;
				switch (errors.message) {
					case 'Invalid JSON file':
						uiMessage = __('Invalid JSON file', 'vk-blocks');
						break;
					default:
						uiMessage = __('Unknown error', 'vk-blocks');
				}
				setError(uiMessage);
			});
	};

	useEffect(() => {
		if (isImportSuccess) {
			setTimeout(() => {
				setIsImportSuccess(false);
			}, 3000);
		}
	}, [isImportSuccess]);

	// uploadedOptionからインポートするオプションが存在するか確認
	useEffect(() => {
		if (uploadedVkBlocksOptions) {
			const copyObj = JSON.parse(JSON.stringify(importSettings));
			Object.keys(OPTION_DEFAULT_SETTINGS).forEach((key, index) => {
				const { options } = importSettings[key];
				const isFind = options.find(
					(option) =>
						uploadedVkBlocksOptions &&
						option.name in uploadedVkBlocksOptions
				);
				if (!isFind) {
					copyObj[index].isImport = false;
					setImportSettings(copyObj);
				}
			});
		}
	}, [uploadedVkBlocksOptions]);

	const onDismissError = () => {
		setError(null);
	};

	return (
		<div>
			<h4>{__('Import', 'vk-blocks')}</h4>
			{error && (
				<Notice status="error" onRemove={() => onDismissError()}>
					{error}
				</Notice>
			)}
			<div>
				<input
					type="file"
					accept="application/json"
					onChange={onChangeFile}
				/>
			</div>
			<div className="submit">
				<Button
					onClick={openModal}
					variant="primary"
					icon={upload}
					disabled={!file ? true : false}
				>
					{__('Import', 'vk-blocks')}
				</Button>
			</div>
			{isModalOpen && (
				<Modal
					title={__('Import data confirmation', 'vk-blocks')}
					onRequestClose={closeModal}
					isDismissible={false}
					className="import_export_add_modal"
					isFullScreen={true}
				>
					{!importSettings.some((list) => list.isImport === true) && (
						<p>{__('No import data', 'vk-blocks')}</p>
					)}
					{OPTION_DEFAULT_SETTINGS.map(
						({ groupTitle, options, isShow = true }, index) => {
							const isFind = options.find(
								(option) =>
									uploadedVkBlocksOptions &&
									option.name in uploadedVkBlocksOptions
							);
							const checked = importSettings[index].isImport;
							const handleToggle = (value) => {
								const copyObj = JSON.parse(
									JSON.stringify(importSettings)
								);
								copyObj[index].isImport = value;
								setImportSettings(copyObj);
							};
							const onChangeIsOverride = (value, id) => {
								const copyObj = JSON.parse(
									JSON.stringify(importSettings)
								);
								copyObj[index].options[id].importMethod = value;
								setImportSettings(copyObj);
							};
							return (
								isShow &&
								isFind && (
									<div
										key={index}
										className="import_export_section"
									>
										<CheckboxControl
											key={index}
											label={sprintf(
												// translators: Import %s
												__('Import %s', 'vk-blocks'),
												groupTitle
											)}
											checked={checked}
											onChange={handleToggle}
										/>
										{options.map(
											(
												{
													name,
													uniqKey = false,
													importMethod,
												},
												id
											) =>
												checked &&
												importMethod && (
													<div
														key={id}
														className="import_export_detail_area"
													>
														<RadioControl
															label={__(
																'Import method',
																'vk-blocks'
															)}
															onChange={(
																value
															) => {
																onChangeIsOverride(
																	value,
																	id
																);
															}}
															options={[
																{
																	label: __(
																		'Add',
																		'vk-blocks'
																	),
																	value: 'add',
																},
																{
																	label: __(
																		'Override',
																		'vk-blocks'
																	),
																	value: 'override',
																},
															]}
															selected={
																importSettings[
																	index
																].options[id]
																	.importMethod
															}
														/>
														{importSettings[index]
															.options[id]
															.importMethod ===
															'add' &&
															'uniqKey' in
																options[id] &&
															vkBlocksOption[
																name
															].some((preKey) =>
																uploadedVkBlocksOptions[
																	name
																].some(
																	(
																		uploadKey
																	) =>
																		uploadKey[
																			uniqKey
																		] ===
																		preKey[
																			uniqKey
																		]
																)
															) && (
																<p>
																	{__(
																		'The following data will not be imported because the identifiers are covered.',
																		'vk-blocks'
																	)}
																</p>
															)}
														{importSettings[index]
															.options[id]
															.importMethod ===
															'add' &&
															'uniqKey' in
																options[id] &&
															vkBlocksOption[
																name
															].map((preKey) => {
																return uploadedVkBlocksOptions[
																	name
																].map(
																	(
																		uploadKey,
																		uploadId
																	) => {
																		return (
																			uploadKey[
																				uniqKey
																			] ===
																				preKey[
																					uniqKey
																				] && (
																				<div
																					key={
																						uploadId
																					}
																				>
																					{
																						uploadKey[
																							uniqKey
																						]
																					}
																				</div>
																			)
																		);
																	}
																);
															})}
													</div>
												)
										)}
									</div>
								)
							);
						}
					)}
					<div className="import_export_add_modal_button_area">
						<Flex justify="flex-end">
							<FlexItem>
								<Button
									variant="secondary"
									onClick={closeModal}
								>
									{__('Cancel', 'vk-blocks')}
								</Button>
							</FlexItem>
							<FlexItem>
								<Button
									onClick={(event) => {
										onSubmit(event);
									}}
									variant="primary"
									disabled={
										!importSettings.some(
											(list) => !!list.isImport
										)
									}
								>
									{__('Import', 'vk-blocks')}
								</Button>
							</FlexItem>
						</Flex>
					</div>
				</Modal>
			)}
			{isImportSuccess && (
				<div>
					<Snackbar>{__('Import Success', 'vk-blocks')} </Snackbar>
				</div>
			)}
		</div>
	);
}
