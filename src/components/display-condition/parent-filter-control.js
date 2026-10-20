import { __, _x } from '@wordpress/i18n';
import { BaseControl, ComboboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

export function ParentFilterControl({ postType, value, onChange }) {
	const [search, setSearch] = useState('');
	const debouncedSetSearch = useDebounce(setSearch, 300);
	// 候補と保存済みの親を必要なフィールドだけ取得する。
	// Fetch only the fields needed for candidates and the saved parent.
	// context は view にする。既定の edit では edit_pages 権限のない投稿者・寄稿者に REST が拒否を返し、候補を読み込めないため。
	// Use the view context: the default edit context is rejected for authors and contributors without edit_pages.
	const { records, selectedRecord, isLoading, hasError } = useSelect(
		(select) => {
			const core = select('core');
			const query = {
				per_page: 20,
				search,
				orderby: 'title',
				order: 'asc',
				_fields: 'id,title',
				context: 'view',
			};
			const recordQuery = { _fields: 'id,title', context: 'view' };
			const recordsArgs = ['postType', postType, query];
			const recordArgs = ['postType', postType, value, recordQuery];
			const candidates = core.getEntityRecords(...recordsArgs);
			const parent =
				value > 0 ? core.getEntityRecord(...recordArgs) : null;
			const candidatesFinished = core.hasFinishedResolution(
				'getEntityRecords',
				recordsArgs
			);
			const parentFinished =
				!(value > 0) ||
				core.hasFinishedResolution('getEntityRecord', recordArgs);
			// 保存済みの親が読めない（非公開・削除済み・取得失敗）ときはエラー文を出さず、(#ID) の表示だけにする。
			// An unreadable saved parent (private, deleted or failed to fetch) shows only (#ID), not the error message.
			return {
				records: candidates,
				selectedRecord: parent,
				isLoading: !candidatesFinished || !parentFinished,
				hasError: candidatesFinished && !candidates,
			};
		},
		[postType, search, value]
	);
	const candidates = [...(records || [])];
	if (selectedRecord && !candidates.some((post) => post.id === value)) {
		candidates.push(selectedRecord);
	}
	const options = [
		{ value: '-1', label: __('No parent filter', 'vk-blocks') },
		...candidates.map((post) => ({
			value: String(post.id),
			label: `${decodeEntities(post.title?.rendered || __('(no title)', 'vk-blocks'))} (#${post.id})`,
		})),
	];

	// 削除済み・取得中の親もIDで示し、属性は選択操作でのみ変更する。
	// Keep unresolved parents visible by ID and change attributes only on selection.
	if (value > 0 && !candidates.some((post) => post.id === value)) {
		options.push({ value: String(value), label: `(#${value})` });
	}
	let status = '';
	if (isLoading) {
		status = __('Loading parent pages…', 'vk-blocks');
	} else if (hasError) {
		status = __('Unable to load parent pages.', 'vk-blocks');
	}

	// ComboboxControl は内部の BaseControl を div で包み「最後の子」にするため、標準の下余白が付かない。外側の BaseControl で余白を付ける。
	// ComboboxControl wraps its BaseControl in a div, so the editor's bottom margin is lost; the outer BaseControl restores it.
	return (
		<BaseControl id="vk_postList-parentFilter">
			<ComboboxControl
				label={_x('Parent', 'post list filter', 'vk-blocks')}
				isLoading={isLoading}
				help={
					<>
						{[
							__(
								'Select a parent to display only its direct children.',
								'vk-blocks'
							),
							__(
								'Available only when a single hierarchical post type (such as Pages) is selected.',
								'vk-blocks'
							),
						].join(' ')}
						{status && <span role="status"> {status}</span>}
					</>
				}
				value={String(value ?? -1)}
				options={options}
				onFilterValueChange={debouncedSetSearch}
				onChange={(selected) =>
					onChange(selected ? Number(selected) : -1)
				}
			/>
		</BaseControl>
	);
}
