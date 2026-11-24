'use client';

import { useCallback } from 'react';
import { COMPLETE_MEDIA_UPLOAD, CREATE_MEDIA_UPLOAD } from '@/apollo/user/mutation';
import type { MediaAsset } from '@/libs/types/api';
import { useApi } from './use-api';

export function useMediaUpload() {
	const { mutate } = useApi();
	return useCallback(
		async (file: File, durationMs?: number) => {
			const contentType = file.type === 'audio/x-wav' ? 'audio/wav' : file.type;
			const { createMediaUpload: upload } = await mutate<{
				createMediaUpload: { id: string; uploadUrl: string; contentType: string };
			}>(CREATE_MEDIA_UPLOAD, { input: { contentType, sizeBytes: file.size, durationMs } });
			const response = await fetch(upload.uploadUrl, {
				method: 'PUT',
				headers: { 'content-type': upload.contentType },
				body: file,
			});
			if (!response.ok) throw new Error('Upload failed');
			const { completeMediaUpload } = await mutate<{ completeMediaUpload: MediaAsset }>(COMPLETE_MEDIA_UPLOAD, {
				id: upload.id,
			});
			return completeMediaUpload;
		},
		[mutate],
	);
}
