'use client';

import { useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import { AudioLines, Pause, Play, RotateCcw } from 'lucide-react';
import { PLAY_ATTEMPT_AUDIO, SAVE_ATTEMPT_AUDIO } from '@/apollo/user/mutation';
import { useApi } from '@/libs/hooks/use-api';
import { useLocale } from '@/libs/i18n/context';
import type { AudioPlay, QuestionGroup } from '@/libs/types/api';
import { Feedback } from '@/libs/components/common/ui';

export interface AudioHandle {
	stop: () => Promise<void>;
}

export function AudioControl({
	attemptId,
	group,
	ref,
}: {
	attemptId: string;
	group: QuestionGroup;
	ref: Ref<AudioHandle>;
}) {
	const { t } = useLocale();
	const { mutate } = useApi();
	const player = useRef<HTMLAudioElement | null>(null);
	const playback = useRef<AudioPlay | null>(null);
	const lastSave = useRef(0);
	const done = useRef(false);
	const [playing, setPlaying] = useState(false);
	const [busy, setBusy] = useState(false);
	const [fault, setFault] = useState(false);
	const [plays, setPlays] = useState(group.plays);
	const [ended, setEnded] = useState(
		group.audioMaxPlays !== null &&
			group.plays >= group.audioMaxPlays &&
			group.audioEndMs !== null &&
			group.positionMs >= group.audioEndMs,
	);

	async function persist(finished = false) {
		const element = player.current;
		const active = playback.current;
		if (!element || !active || !Number.isFinite(element.currentTime)) return;
		const positionMs = Math.round(
			Math.max(active.startMs, Math.min(element.currentTime * 1000, active.endMs ?? Infinity)),
		);
		await mutate(SAVE_ATTEMPT_AUDIO, {
			input: { attemptId, groupId: group.id, playbackId: active.playbackId, positionMs, finished },
		}).catch(() => {});
	}
	useImperativeHandle(ref, () => ({
		stop: async () => {
			player.current?.pause();
			await persist(done.current);
		},
	}));

	async function play(replay = false) {
		const element = player.current;
		if (!element || busy) return;
		setBusy(true);
		setFault(false);
		try {
			const known = playback.current;
			if (known && !replay && !done.current && element.currentSrc) {
				await element.play();
				return;
			}
			const { playAttemptAudio } = await mutate<{ playAttemptAudio: AudioPlay }>(PLAY_ATTEMPT_AUDIO, {
				input: { attemptId, groupId: group.id, replay },
			});
			playback.current = playAttemptAudio;
			done.current = false;
			setEnded(false);
			setPlays(playAttemptAudio.plays);
			element.src = playAttemptAudio.url;
			element.currentTime = playAttemptAudio.positionMs / 1000;
			await element.play();
		} catch {
			setFault(true);
		} finally {
			setBusy(false);
		}
	}
	function finish() {
		if (done.current) return;
		done.current = true;
		setEnded(true);
		setPlaying(false);
		player.current?.pause();
		void persist(true);
	}
	function timeUpdate() {
		const element = player.current;
		if (!element) return;
		const end = playback.current?.endMs;
		if (end != null && element.currentTime * 1000 >= end) {
			finish();
			return;
		}
		if (element.currentTime - lastSave.current >= 3) {
			lastSave.current = element.currentTime;
			void persist();
		}
	}
	const canReplay = group.audioMaxPlays === null || plays < group.audioMaxPlays;
	return (
		<div className="audio-control">
			<audio
				ref={player}
				preload="metadata"
				onPlay={() => setPlaying(true)}
				onPause={() => {
					setPlaying(false);
					if (!done.current) void persist();
				}}
				onError={() => setFault(true)}
				onTimeUpdate={timeUpdate}
				onEnded={finish}
			/>
			<div className="inline-actions">
				<AudioLines size={20} />
				<button
					className="button primary small"
					disabled={busy || (ended && !canReplay)}
					onClick={() => {
						if (playing) player.current?.pause();
						else void play(ended);
					}}
				>
					{playing ? <Pause size={15} /> : <Play size={15} />}
					{t(playing ? 'stopAudio' : ended ? 'replay' : 'play')}
				</button>
				{plays > 0 && !ended && (
					<button
						className="icon-button"
						disabled={!canReplay || busy}
						onClick={() => void play(true)}
						title={t('replay')}
						aria-label={t('replay')}
					>
						<RotateCcw size={16} />
					</button>
				)}
				<span className="caption">
					{t('plays')} {plays}
					{group.audioMaxPlays !== null ? ' / ' + group.audioMaxPlays : ''}
				</span>
			</div>
			<Feedback message={fault ? t('audioError') : undefined} />
		</div>
	);
}
