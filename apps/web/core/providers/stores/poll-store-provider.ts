import { PollData } from "@/types/poll";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { PollStoreInterface } from "./poll-store-interface";

export class PollStoreProvider implements PollStoreInterface {
  constructor(private baseApiUrl: string) {}

  public async getById(pollId: number): Promise<PollData> {
    const url = new URL(this.baseApiUrl);
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

    const url = new URL(this.baseApiUrl);
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
