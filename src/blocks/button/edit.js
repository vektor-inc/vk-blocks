import { __ } from '@wordpress/i18n';
import { VKBButton } from './component';
import { FontAwesome } from '@vkblocks/utils/font-awesome-new';
import {
	SelectControl,
	PanelBody,
	BaseControl,
	TextControl,
	Button,
	RangeControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToolbarGroup,
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import {
	RichText,
	InspectorControls,
	useBlockProps,
	BlockControls,
} from '@wordpress/block-editor';
import { settings } from '@wordpress/icons';
import { useEffect, useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { dispatch, select } from '@wordpress/data';
import { AdvancedColorPalette } from '@vkblocks/components/advanced-color-palette';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { isParentReusableBlock } from '@vkblocks/utils/is-parent-reusable-block';
import LinkToolbar from '@vkblocks/components/link-toolbar';
import { iconLabel } from '@vkblocks/utils/icon-label';
import { fixBrokenUnicode } from '@vkblocks/utils/fixBrokenUnicode';
import { toPresetSpacingVar } from '@vkblocks/utils/to-preset-spacing-var';

export default function ButtonEdit(props) {
	const { attributes, setAttributes, clientId, context, isSelected } = props;
	const buttonSizeLabelId = useInstanceId(ButtonEdit, 'vk-button-size-label');
	// プリセット⇔数値指定の切り替えをスクリーンリーダーへ通知するための文言。
	// onChange ハンドラ内でのみ更新する（既存データを開いた瞬間に dirty 化させないため）。
	// Live-region message announced to screen readers when switching between the preset
	// and the numeric size. Updated only inside onChange handlers so opening existing
	// data never marks the block dirty.
	const [fontSizeAnnouncement, setFontSizeAnnouncement] = useState('');
	// 数値入力(UnitControl)を強制再マウントするためのキー。
	// UnitControl は内部に入力ドラフトを持つ制御コンポーネントで、ドラフトの
	// クランプ結果が現在の保存値(value prop)と等しいと、属性が変化せず再レンダリングが
	// 起きず、内部ドラフト(例: '1')が value('10px')へ再同期されず表示だけ取り残される。
	// blur 確定時に「ドラフト由来の確定値と保存値が乖離していたら」このキーを更新して
	// UnitControl だけを作り直し、表示を保存値へ揃える。再マウントは blur 後にだけ
	// 起こすため、入力中のフォーカスは奪わない。
	// Key used to force-remount the numeric input (UnitControl).
	// UnitControl is a controlled component with an internal input draft; when the
	// clamped draft equals the current stored value (the value prop), the attribute
	// does not change, no re-render happens, and the internal draft (e.g. '1') is
	// never re-synced to value ('10px') — so the display is left stale. On blur, if
	// the committed value diverges from the stored value, we bump this key to rebuild
	// only the UnitControl and snap its display to the stored value. The remount fires
	// only after blur, so it never steals focus while the user is typing.
	const [fontSizeInputKey, setFontSizeInputKey] = useState(0);
	// 数値指定が優先されたことを通知する文言（aria-live でのみ使用）。
	// 視覚的な注記はコア FontSizePicker 同様に廃し、セグメントを隠す構成へ
	// 変えたため不要になったが、スクリーンリーダー向けのアナウンスは残す。
	// Text announced (via aria-live only) when the numeric size takes priority.
	// The visual note is dropped to match the core FontSizePicker (the preset
	// segment is hidden instead), but the screen-reader announcement is kept.
	const fontSizePriorityMessage = __(
		'The numeric font size takes priority.',
		'vk-blocks'
	);
	const {
		content,
		subCaption,
		buttonUrl,
		buttonTarget,
		relAttribute,
		linkToPost,
		buttonSize,
		buttonType,
		buttonEffect,
		buttonColor,
		buttonTextColorCustom,
		buttonColorCustom,
		buttonAlign,
		buttonWidthMobile,
		buttonWidthTablet,
		buttonWidth,
		outerGap,
		fontAwesomeIconBefore,
		fontAwesomeIconAfter,
		iconSizeBefore,
		iconSizeAfter,
		buttonHoverBgColorCustom,
		buttonHoverTextColorCustom,
		blockId,
		old_1_31_0,
		fontSizeValue,
	} = attributes;

	const isDescendentOfQueryLoop =
		typeof context?.queryId === 'number' &&
		Number.isFinite(context.queryId);

	// 親ブロックが vk-blocks/button-outer かどうか判定
	const parents = select('core/block-editor').getBlockParentsByBlockName(
		clientId,
		['vk-blocks/button-outer']
	);
	const isInnerButton = parents.length ? true : false;

	// 「カスタムサイズモード」の表示状態。コアの FontSizePicker と同様、
	// 数値入力欄はトグルで出し入れする。これは属性ではなく UI のローカル状態なので
	// ブロックを dirty 化しない。既存データで fontSizeValue があれば custom モードで開く。
	// Local UI state for the custom-size mode. As with the core FontSizePicker,
	// the numeric input is toggled in/out. This is UI-only state (not an attribute),
	// so it never marks the block dirty. Existing data that has a fontSizeValue
	// opens in custom mode.
	const [isCustomSize, setIsCustomSize] = useState(!!fontSizeValue);

	// スライダー(RangeControl)に渡す数値。fontSizeValue は単位付き文字列
	// （'53px' 形式・レガシーで '1.2em' 等もありうる）なので、parseFloat で
	// 数値部だけ取り出してスライダー位置に反映する。falsy / 解釈不能な値は
	// undefined を渡し、マウントしただけでは onChange を発火させない
	// （＝触るまで保存値を書き換えない）。max(100) を超えるレガシー値は
	// 表示だけ 100 で頭打ちにし、state(fontSizeValue) 自体は書き換えない。
	// Numeric value passed to the slider (RangeControl). fontSizeValue is a
	// unit-bearing string ('53px'; legacy values such as '1.2em' are possible),
	// so parseFloat extracts the numeric part for the slider position. For
	// falsy / unparsable values, undefined is passed and no onChange fires on
	// mount (the stored value is not rewritten until the user edits it).
	// Legacy values above max(100) are clamped to 100 for display only; the
	// stored fontSizeValue itself is left untouched.
	const parsedFontSize = fontSizeValue
		? parseFloat(fontSizeValue)
		: undefined;
	const sliderFontSizeValue =
		parsedFontSize !== undefined && !Number.isNaN(parsedFontSize)
			? Math.min(parsedFontSize, 100)
			: undefined;
	// 現在の単位を判定する。px（または値が空＝既定 px）ではスライダーを px レンジで、
	// em / rem 等の相対単位では相対レンジ（0〜10・0.1 刻み）で動かす（コアの
	// FontSizePicker と同じ考え方）。単位は表示用の派生値で、保存値は書き換えない。
	// Determine the current unit. For px (or empty, defaulting to px) the slider
	// uses the px range; for relative units (em / rem) it uses a relative range
	// (0–10, step 0.1), mirroring the core FontSizePicker. The unit is a derived
	// value for display only and never rewrites the stored value.
	const currentFontUnit = (() => {
		if (!fontSizeValue) {
			return 'px';
		}
		const unitMatch = String(fontSizeValue).match(/[a-z%]+$/i);
		return unitMatch ? unitMatch[0].toLowerCase() : 'px';
	})();
	const isPxFontUnit = currentFontUnit === 'px';
	const sliderFontMin = isPxFontUnit ? 10 : 0;
	const sliderFontMax = isPxFontUnit ? 100 : 10;
	const sliderFontStep = isPxFontUnit ? 1 : 0.1;

	// コアの FontSizePicker と同じ単位セット（px / em / rem / vw / vh）。
	// useCustomUnits フックは古い wp.components 環境では未提供のため、
	// バージョン非依存の静的配列で UnitControl にそのまま渡す。
	// Same unit set as the core FontSizePicker (px / em / rem / vw / vh).
	// The useCustomUnits hook is absent on older wp.components builds, so we
	// pass a version-independent static array straight to UnitControl.
	const fontSizeUnits = [
		{ value: 'px', label: 'px' },
		{ value: 'em', label: 'em' },
		{ value: 'rem', label: 'rem' },
		{ value: 'vw', label: 'vw' },
		{ value: 'vh', label: 'vh' },
	];

	// 数値入力(UnitControl)・スライダー(RangeControl)の双方から呼ぶ共通更新処理。
	// 「カスタム値の更新」だけを担い、プリセット復帰や歯車トグルの排他ロジックは
	// 混ぜない。next は単位付き文字列（'24px'）または null（＝プリセットへ復帰）。
	// 初回に数値が入った時は「数値指定優先」、値が空になった時は「プリセット復帰」を
	// スクリーンリーダーへアナウンスする（既存挙動を踏襲）。
	// Shared updater called by both the numeric input (UnitControl) and the
	// slider (RangeControl). It only handles "updating the custom value" and does
	// not mix in preset-return or gear-toggle exclusivity logic. `next` is a
	// unit-bearing string ('24px') or null (return to preset). It announces the
	// numeric-priority message on the first set, and the preset-return message
	// when cleared, mirroring the existing behavior.
	const updateCustomFontSize = (next) => {
		setAttributes({ fontSizeValue: next });
		if (next && !fontSizeValue) {
			setFontSizeAnnouncement(fontSizePriorityMessage);
		} else if (!next && fontSizeValue) {
			setFontSizeAnnouncement(
				__('Returned to the preset size.', 'vk-blocks')
			);
		}
	};

	// 数値入力(UnitControl)が満たすべき新規入力レンジ。スライダー(RangeControl)
	// と同じ min=10 / max=100 / step=1（px 整数）に揃える。
	// Range the numeric input (UnitControl) must enforce for new input, matching
	// the slider (RangeControl): min=10 / max=100 / step=1 (integer px).
	const FONT_SIZE_MIN = 10;
	const FONT_SIZE_MAX = 100;

	// 数値入力(UnitControl)専用の onChange ハンドラ。新規入力をレンジ
	// （下限10・上限100・px 整数）に揃えつつ、既存ユーザーのレンジ外レガシー値
	// （例: '200px'・'1.2em'）を受動操作で書き換えないことを両立させる。
	//
	// 重要: UnitControl(内部 NumberControl)に min/max を「渡さない」。min/max を
	// 渡すと内部の number input が HTML 制約違反となるレガシー値を、ユーザーが
	// 何も操作していなくてもフォーカス→ブラーしただけで境界値へクランプし、その値で
	// onChange を発火させる（@wordpress/components 34.0.0 を確認・実機e2eでも再現:
	// isPressEnterToChange=false では blur 時 commit 条件が実質 !validity.valid のみ
	// となり、レンジ外値で commit→クランプ→onChange 伝播し 200px→100px / 1.2em→10px
	// と保存値が書き換わる＝後方互換違反）。
	// min/max を渡さなければ validity.valid は常に true・isDirty も立たないため、
	// レガシー値をフォーカス→ブラーしても commit が走らず onChange 自体が発火しない
	// （＝触らなければ保存値は不変）。
	// そのうえで新規入力レンジは、ユーザーが実際に編集したときだけ来るこの onChange の
	// 中で明示的にクランプして担保する。レンジ外レガシー値はユーザーが能動的に編集した
	// 場合にのみレンジへ丸められる（その時は新仕様適用が妥当）。
	// IMPORTANT: do NOT pass min/max to UnitControl. With min/max, the native
	// number input clamps an out-of-range legacy value on blur and fires onChange
	// even without user edits (verified in @wordpress/components 34.0.0 and
	// reproduced in e2e), rewriting the stored value and breaking backward
	// compatibility. Without min/max, validity stays valid and isDirty stays
	// false, so no commit/onChange fires on passive focus/blur. The new-input
	// range is instead enforced here, inside onChange, which only fires on actual
	// user edits.
	const clampFontSizePx = (raw) => {
		// step=1（整数）に丸めてから下限/上限へクランプする。
		const stepped = Math.round(raw);
		return Math.min(Math.max(stepped, FONT_SIZE_MIN), FONT_SIZE_MAX);
	};
	const handleUnitControlFontSize = (value) => {
		// 空（クリア）はプリセット復帰。
		if (!value) {
			updateCustomFontSize(null);
			return;
		}
		const raw = parseFloat(value);
		// 数値として解釈できない異常値はそのまま既存共通処理に委ねる（基本到達しない）。
		if (Number.isNaN(raw)) {
			updateCustomFontSize(value);
			return;
		}
		// 単位を判定する。px（または単位なし）は新規入力レンジ（10〜100・整数px）へ
		// 揃える。em / rem 等の相対単位は、ユーザー指定の数値・単位をそのまま尊重する
		// （スライダーは単位に応じて範囲が切り替わり、相対単位でも操作できる）。
		// Determine the unit. px (or no unit) is snapped to the new-input range
		// (10–100, integer px). Relative units (em / rem) keep the user's value and
		// unit as-is (the slider switches range per unit and works for them too).
		const unitMatch = String(value).match(/[a-z%]+$/i);
		const unit = unitMatch ? unitMatch[0].toLowerCase() : 'px';
		if (unit === 'px') {
			updateCustomFontSize(`${clampFontSizePx(raw)}px`);
			return;
		}
		updateCustomFontSize(`${raw}${unit}`);
	};

	// blur(編集確定)時に、入力欄の生ドラフトを「保存される確定値」と突き合わせ、
	// 両者が乖離していたら UnitControl を再マウントして表示を保存値へ揃える。
	// 例: 既存保存値が '10px' のときにレンジ下限未満の '1' を打つと、確定値は
	// clamp 結果 '10px' となり属性が変化しない→再レンダリングが起きず入力欄に '1' が
	// 残る。この乖離をここで検出してキーを更新し、入力欄を保存値('10px')に揃える。
	// 乖離が無い通常入力では何もしない（不要な再マウントを避ける）。再マウントは
	// blur 後にしか走らないため、入力途中のフォーカスは奪わない（後方互換のための
	// 「触らなければ書き換えない」担保とも独立しており、保存値は変えない）。
	// On blur (edit committed), compare the raw input draft with the value that
	// would actually be stored; if they diverge, remount the UnitControl so its
	// display snaps to the stored value. Example: with a stored value of '10px',
	// typing '1' (below the lower bound) commits the clamped '10px', so the
	// attribute is unchanged, no re-render occurs, and the input keeps showing '1'.
	// We detect that divergence here and bump the key to align the input to the
	// stored value ('10px'). For ordinary input with no divergence, do nothing
	// (avoiding needless remounts). Because the remount runs only after blur, it
	// never steals focus mid-typing; it also leaves the stored value untouched, so
	// it is independent of the backward-compat "don't rewrite unless touched" rule.
	const handleUnitControlFontSizeBlur = (event) => {
		const raw = event?.target?.value;
		// 入力欄が空（クリア）のときは onChange 側でプリセット復帰済み。何もしない。
		if (raw === undefined || raw === null || raw === '') {
			return;
		}
		const numeric = parseFloat(raw);
		if (Number.isNaN(numeric)) {
			return;
		}
		// onChange と同じ規則で「確定後に保存されているはずの値」を組み立てる。
		const unitMatch = String(raw).match(/[a-z%]+$/i);
		const unit = unitMatch ? unitMatch[0].toLowerCase() : currentFontUnit;
		const committed =
			unit === 'px'
				? `${clampFontSizePx(numeric)}px`
				: `${numeric}${unit}`;
		// 表示中の生ドラフトを正規化（単位を補ってから）保存確定値と比較する。
		const normalizedRaw = unitMatch ? String(raw) : `${raw}${unit}`;
		if (normalizedRaw !== committed) {
			setFontSizeInputKey((prev) => prev + 1);
		}
	};

	// 以前の値を切り替え
	useEffect(() => {
		if (attributes.clientId !== undefined) {
			setAttributes({ clientId: undefined });
		}
		if (
			blockId === undefined ||
			isParentReusableBlock(clientId) === false
		) {
			setAttributes({ blockId: clientId });
		}
		if (
			buttonUrl === null ||
			buttonUrl === 'null' ||
			buttonUrl === 'undefined' ||
			buttonUrl === ''
		) {
			setAttributes({ buttonUrl: undefined });
		}
		if (buttonColorCustom === undefined) {
			setAttributes({ buttonTextColorCustom: undefined });
		}
		if (
			buttonColorCustom === null ||
			buttonColorCustom === 'null' ||
			buttonColorCustom === 'undefined' ||
			buttonColorCustom === ''
		) {
			setAttributes({ buttonColorCustom: undefined });
		}
		if (
			fontAwesomeIconBefore === null ||
			fontAwesomeIconBefore === 'null' ||
			fontAwesomeIconBefore === 'undefined' ||
			fontAwesomeIconBefore === ''
		) {
			setAttributes({ fontAwesomeIconBefore: undefined });
		}
		if (
			fontAwesomeIconAfter === null ||
			fontAwesomeIconAfter === 'null' ||
			fontAwesomeIconAfter === 'undefined' ||
			fontAwesomeIconAfter === ''
		) {
			setAttributes({ fontAwesomeIconAfter: undefined });
		}
		if (
			subCaption === null ||
			subCaption === 'null' ||
			subCaption === 'undefined' ||
			subCaption === ''
		) {
			setAttributes({ subCaption: undefined });
		}
		if (old_1_31_0 === undefined) {
			if (buttonWidthMobile === undefined) {
				setAttributes({ buttonWidthMobile: buttonWidth });
			}
			if (buttonWidthTablet === undefined) {
				setAttributes({ buttonWidthTablet: buttonWidth });
			}
			setAttributes({ old_1_31_0: true });
		}
		if (!isInnerButton) {
			setAttributes({ buttonWidth: 0 });
		}
	}, [clientId]);

	const { updateBlockAttributes } = dispatch('core/block-editor');

	// buttonColor が有効なら buttonColorCustom と buttonTextColorCustom を無効化
	// プルダウンから直接カスタムを選ぶとその瞬間色が適用されなくなるので primary に戻す
	// buttonColorCustom が有効でないと buttonTextColorCustom は意味を成さないので無効化
	useEffect(() => {
		if (buttonColor !== 'custom') {
			updateBlockAttributes(clientId, {
				buttonTextColorCustom: undefined,
			});
			updateBlockAttributes(clientId, { buttonColorCustom: undefined });
		} else if (
			buttonColorCustom === undefined &&
			buttonColor === 'custom'
		) {
			updateBlockAttributes(clientId, { buttonColor: 'primary' });
			updateBlockAttributes(clientId, {
				buttonTextColorCustom: undefined,
			});
		}
	}, [buttonColor]);

	// buttonColorCustom が有効なら buttonColor を custom に
	// buttonColorCustom が空白かつ buttonColor が custom なら buttonColor を primary に
	useEffect(() => {
		if (buttonColorCustom !== undefined) {
			updateBlockAttributes(clientId, { buttonColor: 'custom' });
		} else if (buttonColor === 'custom') {
			// 背景色クリアされたらデフォルトに戻す
			updateBlockAttributes(clientId, { buttonColor: 'primary' });
		}
	}, [buttonColorCustom]);

	useEffect(() => {
		const fixes = {};
		if (fontAwesomeIconBefore) {
			const fixed = fixBrokenUnicode(fontAwesomeIconBefore);
			if (fixed !== fontAwesomeIconBefore) {
				fixes.fontAwesomeIconBefore = fixed;
			}
		}
		if (fontAwesomeIconAfter) {
			const fixed = fixBrokenUnicode(fontAwesomeIconAfter);
			if (fixed !== fontAwesomeIconAfter) {
				fixes.fontAwesomeIconAfter = fixed;
			}
		}
		if (Object.keys(fixes).length > 0) {
			setAttributes(fixes);
		}
	}, [fontAwesomeIconBefore, fontAwesomeIconAfter]);

	let containerClass;
	// カスタムカラーの場合 またはアウターにギャップが指定されている場合 またはホバー色が指定されている場合
	if (
		(buttonColorCustom !== undefined && isHexColor(buttonColorCustom)) ||
		(buttonTextColorCustom !== undefined &&
			isHexColor(buttonTextColorCustom)) ||
		outerGap ||
		(buttonHoverBgColorCustom !== undefined &&
			buttonHoverBgColorCustom !== '') ||
		(buttonHoverTextColorCustom !== undefined &&
			buttonHoverTextColorCustom !== '')
	) {
		containerClass = `vk_button vk_button-color-custom vk_button-${blockId}`;
	} else {
		containerClass = `vk_button vk_button-color-custom`;
	}

	if (isInnerButton) {
		if (buttonWidthMobile) {
			// 横並びボタンで幅が指定されている
			containerClass += ` vk_button-width-mobile-${buttonWidthMobile}`;
		}
		if (buttonWidthTablet) {
			containerClass += ` vk_button-width-tablet-${buttonWidthTablet}`;
		}
		if (buttonWidth) {
			containerClass += ` vk_button-width-${buttonWidth}`;
		}
	} else {
		containerClass += ` vk_button-align-${buttonAlign}`;
	}

	// エフェクト
	if (buttonEffect !== '') {
		containerClass += ` is-style-${buttonEffect}`;
	}

	// アイコン単位
	const units = [
		{ value: 'px', label: 'px', default: 16 },
		{ value: 'em', label: 'em', default: 1 },
		{ value: 'rem', label: 'rem', default: 1 },
	];

	const blockProps = useBlockProps({
		className: containerClass,
	});

	// コア spacing.padding は wrapper (.vk_button) にインライン style として
	// 自動注入されるが、編集画面でも save と同様に wrapper 側を取り除き、
	// 同じ値を <a> 側に転写する。これによりエディタ表示と保存後 HTML を一致させる。
	// Same wrapper-padding strip / forward to <a> as in save.js, so the editor
	// preview matches the saved HTML.
	const spacingPadding = attributes?.style?.spacing?.padding;
	const hasSpacingPadding =
		spacingPadding &&
		(spacingPadding.top ||
			spacingPadding.right ||
			spacingPadding.bottom ||
			spacingPadding.left);

	if (hasSpacingPadding && blockProps.style) {
		const {
			paddingTop: _pt,
			paddingRight: _pr,
			paddingBottom: _pb,
			paddingLeft: _pl,
			...restWrapperStyle
		} = blockProps.style;
		blockProps.style = restWrapperStyle;
	}

	let inlineStyle = {};
	if (
		buttonTextColorCustom !== undefined &&
		isHexColor(buttonTextColorCustom)
	) {
		inlineStyle = {
			// 編集画面対策
			color: `${buttonTextColorCustom}`,
		};
	}
	if (hasSpacingPadding) {
		if (spacingPadding.top) {
			inlineStyle.paddingTop = toPresetSpacingVar(spacingPadding.top);
		}
		if (spacingPadding.right) {
			inlineStyle.paddingRight = toPresetSpacingVar(spacingPadding.right);
		}
		if (spacingPadding.bottom) {
			inlineStyle.paddingBottom = toPresetSpacingVar(
				spacingPadding.bottom
			);
		}
		if (spacingPadding.left) {
			inlineStyle.paddingLeft = toPresetSpacingVar(spacingPadding.left);
		}
	}

	// buttonTargetをlink-toolbarのlinkTargetに変換
	const linkTarget = buttonTarget ? '_blank' : '';

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<LinkToolbar
						linkUrl={buttonUrl || ''}
						setLinkUrl={(value) =>
							setAttributes({ buttonUrl: value })
						}
						linkTarget={linkTarget}
						setLinkTarget={(value) =>
							setAttributes({ buttonTarget: value === '_blank' })
						}
						relAttribute={relAttribute || ''}
						setRelAttribute={(value) =>
							setAttributes({ relAttribute: value })
						}
						isDescendentOfQueryLoop={isDescendentOfQueryLoop}
						linkToPost={linkToPost}
						setLinkToPost={(checked) =>
							setAttributes({ linkToPost: !!checked })
						}
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={__('Button setting', 'vk-blocks')}>
					<TextControl
						label={__('Sub Caption', 'vk-blocks')}
						value={subCaption}
						className={`mt-0 mb-3`}
						onChange={(value) =>
							setAttributes({ subCaption: value })
						}
						placeholder={__('Sub Caption', 'vk-blocks')}
					/>

					{/* 見出しとカスタムサイズ切替トグルを 1 行に並べる。
						コアの FontSizePicker のヘッダー（ラベル＋歯車トグル）に倣う。
						Lay out the heading and the custom-size toggle on one row,
						mirroring the core FontSizePicker header (label + gear toggle). */}
					<div className="vk-button-font-size-header mt-0 mb-2">
						<h4 id={buttonSizeLabelId}>
							{__('Button Size:', 'vk-blocks')}
						</h4>
						{/* プリセット⇔カスタムサイズを切り替えるトグル。
							isPressed はコアの Button 内部で aria-pressed に変換されるため、
							これだけでカスタムサイズモードの ON/OFF を支援技術へ伝えられる。
							Toggle between preset and custom size. The core Button converts
							isPressed into aria-pressed, so this alone conveys whether the
							custom-size mode is on to assistive technologies. */}
						<Button
							className="vk-button-font-size-toggle"
							size="small"
							icon={settings}
							isPressed={isCustomSize}
							label={
								isCustomSize
									? __('Use size preset', 'vk-blocks')
									: __('Set custom size', 'vk-blocks')
							}
							showTooltip
							onClick={() => {
								if (isCustomSize) {
									// カスタム → プリセットへ戻す。
									// 数値指定を解除し、プリセットへ戻した旨を通知する。
									// Custom -> preset. Clear the numeric size and
									// announce the return to the preset.
									setIsCustomSize(false);
									if (fontSizeValue) {
										setAttributes({ fontSizeValue: null });
										setFontSizeAnnouncement(
											__(
												'Returned to the preset size.',
												'vk-blocks'
											)
										);
									}
								} else {
									// プリセット → カスタムへ。
									// ここでは fontSizeValue を自動セットしない。ユーザーが
									// 数値を入れるまで出力はプリセットのまま（dirty 化を避ける）。
									// Preset -> custom. Do not auto-set fontSizeValue here;
									// the output stays on the preset until the user enters a
									// value (avoids marking the block dirty).
									setIsCustomSize(true);
								}
							}}
						/>
					</div>
					{/* プリセットモード: XS/S/M/L/XL のセグメント。
						カスタムサイズモード時は隠す（コア FontSizePicker と同じ挙動）。
						Preset mode: the XS/S/M/L/XL segments. Hidden while in custom-size
						mode (matching the core FontSizePicker behavior). */}
					{!isCustomSize && (
						<ToggleGroupControl
							value={buttonSize}
							// プリセットを選び直したら数値指定を解除してプリセットに戻す。
							// Choosing a preset clears the numeric size and returns to the preset.
							onChange={(value) => {
								setAttributes({
									buttonSize: value,
									fontSizeValue: null,
								});
								if (fontSizeValue) {
									setFontSizeAnnouncement(
										__(
											'Returned to the preset size.',
											'vk-blocks'
										)
									);
								}
							}}
							aria-labelledby={buttonSizeLabelId}
							isBlock
						>
							<ToggleGroupControlOption
								value="xs"
								label={__('XS', 'vk-blocks')}
								aria-label={__('Extra Small', 'vk-blocks')}
								showTooltip
							/>
							<ToggleGroupControlOption
								value="sm"
								label={__('S', 'vk-blocks')}
								aria-label={__('Small', 'vk-blocks')}
								showTooltip
							/>
							<ToggleGroupControlOption
								value="md"
								label={__('M', 'vk-blocks')}
								aria-label={__('Medium', 'vk-blocks')}
								showTooltip
							/>
							<ToggleGroupControlOption
								value="lg"
								label={__('L', 'vk-blocks')}
								aria-label={__('Large', 'vk-blocks')}
								showTooltip
							/>
							<ToggleGroupControlOption
								value="xl"
								label={__('XL', 'vk-blocks')}
								aria-label={__('Extra Large', 'vk-blocks')}
								showTooltip
							/>
						</ToggleGroupControl>
					)}
					{/* カスタムサイズモード: 数値入力(px固定)＋スライダー。
						コアの FontSizePicker（withSlider）の見た目を、min/max/step を
						指定できる UnitControl + RangeControl の併置で再現する。コアの
						FontSizePicker コンポーネント自体は min/max/step を props で
						受け取れず、植草指定の min=10/max=100/step=1・px 固定を満たせない
						ため採用しない（A-2 方針）。
						Custom-size mode: a px-only numeric input plus a slider.
						This reproduces the look of the core FontSizePicker (withSlider)
						using a UnitControl + RangeControl placed side by side, because the
						core FontSizePicker component cannot accept min/max/step props and so
						cannot satisfy the specified min=10/max=100/step=1 px-only range. */}
					{isCustomSize && (
						<div className="vk-button-font-size-control mt-0 mb-2">
							<div className="vk-button-font-size-control__row">
								<UnitControl
									// 保存値とクランプ確定値が一致して再レンダリングが
									// 起きないケースで、blur 時にこのキーを変えて再マウントし
									// 表示を保存値へ強制同期する（詳細は宣言箇所のコメント参照）。
									// Bumping this key on blur remounts the control so its
									// display snaps to the stored value when the clamped result
									// matches the stored value and no re-render would occur.
									key={fontSizeInputKey}
									className="vk-button-font-size-control__unit"
									label={__('Font Size', 'vk-blocks')}
									value={fontSizeValue}
									// 単位はコア準拠（px / em / rem / vw / vh）。レガシー値は
									// ユーザーが能動的に触るまで温存し、勝手に変換しない。
									// Units follow the core set (px / em / rem / vw / vh). Legacy
									// values are kept until the user actively edits them; they are
									// never auto-converted.
									units={fontSizeUnits}
									// 新規入力レンジ（下限10・上限100・px 整数）の担保は
									// handleUnitControlFontSize 側で明示的に行う。
									// min/max を UnitControl に渡すと、レンジ外のレガシー値
									// （'200px'・'1.2em' 等）をフォーカス→ブラーしただけで
									// 受動的に境界値へクランプ＆保存してしまい後方互換を壊すため、
									// あえて min/max は渡さない（step は整数入力のUIヒント）。
									// The new-input range (min 10, max 100, integer px) is enforced
									// in handleUnitControlFontSize. min/max are intentionally NOT
									// passed to UnitControl because they would passively clamp and
									// persist out-of-range legacy values ('200px', '1.2em') on mere
									// focus/blur, breaking backward compatibility. (step is only a
									// UI hint for integer input.)
									step={1}
									// 数値指定したらプリセットより優先。空ならプリセットへ戻す。
									// Setting a value makes it take priority over the preset; an
									// empty value returns control to the preset.
									onChange={(value) =>
										handleUnitControlFontSize(value)
									}
									// 編集確定(blur)時に、表示中のドラフトが保存確定値と
									// 乖離していれば再マウントして表示を揃える。
									// On blur, remount to align the display when the draft
									// diverges from the committed stored value.
									onBlur={handleUnitControlFontSizeBlur}
								/>
								{/* スライダー。数値入力は UnitControl 側に集約するため、
									ここでは入力欄を出さない（spinbutton の二重化を防ぐ）。
									見出しラベルを持たないので aria-label で操作対象を明示する。
									The slider. The numeric input lives in the UnitControl, so
									this hides its own input field to avoid duplicate spinbuttons.
									It has no visible label, so aria-label states its purpose. */}
								<RangeControl
									className="vk-button-font-size-control__slider"
									aria-label={__('Font Size', 'vk-blocks')}
									value={sliderFontSizeValue}
									min={sliderFontMin}
									max={sliderFontMax}
									step={sliderFontStep}
									withInputField={false}
									showTooltip
									// スライダー操作時は常に px の数値として確定させる。
									// On slider change, always commit a px numeric value.
									onChange={(value) =>
										updateCustomFontSize(
											value === undefined ||
												value === null
												? null
												: `${value}${currentFontUnit}`
										)
									}
								/>
							</div>
						</div>
					)}
					{/* 状態変化をスクリーンリーダーへ通知する live region。
						Live region announcing the state change to screen readers. */}
					<div
						className="screen-reader-text"
						aria-live="polite"
						aria-atomic="true"
					>
						{fontSizeAnnouncement}
					</div>
					<style>
						{`
							/* 見出しと歯車トグルを両端に配置する。
							   Place the heading and the gear toggle at opposite ends. */
							.vk-button-font-size-header {
								display: flex;
								align-items: center;
								justify-content: space-between;
								gap: 8px;
							}
							/* ヘッダー内の見出しは flex で縦中央に揃えるためマージンを消す。
							   Drop the heading margin so flex can center it vertically. */
							.vk-button-font-size-header h4 {
								margin: 0;
							}
							/* カスタムサイズUI全体のラッパー。数値入力とスライダーを __row 内に
							   横1行で収める（コア FontSizePicker と同じ構成）。
							   Wrapper for the whole custom-size UI. The numeric input and slider
							   sit on a single __row (same layout as the core FontSizePicker). */
							.vk-button-font-size-control {
								display: flex;
								flex-direction: column;
								align-items: stretch;
							}
							/* 数値入力(UnitControl)とスライダー(RangeControl)を横1行に並べ、
							   コアの FontSizePicker（数値＋px＋スライダー）の見た目に寄せる。
							   狭いサイドバーでも縦積みにならないよう折り返しはさせず、
							   数値入力はコンパクトな固定幅、スライダーが残り幅を埋める。
							   Lay out the numeric input (UnitControl) and the slider
							   (RangeControl) on a single row to mirror the core FontSizePicker
							   (number + px + slider). Do not wrap (so they never stack on a
							   narrow sidebar): the numeric input keeps a compact fixed width
							   and the slider fills the remaining space. */
							.vk-button-font-size-control__row {
								display: flex;
								align-items: center;
								gap: 8px;
							}
							/* 数値入力はコンパクトな固定幅。スライダーは残り幅いっぱい。
							   min-width:0 で flex 子要素が内容幅を超えて縮められるようにする。
							   The numeric input takes a compact fixed width; the slider fills
							   the rest. min-width:0 lets the flex children shrink below their
							   content width. */
							.vk-button-font-size-control__unit {
								flex: 0 1 104px;
								min-width: 0;
							}
							.vk-button-font-size-control__slider {
								flex: 1 1 auto;
								min-width: 0;
								margin: 0;
							}
						`}
					</style>
					{!isInnerButton && (
						<>
							<h4 className="mt-0 mb-2">
								{__('Button Position:', 'vk-blocks')}
							</h4>
							<ToggleGroupControl
								value={buttonAlign}
								onChange={(value) =>
									setAttributes({ buttonAlign: value })
								}
								className="vk-button-align-control"
								isBlock
							>
								<ToggleGroupControlOption
									value="left"
									label={__('Left', 'vk-blocks')}
								/>
								<ToggleGroupControlOption
									value="center"
									label={__('Center', 'vk-blocks')}
								/>
								<ToggleGroupControlOption
									value="right"
									label={__('Right', 'vk-blocks')}
								/>
								<ToggleGroupControlOption
									value="wide"
									label={__('Wide', 'vk-blocks')}
								/>
								<ToggleGroupControlOption
									value="block"
									label={__('Block', 'vk-blocks')}
								/>
							</ToggleGroupControl>
							<style>
								{`
									.vk-button-align-control .components-toggle-group-control-option-base {
										padding: 0;
									}
								`}
							</style>
						</>
					)}

					{isInnerButton && (
						<>
							<h4 className="mt-0 mb-2">
								{__('Button Width:', 'vk-blocks')}
							</h4>
							<p className="mt-0 mb-2">
								{__('Mobile', 'vk-blocks')}
							</p>
							<ToggleGroupControl
								value={String(buttonWidthMobile)}
								onChange={(value) => {
									setAttributes({
										buttonWidthMobile: Number(value),
									});
								}}
								isBlock
							>
								<ToggleGroupControlOption
									value="0"
									label="Auto"
								/>
								<ToggleGroupControlOption
									value="25"
									label="25%"
								/>
								<ToggleGroupControlOption
									value="50"
									label="50%"
								/>
								<ToggleGroupControlOption
									value="75"
									label="75%"
								/>
								<ToggleGroupControlOption
									value="100"
									label="100%"
								/>
							</ToggleGroupControl>
							<p className="mt-0 mb-2">
								{__('Tablet', 'vk-blocks')}
							</p>

							<ToggleGroupControl
								value={String(buttonWidthTablet)}
								onChange={(value) => {
									setAttributes({
										buttonWidthTablet: Number(value),
									});
								}}
								isBlock
							>
								<ToggleGroupControlOption
									value="0"
									label="Auto"
								/>
								<ToggleGroupControlOption
									value="25"
									label="25%"
								/>
								<ToggleGroupControlOption
									value="50"
									label="50%"
								/>
								<ToggleGroupControlOption
									value="75"
									label="75%"
								/>
								<ToggleGroupControlOption
									value="100"
									label="100%"
								/>
							</ToggleGroupControl>

							<p className="mt-0 mb-2">{__('PC', 'vk-blocks')}</p>
							<ToggleGroupControl
								value={String(buttonWidth)}
								onChange={(value) => {
									setAttributes({
										buttonWidth: Number(value),
									});
								}}
								isBlock
							>
								<ToggleGroupControlOption
									value="0"
									label="Auto"
								/>
								<ToggleGroupControlOption
									value="25"
									label="25%"
								/>
								<ToggleGroupControlOption
									value="50"
									label="50%"
								/>
								<ToggleGroupControlOption
									value="75"
									label="75%"
								/>
								<ToggleGroupControlOption
									value="100"
									label="100%"
								/>
							</ToggleGroupControl>
						</>
					)}

					<h4 className="mt-0 mb-2">
						{__('Button Style:', 'vk-blocks')}
					</h4>
					<ToggleGroupControl
						value={buttonType}
						onChange={(value) => {
							setAttributes({ buttonType: value });

							if (value === '1' || value === '2') {
								setAttributes({
									buttonTextColorCustom: undefined,
									buttonEffect: '',
								});
							}
							if (value === '2') {
								setAttributes({
									buttonHoverBgColorCustom: undefined,
								});
							}
						}}
						isBlock
					>
						<ToggleGroupControlOption
							value="0"
							label={__('Solid color', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="1"
							label={__('No background', 'vk-blocks')}
						/>
						<ToggleGroupControlOption
							value="2"
							label={__('Text only', 'vk-blocks')}
						/>
					</ToggleGroupControl>
					<p className={`mb-3`}>
						{__(
							'If you select "No background", you need to select a custom color.',
							'vk-blocks'
						)}
					</p>

					{'0' === buttonType && (
						<>
							<h4 className="mt-0 mb-2">
								{__('Button Effect:', 'vk-blocks')}
							</h4>
							<ToggleGroupControl
								value={buttonEffect}
								onChange={(value) =>
									setAttributes({ buttonEffect: value })
								}
								isBlock
							>
								<ToggleGroupControlOption
									value="none"
									label={__('None', 'vk-blocks')}
								/>
								<ToggleGroupControlOption
									value="shine"
									label={__('Shine', 'vk-blocks')}
								/>
							</ToggleGroupControl>
						</>
					)}

					<h4 className={`mt-0 mb-2`}>{__('Color', 'vk-blocks')}</h4>
					<SelectControl
						label={__('Default Color (Bootstrap)', 'vk-blocks')}
						value={buttonColor}
						options={[
							{
								label: __('Primary', 'vk-blocks'),
								value: 'primary',
							},
							{
								label: __('Secondary', 'vk-blocks'),
								value: 'secondary',
							},
							{
								label: __('Success', 'vk-blocks'),
								value: 'success',
							},
							{
								label: __('Info', 'vk-blocks'),
								value: 'info',
							},
							{
								label: __('Warning', 'vk-blocks'),
								value: 'warning',
							},
							{
								label: __('Danger', 'vk-blocks'),
								value: 'danger',
							},
							{
								label: __('Light', 'vk-blocks'),
								value: 'light',
							},
							{
								label: __('Dark', 'vk-blocks'),
								value: 'dark',
							},
							{
								label: __('Custom Color', 'vk-blocks'),
								value: 'custom',
							},
						]}
						onChange={(value) =>
							setAttributes({ buttonColor: value })
						}
					/>
					<BaseControl
						label={__('Custom Color', 'vk-blocks')}
						id={`vk_block_button_custom_color`}
					>
						<BaseControl
							id={`vk_block_button_custom_background_color`}
							label={
								buttonType === '0' || buttonType === null
									? __('Background Color', 'vk-blocks')
									: __('Button Color', 'vk-blocks')
							}
							help={__(
								'This color palette overrides the default color. If you want to use the default color, click the clear button.',
								'vk-blocks'
							)}
						>
							<AdvancedColorPalette
								schema={'buttonColorCustom'}
								{...props}
							/>
						</BaseControl>
						{(buttonType === '0' || buttonType === null) &&
							buttonColorCustom !== undefined && (
								<BaseControl
									id={`vk_block_button_custom_text_color`}
									label={__('Text Color', 'vk-blocks')}
								>
									<AdvancedColorPalette
										schema={'buttonTextColorCustom'}
										{...props}
									/>
								</BaseControl>
							)}
					</BaseControl>
					<h4 className={`mt-0 mb-2`}>
						{__('Hover Color', 'vk-blocks')}
					</h4>
					<BaseControl id={`vk_block_button_hover_color`}>
						{buttonType !== '2' && (
							<BaseControl
								id={`vk_block_button_hover_background_color`}
								label={__(
									'Hover Background Color',
									'vk-blocks'
								)}
							>
								<AdvancedColorPalette
									schema={'buttonHoverBgColorCustom'}
									{...props}
								/>
							</BaseControl>
						)}
						<BaseControl
							id={`vk_block_button_hover_text_color`}
							label={__('Hover Text Color', 'vk-blocks')}
						>
							<AdvancedColorPalette
								schema={'buttonHoverTextColorCustom'}
								{...props}
							/>
						</BaseControl>
					</BaseControl>
					<BaseControl>
						<h4 className={`mt-0 mb-2`}>
							{iconLabel(__('Icon', 'vk-blocks'))}
						</h4>
						<BaseControl
							id={`vk_block_button_fa_before_text`}
							label={__('Before text', 'vk-blocks')}
						>
							<FontAwesome
								attributeName={'fontAwesomeIconBefore'}
								{...props}
							/>
							<UnitControl
								label={__('Size', 'vk-blocks')}
								value={iconSizeBefore}
								units={units}
								onChange={(value) => {
									setAttributes({
										iconSizeBefore: parseFloat(value)
											? value
											: null,
									});
								}}
							/>
						</BaseControl>
						<hr />
						<BaseControl
							id={`vk_block_button_fa_after_text`}
							label={__('After text', 'vk-blocks')}
						>
							<FontAwesome
								attributeName={'fontAwesomeIconAfter'}
								{...props}
							/>
							<UnitControl
								label={__('Size', 'vk-blocks')}
								value={iconSizeAfter}
								units={units}
								onChange={(value) => {
									setAttributes({
										iconSizeAfter: parseFloat(value)
											? value
											: null,
									});
								}}
							/>
						</BaseControl>
					</BaseControl>
					<h4 className={`mt-0 mb-2`}>
						{__('Button border radius', 'vk-blocks')}
					</h4>
					<UnitControl
						value={attributes.borderRadius}
						onChange={(value) => {
							setAttributes({ borderRadius: value || null });
						}}
						units={[
							{ value: 'px', label: 'px', default: 5 },
							{ value: '%', label: '%', default: 5 },
							{ value: 'em', label: 'em', default: 1 },
							{ value: 'rem', label: 'rem', default: 1 },
						]}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<VKBButton
					lbTextColorCustom={buttonTextColorCustom}
					lbColorCustom={buttonColorCustom}
					lbColor={buttonColor}
					lbType={buttonType}
					lbAlign={buttonAlign}
					lbSize={buttonSize}
					lbFontAwesomeIconBefore={fontAwesomeIconBefore}
					lbFontAwesomeIconAfter={fontAwesomeIconAfter}
					lbIconSizeBefore={iconSizeBefore}
					lbIconSizeAfter={iconSizeAfter}
					lbsubCaption={subCaption}
					lbFontSizeValue={fontSizeValue}
					lbsubCaptionRichText={
						isSelected || subCaption ? (
							<RichText
								tagName="span"
								value={subCaption}
								onChange={(value) =>
									setAttributes({ subCaption: value })
								}
								placeholder={__('Sub Caption', 'vk-blocks')}
								allowedFormats={[]}
								aria-label={__('Sub Caption', 'vk-blocks')}
							/>
						) : null
					}
					inlineStyle={{
						...inlineStyle,
						borderRadius: attributes.borderRadius,
					}}
					lbRichtext={
						<RichText
							tagName={'span'}
							className={'vk_button_link_txt'}
							onChange={(value) =>
								setAttributes({ content: value })
							}
							value={content}
							placeholder={__('Input text', 'vk-blocks')}
							allowedFormats={[
								'core/bold',
								// 'core/code',
								// 'core/image',
								'core/italic',
								// 'core/link',
								'core/strikethrough',
								// 'core/underline',
								// 'core/text-color',
								'core/superscript',
								'core/subscript',
								// 'vk-blocks/highlighter',
								'vk-blocks/responsive-br',
								'vk-blocks/nowrap',
								'vk-blocks/inline-font-size',
							]}
						/>
					}
				/>
			</div>
		</>
	);
}
