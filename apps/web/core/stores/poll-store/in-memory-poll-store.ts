import { AbstractPollStore } from "./abstract-poll-store";
import { pollInsertSchema } from "@/schemas/poll";
import { PollData } from "@/types/poll";
import { z } from "zod";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import * as raw from "multiformats/codecs/raw";

export class InMemoryPollStore extends AbstractPollStore {
  private polls: Map<string, PollData> = new Map();
  private publicKey: string;

  constructor(publicKey: string) {
    super();
    this.publicKey = publicKey;
  }

  async get(cid: string): Promise<PollData> {
    const poll = this.polls.get(cid);
    if (!poll) {
      throw new Error(`Poll with id ${cid} not found`);
    }
    return poll;
  }

  async put(data: z.infer<typeof pollInsertSchema>): Promise<{ cid: string }> {
    try {
      // Validate the data using the schema
      pollInsertSchema.parse(data);

      // Create the poll data structure
      const pollData: PollData = {
        ...data,
        createdAt: new Date(),
        creatorWallet: this.publicKey,
      };

      // Generate CID
      const hash = await sha256.digest(new TextEncoder().encode(JSON.stringify(pollData)));
      const cid = CID.createV1(raw.code, hash);

      // Store in the Map
      this.polls.set(cid.toString(), pollData);

      return { cid: cid.toString() };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid poll data: ${error.message}`);
      }
      throw error;
    }
  }
}