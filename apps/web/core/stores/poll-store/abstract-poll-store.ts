import { pollInsertSchema } from "@/schemas/poll";
import { PollData } from "@/types/poll";
import { z } from "zod";

export abstract class AbstractPollStore {
  abstract getById(pollId: number): Promise<PollData>;
  abstract persist(data: z.infer<typeof pollInsertSchema>): Promise<void>;
}
