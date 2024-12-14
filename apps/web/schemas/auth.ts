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