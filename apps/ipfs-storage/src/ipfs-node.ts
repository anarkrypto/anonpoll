import { createLibp2p, Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import * as dagPB from "@ipld/dag-pb";
import { encode, decode } from "@ipld/dag-pb";
import { FSBlockstore } from "./fs-blockstore";
import { bootstrap } from "@libp2p/bootstrap";
import { identify } from "@libp2p/identify";
import { kadDHT, removePublicAddressesMapper } from "@libp2p/kad-dht";
import bootstrappers from "./bootstrappers";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import fs from "fs/promises";
import path from "path";
import { privateKeyFromProtobuf } from "@libp2p/crypto/keys";
import { createBitswap } from "@helia/bitswap";
import { libp2pRouting } from "@helia/routers";
import { defaultLogger } from "@libp2p/logger";
import type { Bitswap } from "@helia/bitswap";

export interface NodeOptions {
	storagePath?: string;
	port?: number;
}

export class IPFSNode {
	private libp2p: Libp2p | null;
	private blockstore: FSBlockstore | null;
	private bitswap: Bitswap | null;
	private storagePath: string;
	private port: number;
	private keyPath: string;

	constructor(options: NodeOptions = {}) {
		this.libp2p = null;
		this.blockstore = null;
		this.bitswap = null;
		this.storagePath = options.storagePath || "./.datastore";
		this.port = options.port || 4002;
		this.keyPath = path.join(this.storagePath, "peer-key");
	}

	private async loadOrCreatePrivateKey() {
		try {
			// Try to load existing key from storage
			const existingKeyData = await fs.readFile(this.keyPath);
			return privateKeyFromProtobuf(new Uint8Array(existingKeyData));
		} catch (error) {
			// If key doesn't exist or there's an error reading it, create a new one
			const peerId = await createEd25519PeerId();
			if (!peerId.privateKey) {
				throw new Error("Failed to generate private key");
			}
			await fs.mkdir(path.dirname(this.keyPath), { recursive: true });
			await fs.writeFile(this.keyPath, peerId.privateKey);
			return privateKeyFromProtobuf(peerId.privateKey);
		}
	}

	async start(): Promise<void> {
		this.blockstore = new FSBlockstore(this.storagePath);
		await this.blockstore.open();

		const privateKey = await this.loadOrCreatePrivateKey();

		this.libp2p = await createLibp2p({
			privateKey,
			addresses: {
				listen: [`/ip4/0.0.0.0/tcp/${this.port}`, `/ip6/::/tcp/${this.port}`]
			},
			transports: [tcp()],
			streamMuxers: [yamux()],
			connectionEncrypters: [noise()],
			services: {
				kadDHT: kadDHT({
					protocol: "/ipfs/kad/1.0.0",
					peerInfoMapper: removePublicAddressesMapper,
					clientMode: false
				}),
				identify: identify({
					protocolPrefix: "ipfs"
				})
			},
			peerDiscovery: [
				bootstrap({
					list: [...bootstrappers]
				})
			]
		});

		this.libp2p.addEventListener("peer:discovery", (evt) => {
			console.log("Discovered peer:", evt.detail.id.toString());
		});

		this.libp2p.addEventListener("peer:connect", (evt) => {
			console.log("Connected to peer:", evt.detail.toString());
		});

		await this.libp2p.start();

		console.log("libp2p node started");
		console.log(`Storage location: ${this.storagePath}`);
		console.log(`Listening on port: ${this.port}`);

		console.log("Node addresses:");
		this.libp2p.getMultiaddrs().forEach((addr) => {
			console.log(addr.toString());
		});

		if (this.libp2p && this.blockstore) {
			this.bitswap = createBitswap({
				libp2p: this.libp2p,
				blockstore: this.blockstore,
				routing: libp2pRouting(this.libp2p),
				logger: defaultLogger()
			});

			await this.bitswap.start();
			console.log("Bitswap started");
		}
	}

	async stop(): Promise<void> {
		if (this.bitswap) await this.bitswap.stop();
		if (this.libp2p) await this.libp2p.stop();
		if (this.blockstore) await this.blockstore.close();
	}

	async putBlock(data: Uint8Array): Promise<CID> {
		if (!this.blockstore) throw new Error("Blockstore not initialized");

		const dagNode = encode({
			Data: data,
			Links: []
		});

		const hash = await sha256.digest(dagNode);
		const cid = CID.createV1(dagPB.code, hash);

		await this.blockstore.put(cid, dagNode);
		return cid;
	}

	async getBlock(cid: CID): Promise<{ Data: Uint8Array; Links: any[] }> {
		if (!this.blockstore || !this.bitswap) {
			throw new Error("Node not fully initialized");
		}

		try {
			// First try to get from local blockstore
			const data = await this.blockstore.get(cid);
			const decoded = decode(data);
			return {
				Data: decoded.Data || new Uint8Array(),
				Links: decoded.Links
			};
		} catch (error) {
			// If not found locally, try to fetch from network
			console.log(
				`Block ${cid.toString()} not found locally, fetching from network...`
			);
			try {
				const abortController = new AbortController();
				const timeout = setTimeout(() => {
					abortController.abort();
				}, 15000);
				const block = await this.bitswap.want(cid, {
					signal: abortController.signal
				});
				clearTimeout(timeout);
				const decoded = decode(block);

				// Todo: validate poll by size and format

				// Store the fetched block locally
				await this.blockstore.put(cid, block);

				return {
					Data: decoded.Data || new Uint8Array(),
					Links: decoded.Links
				};
			} catch (error) {
				throw new Error(
					`Failed to fetch block from network: ${(error as Error).message}`
				);
			}
		}
	}

	async pinBlock(cid: CID): Promise<void> {
		if (!this.blockstore) throw new Error("Blockstore not initialized");
		await this.blockstore.pin(cid);
	}
}
