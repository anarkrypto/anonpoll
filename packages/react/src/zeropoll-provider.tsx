'use client';

import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { ZeroPoll, ZeroPollConfig } from '@zeropoll/core';
import { AuroWallet } from '@zeropoll/core/signers';

type ZeroPollContextValue = {
	zeroPoll: ZeroPoll;
	initialized: boolean;
};

const ZeroPollContext = createContext({} as ZeroPollContextValue);

export function ZeroPollProvider({
	children,
	tickInterval,
	protokitGraphqlUrl,
	ipfsApiUrl,
}: { children: React.ReactNode } & ZeroPollConfig) {
	const [initialized, setInitialized] = useState(false);

	const zeroPoll = useMemo(
		() => new ZeroPoll({ tickInterval, protokitGraphqlUrl, ipfsApiUrl }),
		[tickInterval, protokitGraphqlUrl, ipfsApiUrl]
	);

	const init = async () => {
		await zeroPoll.init();
		if (AuroWallet.isInstalled()) {
			const walletProvider = new AuroWallet();
			await zeroPoll.wallet.init(walletProvider);
		}
		setInitialized(true);
	};

	useEffect(() => {
		init();
	}, []);

	return (
		<ZeroPollContext.Provider value={{ zeroPoll, initialized }}>
			{children}
		</ZeroPollContext.Provider>
	);
}

export const useZeroPoll = () => {
	return useContext(ZeroPollContext);
};
