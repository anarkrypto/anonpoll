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
};

export const truncateMiddle = (
  str: string,
  start: number,
  end: number,
  separator: string = "...",
) => {
  if (str.length <= start + end) {
    return str;
  }
  return `${str.slice(0, start)}${separator}${str.slice(-end)}`;
};

export const truncateWalletAddress = (address: string) => {
  return truncateMiddle(address, 7, 7);
};

/**
 * Ensures that the URL starts with http:// or https://.
 * @param url
 * @returns
 */
export const ensureHttpOrHttps = (url: string) => {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

/**
 * Gets the site URL based on environment variables or defaults to localhost.
 * @returns {string} The origin URL.
 */
export const getSiteUrl = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL || // Set this to your site URL in production env.
    process.env.NEXT_PUBLIC_VERCEL_URL || // Deploy URL automatically set by Vercel.
    "http://localhost:3000"; // Default to localhost.

  url = ensureHttpOrHttps(url);

  return new URL(url).origin;
};
