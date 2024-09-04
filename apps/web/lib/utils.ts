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
