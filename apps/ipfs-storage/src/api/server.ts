import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import { CID } from "multiformats/cid";
import { Server } from "http";
import { IPFSNode } from "../ipfs/node";
import multer from "multer";
import { FILESIZE_LIMIT } from "../config/config";

export class IPFSAPIServer {
	private server: Server | null = null;
	private node: IPFSNode;

	constructor(node: IPFSNode) {
		this.node = node;
	}

	start(port: number = 5001): void {
		const app = express();
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());

		this.setupRoutes(app);

		this.server = app.listen(port, () => {
			console.log(`API server listening on port ${port}`);
		});

		this.server.unref();
		this.server.on("error", (error) => {
			console.error("Server error:", error);
		});
	}

	async stop(): Promise<void> {
		if (this.server) {
			await new Promise<void>((resolve) => {
				this.server?.close(() => resolve());
			});
			this.server = null;
		}
	}

	private setupRoutes(app: express.Application): void {
		this.setupBlockPutRoute(app);
		this.setupBlockGetRoute(app);
	}

	private setupBlockPutRoute(app: express.Application): void {
		const upload = multer({
			storage: multer.memoryStorage(),
			limits: {
				fileSize: FILESIZE_LIMIT
			}
		});

		app.post("/api/v0/block/put", upload.single("file"), async (req, res) => {
			try {
				if (!req.file) {
					return res.status(400).json({
						Message: "file is required",
						Code: 1,
						Type: "error"
					});
				}

				const cid = await this.node.putBlock(req.file.buffer);

				return res.status(200).json({
					Key: cid.toString(),
					Size: req.file.buffer.length
				});
			} catch (error) {
				return res.status(500).json({
					Message: error instanceof Error ? error.message : "Unknown error",
					Code: 1,
					Type: "error"
				}) as any;
			}
		});
	}

	private setupBlockGetRoute(app: express.Application): void {
		app.post("/api/v0/block/get", async (req: Request, res: Response) => {
			try {
				const cidStr = req.query.arg as string;
				if (!cidStr) {
					return res.status(400).json({
						Message: 'argument "arg" is required',
						Code: 1,
						Type: "error"
					}) as any;
				}

				const cid = CID.parse(cidStr);
				const block = await this.node.getBlock(cid);

				const decoder = new TextDecoder();
				const data = decoder.decode(block.Data);
				res.setHeader("Content-Type", "text/plain");
				return res.send(data);
			} catch (error) {
				return this.handleError(res, error);
			}
		});
	}

	private handleError(res: Response, error: unknown): Response {
		return res.status(500).json({
			Message: error instanceof Error ? error.message : "Unknown error",
			Code: 1,
			Type: "error"
		});
	}
}
