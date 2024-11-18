import { PollData } from "@/types/poll";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { AbstractPollStore } from "./abstract-poll-store";
import { AbstractAuthStore } from "../auth-store/abstract-auth-store";

export class PollStore implements AbstractPollStore {
  constructor(
    private baseApiUrl: string,
    private authStore: AbstractAuthStore,
  ) {}

  public async getById(pollId: number): Promise<PollData> {
    const url = new URL(this.baseApiUrl);
    url.pathname = `/api/polls/${pollId}`;

    const authToken = await this.authStore.get();

    if (!authToken) {
      throw new Error("not authenticated");
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

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

    const url = new URL(this.baseApiUrl);
    url.pathname = "/api/polls";

    const authToken = await this.authStore.get();

    if (!authToken) {
      throw new Error("not authenticated");
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
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
