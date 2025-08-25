import { createBlock } from '@wordpress/blocks';

// preset from
const SPACER_PRESET_FROM = {
	20: 'xxs',
	30: 'xs',
	40: 'small',
	50: 'medium',
	60: 'large',
	70: 'xl',
	80: 'xxl',
};

// preset to
const SPACER_PRESET_TO = Object.entries(SPACER_PRESET_FROM).reduce(
	(acc, [preset, label]) => {
		acc[label] = preset;
		return acc;
	},
	{}
);

const transforms = {
	from: [
		// Spacer -> Responsive Spacer
		{
			type: 'block',
			blocks: ['core/spacer'],
			transform: (attributes) => {
				const { height } = attributes;
				let toSize = 'medium';
				let toValue = 40;
				let toUnit = 'px';
				if (!height.startsWith('var:preset|spacing|')) {
					// custom
					toSize = 'custom';
					toValue = height.replace(/[^0-9]/g, '');
					toUnit = height.replace(/\d/g, '');
				} else {
					//  preset
					const presetSize = height.replace(
						'var:preset|spacing|',
						''
					);
					toSize = SPACER_PRESET_FROM[presetSize];
				}

				const transformAttributes = {
					spaceSize: toSize,
					pc: toValue,
					unit: toUnit,
				};

				return createBlock('vk-blocks/spacer', transformAttributes);
			},
		},
	],
	to: [
		// Responsive Spacer -> Spacer
		{
			type: 'block',
			blocks: ['core/spacer'],
			transform: (attributes) => {
				const { unit, pc, spaceSize } = attributes;

				let toSize;
				if ('custom' === spaceSize) {
					//  custom
					toSize = pc + unit;
				} else {
					// preset
					toSize =
						'var:preset|spacing|' + SPACER_PRESET_TO[spaceSize];
				}

				const transformSpacerAttributes = {
					...attributes,
					height: toSize,
				};

				const blockContent = [];

				blockContent.push(
					createBlock('core/spacer', transformSpacerAttributes)
				);
				return blockContent;
			},
		},
	],
};

export default transforms;
