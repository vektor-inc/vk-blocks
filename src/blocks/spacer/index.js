/**
 * spacer block type
 */

/**
 * Internal dependencies
 */
import { ReactComponent as Icon } from './icon.svg';
import metadata from './block.json';
import deprecated from './deprecated/index';
import edit from './edit';
import save from './save';
import transforms from './transforms.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: <Icon />,
	example: {
		anchor: null,
		spaceType: 'height',
		unit: 'px',
		pc: 40,
		tablet: 30,
		mobile: 20,
		spaceSize: 'custom',
	},
	edit,
	save,
	transforms,
	deprecated,
};
