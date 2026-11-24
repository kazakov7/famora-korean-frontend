'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, KeyRound, LogOut, Mail, UserRound } from 'lucide-react';
import { CHANGE_PASSWORD, LOGOUT, SET_FIRST_PASSWORD, UPDATE_MEMBER, VERIFY_GMAIL_OTP } from '@/apollo/user/mutation';
import { useSession } from '@/libs/auth/session';
import { useApi } from '@/libs/hooks/use-api';
import { useMediaUpload } from '@/libs/hooks/use-media-upload';
import { useLocale } from '@/libs/i18n/context';
import type { MessageKey } from '@/libs/i18n/config';
import { errorKey, PasswordField } from '@/libs/components/account/auth-screen';
import { Avatar, Feedback, Modal, SectionHeading } from '@/libs/components/common/ui';

export function Settings({ challenge, callbackError }: { challenge?: string; callbackError?: boolean }) {
	const { t, url } = useLocale();
	const { member, reload } = useSession();
	const { client, mutate } = useApi();
	const upload = useMediaUpload();
	const router = useRouter();
	const path = usePathname();
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<{ key: MessageKey; success?: boolean } | null>(
		callbackError ? { key: 'oauthError' } : null,
	);
	const [otpNotice, setOtpNotice] = useState<MessageKey | null>(null);
	if (!member) return null;
	const current = member;
	const changeAllowed = current.authMethod === 'NICKNAME' && current.hasPassword;
	const firstPassword = !current.hasPassword && current.authMethod !== 'NICKNAME';
	const startLink = '/auth/google/start?link=true&returnTo=' + encodeURIComponent(url('/my/settings'));

	async function run(work: () => Promise<void>, failure?: MessageKey, showSuccess = true) {
		setBusy(true);
		setNotice(null);
		try {
			await work();
			if (showSuccess) setNotice({ key: 'success', success: true });
		} catch (error) {
			setNotice({ key: failure ?? errorKey(error) });
		} finally {
			setBusy(false);
		}
	}
	function saveProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const age = String(data.get('age') ?? '').trim();
		void run(async () => {
			await mutate(UPDATE_MEMBER, {
				input: {
					nickname: String(data.get('nickname') ?? '').trim(),
					fullName: String(data.get('fullName') ?? '').trim(),
					phone: String(data.get('phone') ?? '').trim() || null,
					age: age ? Number(age) : null,
				},
			});
			await reload();
		});
	}
	function changeAvatar(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		void run(async () => {
			const asset = await upload(file);
			await mutate(UPDATE_MEMBER, { input: { imageId: asset.id } });
			await reload();
		}, 'uploadError');
	}
	function changePassword(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const target = event.currentTarget;
		const data = new FormData(target);
		const password = data.get('password');
		if (data.get('confirm') !== password) {
			setNotice({ key: 'passwordMismatch' });
			return;
		}
		void run(async () => {
			await mutate(changeAllowed ? CHANGE_PASSWORD : SET_FIRST_PASSWORD, {
				input: { password, ...(changeAllowed ? { oldPassword: data.get('oldPassword') } : {}) },
			});
			target.reset();
			await reload();
		});
	}
	function confirmGmail(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const code = new FormData(event.currentTarget).get('code');
		setBusy(true);
		setOtpNotice(null);
		void mutate(VERIFY_GMAIL_OTP, { input: { challengeId: challenge, code } })
			.then(async () => {
				await reload();
				setNotice({ key: 'success', success: true });
				router.replace(path);
			})
			.catch((error) => setOtpNotice(errorKey(error)))
			.finally(() => setBusy(false));
	}
	function logout() {
		void run(
			async () => {
				await mutate(LOGOUT, undefined, true);
				await client.clearStore();
				await reload().catch(() => {});
				router.replace(url());
			},
			undefined,
			false,
		);
	}

	return (
		<>
			<SectionHeading title={t('settings')} icon={<UserRound size={23} />} />
			<Feedback message={notice ? t(notice.key) : undefined} success={notice?.success} />
			<div className="settings-grid">
				<section className="panel">
					<div className="panel-heading">
						<h2>{t('profile')}</h2>
					</div>
					<div className="profile-avatar">
						<Avatar name={current.memberNick} url={current.memberImage} />
						<label className="button secondary small">
							<Camera size={16} />
							{t('uploadAvatar')}
							<input
								className="sr-only"
								type="file"
								accept="image/jpeg,image/png,image/webp,image/avif"
								onChange={changeAvatar}
								disabled={busy}
							/>
						</label>
					</div>
					<form className="form-grid" onSubmit={saveProfile}>
						<label className="field">
							{t('name')}
							<input name="fullName" defaultValue={current.memberFullName} required maxLength={120} />
						</label>
						<label className="field">
							{t('nick')}
							<input
								name="nickname"
								defaultValue={current.memberNick}
								required
								minLength={3}
								maxLength={32}
								spellCheck={false}
							/>
						</label>
						<label className="field">
							{t('phone')}
							<input type="tel" name="phone" defaultValue={current.memberPhone ?? ''} maxLength={35} />
						</label>
						<label className="field">
							{t('age')}
							<input type="number" name="age" defaultValue={current.memberAge ?? ''} min={1} max={120} />
						</label>
						<div className="wide-field">
							<button className="button primary" disabled={busy}>
								{t('save')}
							</button>
						</div>
					</form>
				</section>
				<section className="panel">
					<div className="panel-heading">
						<h2>Gmail</h2>
						<Mail size={21} />
					</div>
					<p className="panel-subtitle">{current.recoveryEmail || t('gmailBody')}</p>
					<a className="button secondary" href={startLink}>
						{t(current.recoveryEmail ? 'gmailReplace' : 'gmailConnect')}
					</a>
				</section>
				<section className="panel">
					<div className="panel-heading">
						<h2>{t(firstPassword ? 'createPassword' : 'changePassword')}</h2>
						<KeyRound size={21} />
					</div>
					{changeAllowed || firstPassword ? (
						<form className="form-stack" method="post" onSubmit={changePassword}>
							{changeAllowed && (
								<PasswordField name="oldPassword" label={t('oldPassword')} autoComplete="current-password" />
							)}
							<PasswordField name="password" label={t('newPassword')} minLength={8} autoComplete="new-password" />
							<PasswordField name="confirm" label={t('confirmPassword')} autoComplete="new-password" />
							<div>
								<button className="button primary" disabled={busy}>
									{t('save')}
								</button>
							</div>
						</form>
					) : (
						<p className="panel-subtitle">{t('changePasswordNote')}</p>
					)}
				</section>
				<section className="panel">
					<button className="button destructive" disabled={busy} onClick={logout}>
						<LogOut size={18} />
						{t('logout')}
					</button>
				</section>
			</div>
			<Modal open={Boolean(challenge)} title={t('gmailCodeTitle')} onClose={() => router.replace(path)}>
				<p className="panel-subtitle">{t('gmailCodeBody')}</p>
				<Feedback message={otpNotice ? t(otpNotice) : undefined} />
				<form className="form-stack" method="post" onSubmit={confirmGmail}>
					<label className="field">
						{t('code')}
						<input
							required
							maxLength={6}
							pattern="[0-9]{6}"
							autoComplete="one-time-code"
							inputMode="numeric"
							name="code"
						/>
					</label>
					<button className="button primary" disabled={busy}>
						{t('verify')}
					</button>
				</form>
			</Modal>
		</>
	);
}
