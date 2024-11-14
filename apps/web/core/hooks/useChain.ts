import { ChainState } from "../controllers/chain-controller";
import { useZeroPollContext } from "../context-provider";

export const useChain = (): ChainState => {
  return useZeroPollContext().chainState;
};