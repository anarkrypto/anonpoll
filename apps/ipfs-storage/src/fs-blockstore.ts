import { mkdir, writeFile, readFile, access } from "fs/promises";
import { join } from "path";
import { constants } from "fs";
import { BaseBlockstore } from "blockstore-core";
import { CID } from "multiformats";

interface PinItem {
	cid: CID;
	timestamp: number;
}

export class FSBlockstore extends BaseBlockstore {
	private path: string;
	private pins: Map<string, PinItem>;

	constructor(path: string) {
		super();
		this.path = path;
		this.pins = new Map();
	}

	async open(): Promise<void> {
		await mkdir(this.path, { recursive: true });
	}

	async put(key: CID, val: Uint8Array): Promise<CID> {
		const cid = CID.asCID(key);
		if (cid == null) {
			throw new Error("Invalid CID");
		}
		const path = join(this.path, cid.toString());
		await writeFile(path, val);
		return cid;
	}

	async get(key: CID): Promise<Uint8Array> {
		const cid = CID.asCID(key);
		if (cid == null) {
			throw new Error("Invalid CID");
		}
		const path = join(this.path, cid.toString());
		return readFile(path);
	}

	async has(key: CID): Promise<boolean> {
		const cid = CID.asCID(key);
		if (cid == null) {
			throw new Error("Invalid CID");
		}
		try {
			await access(join(this.path, cid.toString()), constants.F_OK);
			return true;
		} catch {
			return false;
		}
	}

	async pin(cid: CID): Promise<void> {
		if (!(await this.has(cid))) {
			throw new Error("Cannot pin - block not found");
		}
		this.pins.set(cid.toString(), {
			cid,
			timestamp: Date.now()
		});
	}

	isPinned(cid: CID): boolean {
		return this.pins.has(cid.toString());
	}

	async close(): Promise<void> {
		// Nothing to do for fs
	}
}
