/**
 * The iframe is built in PHP (vk_blocks_visual_embed_render()) from the stored attributes, so nothing is saved
 * in the post body. This keeps the iframe from being removed by KSES for users without unfiltered_html and lets
 * the server validate the source on every save and display.
 * iframe は保存した属性から PHP（vk_blocks_visual_embed_render()）で組み立てるため、本文には何も保存しない。
 * unfiltered_html の無いユーザーの保存で iframe が KSES に消されず、保存時・表示時にサーバーで URL を検証できる。
 *
 * @return {null} No saved markup.
 */
export default function save() {
	return null;
}
