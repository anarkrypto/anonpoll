import '../utils/custom-event-polyfill';
import { createLibp2p, Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { tls } from "@libp2p/tls";
import { yamux } from "@chainsafe/libp2p-yamux";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { FSBlockstore } from "./fs-blockstore";
import { bootstrap } from "@libp2p/bootstrap";
import { identify, identifyPush } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import bootstrappers from "../config/bootstrappers";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import fs from "fs/promises";
import path from "path";
import { privateKeyFromProtobuf } from "@libp2p/crypto/keys";
import { createBitswap } from "@helia/bitswap";
import { libp2pRouting } from "@helia/routers";
import { defaultLogger } from "@libp2p/logger";
import * as libp2pInfo from "libp2p/version";
import type { Bitswap } from "@helia/bitswap";
import { name, version } from "../config/version";
import { ping } from "@libp2p/ping";

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
			const existingKeyData = await fs.readFile(this.keyPath);
			return privateKeyFromProtobuf(new Uint8Array(existingKeyData));
		} catch (error) {
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

		const agentVersion = `${name}/${version} ${libp2pInfo.name}/${libp2pInfo.version} UserAgent=${process.version}`;

		this.libp2p = await createLibp2p({
			privateKey,
			addresses: {
				listen: [`/ip4/0.0.0.0/tcp/${this.port}`, `/ip6/::/tcp/${this.port}`]
			},
			transports: [tcp()],
			streamMuxers: [yamux()],
			connectionEncrypters: [noise(), tls()],
			services: {
				kadDHT: kadDHT(),
				identify: identify({
					protocolPrefix: "ipfs",
					agentVersion
				}),
				identifyPush: identifyPush({
					agentVersion
				}),
				ping: ping()
			},
			peerDiscovery: [
				bootstrap({
					list: bootstrappers
				})
			]
		});

		this.libp2p.addEventListener("peer:discovery", (evt) => {
			console.log("Discovered peer:", evt.detail.multiaddrs.toString());
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

		const hash = await sha256.digest(data);
		const rawCode = 0x55; // raw format code
		const cid = CID.createV1(rawCode, hash);

		await this.blockstore.put(cid, data);

		return cid;
	}

	async getBlock(cid: CID): Promise<{ Data: Uint8Array; Links: any[] }> {
		if (!this.blockstore || !this.bitswap) {
			throw new Error("Node not fully initialized");
		}

		const fetchBlock = async (
			fromNetwork: boolean = false
		): Promise<Uint8Array> => {
			if (fromNetwork) {
				console.log("Fetching from network:", cid.toString());
				const abortController = new AbortController();
				const timeout = setTimeout(() => abortController.abort(), 15000);

				try {
					const block = await this.bitswap!.want(cid, {
						signal: abortController.signal
					});
					clearTimeout(timeout);
					return block;
				} catch (error) {
					throw new Error(`Network fetch failed: ${(error as Error).message}`);
				}
			} else {
				return await this.blockstore!.get(cid);
			}
		};

		try {
			// Try local first, then network
			const data = await fetchBlock().catch(() => fetchBlock(true));

			return {
				Data: data,
				Links: []
			};
		} catch (error) {
			throw new Error(`Block retrieval failed: ${(error as Error).message}`);
		}
	}
}
