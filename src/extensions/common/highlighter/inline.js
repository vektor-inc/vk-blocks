/**
 * WordPress dependencies
 */
import {
	removeFormat,
	getActiveFormat,
	useAnchor,
	useAnchorRef,
} from '@wordpress/rich-text';
import { ColorPalette, useCachedTruthy } from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	highlighColor as settings,
	highlighterOnApply,
	getHighlighterColorCode,
} from './common';

export function getGradientDirectionByWritingMode(contentRef) {
	if (!contentRef?.current) {
		return '';
	}
	let el = contentRef.current;
	while (el) {
		const writingMode = window.getComputedStyle(el).writingMode;
		if (writingMode && writingMode.startsWith('vertical')) {
			if (writingMode === 'vertical-rl') {
				return 'to left';
			}
			if (writingMode === 'vertical-lr') {
				return 'to right';
			}
			return 'to left'; // デフォルトで縦書きは左
		}
		el = el.parentElement;
	}
	return ''; // 横書き
}

export function getActiveColors(value, name) {
	const activeColorFormat = getActiveFormat(value, name);

	if (!activeColorFormat) {
		return undefined;
	}

	// ColorPalette decides the selected swatch by color code, so a raw slug would leave
	// nothing selected and print the slug in the input field. Resolve it back first.
	// ColorPalette は色コードで選択中の色を判定するため、スラッグのままだと選択の印が付かず
	// 入力欄にスラッグが出る。data にはパレットのスラッグが入ることがあるため色コードへ戻して返す。
	return getHighlighterColorCode(activeColorFormat.attributes);
}

function ColorPicker({ name, value, onChange, setIsAddingColor, contentRef }) {
	const onColorChange = (color) => {
		if (color) {
			// select color on palette
			const direction = getGradientDirectionByWritingMode(contentRef);
			highlighterOnApply({
				color,
				value,
				onChange,
				direction,
			});
		} else {
			// clear palette
			onChange(removeFormat(value, name));
			setIsAddingColor(false);
		}
	};

	const activeColor = getActiveColors(value, name);

	return <ColorPalette value={activeColor} onChange={onColorChange} />;
}

export default function InlineColorUI({
	name,
	value,
	onChange,
	onClose,
	contentRef,
	setIsAddingColor,
}) {
	/*
		As you change the text color by typing a HEX value into a field,
		the return value of document.getSelection jumps to the field you're editing,
		not the highlighted text. Given that useAnchor uses document.getSelection,
		it will return null, since it can't find the <mark> element within the HEX input.
		This caches the last truthy value of the selection anchor reference.
		*/

	// NOTE: useAnchorRefが非推奨になったのでフォールバック WP6.0以下をサポートしなくなったら削除すること #1456
	const existsUseAnchor = typeof useAnchor === 'function';
	const _useAnchor = existsUseAnchor ? useAnchor : useAnchorRef;
	const useAnchorObj = existsUseAnchor
		? { editableContentElement: contentRef.current, value, settings }
		: { ref: contentRef, value };
	const popoverAnchor = useCachedTruthy(_useAnchor(useAnchorObj));

	return (
		<Popover
			onClose={onClose}
			className="vk-blocks-format-popover components-inline-color-popover"
			anchor={popoverAnchor}
		>
			<ColorPicker
				name={name}
				value={value}
				onChange={onChange}
				setIsAddingColor={setIsAddingColor}
				contentRef={contentRef}
			/>
		</Popover>
	);
}
