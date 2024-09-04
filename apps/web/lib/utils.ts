import { PollProof, PollPublicOutput } from "chain/dist/runtime/modules/poll";

export const mockProof = async (
  publicOutput: PollPublicOutput,
): Promise<PollProof> => {
  const dummy = await PollProof.dummy([], [""], 2);
  return new PollProof({
    proof: dummy.proof,
    maxProofsVerified: 2,
    publicInput: undefined,
    publicOutput,
  });
}

export const truncateWalletAddress = (address: string) => {
  return `${address.slice(0, 7)}...${address.slice(-7)}`;
};