import { PollProof, PollPublicOutput } from "chain/dist/runtime/modules/poll";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function mockProof(
  publicOutput: PollPublicOutput,
): Promise<PollProof> {
  const dummy = await PollProof.dummy([], [""], 2);
  return new PollProof({
    proof: dummy.proof,
    maxProofsVerified: 2,
    publicInput: undefined,
    publicOutput,
  });
}
