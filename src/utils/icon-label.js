/* global vkFontAwesome */
export const iconLabel = (label) => {
	// vkFontAwesome が未定義でも落ちないように存在チェックし、あれば iconFamily を取得する
	// eslint-disable-next-line no-undef
	const iconFamily =
		typeof vkFontAwesome !== 'undefined' &&
		vkFontAwesome &&
		vkFontAwesome.iconFamily
			? vkFontAwesome.iconFamily
			: undefined;
	return iconFamily ? `${label} ( ${iconFamily} )` : label;
};
