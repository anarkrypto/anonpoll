import { AbstractMetadataStore } from './abstract-metadata-store'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import * as raw from 'multiformats/codecs/raw'

export class InMemoryMetadataStore<
	Data = Record<string, any>,
> extends AbstractMetadataStore<Data> {
	private metadatas: Map<string, Data> = new Map()

	async get(key: string): Promise<Data> {
		const data = this.metadatas.get(key)
		if (!data) {
			throw new Error(`Content for key ${key} not found`)
		}
		return data
	}

	async put(data: Data): Promise<{ key: string }> {
		const key = await this.generateKey(data)

		this.metadatas.set(key.toString(), data)

		return { key: key.toString() }
	}

	private async generateKey(data: Data): Promise<string> {
		const hash = await sha256.digest(
			new TextEncoder().encode(JSON.stringify(data))
		)
		return CID.createV1(raw.code, hash).toString()
	}
}
