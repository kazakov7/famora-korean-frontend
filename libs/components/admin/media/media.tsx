'use client';

import { useState } from 'react';
import { FileAudio, ImageIcon, Images, Upload, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_ADMIN_MEDIA } from '@/apollo/admin/query';
import { useMediaUpload } from '@/libs/hooks/use-media-upload';
import { useLocale } from '@/libs/i18n/context';
import type { MediaAsset, Page } from '@/libs/types/api';
import {
	ContentImage,
	Empty,
	Feedback,
	LoadError,
	Loading,
	Modal,
	Pagination,
	SectionHeading,
} from '@/libs/components/common/ui';
import { useAdminAction } from '@/libs/components/admin/admin-actions';

const accept = {
	image: 'image/jpeg,image/png,image/webp,image/avif',
	audio: 'audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,audio/aac',
};
const limit = 24;

function duration(file: File): Promise<number | undefined> {
	if (!file.type.startsWith('audio/')) return Promise.resolve(undefined);
	return new Promise((resolve) => {
		const player = document.createElement('audio');
		const url = URL.createObjectURL(file);
		function finish(value?: number) {
			window.clearTimeout(timeout);
			URL.revokeObjectURL(url);
			resolve(value);
		}
		const timeout = window.setTimeout(() => finish(), 3000);
		player.preload = 'metadata';
		player.onloadedmetadata = () =>
			finish(Number.isFinite(player.duration) ? Math.round(player.duration * 1000) : undefined);
		player.onerror = () => finish();
		player.src = url;
	});
}

function Library({ filter, onSelect }: { filter?: 'image' | 'audio'; onSelect?: (asset: MediaAsset) => void }) {
	const { t } = useLocale();
	const [offset, setOffset] = useState(0);
	const { data, loading, error, refetch } = useQuery<{ getAdminMedia: Page<MediaAsset> }>(GET_ADMIN_MEDIA, {
		variables: { page: { limit, offset } },
		fetchPolicy: 'cache-and-network',
	});
	const uploads = useMediaUpload();
	const action = useAdminAction();
	const response = data?.getAdminMedia;
	const items = response?.list.filter((asset) => !filter || asset.contentType.startsWith(filter + '/')) ?? [];
	return (
		<div>
			{onSelect && (
				<label className="button secondary small file-button">
					<Upload size={17} />
					{t(action.busy ? 'loading' : 'upload')}
					<input
						className="sr-only"
						type="file"
						accept={filter ? accept[filter] : Object.values(accept).join(',')}
						disabled={action.busy}
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = '';
							if (file)
								void action.run(async () => {
									const item = await uploads(file, await duration(file));
									await refetch();
									onSelect?.(item);
								});
						}}
					/>
				</label>
			)}
			<Feedback message={action.message} />
			{loading && !data ? (
				<Loading />
			) : error ? (
				<LoadError onRetry={() => void refetch()} />
			) : !items.length ? (
				<Empty title={t('mediaEmpty')} />
			) : (
				<div className="media-grid">
					{items.map((item) => {
						const image = item.contentType.startsWith('image/');
						const body = (
							<>
								<span className="media-thumbnail">
									{image && item.url ? (
										<ContentImage url={item.url} />
									) : image ? (
										<ImageIcon size={24} />
									) : (
										<FileAudio size={25} />
									)}
								</span>
								<span className="media-caption">
									<strong>{item.contentType}</strong>
									<small>
										{Math.ceil(item.sizeBytes / 1024)} KB
										{item.durationMs ? ' · ' + Math.ceil(item.durationMs / 1000) + 's' : ''}
									</small>
								</span>
							</>
						);
						return onSelect ? (
							<button className="media-card" key={item.id} type="button" onClick={() => onSelect(item)}>
								{body}
							</button>
						) : (
							<article className="media-card" key={item.id}>
								{body}
								{!image && item.url && <audio src={item.url} controls preload="none" />}
							</article>
						);
					})}
				</div>
			)}
			<Pagination limit={limit} offset={offset} total={response?.total ?? 0} onChange={setOffset} />
		</div>
	);
}

export function MediaField({
	label,
	value,
	type,
	onChange,
}: {
	label: string;
	value: string | null;
	type: 'image' | 'audio';
	onChange: (next: string | null) => void;
}) {
	const { t } = useLocale();
	const [open, setOpen] = useState(false);
	return (
		<div className="field">
			<span>{label}</span>
			<div className="inline-actions">
				<button className="button secondary small" type="button" onClick={() => setOpen(true)}>
					{value ? (
						<>
							{t('selected')} · {value.slice(0, 8)}
						</>
					) : (
						t('chooseMedia')
					)}
				</button>
				{value && (
					<button
						className="icon-button"
						type="button"
						aria-label={t('clear') + ' ' + label}
						onClick={() => onChange(null)}
					>
						<X size={16} />
					</button>
				)}
			</div>
			<Modal open={open} title={label} onClose={() => setOpen(false)}>
				{open && (
					<Library
						filter={type}
						onSelect={(item) => {
							onChange(item.id);
							setOpen(false);
						}}
					/>
				)}
			</Modal>
		</div>
	);
}

export function AdminMedia() {
	const { t } = useLocale();
	const uploads = useMediaUpload();
	const action = useAdminAction();
	const [revision, setRevision] = useState(0);
	return (
		<>
			<SectionHeading title={t('media')} icon={<Images size={23} />}>
				<label className="button primary file-button">
					<Upload size={19} />
					{t(action.busy ? 'loading' : 'upload')}
					<input
						className="sr-only"
						type="file"
						accept={Object.values(accept).join(',')}
						disabled={action.busy}
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = '';
							if (file)
								void action.run(async () => {
									await uploads(file, await duration(file));
									setRevision((previous) => previous + 1);
								});
						}}
					/>
				</label>
			</SectionHeading>
			<Feedback message={action.message} />
			<Library key={revision} />
		</>
	);
}
