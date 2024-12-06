import { pollInsertSchema } from "@/schemas/poll";
import { PollData } from "@/types/poll";
import { z } from "zod";

export abstract class AbstractPollStore {
  abstract get(cid: string): Promise<PollData>;
  abstract put(data: z.infer<typeof pollInsertSchema>): Promise<void>;
}
