'use client'

import { WalletState } from 'core/controllers'
import { useCallback, useSyncExternalStore } from 'react'
import { useControllers } from './useControllers'

export interface UseWalletReturn extends WalletState {
	connect: () => Promise<void>
}

export const useWallet = (): UseWalletReturn => {
	const { wallet: walletController } = useControllers()

	const state = useSyncExternalStore(
		callback => walletController.subscribe(callback),
		() => walletController.state,
		() => walletController.state
	)

	return {
		...state,
		connect: useCallback(() => walletController.connect(), [walletController]),
	}
}
