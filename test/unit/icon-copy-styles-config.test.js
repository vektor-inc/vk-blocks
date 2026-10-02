/**
 * Icon block "Copy styles" / "Paste styles" (issue #3205) — unit tests for
 * the Icon block's own configuration
 * (src/blocks/icon/copy-styles-config.js), registered with the shared
 * common component (src/components/copy-paste-styles/). Covers:
 *  - iconCopyStylesConfig.attributes, exercised through the common
 *    component's pickCopyableAttributes() (mirrors the values Icon's own
 *    UI controls can produce).
 *  - iconCopyStylesConfig.narrowAttributesForTarget(), the Icon-Outer-child
 *    narrowing rule.
 *  - iconCopyStylesConfig.notifyNarrowedPaste(), the Icon-Outer-specific
 *    notice wording.
 *
 * アイコンブロックの「スタイルをコピー/貼り付け」（issue #3205）—
 * アイコンブロック自身の設定（src/blocks/icon/copy-styles-config.js、共通部品
 * src/components/copy-paste-styles/ へ登録）のテスト。
 */
import { pickCopyableAttributes } from '../../src/components/copy-paste-styles/pick-attributes';
import {
	ICON_BLOCK_NAME,
	iconCopyStylesConfig,
} from '../../src/blocks/icon/copy-styles-config';

const ICON_COPYABLE_KEYS = iconCopyStylesConfig.attributes.map(
	(def) => def.key
);

function pickIconAttributes(sourceAttributes) {
	return pickCopyableAttributes(
		sourceAttributes,
		iconCopyStylesConfig.attributes
	);
}

test('blockName は vk-blocks/icon', () => {
	expect(ICON_BLOCK_NAME).toBe('vk-blocks/icon');
	expect(iconCopyStylesConfig.blockName).toBe(ICON_BLOCK_NAME);
});

describe('iconCopyStylesConfig.attributes（pickCopyableAttributes 経由）', () => {
	test('コピー対象の属性だけを抜き出す', () => {
		const sourceAttributes = {
			iconType: '1',
			iconColor: '#ff0000',
			iconFontColor: '#ffffff',
			iconSize: 48,
			iconSizeUnit: 'px',
			iconMargin: 10,
			iconMarginUnit: 'px',
			iconRadius: 20,
			// コピー対象外の属性（混ざっていても無視される）
			faIcon: '<i class="fas fa-star"></i>',
			iconAlign: 'center',
			anchor: 'my-anchor',
			className: 'my-class',
		};

		expect(pickIconAttributes(sourceAttributes)).toEqual({
			iconType: '1',
			iconColor: '#ff0000',
			iconFontColor: '#ffffff',
			iconSize: 48,
			iconSizeUnit: 'px',
			iconMargin: 10,
			iconMarginUnit: 'px',
			iconRadius: 20,
		});
	});

	test('コピー元で未設定の属性は undefined のままキーとして残す（見た目を一致させるため）', () => {
		const result = pickIconAttributes({
			iconType: '0',
			iconSize: 36,
			iconSizeUnit: 'px',
			iconMargin: 22,
			iconMarginUnit: 'px',
			iconRadius: 50,
			// iconColor / iconFontColor は未設定
		});

		expect(result).toHaveProperty('iconColor', undefined);
		expect(result).toHaveProperty('iconFontColor', undefined);
		expect(Object.keys(result).sort()).toEqual(
			[...ICON_COPYABLE_KEYS].sort()
		);
	});

	test("旧形式で iconColor が文字列 'undefined' の場合は未設定として扱う", () => {
		const result = pickIconAttributes({
			iconColor: 'undefined',
			iconFontColor: '#000000',
		});

		expect(result.iconColor).toBeUndefined();
		expect(result.iconFontColor).toBe('#000000');
	});

	test('sourceAttributes を渡さない場合でも全キーを undefined で返す', () => {
		const result = pickIconAttributes();
		ICON_COPYABLE_KEYS.forEach((key) => {
			expect(result).toHaveProperty(key, undefined);
		});
	});

	// 貼り付ける値・単位の値を検証し、想定外の値は未設定として扱う
	// （ブロック自身のUIでは作りえない値は捨てる）。
	describe('想定外の値・単位を未設定として捨てる', () => {
		test('許可リストに無い単位（iconSizeUnit）は未設定にする', () => {
			const result = pickIconAttributes({ iconSizeUnit: 'pt' });
			expect(result.iconSizeUnit).toBeUndefined();
		});

		test('許可リストに無い単位（iconMarginUnit）は未設定にする', () => {
			const result = pickIconAttributes({ iconMarginUnit: 'px;' });
			expect(result.iconMarginUnit).toBeUndefined();
		});

		test('引用符を含む値（iconSizeUnit）は未設定にする', () => {
			const result = pickIconAttributes({ iconSizeUnit: 'px"' });
			expect(result.iconSizeUnit).toBeUndefined();
		});

		test('数値ではない iconSize（文字列）は未設定にする', () => {
			const result = pickIconAttributes({ iconSize: '48px' });
			expect(result.iconSize).toBeUndefined();
		});

		test('NaN の iconSize は未設定にする', () => {
			const result = pickIconAttributes({ iconSize: NaN });
			expect(result.iconSize).toBeUndefined();
		});

		test('Infinity の iconMargin は未設定にする', () => {
			const result = pickIconAttributes({ iconMargin: Infinity });
			expect(result.iconMargin).toBeUndefined();
		});

		test('数値ではない iconRadius は未設定にする', () => {
			const result = pickIconAttributes({ iconRadius: 'not-a-number' });
			expect(result.iconRadius).toBeUndefined();
		});

		test('許可リストに無い iconType は未設定にする', () => {
			const result = pickIconAttributes({ iconType: '99' });
			expect(result.iconType).toBeUndefined();
		});

		test('inherit・hexカラー・スラッグのいずれでもない iconColor は未設定にする', () => {
			const result = pickIconAttributes({ iconColor: '#12345' });
			expect(result.iconColor).toBeUndefined();
		});

		test('inherit・hexカラー・スラッグのいずれでもない iconFontColor は未設定にする', () => {
			const result = pickIconAttributes({ iconFontColor: 'red;' });
			expect(result.iconFontColor).toBeUndefined();
		});

		test('正規の値（hexカラー・px・0/1/2 等）は変更せずそのまま通す', () => {
			const validAttributes = {
				iconType: '1',
				iconColor: 'inherit',
				iconFontColor: '#ff0000',
				iconSize: 48,
				iconSizeUnit: 'em',
				iconMargin: 10,
				iconMarginUnit: 'rem',
				iconRadius: 20,
			};
			expect(pickIconAttributes(validAttributes)).toEqual(
				validAttributes
			);
		});

		test('カラーパレットのスラッグ（例: vk-primary-color）は許可する', () => {
			const result = pickIconAttributes({
				iconColor: 'vk-primary-color',
				iconFontColor: 'vk-secondary-color',
			});
			expect(result.iconColor).toBe('vk-primary-color');
			expect(result.iconFontColor).toBe('vk-secondary-color');
		});

		test('大文字・アンダースコアを含むテーマ由来のスラッグも許可する', () => {
			// テーマのカラーパレットのスラッグは sanitizeSlug のケバブケース出力に
			// 限らないため、大文字・アンダースコアを含む値も貼り付けで消えない
			// ことを確認する。
			const result = pickIconAttributes({
				iconColor: 'Theme_Primary_Color',
				iconFontColor: 'Theme_Secondary_Color',
			});
			expect(result.iconColor).toBe('Theme_Primary_Color');
			expect(result.iconFontColor).toBe('Theme_Secondary_Color');
		});

		test('iconFontColor に inherit を渡しても許可しない（対象外）', () => {
			// iconFontColor は allowInherit: false で登録されているため、
			// iconColor とは異なり inherit を許可しない。
			const result = pickIconAttributes({ iconFontColor: 'inherit' });
			expect(result.iconFontColor).toBeUndefined();
		});
	});
});

