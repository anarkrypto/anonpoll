'use client';

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { PollState } from '@zeropoll/core/controllers';
import { useZeroPoll } from '../zeropoll-provider';

export interface UsePollReturn {
	data: Omit<PollState, 'loading'>;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

export interface UsePollOptions {
	encryptionKey?: string;
	onError?: (message: string) => void;
	onSuccess?: (result: { hash: string }) => void;
}

export const usePoll = (
	id: string,
	options?: UsePollOptions
): UsePollReturn => {
	const { zeroPoll, initialized } = useZeroPoll();
	const pollController = zeroPoll.context.poll;

	const [error, setError] = useState<string | null>(null);

	const pollState = useSyncExternalStore(
		callback => pollController.subscribe(callback),
		() => pollController.state,
		() => pollController.state
	);

	const loadPoll = useCallback(async () => {
		setError(null);
		try {
			await pollController.loadPoll(id, options?.encryptionKey);
			options?.onSuccess?.({ hash: id });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to load poll';
			setError(message);
			options?.onError?.(message);
		}
	}, [id, pollController]);

	useEffect(() => {
		if (initialized) loadPoll();
	}, [id, loadPoll, initialized]);

	return {
		data: {
			metadata: pollState.metadata,
			options: pollState.options,
			commitment: pollState.commitment,
		},
		isLoading: pollState.loading,
		isSuccess: !pollState.loading && !error,
		isError: !!error,
		error,
		refetch: loadPoll,
	};
};
