import { createLibp2p, Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import * as dagPB from "@ipld/dag-pb";
import { encode, decode } from "@ipld/dag-pb";
import { FSBlockstore } from "./fs-blockstore";
import { Server } from "http";

interface NodeOptions {
	storagePath?: string;
}

export class IPFSNode {
	private libp2p: Libp2p | null;
	private blockstore: FSBlockstore | null;
	private storagePath: string;
	private server: Server | null = null;

	constructor(options: NodeOptions = {}) {
		this.libp2p = null;
		this.blockstore = null;
		this.storagePath = options.storagePath || "./ipfs-storage";
	}

	async start(): Promise<void> {
		// Initialize blockstore
		this.blockstore = new FSBlockstore(this.storagePath);
		await this.blockstore.open();

		// Create and start libp2p node
		this.libp2p = await createLibp2p({
			addresses: {
				listen: ["/ip4/127.0.0.1/tcp/0"]
			},
			transports: [tcp()],
			streamMuxers: [yamux()],
			connectionEncrypters: [noise()]
		});

		await this.libp2p.start();
		console.log("libp2p node started");
		console.log(`Storage location: ${this.storagePath}`);

		// Start API server
		this.startAPIServer();
	}

	async stop(): Promise<void> {
		if (this.server) {
			await new Promise<void>((resolve) => {
				this.server?.close(() => resolve());
			});
			this.server = null;
		}
		if (this.libp2p) await this.libp2p.stop();
		if (this.blockstore) await this.blockstore.close();
	}

	private async putBlock(data: Uint8Array): Promise<CID> {
		if (!this.blockstore) throw new Error("Blockstore not initialized");

		// Create DAG-PB node
		const dagNode = encode({
			Data: data,
			Links: []
		});

		// Calculate CID (SHA2-256 with DAG-PB codec)
		const hash = await sha256.digest(dagNode);
		const cid = CID.createV1(dagPB.code, hash);

		// Store the block
		await this.blockstore.put(cid, dagNode);

		return cid;
	}

	private async getBlock(
		cid: CID
	): Promise<{ Data: Uint8Array; Links: any[] }> {
		if (!this.blockstore) throw new Error("Blockstore not initialized");

		const data = await this.blockstore.get(cid);
		const decoded = decode(data);
		return {
			Data: decoded.Data || new Uint8Array(),
			Links: decoded.Links
		};
	}

	private startAPIServer(): void {
		const app = express();
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());

		// Add block API
		app.post("/api/v0/block/put", async (req: Request, res: Response) => {
			try {
				if (!req.body.data) {
					return res.status(400).json({
						Message: "data is required",
						Code: 1,
						Type: "error"
					});
				}

				const data = Buffer.from(req.body.data);
				const cid = await this.putBlock(data);

				return res.status(200).json({
					Key: cid.toString(),
					Size: data.length
				});
			} catch (error) {
				return res.status(500).json({
					Message: error instanceof Error ? error.message : "Unknown error",
					Code: 1,
					Type: "error"
				}) as any;
			}
		});

		// Get block API
		app.get("/api/v0/block/get", async (req: Request, res: Response) => {
			try {
				const cidStr = req.query.arg as string;
				if (!cidStr) {
					return res.status(400).json({
						Message: 'argument "key" is required',
						Code: 1,
						Type: "error"
					});
				}

				const cid = CID.parse(cidStr);
				const block = await this.getBlock(cid);

				return res.json({
					Data: block.Data,
					Links: block.Links
				});
			} catch (error) {
				return res.status(500).json({
					Message: error instanceof Error ? error.message : "Unknown error",
					Code: 1,
					Type: "error"
				}) as any;
			}
		});

		// Pin API
		app.post("/api/v0/pin/add", async (req: Request, res: Response) => {
			try {
				const cidStr = req.query.arg as string;
				if (!cidStr) {
					return res.status(400).json({
						Message: 'argument "key" is required',
						Code: 1,
						Type: "error"
					});
				}

				if (!this.blockstore) throw new Error("Blockstore not initialized");

				const cid = CID.parse(cidStr);
				await this.blockstore.pin(cid);

				return res.json({
					Pins: [cidStr]
				});
			} catch (error) {
				return res.status(500).json({
					Message: error instanceof Error ? error.message : "Unknown error",
					Code: 1,
					Type: "error"
				}) as any;
			}
		});

		const PORT = process.env.PORT || 5001;
		this.server = app.listen(PORT, () => {
			console.log(`API server listening on port ${PORT}`);
		});

		// Ensure timers don't keep the process alive
		this.server.unref();

		this.server.on("error", (error) => {
			console.error("Server error:", error);
		});
	}
}
