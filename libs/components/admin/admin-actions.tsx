'use client';

import { useState } from 'react';
import { useLocale } from '@/libs/i18n/context';
import { Modal } from '@/libs/components/common/ui';

export function useAdminAction() {
	const { t } = useLocale();
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	async function run(action: () => Promise<unknown>) {
		setBusy(true);
		setMessage('');
		try {
			await action();
			return true;
		} catch (error) {
			setMessage(error instanceof Error && error.message ? error.message : t('error'));
			return false;
		} finally {
			setBusy(false);
		}
	}
	return { busy, message, clear: () => setMessage(''), run };
}

export function ConfirmAction({
	title,
	open,
	onClose,
	onConfirm,
	busy,
	destructive = false,
}: {
	title: string;
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	busy: boolean;
	destructive?: boolean;
}) {
	const { t } = useLocale();
	return (
		<Modal
			open={open}
			onClose={() => {
				if (!busy) onClose();
			}}
			title={title}
			actions={
				<>
					<button className="button secondary" disabled={busy} onClick={onClose}>
						{t('cancel')}
					</button>
					<button className={'button ' + (destructive ? 'destructive' : 'primary')} disabled={busy} onClick={onConfirm}>
						{t(busy ? 'loading' : destructive ? 'delete' : 'publish')}
					</button>
				</>
			}
		>
			{null}
		</Modal>
	);
}

export const readText = (form: FormData, name: string) => String(form.get(name) ?? '').trim();
export const readOptionalText = (form: FormData, name: string) => readText(form, name) || null;
export const readInt = (form: FormData, name: string) => Number(readText(form, name));
export const readOptionalInt = (form: FormData, name: string) => (readText(form, name) ? readInt(form, name) : null);
