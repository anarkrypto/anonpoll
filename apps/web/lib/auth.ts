import MinaClient from "mina-signer";
import { authSchema, publicKeySchema } from "@/schemas/auth";
import { z } from "zod";
import { getSiteUrl } from "./utils";
import { jwtVerify, JWTVerifyResult, SignJWT } from "jose";

/**
 * Generates a JSON-formatted authentication message to be signed by the Auro Wallet.
 * The message contains key details such as the action being performed, the origin of the request,
 * and the timestamp of issuance. This message will be displayed to the user in Auro Wallet
 * for approval during the sign-in process.
 *
 * For more information, refer to the Auro Wallet documentation:
 * https://docs.aurowallet.com/general/howto/sign-message#sign-json-message
 *
 * @param {string} originUri - The URI where the sign-in request originates from.
 * @param {number} issueAt - The UNIX timestamp representing the time the message was issued.
 *
 * @returns {Array<{ label: string; value: string }>} A structured array of objects containing labels and values
 *                                                   used to construct the sign-in message for Auro Wallet.
 */
export const generateAuthJsonMessage = (
  originUri: string,
  issueAt: number,
): { label: string; value: string }[] => {
  return [
    { label: "Label:", value: "Sign In" },
    {
      label: "Message:",
      value: "Click to confirm sign in",
    },
    {
      label: "URI:",
      value: originUri,
    },
    {
      label: "Issued At:",
      value: issueAt.toString(),
    },
  ];
};

/**
 * Verifies the authenticity of a Auro Wallet signature for a given authentication message.
 * This function uses the `MinaClient` to verify that the provided signature
 * corresponds to the reconstructed authentication message. It helps ensure that the message
 * was signed by the rightful owner of the provided public key.
 *
 * For further details, refer to the Auro Wallet documentation:
 * https://docs.aurowallet.com/general/howto/verifymessage-in-server-side
 *
 * @param {Object} params - The parameters for verification.
 * @param {string} params.publicKey - The public key associated with the signature.
 * @param {number} params.issuedAt - The UNIX timestamp when the message was issued.
 * @param {Object} params.signature - The signature to verify, containing field and scalar values.
 *
 * @returns {boolean} - Returns true if the signature is valid, false otherwise.
 */
export const verifyAuthSignature = ({
  publicKey,
  issuedAt,
  signature,
}: z.infer<typeof authSchema>): boolean => {
  const signerClient = new MinaClient({ network: "mainnet" });

  const siteUrl = getSiteUrl();

  // Reconstruct the auth message
  const message = generateAuthJsonMessage(siteUrl, issuedAt);

  const verifyResult = signerClient.verifyMessage({
    data: JSON.stringify(message),
    publicKey: publicKey,
    signature: {
      field: signature.field,
      scalar: signature.scalar,
    },
  });

  return verifyResult;
};

/**
 * Generates a JWT for authentication with the provided public key.
 *
 * @param {Object} params - The parameters for token generation.
 * @param {string} params.publicKey - The public key to include in the JWT payload.
 *
 * @returns {Promise<string>} - The generated JWT as a string.
 *
 * @throws {Error} - Throws an error if the `JWT_SECRET` environment variable is not defined.
 */
export const generateAuthJwtToken = async ({
  publicKey,
}: {
  publicKey: string;
}) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET env is not defined");
  }
  const secret = new TextEncoder().encode(jwtSecret);
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 1; // 1 day
  const token = await new SignJWT({ publicKey })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
  return token;
};

/**
 * Verifies the validity of a JWT token and extracts the payload.
 *
 * @param {string} token - The JWT token to be verified.
 *
 * @returns {Promise<Object>}
 * A promise that resolves to an object containing:
 * - `payload`: The decoded payload of the JWT if the token is valid; `null` if the token is invalid or expired.
 * - `success`: A boolean indicating whether the token was successfully verified.
 *
 * @throws {Error} - Throws an error if the `JWT_SECRET` environment variable is not defined.
 */
export const verifyAuthJwtToken = async (
  token: string,
): Promise<
  | {
      payload: JWTVerifyResult<{ publicKey: string }>["payload"];
      success: true;
    }
  | {
      payload: null;
      success: false;
    }
> => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET env is not defined");
  }
  const secret = new TextEncoder().encode(jwtSecret);

  try {
    const { payload } = await jwtVerify<{ publicKey: string }>(token, secret);
    publicKeySchema.parse(payload.publicKey);
    return { payload, success: true };
  } catch (error) {
    return { payload: null, success: false };
  }
};
