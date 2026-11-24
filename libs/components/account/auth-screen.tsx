'use client';

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, KeyRound, Send } from 'lucide-react';
import { LOGIN, REQUEST_PASSWORD_RESET, RESET_PASSWORD, SIGNUP, VERIFY_RESET_OTP } from '@/apollo/user/mutation';
import { useSession } from '@/libs/auth/session';
import { useApi } from '@/libs/hooks/use-api';
import { safeReturnTo } from '@/libs/i18n/config';
import type { MessageKey } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import { BackLink, Feedback } from '@/libs/components/common/ui';

export function errorKey(error: unknown): MessageKey {
	const message = error instanceof Error ? error.message.toLowerCase() : '';
	if (message.includes('nickname is already')) return 'nameTaken';
	if (message.includes('invalid nickname') || message.includes('invalid current password')) return 'invalidLogin';
	if (message.includes('confirmation code is invalid') || message.includes('reset grant is invalid'))
		return 'invalidCode';
	return 'error';
}

export function PasswordField({
	label,
	name,
	autoComplete,
	minLength,
	required = true,
}: {
	label: string;
	name: string;
	autoComplete: string;
	minLength?: number;
	required?: boolean;
}) {
	const { t } = useLocale();
	const [visible, setVisible] = useState(false);
	return (
		<label className="field">
			{label}
			<span className="password-field">
				<input
					name={name}
					type={visible ? 'text' : 'password'}
					autoComplete={autoComplete}
					minLength={minLength}
					maxLength={128}
					required={required}
				/>
				<button
					type="button"
					className="icon-button"
					aria-label={t(visible ? 'hidePassword' : 'showPassword')}
					onClick={() => setVisible(!visible)}
				>
					{visible ? <EyeOff size={17} /> : <Eye size={17} />}
				</button>
			</span>
			{minLength != null && <small>{t('passwordHint')}</small>}
		</label>
	);
}

function AuthFrame({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
	const { t, url } = useLocale();
	return (
		<main className="container account-page">
			<BackLink href={url()} label={t('home')} />
			<div className="account-frame">
				<div className="account-art" aria-hidden="true">
					<span className="account-art-title">한국어</span>
					<div className="account-image" />
				</div>
				<section className="account-card">
					<h1>{title}</h1>
					{body && <p className="account-copy">{body}</p>}
					{children}
				</section>
			</div>
		</main>
	);
}

export function AuthScreen({
	variant,
	returnTo,
	oauthError,
	reset,
}: {
	variant: 'login' | 'signup';
	returnTo?: string;
	oauthError?: boolean;
	reset?: boolean;
}) {
	const { t, url, locale } = useLocale();
	const router = useRouter();
	const { member, checking, reload } = useSession();
	const { mutate } = useApi();
	const [busy, setBusy] = useState(false);
	const [problem, setProblem] = useState<MessageKey | null>(oauthError ? 'oauthError' : null);
	const isSignup = variant === 'signup';
	const destination = safeReturnTo(returnTo ?? null, locale);
	const authQuery = '?returnTo=' + encodeURIComponent(destination);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const password = String(form.get('password') ?? '');
		if (isSignup && password !== String(form.get('confirm') ?? '')) {
			setProblem('passwordMismatch');
			return;
		}
		const input = {
			nickname: String(form.get('nickname') ?? '').trim(),
			password,
			...(isSignup ? { fullName: String(form.get('fullName') ?? '').trim() } : {}),
		};
		setBusy(true);
		setProblem(null);
		try {
			await mutate(isSignup ? SIGNUP : LOGIN, { input }, true);
			await reload();
			router.replace(destination);
		} catch (error) {
			setProblem(errorKey(error));
			setBusy(false);
		}
	}
	return (
		<AuthFrame title={t(isSignup ? 'signupTitle' : 'authTitle')} body={t(isSignup ? 'signupBody' : 'authBody')}>
			{member ? (
				<Link className="button primary stretch" href={destination}>
					{t('continue')}
					<ArrowRight size={17} />
				</Link>
			) : (
				<>
					<Feedback message={reset ? t('resetComplete') : undefined} success />
					<Feedback message={problem ? t(problem) : undefined} />
					<div className="provider-buttons">
						<a className="button secondary stretch" href={'/auth/google/start' + authQuery}>
							<span className="google-mark" aria-hidden="true">
								G
							</span>
							{t('google')}
						</a>
						<a className="button secondary stretch" href={'/auth/telegram/start' + authQuery}>
							<Send size={17} className="telegram-mark" />
							{t('telegram')}
						</a>
					</div>
					<div className="form-separator">
						<span>{t('or')}</span>
					</div>
					<form className="form-stack" method="post" onSubmit={(event) => void submit(event)}>
						{isSignup && (
							<label className="field">
								{t('name')}
								<input name="fullName" autoComplete="name" required maxLength={120} />
							</label>
						)}
						<label className="field">
							{t('nick')}
							<input
								name="nickname"
								autoComplete="username"
								required
								minLength={3}
								maxLength={32}
								autoCapitalize="none"
								spellCheck={false}
							/>
							{isSignup && <small>{t('nickHint')}</small>}
						</label>
						<PasswordField
							name="password"
							label={t('password')}
							autoComplete={isSignup ? 'new-password' : 'current-password'}
							minLength={isSignup ? 8 : undefined}
						/>
						{isSignup ? (
							<PasswordField name="confirm" label={t('confirmPassword')} autoComplete="new-password" />
						) : (
							<Link className="text-link forgot-link" href={url('/account/forgot-password' + authQuery)}>
								{t('forgot')}
							</Link>
						)}
						<button className="button primary stretch" disabled={checking || busy}>
							{t(busy ? 'loading' : isSignup ? 'signup' : 'login')}
							<ArrowRight size={17} />
						</button>
					</form>
					<p className="auth-switch">
						{t(isSignup ? 'haveAccount' : 'noAccount')}{' '}
						<Link className="text-link" href={url((isSignup ? '/account/login' : '/account/signup') + authQuery)}>
							{t(isSignup ? 'login' : 'signup')}
						</Link>
					</p>
				</>
			)}
		</AuthFrame>
	);
}

