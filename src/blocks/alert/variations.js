import { __ } from '@wordpress/i18n';
import { ReactComponent as Icon } from './icon.svg';

const variations = [
	{
		name: 'alert-success',
		title: __('Alert Success', 'vk-blocks'),
		scope: ['inserter', 'transform'],
		icon: <Icon />,
		attributes: {
			style: 'success',
			icon: '<i class="fa-solid fa-circle-check"></i>',
			iconText: __('Success', 'vk-blocks'),
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __('This is a success alert.', 'vk-blocks'),
				},
			},
		],
	},
	{
		name: 'alert-info',
		title: __('Alert Info', 'vk-blocks'),
		scope: ['inserter', 'transform'],
		icon: <Icon />,
		attributes: {
			style: 'info',
			icon: '<i class="fa-solid fa-circle-info"></i>',
			iconText: __('Information', 'vk-blocks'),
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __('This is a information alert.', 'vk-blocks'),
				},
			},
		],
	},
	{
		name: 'alert-warning',
		title: __('Alert Warning', 'vk-blocks'),
		scope: ['inserter', 'transform'],
		icon: <Icon />,
		attributes: {
			style: 'warning',
			icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
			iconText: __('Warning', 'vk-blocks'),
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __('This is a warning alert.', 'vk-blocks'),
				},
			},
		],
	},
	{
		name: 'alert-danger',
		title: __('Alert Danger', 'vk-blocks'),
		scope: ['inserter', 'transform'],
		icon: <Icon />,
		attributes: {
			style: 'danger',
			icon: '<i class="fa-solid fa-circle-exclamation"></i>',
			iconText: __('Danger', 'vk-blocks'),
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __('This is a danger alert.', 'vk-blocks'),
				},
			},
		],
	},
];

export default variations;
