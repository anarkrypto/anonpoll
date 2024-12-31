'use client';

import { useState, useCallback, useMemo } from 'react';
import { MetadataEncryptionV1 } from '@zeropoll/core/utils';
import { useZeroPoll } from '../zeropoll-provider';
import { PollMetadata } from '@zeropoll/core/schemas';

export interface CreatePollResult {
	id: string;
	hash: string;
	encryptionKey: string;
}

export interface UseCreatePollOptions {
	onError?: (message: string) => void;
	onSuccess?: (result: CreatePollResult) => void;
}

export interface UseCreatePollReturn {
	createPoll: (data: PollMetadata) => Promise<void>;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: string | null;
	data: CreatePollResult | null;
}

export const useCreatePoll = (
	options: UseCreatePollOptions = {}
): UseCreatePollReturn => {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<CreatePollResult | null>(null);
	const { zeroPoll } = useZeroPoll();

	const encryptionKey = useMemo(() => MetadataEncryptionV1.generateKey(), []);

	const createPoll = useCallback(
		async (pollData: PollMetadata) => {
			setIsPending(true);
			setError(null);
			setData(null);
			try {
				const result = await zeroPoll.pollManager.create(
					pollData,
					encryptionKey
				);
				setData({ ...result, encryptionKey });
				options.onSuccess?.({ ...result, encryptionKey });
			} catch (error) {
				const message =
					error instanceof Object &&
					'message' in error &&
					typeof error.message === 'string'
						? error.message
						: 'Unknown error';
				setError(message);
				options.onError?.(message);
				console.error({ error });
				throw new Error(message);
			} finally {
				setIsPending(false);
			}
		},
		[zeroPoll.pollManager, options]
	);

	return {
		createPoll,
		isPending,
		isSuccess: !isPending && !error && !!data,
		isError: !!error,
		error,
		data,
	};
};
