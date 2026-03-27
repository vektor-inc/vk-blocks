export const isValidJson = (value) => {
	try {
		JSON.parse(value);
	} catch (e) {
		return false;
	}
	return true;
};

export const fixBrokenUnicode = (text) => {
	if (!text || typeof text !== 'string') {
		return text;
	}
	if (!isValidJson(text)) {
		text = text.replace(/u003c/g, '<');
		text = text.replace(/u003e/g, '>');
		text = text.replace(/u0022/g, '"');
	}

	return text;
};
