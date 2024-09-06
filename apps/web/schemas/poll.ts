import { z } from "zod";
import { publicKeySchema } from "./auth";

export const pollInsertSchema = z.object({
  id: z.number(),
  title: z.string().min(3).max(128),
  description: z.string().max(1024).nullable().optional(),
  options: z.array(z.string().min(1).max(128)),
  votersWallets: z.array(publicKeySchema),
});
