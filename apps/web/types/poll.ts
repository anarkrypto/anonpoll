import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";

export type PollData = z.infer<typeof pollInsertSchema> & {
  creatorWallet: string;
  createdAt: Date;
}
