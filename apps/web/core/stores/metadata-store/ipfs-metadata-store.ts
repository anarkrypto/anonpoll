import { AbstractMetadataStore } from "./abstract-metadata-store";
import { AbstractAuthStore } from "../auth-store/abstract-auth-store";
import { CID } from "multiformats/cid";
import { isCID } from "@/core/utils/cid";

/**
 * An IPFS-based metadata store compatible with Kubo's API
 */
export class IpfsMetadataStore<Data = Record<string, any>>
  implements AbstractMetadataStore<Data>
{
  constructor(
    private ipfsApiUrl: string,
    private authStore: AbstractAuthStore,
  ) {}

  public async get(cid: string): Promise<Data> {
    if (!isCID(cid)) {
      throw new Error("Invalid CID received from IPFS");
    }

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
        errorData?.Message || "Failed to fetch data from IPFS";
      throw new Error(errorMessage);
    }

    const data = await response.text();
    return JSON.parse(data);
  }

  public async put(data: Data): Promise<{ key: string }> {
    const url = new URL(this.ipfsApiUrl);
    url.pathname = "/api/v0/block/put";

    const authToken = await this.authStore.get();
    if (!authToken) {
      throw new Error("not authenticated");
    }

    const formData = this.createFormData(data);

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
        errorData?.Message || "Failed to persist data data to IPFS";
      throw new Error(errorMessage);
    }

    const result = (await response.json()) as { Key: string; Size: number };

    if (!isCID(result.Key)) {
      throw new Error("Invalid CID received from IPFS");
    }
    return { key: result.Key };
  }

  private createFormData(data: Data): FormData {
    // Create form data with the JSON content (IPFS API expects a file)
    const formData = new FormData();
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], {
      type: "application/json",
    });
    formData.append("file", blob);
    return formData;
  }
}
