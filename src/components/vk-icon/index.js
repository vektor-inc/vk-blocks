/**
 * VK Icon Component
 *
 * Common VK icon SVG component for use in panels and toolbar buttons.
 */
import { Icon } from '@wordpress/components';
import { ReactComponent as IconSVG } from './icon.svg';

/**
 * Get base icon style
 *
 * @return {Object} Base icon style object
 */
export const getVkIconBaseStyle = () => ({
	width: '24px',
	height: '24px',
});

/**
 * Get active icon style
 *
 * @return {Object} Active icon style object
 */
export const getVkIconActiveStyle = () => ({
	color: '#fff',
	background: '#1e1e1e',
});

/**
 * Get icon style based on active state
 *
 * @param {boolean} isActive    - Whether the icon should be in active state
 * @param {Object}  customStyle - Optional custom style to merge (highest precedence, will override base and active styles)
 * @return {Object} Icon style object
 *
 * Style merge order: base → active (if isActive) → custom
 */
export const getVkIconStyle = (isActive = false, customStyle = {}) => {
	const baseStyle = getVkIconBaseStyle();
	if (isActive) {
		return {
			...baseStyle,
			...getVkIconActiveStyle(),
			...customStyle,
		};
	}
	return {
		...baseStyle,
		...customStyle,
	};
};

/**
 * VK Panel Icon Component
 *
 * Ready-to-use icon component for PanelBody icon prop
 *
 * @param {Object}  props             - Component props
 * @param {boolean} props.isActive    - Whether the icon should be in active state
 * @param {Object}  props.customStyle - Optional custom style to merge (highest precedence, will override base and active styles)
 * @return {JSX.Element} Icon component ready for PanelBody
 */
export const VkPanelIcon = ({ isActive = false, customStyle = {} }) => {
	const iconStyle = getVkIconStyle(isActive, customStyle);
	return <Icon icon={IconSVG} style={iconStyle} />;
};

export { IconSVG };
export default IconSVG;
