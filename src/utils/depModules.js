import { select, dispatch } from '@wordpress/data';
/**
 * 下記は vkbBlockEditor でしか使われていなかったのでコメントアウト
 * vkbBlockEditor が復活したり他で必要になったときのために一応残す
 */
// import * as blockEditor from '@wordpress/block-editor';
// import * as editor from '@wordpress/editor';
import ServerSideRender from '@wordpress/server-side-render';
import * as components from '@wordpress/components';

/*
・vkbBlockEditor はすでに使われていない
・@wordpress/editor を読み込むと 外観 > ウィジェット で怒られる
("wp-editor" script should not be enqueued together with the new widgets editor (wp-edit-widgets or wp-customize-widgets).)

上記の点からコメントアウトしました

export const vkbBlockEditor =
	blockEditor && blockEditor.BlockEdit ? blockEditor : editor;
*/
export const depServerSideRender = () => {
	if (ServerSideRender) {
		return ServerSideRender;
	}
	return components.ServerSideRender;
};

export const selectEditor = select('core/block-editor')
	? select('core/block-editor')
	: select('core/editor');
export const dispatchEditor = dispatch('core/block-editor')
	? dispatch('core/block-editor')
	: dispatch('core/editor');

export { fixBrokenUnicode } from './fixBrokenUnicode';
