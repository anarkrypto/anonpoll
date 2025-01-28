'use client';

import { WalletState } from '@zeropoll/core/controllers';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useZeroPoll } from '../zeropoll-provider';
import { AuroWallet } from '@zeropoll/core/signers';

export interface UseWalletReturn extends WalletState {
	connect: () => Promise<void>;
	isInstalled: boolean;
}

export const useWallet = (): UseWalletReturn => {
	const { zeroPoll } = useZeroPoll();
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		setIsInstalled(AuroWallet.isInstalled());
	}, []);

	const state = useSyncExternalStore(
		callback => zeroPoll.wallet.subscribe(callback),
		() => zeroPoll.wallet.state,
		() => zeroPoll.wallet.state
	);

	return {
		...state,
		isInstalled,
		connect: useCallback(() => zeroPoll.wallet.connect(), [zeroPoll.wallet]),
	};
};
