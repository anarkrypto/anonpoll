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

export const truncateMiddle = (str: string, start: number, end: number, separator: string = "...") => {
  if (str.length <= start + end) {
    return str;
  }
  return `${str.slice(0, start)}${separator}${str.slice(-end)}`;
};

export const truncateWalletAddress = (address: string) => {
  return truncateMiddle(address, 7, 7);
};