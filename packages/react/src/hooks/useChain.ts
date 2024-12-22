'use client';

import { ChainState } from '@zeropoll/core/controllers';
import { useSyncExternalStore } from 'react';
import { useZeroPoll } from 'src/zeropoll-provider';

export interface UseChainReturn extends ChainState {}

export const useChain = (): UseChainReturn => {
	const { zeroPoll } = useZeroPoll();

	const chainState = useSyncExternalStore(
		callback => zeroPoll.chain.subscribe(callback),
		() => zeroPoll.chain.state,
		() => zeroPoll.chain.state
	);

	return {
		...chainState,
	};
};
