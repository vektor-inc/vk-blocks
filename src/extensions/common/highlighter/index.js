/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { registerFormatType, getActiveFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ReactComponent as IconSVG } from './icon.svg';
import hex2rgba from '@vkblocks/utils/hex-to-rgba';
import { default as InlineColorUI } from './inline';
import {
	name,
	alpha,
	highlighColor as settings,
	highlighterOnApply,
	getHighlighterColorCode,
	hasAlphaInColorCode,
} from './common';

function HighlighterEdit({
	value,
	onChange,
	isActive,
	activeAttributes,
	contentRef,
}) {
	const shortcutType = 'primary';
	const shortcutChar = 'h';

	let heightlightColor;
	let heightlightColorCode;
	if (isActive) {
		const activeFormat = getActiveFormat(value, name);
		heightlightColor = activeFormat.attributes.data;
		// data にはパレットのスラッグが入ることがあるため、色コードへ戻してから使う。
		// data may hold a palette slug, so resolve it back to a color code first.
		heightlightColorCode = getHighlighterColorCode(activeFormat.attributes);
	}
	let iconStyle = {};
	if (heightlightColorCode) {
		/*
		 * Match the density of the post content: colors that already carry an alpha are used
		 * as-is, and the rest get 70% applied. hex2rgba() cannot handle rgb() / hsl() / color
		 * keywords and returns null for them, so those fall back to color-mix(), which is the
		 * same calculation src/utils/common.scss does.
		 * 本文と同じ濃さにする。不透明度つきの色はそのまま、それ以外は 70% を掛ける。
		 * hex2rgba() は rgb() / hsl() / 色名を扱えず null を返すため、その場合は
		 * src/utils/common.scss と同じ計算になる color-mix() で掛ける。
		 */
		const highlightColorValue = hasAlphaInColorCode(heightlightColorCode)
			? heightlightColorCode
			: hex2rgba(heightlightColorCode, alpha) ||
				`color-mix(in srgb, ${heightlightColorCode} ${Math.round(
					alpha * 100
				)}%, transparent)`;
		iconStyle = {
			...iconStyle,
			backgroundImage: `linear-gradient(transparent 60%, ${highlightColorValue} 0)`,
		};
	}

	const [isAddingColor, setIsAddingColor] = useState(false);

	const enableIsAddingColor = useCallback(
		() => setIsAddingColor(true),
		[setIsAddingColor]
	);
	const disableIsAddingColor = useCallback(
		() => setIsAddingColor(false),
		[setIsAddingColor]
	);

	return (
		<>
			<RichTextShortcut
				type={shortcutType}
				character={shortcutChar}
				onUse={() => setIsAddingColor(true)}
			/>
			<RichTextToolbarButton
				title={settings.title}
				onClick={() => {
					if (heightlightColor === undefined) {
						// set default color on initial
						highlighterOnApply({
							heightlightColor,
							value,
							onChange,
						});
					}
					setIsAddingColor(true);
					enableIsAddingColor(true);
				}}
				shortcutType={shortcutType}
				shortcutCharacter={shortcutChar}
				className="format-library-text-color-button"
				isActive={isActive}
				icon={
					<>
						<Icon icon={IconSVG} style={iconStyle} />
					</>
				}
			/>
			{isAddingColor && (
				<InlineColorUI
					name={name}
					onClose={disableIsAddingColor}
					activeAttributes={activeAttributes}
					value={value}
					onChange={onChange}
					contentRef={contentRef}
					setIsAddingColor={setIsAddingColor}
				/>
			)}
		</>
	);
}

const highlighColor = {
	...settings,
	edit: HighlighterEdit,
};

registerFormatType(name, highlighColor);
