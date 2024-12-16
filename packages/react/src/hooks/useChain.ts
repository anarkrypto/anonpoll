'use client'

import { ChainState } from 'core/controllers'
import { useSyncExternalStore } from 'react'
import { useControllers } from './useControllers'

export interface UseChainReturn extends ChainState {}

export const useChain = (): UseChainReturn => {
	const { chain: chanController } = useControllers()

	const chainState = useSyncExternalStore(
		callback => chanController.subscribe(callback),
		() => chanController.state,
		() => chanController.state
	)

	return {
		...chainState,
	}
}
