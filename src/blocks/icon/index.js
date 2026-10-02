/**
 * icon block type
 *
 */
import { ReactComponent as Icon } from './icon.svg';
import { url, iconUser } from '@vkblocks/utils/example-data';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import { deprecated } from './deprecated/';
// "Copy styles" / "Paste styles" (issue #3205). Side-effect import: this
// registers the Icon block's configuration with the shared common component
// (src/components/copy-paste-styles/) once, when this block module loads.
// 「スタイルをコピー/貼り付け」（issue #3205）。副作用のみの import で、この
// ブロックモジュールの読み込み時に、共通部品への設定登録を一度だけ行う。
import './copy-styles-config';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: <Icon />,
	example: {
		attributes: {
			faIcon: iconUser,
			iconSize: 36,
			iconSizeUnit: 'px',
			iconMargin: 22,
			iconMarginUnit: 'px',
			iconRadius: 50,
			iconType: '0',
			iconAlign: 'left',
			iconColor: 'undefined',
			iconFontColor: 'undefined',
			iconUrl: url,
			iconTarget: false,
		},
	},
	edit,
	save,
	deprecated,
};
