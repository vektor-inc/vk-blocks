export const getFontAwesomeVersionValue = (config) => {
	if (!config) {
		return '';
	}
	if (typeof config === 'string') {
		return config;
	}
	return config?.version || '';
};

const toBool = (value) => value === true || value === '1' || value === 1;

export const normalizeFontAwesomeConfig = (config) => {
	if (!config) {
		return { version: '', compatibility: { v4: false, v5: false } };
	}
	if (typeof config === 'string') {
		return { version: config, compatibility: { v4: false, v5: false } };
	}
	return {
		...config,
		version: config?.version || '',
		compatibility: {
			v4: toBool(config?.compatibility?.v4),
			v5: toBool(config?.compatibility?.v5),
		},
	};
};

export const serializeFontAwesomeConfig = (config) => {
	const normalized = normalizeFontAwesomeConfig(config);
	return {
		version: normalized.version,
		compatibility: {
			v4: normalized.compatibility.v4 ? '1' : '0',
			v5: normalized.compatibility.v5 ? '1' : '0',
		},
	};
};

export const updateFontAwesomeVersion = (prevConfig, nextVersion) => {
	if (!prevConfig || typeof prevConfig === 'string') {
		return {
			version: nextVersion,
			compatibility: { v4: '0', v5: '0' },
		};
	}
	return {
		...prevConfig,
		version: nextVersion,
		compatibility: {
			v4: prevConfig?.compatibility?.v4 ?? '0',
			v5: prevConfig?.compatibility?.v5 ?? '0',
		},
	};
};

export const updateFontAwesomeCompatibility = (prevConfig, key, enabled) => {
	const nextValue = enabled ? '1' : '0';
	if (!prevConfig || typeof prevConfig === 'string') {
		return {
			version: getFontAwesomeVersionValue(prevConfig),
			compatibility: {
				v4: key === 'v4' ? nextValue : '0',
				v5: key === 'v5' ? nextValue : '0',
			},
		};
	}
	return {
		...prevConfig,
		compatibility: {
			v4: prevConfig?.compatibility?.v4 ?? '0',
			v5: prevConfig?.compatibility?.v5 ?? '0',
			[key]: nextValue,
		},
	};
};

export const isFontAwesomeConfigChanged = (a, b) => {
	const left = serializeFontAwesomeConfig(a);
	const right = serializeFontAwesomeConfig(b);
	return (
		left.version !== right.version ||
		left.compatibility.v4 !== right.compatibility.v4 ||
		left.compatibility.v5 !== right.compatibility.v5
	);
};
