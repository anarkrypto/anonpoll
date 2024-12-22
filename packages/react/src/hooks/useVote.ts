'use client';

import { useState, useCallback, useEffect } from 'react';
import { useZeroPoll } from '../zeropoll-provider';

export interface UseVoteOptions {
	encryptionKey?: string;
	onError?: (message: string) => void;
	onSuccess?: (result: { hash: string }) => void;
}

export interface UseVoteReturn {
	vote: (optionHash: string) => Promise<void>;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: string | null;
	data: { hash: string } | null;
}

export const useVote = (
	pollId: string,
	options?: UseVoteOptions
): UseVoteReturn => {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<{ hash: string } | null>(null);
	const { zeroPoll } = useZeroPoll();
	const { initialized } = useZeroPoll();

	useEffect(() => {
		// Preload the poll
		if (initialized) {
			zeroPoll.poll.loadPoll(pollId, options?.encryptionKey);
		}
	}, [pollId, zeroPoll, initialized]);

	const vote = useCallback(
		async (optionHash: string) => {
			setIsPending(true);
			setError(null);
			setData(null);
			try {
				const result = await zeroPoll.poll.vote(optionHash);
				setData(result);
				options?.onSuccess?.(result);
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Unknown error';
				setError(message);
				options?.onError?.(message);
			} finally {
				setIsPending(false);
			}
		},
		[zeroPoll, options]
	);

	return {
		vote,
		isPending,
		isSuccess: !isPending && !error && !!data,
		isError: !!error,
		error,
		data,
	};
};
