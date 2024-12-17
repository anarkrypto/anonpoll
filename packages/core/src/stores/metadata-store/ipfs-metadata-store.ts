import { CID } from 'multiformats/cid';
import { AbstractMetadataStore } from './abstract-metadata-store';

/**
 * An IPFS-based metadata store compatible with Kubo's API
 */
export class IpfsMetadataStore<Data = Record<string, any>>
	implements AbstractMetadataStore<Data>
{
	constructor(private ipfsApiUrl: string) {}

	public async get(cid: string): Promise<Data> {
		if (!IpfsMetadataStore.isCID(cid)) {
			throw new Error('Invalid CID received from IPFS');
		}

		const url = new URL(this.ipfsApiUrl);
		url.pathname = '/api/v0/block/get';
		url.searchParams.append('arg', cid);

		const response = await fetch(url.toString(), {
			method: 'POST', // The IPFS API uses POST for block/get
		});

		if (!response.ok) {
			const errorData = (await response.json().catch(() => null)) as {
				Message?: string;
				Code?: number;
				Type?: string;
			} | null;

			const errorMessage =
				errorData?.Message || 'Failed to fetch data from IPFS';
			throw new Error(errorMessage);
		}

		const data = await response.text();
		return JSON.parse(data);
	}

	public async put(data: Data): Promise<{ key: string }> {
		const url = new URL(this.ipfsApiUrl);
		url.pathname = '/api/v0/block/put';

		const formData = this.createFormData(data);

		const response = await fetch(url.toString(), {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const errorData = (await response.json().catch(() => null)) as {
				Message?: string;
				Code?: number;
				Type?: string;
			} | null;

			const errorMessage =
				errorData?.Message || 'Failed to persist data data to IPFS';
			throw new Error(errorMessage);
		}

		const result = (await response.json()) as { Key: string; Size: number };

		if (!IpfsMetadataStore.isCID(result.Key)) {
			throw new Error('Invalid CID received from IPFS');
		}
		return { key: result.Key };
	}

	private createFormData(data: Data): FormData {
		// Create form data with the JSON content (IPFS API expects a file)
		const formData = new FormData();
		const content = JSON.stringify(data, null, 2);
		const blob = new Blob([content], {
			type: 'application/json',
		});
		formData.append('file', blob);
		return formData;
	}

	static isCID = (value: string): boolean => {
		try {
			CID.parse(value);
			return true;
		} catch {
			return false;
		}
	};
}
