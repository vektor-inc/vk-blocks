export const getCssLength = (value) => {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	const stringValue = String(value);

	return /^\d+$/.test(stringValue) ? `${stringValue}px` : stringValue;
};