describe('iconCopyStylesConfig.narrowAttributesForTarget', () => {
	const fullAttributes = {
		iconType: '1',
		iconColor: '#ff0000',
		iconFontColor: '#ffffff',
		iconSize: 48,
		iconSizeUnit: 'px',
		iconMargin: 10,
		iconMarginUnit: 'px',
		iconRadius: 20,
	};

	test('通常のアイコンブロック（icon-outer の子ではない）では絞り込まない（undefined を返す）', () => {
		const helpers = {
			getBlockRootClientId: () => undefined,
			getBlockName: () => undefined,
		};
		const result = iconCopyStylesConfig.narrowAttributesForTarget(
			fullAttributes,
			{ clientId: 'target-1' },
			helpers
		);
		expect(result).toBeUndefined();
	});

	test('icon-outer の子アイコンには色（iconColor / iconFontColor）だけを反映する', () => {
		const helpers = {
			getBlockRootClientId: () => 'icon-outer-client-id',
			getBlockName: (clientId) =>
				clientId === 'icon-outer-client-id'
					? 'vk-blocks/icon-outer'
					: undefined,
		};
		const result = iconCopyStylesConfig.narrowAttributesForTarget(
			fullAttributes,
			{ clientId: 'target-2' },
			helpers
		);

		expect(result.narrowed).toBe(true);
		expect(Object.keys(result.attributes).sort()).toEqual([
			'iconColor',
			'iconFontColor',
		]);
		expect(result.attributes.iconColor).toBe('#ff0000');
		expect(result.attributes.iconFontColor).toBe('#ffffff');
	});

	test('親が icon-outer 以外のブロックでは絞り込まない', () => {
		const helpers = {
			getBlockRootClientId: () => 'some-other-parent',
			getBlockName: () => 'core/group',
		};
		const result = iconCopyStylesConfig.narrowAttributesForTarget(
			fullAttributes,
			{ clientId: 'target-3' },
			helpers
		);
		expect(result).toBeUndefined();
	});
});

describe('iconCopyStylesConfig.notifyNarrowedPaste', () => {
	test('1件のときは単数形の文言で通知する', () => {
		const createSuccessNotice = jest.fn();
		iconCopyStylesConfig.notifyNarrowedPaste(1, { createSuccessNotice });

		expect(createSuccessNotice).toHaveBeenCalledWith(
			'Pasted color to 1 icon in the Icon Outer block. Size, margin, corner radius and style follow the Icon Outer block setting.',
			{ type: 'snackbar' }
		);
	});

	test('複数件のときは複数形の文言で通知する', () => {
		const createSuccessNotice = jest.fn();
		iconCopyStylesConfig.notifyNarrowedPaste(2, { createSuccessNotice });

		expect(createSuccessNotice).toHaveBeenCalledWith(
			'Pasted color to 2 icons in the Icon Outer block. Size, margin, corner radius and style follow the Icon Outer block setting.',
			{ type: 'snackbar' }
		);
	});
});
