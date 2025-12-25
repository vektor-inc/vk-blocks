/* eslint-env jest */
import {
	getFontAwesomeVersionValue,
	isFontAwesomeConfigChanged,
	normalizeFontAwesomeConfig,
	updateFontAwesomeCompatibility,
	updateFontAwesomeVersion,
} from '@vkblocks/utils/font-awesome-version';

describe('Font Awesome version helpers', () => {
	test('getFontAwesomeVersionValue returns version from object', () => {
		expect(
			getFontAwesomeVersionValue({
				version: '7_WebFonts_CSS',
				compatibility: { v4: '1', v5: '1' },
			})
		).toBe('7_WebFonts_CSS');
	});

	test('getFontAwesomeVersionValue returns string as-is', () => {
		expect(getFontAwesomeVersionValue('5_WebFonts_CSS')).toBe(
			'5_WebFonts_CSS'
		);
	});

	test('updateFontAwesomeVersion updates only version field', () => {
		const prev = {
			version: '6_WebFonts_CSS',
			compatibility: { v4: '1', v5: '1' },
		};
		expect(updateFontAwesomeVersion(prev, '7_WebFonts_CSS')).toEqual({
			version: '7_WebFonts_CSS',
			compatibility: { v4: '1', v5: '1' },
		});
	});

	test('normalizeFontAwesomeConfig fills missing compatibility', () => {
		expect(
			normalizeFontAwesomeConfig({ version: '7_WebFonts_CSS' })
		).toEqual({
			version: '7_WebFonts_CSS',
			compatibility: { v4: false, v5: false },
		});
	});

	test('updateFontAwesomeCompatibility toggles a single flag', () => {
		const prev = {
			version: '7_WebFonts_CSS',
			compatibility: { v4: false },
		};
		expect(updateFontAwesomeCompatibility(prev, 'v4', true)).toEqual({
			version: '7_WebFonts_CSS',
			compatibility: { v4: '1', v5: '0' },
		});
	});

	test('isFontAwesomeConfigChanged compares version and flags', () => {
		const a = {
			version: '7_WebFonts_CSS',
			compatibility: { v4: true, v5: false },
		};
		const b = {
			version: '7_WebFonts_CSS',
			compatibility: { v4: false, v5: false },
		};
		expect(isFontAwesomeConfigChanged(a, b)).toBe(true);
		expect(isFontAwesomeConfigChanged(a, a)).toBe(false);
	});
});
