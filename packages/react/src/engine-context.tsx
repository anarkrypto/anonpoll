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

type EngineContextValue = {
	zeroPoll: ZeroPoll;
	initialized: boolean;
};

const EngineContext = createContext({} as EngineContextValue);

export function EngineProvider({
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
			await zeroPoll.context.wallet.init(walletProvider);
		}
		setInitialized(true);
	};

	useEffect(() => {
		init();
	}, []);

	return (
		<EngineContext.Provider value={{ zeroPoll, initialized }}>
			{children}
		</EngineContext.Provider>
	);
}

export const useZeroPoll = () => {
	return useContext(EngineContext);
};
