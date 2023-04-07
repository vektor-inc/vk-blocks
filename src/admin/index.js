/**
 * WordPress dependencies
 */
import {
	render,
	createRoot,
	useState,
	createContext,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import AdminLicense from '@vkblocks/admin/license';
import AdminBalloon from '@vkblocks/admin/balloon';
import AdminMargin from '@vkblocks/admin/margin';
import AdminLoadSeparate from '@vkblocks/admin/load-separate';
import AdminNewFaq from '@vkblocks/admin/new-faq';
import BlockManager from '@vkblocks/admin/block-manager';
import AdminCustomFormat from '@vkblocks/admin/custom-format';
import AdminCustomBlockStyle from '@vkblocks/admin/custom-block-style';
import AdminCustomCss from '@vkblocks/admin/custom-css';
import { SaveButton } from '@vkblocks/admin/save-button';
/*globals vkBlocksObject */

export const AdminContext = createContext();

export default function VKBlocksAdmin() {
	const [vkBlocksOption, setVkBlocksOption] = useState(
		vkBlocksObject.options
	);

	const [reloadFlag, setReloadFlag] = useState(false);

	return (
		<>
			{/* AdminContext.Providerで各コンポーネントにvalueを渡す */}
			<AdminContext.Provider
				value={{
					vkBlocksOption,
					setVkBlocksOption,
					reloadFlag,
					setReloadFlag,
				}}
			>
				{vkBlocksObject.isLicenseSetting && <AdminLicense />}
				<AdminBalloon />
				{vkBlocksObject.isPro && <AdminCustomFormat />}
				{vkBlocksObject.isPro && <AdminCustomBlockStyle />}
				<AdminMargin />
				<AdminLoadSeparate />
				{vkBlocksObject.isPro && <AdminNewFaq />}
				{vkBlocksObject.isPro && <AdminCustomCss />}
				<BlockManager />
				<SaveButton
					classOption={'sticky'}
					vkBlocksOption={vkBlocksOption}
					reloadFlag={reloadFlag}
				/>
			</AdminContext.Provider>
		</>
	);
}

// NOTE: ReactDOM.renderが非推奨になったのでフォールバック WP6.1以下をサポートしなくなったら削除すること #1574
const existsCreateRoot = typeof createRoot === 'function';
if (existsCreateRoot) {
	const container = document.getElementById('vk-blocks-admin');
	const root = createRoot(container);
	root.render(<VKBlocksAdmin />);
} else {
	render(<VKBlocksAdmin />, document.getElementById('vk-blocks-admin'));
}
