'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { FolderTree, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { DELETE_MENU, SAVE_MENU } from '@/apollo/admin/mutation';
import { GET_ADMIN_MENUS } from '@/apollo/admin/query';
import { useApi } from '@/libs/hooks/use-api';
import { useLocale } from '@/libs/i18n/context';
import type { Menu } from '@/libs/types/api';
import { Empty, Feedback, LoadError, Loading, Modal, SectionHeading } from '@/libs/components/common/ui';
import {
	ConfirmAction,
	readInt,
	readOptionalText,
	readText,
	useAdminAction,
} from '@/libs/components/admin/admin-actions';

function orderedMenus(menus: Menu[]) {
	const groups = new Map<string | null, Menu[]>();
	for (const menu of menus) groups.set(menu.parentId, [...(groups.get(menu.parentId) ?? []), menu]);
	const rows: { menu: Menu; depth: number }[] = [];
	function add(id: string | null, depth: number) {
		for (const menu of groups.get(id) ?? []) {
			rows.push({ menu, depth });
			add(menu.id, depth + 1);
		}
	}
	add(null, 0);
	return rows;
}

export function AdminMenus() {
	const { t } = useLocale();
	const { mutate } = useApi();
	const action = useAdminAction();
	const { data, loading, error, refetch } = useQuery<{ getAdminMenus: Menu[] }>(GET_ADMIN_MENUS);
	const menus = data?.getAdminMenus ?? [];
	const rows = orderedMenus(menus);
	const [editing, setEditing] = useState<Menu | null | undefined>(undefined);
	const [removing, setRemoving] = useState<Menu | null>(null);
	function open(menu: Menu | null) {
		action.clear();
		setEditing(menu);
	}
	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			await action.run(async () => {
				await mutate(SAVE_MENU, {
					input: {
						id: editing?.id,
						name: readText(form, 'name'),
						slug: readText(form, 'slug'),
						parentId: readOptionalText(form, 'parent'),
						sortOrder: readInt(form, 'order'),
						published: form.has('published'),
					},
				});
				await refetch();
			})
		)
			setEditing(undefined);
	}
	async function remove() {
		if (!removing) return;
		if (
			await action.run(async () => {
				await mutate(DELETE_MENU, { id: removing.id });
				await refetch();
			})
		)
			setRemoving(null);
	}
	return (
		<>
			<SectionHeading title={t('menus')} icon={<FolderTree size={23} />}>
				<button className="button primary" onClick={() => open(null)}>
					<Plus size={18} />
					{t('newMenu')}
				</button>
			</SectionHeading>
			{editing === undefined && <Feedback message={action.message} />}
			{loading && !data ? (
				<Loading />
			) : error ? (
				<LoadError onRetry={() => void refetch()} />
			) : !rows.length ? (
				<Empty title={t('empty')} />
			) : (
				<div className="table-shell">
					<table>
						<thead>
							<tr>
								<th>{t('title')}</th>
								<th>{t('slug')}</th>
								<th>{t('order')}</th>
								<th>{t('visible')}</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{rows.map(({ menu, depth }) => (
								<tr key={menu.id}>
									<td>
										<span className="menu-tree-label" style={{ paddingInlineStart: Math.min(depth, 9) * 16 }}>
											<FolderTree size={16} />
											{menu.name}
											{menu.systemKey && <small className="meta-pill">{t('system')}</small>}
										</span>
									</td>
									<td>{menu.slug}</td>
									<td>{menu.sortOrder}</td>
									<td>{t(menu.published ? 'visible' : 'hidden')}</td>
									<td>
										<div className="inline-actions">
											{!menu.systemKey && (
												<>
													<button
														className="icon-button"
														onClick={() => open(menu)}
														aria-label={t('edit') + ' ' + menu.name}
													>
														<PencilLine size={17} />
													</button>
													<button
														className="icon-button"
														onClick={() => {
															action.clear();
															setRemoving(menu);
														}}
														aria-label={t('delete') + ' ' + menu.name}
													>
														<Trash2 size={17} />
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<Modal
				open={editing !== undefined}
				title={t(editing ? 'edit' : 'newMenu')}
				onClose={() => {
					if (!action.busy) setEditing(undefined);
				}}
			>
				<Feedback message={action.message} />
				<form key={editing?.id ?? 'new'} onSubmit={(event) => void save(event)} className="form-stack">
					<label className="field">
						{t('title')}
						<input name="name" required maxLength={150} defaultValue={editing?.name} />
					</label>
					<label className="field">
						{t('slug')}
						<input
							name="slug"
							required
							pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
							maxLength={100}
							defaultValue={editing?.slug}
						/>
					</label>
					<label className="field">
						{t('parent')}
						<select name="parent" defaultValue={editing?.parentId ?? ''}>
							<option value="">{t('root')}</option>
							{rows
								.filter(({ menu }) => menu.id !== editing?.id)
								.map(({ menu, depth }) => (
									<option key={menu.id} value={menu.id}>
										{'· '.repeat(depth)}
										{menu.name}
									</option>
								))}
						</select>
					</label>
					<label className="field">
						{t('order')}
						<input
							name="order"
							type="number"
							min={0}
							max={2147483647}
							required
							defaultValue={editing?.sortOrder ?? 0}
						/>
					</label>
					<label className="check-field">
						<input name="published" type="checkbox" defaultChecked={editing?.published ?? true} />
						{t('visible')}
					</label>
					<button className="button primary" disabled={action.busy}>
						{t(action.busy ? 'saving' : 'save')}
					</button>
				</form>
			</Modal>
			<ConfirmAction
				destructive
				open={Boolean(removing)}
				title={t('removeConfirm')}
				onClose={() => setRemoving(null)}
				onConfirm={() => void remove()}
				busy={action.busy}
			/>
		</>
	);
}
