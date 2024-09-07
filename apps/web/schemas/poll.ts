import { z } from "zod";
import { publicKeySchema } from "./auth";

export const pollInsertSchema = z.object({
  id: z.number(),
  title: z.string().min(3).trim().max(128),
  description: z.string().max(1024).nullable().optional(),
  options: z.array(z.string().trim().min(1).max(128)).min(2).max(100),
  votersWallets: z.array(publicKeySchema).min(1).max(100),
});
