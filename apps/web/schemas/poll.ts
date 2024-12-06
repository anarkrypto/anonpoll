import { z } from "zod";
import { publicKeySchema } from "./auth";
import { MAX_POLL_OPTIONS, MAX_POLL_VOTERS } from "@/core/constants";

export const pollInsertSchema = z.object({
  title: z.string().min(3).trim().max(128),
  description: z.string().max(1024).nullable().optional(),
  options: z.array(z.string().trim().min(1).max(128)).min(2).max(MAX_POLL_OPTIONS),
  salt: z.string().min(1).max(128),
  votersWallets: z.array(publicKeySchema).min(1).max(MAX_POLL_VOTERS),
});
