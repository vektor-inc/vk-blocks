/**
 * Build a URL to the VK Blocks setting page ( Setting > VK Blocks ).
 * VK Blocks 設定ページ（ 設定 > VK Blocks ）への URL を生成する。
 *
 * The editor always runs under /wp-admin/, so a relative URL resolves
 * correctly even on subdirectory installs.
 * エディターは常に /wp-admin/ 配下で動作するため、相対 URL でも
 * サブディレクトリ構成を含めて正しく解決される。
 *
 * @param {string} anchor Section anchor on the setting page without '#' (e.g. 'margin-setting'). 設定ページ内のセクションアンカー（'#' なし）
 * @return {string} Relative URL to the setting page. 設定ページへの相対 URL。
 */
export const getSettingsPageUrl = (anchor = '') =>
	`options-general.php?page=vk_blocks_options${
		anchor ? `#${encodeURIComponent(anchor)}` : ''
	}`;
