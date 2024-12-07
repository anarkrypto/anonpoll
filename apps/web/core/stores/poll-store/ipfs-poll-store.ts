import { PollData } from "@/types/poll";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { AbstractPollStore } from "./abstract-poll-store";
import { AbstractAuthStore } from "../auth-store/abstract-auth-store";
import { CID } from "multiformats/cid";

export class IpfsPollStore implements AbstractPollStore {
  constructor(
    private ipfsApiUrl: string,
    private authStore: AbstractAuthStore,
  ) {}

  public async get(cid: string) {
    const url = new URL(this.ipfsApiUrl);
    url.pathname = "/api/v0/block/get";
    url.searchParams.append("arg", cid);

    const authToken = await this.authStore.get();
    if (!authToken) {
      throw new Error("not authenticated");
    }

    const response = await fetch(url.toString(), {
      method: "POST", // The IPFS API uses POST for block/get
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        Message?: string;
        Code?: number;
        Type?: string;
      } | null;

      const errorMessage =
        errorData?.Message || "Failed to fetch poll data from IPFS";
      throw new Error(errorMessage);
    }

    const data = await response.text();
    return JSON.parse(data) as PollData;
  }

  public async put(data: z.infer<typeof pollInsertSchema>) {
    // Validate the data first
    pollInsertSchema.parse(data);

    const url = new URL(this.ipfsApiUrl);
    url.pathname = "/api/v0/block/put";

    const authToken = await this.authStore.get();
    if (!authToken) {
      throw new Error("not authenticated");
    }

    // Create form data with the JSON content
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    formData.append("file", jsonBlob);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        Message?: string;
        Code?: number;
        Type?: string;
      } | null;

      const errorMessage =
        errorData?.Message || "Failed to persist poll data to IPFS";
      throw new Error(errorMessage);
    }

    // The response includes the CID of the stored data
    const result = (await response.json()) as { Key: string; Size: number };

    // You might want to store or return the CID for future reference
    // For now, we'll just validate it's a valid CID
    try {
      CID.parse(result.Key);
      return { cid: result.Key };
    } catch (e) {
      throw new Error("Invalid CID received from IPFS");
    }
  }
}
