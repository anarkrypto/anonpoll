import { PublicKey } from "o1js";
import { z } from "zod";

export const publicKeySchema = z.string().refine(
  (value) => {
    try {
      PublicKey.fromBase58(value);
      return true;
    } catch (error) {
      return false;
    }
  },
  {
    message: "Must be a valid public key",
  },
);

export const signatureHexSchema = z
  .string()
  .regex(/^[0-9a-fA-F]+$/, "Must be a valid hex string")

export const signatureSchema = z.object({
  field: signatureHexSchema,
  scalar: signatureHexSchema,
});

export const authSchema = z.object({
  publicKey: publicKeySchema,
  signature: signatureSchema,
  issuedAt: z.number(),
});
