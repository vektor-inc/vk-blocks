import { __ } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarButton, Dropdown } from '@wordpress/components';
import { image as imageIcon } from '@wordpress/icons';
import { AdvancedMediaUpload } from '@vkblocks/components/advanced-media-upload';

/**
 * 背景画像（PC / タブレット / モバイル）をブロックツールバーから変更するためのコンポーネント。
 * ツールバーに画像アイコンのボタンを 1 つ追加し、押すとレスポンシブ別の
 * メディアアップロード UI（選択 / 置換 / 削除）をまとめたポップオーバーを表示する。
 *
 * サイドバーで使っている AdvancedMediaUpload をそのまま再利用するため、
 * 選択・置換・削除の挙動や ID 補完ロジックはサイドバー側と完全に一致する。
 *
 * @param {Object} props                ブロックの props（attributes / setAttributes / clientId を含む）
 * @param {string} [props.sidebarClass] AdvancedMediaUpload のラッパに付与するクラス名
 *                                      （サイドバーと同じホバー表示スタイルを流用するために使用）
 * @return {JSX.Element} ツールバー用のドロップダウン
 */
const BackgroundImageToolbar = (props) => {
	const { attributes, sidebarClass } = props;
	const { bgImage, bgImageTablet, bgImageMobile } = attributes;

	// いずれかの背景画像が設定されているか（ボタンのアクティブ表示に使用）
	const hasBgImage = !!(bgImage || bgImageTablet || bgImageMobile);

	// レスポンシブ別の背景画像設定（PC / タブレット / モバイル）
	const bgImageFields = [
		{
			label: __('Background Image PC', 'vk-blocks'),
			schema: 'bgImage',
			schemaId: 'bgImageId',
		},
		{
			label: __('Background Image Tablet', 'vk-blocks'),
			schema: 'bgImageTablet',
			schemaId: 'bgImageTabletId',
		},
		{
			label: __('Background Image Mobile', 'vk-blocks'),
			schema: 'bgImageMobile',
			schemaId: 'bgImageMobileId',
		},
	];

	return (
		<ToolbarGroup>
			<Dropdown
				className="vk-block-editor-bg-image-toolbar"
				contentClassName="vk-block-editor-bg-image-toolbar__popover"
				popoverProps={{ placement: 'bottom-start' }}
				renderToggle={({ isOpen, onToggle }) => (
					<ToolbarButton
						aria-expanded={isOpen}
						icon={imageIcon}
						isActive={hasBgImage}
						label={__('Background Image', 'vk-blocks')}
						onClick={onToggle}
					/>
				)}
				renderContent={() => (
					<div className="vk-block-editor-bg-image-toolbar__content">
						{bgImageFields.map((field) => (
							<div
								key={field.schema}
								className={`vk-block-editor-bg-image-toolbar__field ${sidebarClass || ''}`}
							>
								<p className="vk-block-editor-bg-image-toolbar__label">
									{field.label}
								</p>
								<AdvancedMediaUpload
									schema={field.schema}
									schemaId={field.schemaId}
									{...props}
								/>
							</div>
						))}
					</div>
				)}
			/>
		</ToolbarGroup>
	);
};

export default BackgroundImageToolbar;
