import { PollData } from "@/types/poll";
import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";

export interface PollStoreConfig extends BaseConfig {
  baseApiUrl: string;
}

export interface PollStoreState extends BaseState {}

export class PollStoreController
  extends BaseController<PollStoreConfig, PollStoreState>
  implements PollStoreInterface
{
  readonly defaultState: PollStoreState = {};

  public async getById(pollId: number): Promise<PollData> {
    const url = new URL(this.config.baseApiUrl);
    url.pathname = `/api/polls/${pollId}`;

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        message: string;
      } | null;
      const errorMessage =
        errorData && typeof errorData.message === "string"
          ? errorData.message
          : "Failed to fetch poll data";
      throw new Error(errorMessage);
    }

    return (await response.json()) as PollData;
  }

  public async persist(data: z.infer<typeof pollInsertSchema>) {
    pollInsertSchema.parse(data);

    const url = new URL(this.config.baseApiUrl);
    url.pathname = "/api/polls";

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        message: string;
      } | null;
      const errorMessage =
        errorData && typeof errorData.message === "string"
          ? errorData.message
          : "Failed to persist poll data";
      throw new Error(errorMessage);
    }
  }
}

export interface PollStoreInterface {
  getById(pollId: number): Promise<PollData>;
  persist(data: z.infer<typeof pollInsertSchema>): Promise<void>;
}

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
