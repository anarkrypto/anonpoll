import { pollInsertSchema } from "@/schemas/poll";
import { PollData } from "@/types/poll";
import { z } from "zod";

export interface PollStoreInterface {
  getById(pollId: number): Promise<PollData>;
  persist(data: z.infer<typeof pollInsertSchema>): Promise<void>;
}
