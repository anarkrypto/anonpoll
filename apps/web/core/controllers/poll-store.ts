import { PollData } from "@/types/poll";
import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";

export interface PollStoreConfig extends BaseConfig {
  baseApiUrl: string;
}

export interface PollStoreState extends BaseState {}

export class PollStoreController extends BaseController<
  PollStoreConfig,
  PollStoreState
> {
  readonly defaultState: PollStoreState = {};

  public async getById(pollId: string): Promise<PollData> {
    const url = new URL(this.config.baseApiUrl);
    url.pathname = `/api/polls/${pollId}`;

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData && typeof errorData.message === "string"
          ? errorData.message
          : "Failed to fetch poll data";
      throw new Error(errorMessage);
    }

    return await response.json();
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
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData && typeof errorData.message === "string"
          ? errorData.message
          : "Failed to persist poll data";
      throw new Error(errorMessage);
    }
  }
}
