import MinaClient from 'mina-signer';
import { MinaSignerAbstract } from './base-signer';
import { Nullifier } from 'o1js';

export class Wallet implements MinaSignerAbstract {
	#privateKey: string;
	client: MinaClient;

	constructor(privateKey: string) {
		this.#privateKey = privateKey;
		this.client = new MinaClient({ network: 'mainnet' });
	}

	async requestAccount(): Promise<string> {
		return this.client.derivePublicKey(this.#privateKey);
	}

	async getAccount(): Promise<string> {
		return this.requestAccount();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public on(event: 'accountsChanged', handler: (event: any) => void): void {
		// Not implemented
	}

	public async createNullifier({ message }: { message: number[] }) {
		const jsonNullifier = await this.client.createNullifier(
			message.map(m => BigInt(m)),
			this.#privateKey
		);
		return Nullifier.fromJSON(jsonNullifier);
	}

	public async signJsonMessage({
		message,
	}: {
		message: { label: string; value: string }[];
	}) {
		const signature = await this.client.signMessage(
			JSON.stringify(message),
			this.#privateKey
		);

		return {
			data: signature.data,
			publicKey: signature.publicKey,
			signature: {
				field: signature.signature.field,
				scalar: signature.signature.scalar,
			},
		};
	}
}
