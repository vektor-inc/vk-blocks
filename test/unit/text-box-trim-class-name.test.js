import {
	TRIM_CLASS,
	hasTrimClass,
	toggleTrimClass,
} from '../../src/extensions/common/text-box-trim/class-name';

describe('hasTrimClass', () => {
	it('is-vk-trim-both が含まれていれば true', () => {
		expect(hasTrimClass(`foo ${TRIM_CLASS} bar`)).toBe(true);
	});

	it('名前が似ているだけのクラスでは true にならない', () => {
		expect(hasTrimClass('is-vk-trim-both-x')).toBe(false);
	});

	it('className が無いときは false', () => {
		expect(hasTrimClass(undefined)).toBe(false);
		expect(hasTrimClass('')).toBe(false);
	});
});

describe('toggleTrimClass', () => {
	it('ON にするとほかのクラスを残したまま末尾に付ける', () => {
		expect(toggleTrimClass('foo bar', true)).toBe(`foo bar ${TRIM_CLASS}`);
	});

	it('className が無いときに ON にするとクラスだけになる', () => {
		expect(toggleTrimClass(undefined, true)).toBe(TRIM_CLASS);
	});

	it('すでに付いているときに ON にしても重複しない', () => {
		expect(toggleTrimClass(`${TRIM_CLASS} foo`, true)).toBe(
			`foo ${TRIM_CLASS}`
		);
	});

	it('OFF にするとこのクラスだけを外し、ほかは順序を保って残す', () => {
		expect(toggleTrimClass(`foo ${TRIM_CLASS} bar`, false)).toBe('foo bar');
	});

	it('OFF にしてクラスが残らなければ undefined', () => {
		expect(toggleTrimClass(TRIM_CLASS, false)).toBeUndefined();
	});
});