export function RecoverPassword({ returnTo }: { returnTo?: string }) {
	const { t, url, locale } = useLocale();
	const router = useRouter();
	const { mutate } = useApi();
	const [nickname, setNickname] = useState('');
	const [challenge, setChallenge] = useState('');
	const [grant, setGrant] = useState('');
	const [busy, setBusy] = useState(false);
	const [problem, setProblem] = useState<MessageKey | null>(null);
	const step = grant ? 'password' : challenge ? 'code' : 'nickname';
	const destination = safeReturnTo(returnTo ?? null, locale);
	const query = '?returnTo=' + encodeURIComponent(destination);
	async function run(work: () => Promise<void>) {
		setBusy(true);
		setProblem(null);
		try {
			await work();
		} catch (error) {
			setProblem(errorKey(error));
		} finally {
			setBusy(false);
		}
	}
	function requestCode(nextNickname: string) {
		return run(async () => {
			const data = await mutate<{ requestPasswordReset: string }>(
				REQUEST_PASSWORD_RESET,
				{ input: { nickname: nextNickname } },
				true,
			);
			setNickname(nextNickname);
			setChallenge(data.requestPasswordReset);
		});
	}
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (step === 'nickname') {
			void requestCode(String(form.get('nickname') ?? '').trim());
			return;
		}
		if (step === 'code') {
			void run(async () => {
				const data = await mutate<{ verifyPasswordResetOtp: string }>(
					VERIFY_RESET_OTP,
					{ input: { challengeId: challenge, code: form.get('code') } },
					true,
				);
				setGrant(data.verifyPasswordResetOtp);
			});
			return;
		}
		const password = form.get('password');
		if (password !== form.get('confirm')) {
			setProblem('passwordMismatch');
			return;
		}
		void run(async () => {
			await mutate(RESET_PASSWORD, { input: { challengeId: challenge, grant, password } }, true);
			router.replace(url('/account/login' + query + '&reset=1'));
		});
	}
	return (
		<AuthFrame title={t('recoverTitle')} body={t(step === 'code' ? 'gmailCodeBody' : 'recoverBody')}>
			<Feedback message={problem ? t(problem) : undefined} />
			<form key={step} className="form-stack" method="post" onSubmit={submit}>
				{step === 'nickname' && (
					<label className="field">
						{t('nick')}
						<input name="nickname" autoComplete="username" required minLength={3} maxLength={32} />
					</label>
				)}
				{step === 'code' && (
					<label className="field">
						{t('code')}
						<input
							name="code"
							autoComplete="one-time-code"
							inputMode="numeric"
							pattern="[0-9]{6}"
							required
							maxLength={6}
						/>
					</label>
				)}
				{step === 'password' && (
					<>
						<PasswordField name="password" label={t('newPassword')} autoComplete="new-password" minLength={8} />
						<PasswordField name="confirm" label={t('confirmPassword')} autoComplete="new-password" />
					</>
				)}
				<button className="button primary stretch" disabled={busy}>
					<KeyRound size={17} />
					{t(busy ? 'loading' : step === 'nickname' ? 'sendCode' : step === 'code' ? 'verify' : 'save')}
				</button>
				{step === 'code' && (
					<button
						type="button"
						className="button quiet stretch"
						disabled={busy}
						onClick={() => void requestCode(nickname)}
					>
						{t('resend')}
					</button>
				)}
			</form>
			<p className="auth-switch">
				<Link className="text-link" href={url('/account/login' + query)}>
					{t('login')}
				</Link>
			</p>
		</AuthFrame>
	);
}
