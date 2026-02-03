export const mergeColors = (defaultColors, themeColors, customColors) => {
	const colors = [];
	if (themeColors.length > 0) {
		colors.push(...themeColors);
	} else if (defaultColors.length > 0) {
		colors.push(...defaultColors);
	}

	if (customColors.length > 0) {
		customColors.forEach((customColor) => {
			const exists = colors.some((color) => {
				return (
					color.color === customColor.color ||
					(customColor.slug &&
						color.slug &&
						color.slug === customColor.slug)
				);
			});
			if (!exists) {
				colors.push(customColor);
			}
		});
	}
	return colors;
};
