'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, Inbox, LoaderCircle, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocale } from '@/libs/i18n/context';

export function Loading({ inline = false }: { inline?: boolean }) {
	const { t } = useLocale();
	return (
		<div className={inline ? 'loading inline' : 'loading'} role="status">
			<LoaderCircle className="spin" size={20} />
			<span>{t('loading')}</span>
		</div>
	);
}

export function Empty({ title, icon, children }: { title: string; icon?: ReactNode; children?: ReactNode }) {
	return (
		<div className="empty-state">
			<span className="empty-icon">{icon ?? <Inbox size={25} />}</span>
			<strong>{title}</strong>
			{children}
		</div>
	);
}

export function Feedback({ message, success = false }: { message?: string; success?: boolean }) {
	if (!message) return null;
	return (
		<div className={'feedback ' + (success ? 'success' : 'danger')} role={success ? 'status' : 'alert'}>
			{success ? <CircleCheck size={17} /> : <CircleAlert size={17} />}
			<span>{message}</span>
		</div>
	);
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
	const { t } = useLocale();
	return (
		<Empty title={t('unavailable')} icon={<CircleAlert size={24} />}>
			<button className="button secondary small" onClick={onRetry}>
				{t('retry')}
			</button>
		</Empty>
	);
}

export function SectionHeading({
	title,
	description,
	icon,
	children,
}: {
	title: string;
	description?: string;
	icon?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="section-heading">
			<div>
				{icon ? <span className="lead-icon">{icon}</span> : null}
				<h1>{title}</h1>
				{description && <p>{description}</p>}
			</div>
			{children}
		</div>
	);
}

export function BackLink({ href, label }: { href: string; label?: string }) {
	const { t } = useLocale();
	return (
		<Link className="back-link" href={href}>
			<ArrowLeft size={16} />
			{label ?? t('back')}
		</Link>
	);
}

export function Avatar({ url, name, className = '' }: { url?: string | null; name?: string; className?: string }) {
	const initial = name?.trim().slice(0, 1).toUpperCase();
	return (
		<span className={'avatar ' + className}>
			{url ? (
				<Image unoptimized src={url} alt="" width={72} height={72} />
			) : initial ? (
				<span>{initial}</span>
			) : (
				<UserRound size={18} />
			)}
		</span>
	);
}

export function ContentImage({ url, alt = '', zoom = false }: { url: string; alt?: string; zoom?: boolean }) {
	const image = <Image unoptimized className="content-image" src={url} alt={alt} width={720} height={440} />;
	if (!zoom) return image;
	return (
		<a className="exam-media-link" href={url} target="_blank" rel="noreferrer">
			{image}
		</a>
	);
}

export function Modal({
	open,
	onClose,
	title,
	children,
	actions,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { className: 'modal-paper' } }}>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>{children}</DialogContent>
			{actions && <DialogActions>{actions}</DialogActions>}
		</Dialog>
	);
}

export function Pagination({
	offset,
	limit,
	total,
	onChange,
}: {
	offset: number;
	limit: number;
	total: number;
	onChange: (offset: number) => void;
}) {
	const { t } = useLocale();
	if (total <= limit) return null;
	return (
		<nav className="pagination" aria-label={t('page')}>
			<button
				className="button secondary small"
				disabled={offset === 0}
				onClick={() => onChange(Math.max(0, offset - limit))}
			>
				<ArrowLeft size={15} />
				{t('previous')}
			</button>
			<span>
				{Math.floor(offset / limit) + 1} / {Math.ceil(total / limit)}
			</span>
			<button
				className="button secondary small"
				disabled={offset + limit >= total}
				onClick={() => onChange(offset + limit)}
			>
				{t('next')}
				<ArrowRight size={15} />
			</button>
		</nav>
	);
}

export function clock(ms: number) {
	const seconds = Math.max(0, Math.ceil(ms / 1000));
	return (
		Math.floor(seconds / 60)
			.toString()
			.padStart(2, '0') +
		':' +
		(seconds % 60).toString().padStart(2, '0')
	);
}

export function humanDate(value: string, locale: string) {
	return new Intl.DateTimeFormat(
		locale,
		locale === 'uz' ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { dateStyle: 'medium' },
	).format(new Date(value));
}
