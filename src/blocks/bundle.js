/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/notices';
// import '@wordpress/block-editor';
import {
	registerBlockType,
	unstable__bootstrapServerSideBlockDefinitions,
} from '@wordpress/blocks';
import { compareVersions } from 'compare-versions';
const vkblocksPro = [];

/**
 * Blocks
 */
import * as alert from './alert';
import * as ancestorPageList from './ancestor-page-list';
import * as balloon from './balloon';
import * as borderBox from './border-box';
import * as button from './button';
import * as faq from './faq';
import * as faq2 from './faq2';
import * as faq2a from './faq2-a';
import * as faq2q from './faq2-q';
import * as flow from './flow';
import * as heading from './heading';
import * as icon from './icon';
import * as iconOuter from './icon-outer';
import * as pageContent from './page-content';
import * as prBlocks from './pr-blocks';
import * as prContent from './pr-content';
import * as slider from './slider';
import * as sliderItem from './slider-item';
import * as spacer from './spacer';
import * as staff from './staff';
import * as visualEmbed from './visual-embed';

/**
 * Store
 */
import '@vkblocks/utils/store';
import '@vkblocks/utils/store/termColor';

/**
 * "Copy styles" / "Paste styles" (issue #3205). Registers the shared
 * BlockSettingsMenuControls Fill once for the whole editor. Lives here (the
 * free bundle) so both free and Pro blocks can opt in by registering their
 * own configuration (src/components/copy-paste-styles/config-registry.js)
 * from their own module, regardless of which bundle they ship in.
 *
 * 「スタイルをコピー/貼り付け」（issue #3205）。共通の BlockSettingsMenuControls
 * Fill をエディタ全体に対して一度だけ登録する。無料版バンドルに置くことで、
 * 無料版・Pro版どちらのブロックも、自分がどちらのバンドルで配布されるかに関わらず、
 * 自分自身のモジュールから設定
 * （src/components/copy-paste-styles/config-registry.js）を登録するだけで
 * 利用できる。
 */
import '@vkblocks/components/copy-paste-styles/register-plugin';

/**
 * Extensions
 */
import '@vkblocks/extensions/core/group/style';
import '@vkblocks/extensions/core/list/style';
import '@vkblocks/extensions/core/columns/style';
import '@vkblocks/extensions/core/site-logo/style';
import '@vkblocks/extensions/core/site-title/style';
import '@vkblocks/extensions/core/navigation/style';
import '@vkblocks/extensions/core/table/style';
import '@vkblocks/extensions/core/cover/style';
import '@vkblocks/extensions/common/hidden-extension';
import '@vkblocks/extensions/common/highlighter';
import '@vkblocks/extensions/common/inline-font-size';
import '@vkblocks/extensions/common/nowrap';
import '@vkblocks/extensions/common/responsive-br';
import '@vkblocks/extensions/common/margin-extension';
import '@vkblocks/extensions/common/content-width-half';

const vkBlocks = [
	alert,
	balloon,
	borderBox,
	button,
	faq,
	faq2,
	faq2a,
	faq2q,
	flow,
	heading,
	icon,
	iconOuter,
	pageContent,
	prBlocks,
	prContent,
	slider,
	sliderItem,
	spacer,
	staff,
	visualEmbed,
	ancestorPageList,
];

/**
 * Function to get all the VK Blocks in an array.
 */
export const __getVKBlocks = () => vkBlocks.concat(vkblocksPro);

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 */
const registerBlock = (block) => {
	if (!block) {
		return;
	}

	let { metadata, settings, name } = block;

	/*
	そもそも Require at Least が 5.7 なので 5.5 以下の後方互換は不要ではあるが、現状影響が少ないので残しておく
	window.wpVersion は外観 > カスタマイズ > ウィジェットでは undefined を返すので比較不可能
	ともかく最初から undefined が条件に当てはまらないように変更
	*/

	//WP5.5未満の場合
	if (
		window.wpVersion !== undefined &&
		window.wpVersion !== null &&
		compareVersions(window.wpVersion, '5.5') < 0
	) {
		//nameを削除
		delete metadata.name;
		//カテゴリ等を追加
		settings = {
			...settings,
			...metadata,
		};
	} else if (metadata) {
		// ServerSideBlockの設定読み込み
		unstable__bootstrapServerSideBlockDefinitions({ [name]: metadata });
	}

	// 5.8以前の場合はnameのみ渡す
	if (typeof getBlockSettingsFromMetadata !== 'function') {
		registerBlockType(name, settings);
	} else if (metadata) {
		registerBlockType(metadata, settings);
	}
};

/**
 * Function to register VK Blocks.
 *
 * @param {*} blocks
 */
export const registerVKBlocks = (blocks = __getVKBlocks()) => {
	blocks.forEach(registerBlock);
};
