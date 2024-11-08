import { PollData } from "@/types/poll";
import { PollStoreInterface } from "./poll-store-interface";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";

export class InMemoryPollStore implements PollStoreInterface {
  private polls: Map<number, PollData>;

  constructor(private publicKey: string) {
    this.polls = new Map<number, PollData>();
  }

  async getById(pollId: number): Promise<PollData> {
    const poll = this.polls.get(pollId);

    if (!poll) {
      throw new Error(`Poll with id ${pollId} not found`);
    }

    return poll;
  }

  async persist(data: z.infer<typeof pollInsertSchema>): Promise<void> {
    try {
      // Validate the data using the schema
      pollInsertSchema.parse(data);

      // Create the poll data structure
      const pollData: PollData = {
        ...data,
        createdAt: new Date(),
        creatorWallet: this.publicKey,
      };

      // Store in the Map
      this.polls.set(data.id, pollData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid poll data: ${error.message}`);
      }
      throw error;
    }
  }
}
