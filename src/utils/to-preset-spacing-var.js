export const toPresetSpacingVar = (value) => {
	if (typeof value !== 'string') {
		return value;
	}
	if (!value.startsWith('var:preset|spacing|')) {
		return value;
	}
	return value.replace(
		/^var:preset\|spacing\|(.+)$/,
		'var(--wp--preset--spacing--$1)'
	);
};
