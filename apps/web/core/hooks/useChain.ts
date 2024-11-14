import { ChainState } from "../controllers/chain-controller";
import { useZeroPollContext } from "../context-provider";

export interface UseChainReturn extends ChainState {}

export const useChain = (): UseChainReturn => {
  return useZeroPollContext().chainState;
};