'use client';

import { WalletState } from '@zeropoll/core/controllers';
import { useCallback, useSyncExternalStore } from 'react';
import { useZeroPoll } from '../zeropoll-provider';

export interface UseWalletReturn extends WalletState {
	connect: () => Promise<void>;
}

export const useWallet = (): UseWalletReturn => {
	const { zeroPoll } = useZeroPoll();

	const state = useSyncExternalStore(
		callback => zeroPoll.wallet.subscribe(callback),
		() => zeroPoll.wallet.state,
		() => zeroPoll.wallet.state
	);

	return {
		...state,
		connect: useCallback(() => zeroPoll.wallet.connect(), [zeroPoll.wallet]),
	};
};
