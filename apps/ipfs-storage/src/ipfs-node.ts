import { createLibp2p, Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import * as dagPB from "@ipld/dag-pb";
import { encode, decode } from "@ipld/dag-pb";
import { FSBlockstore } from "./fs-blockstore";

export interface NodeOptions {
    storagePath?: string;
}

export class IPFSNode {// main.ts

    private libp2p: Libp2p | null;
    private blockstore: FSBlockstore | null;
    private storagePath: string;

    constructor(options: NodeOptions = {}) {
        this.libp2p = null;
        this.blockstore = null;
        this.storagePath = options.storagePath || "./ipfs-storage";
    }

    async start(): Promise<void> {
        this.blockstore = new FSBlockstore(this.storagePath);
        await this.blockstore.open();

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
    }

    async stop(): Promise<void> {
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
        if (!this.blockstore) throw new Error("Blockstore not initialized");

        const data = await this.blockstore.get(cid);
        const decoded = decode(data);
        return {
            Data: decoded.Data || new Uint8Array(),
            Links: decoded.Links
        };
    }

    async pinBlock(cid: CID): Promise<void> {
        if (!this.blockstore) throw new Error("Blockstore not initialized");
        await this.blockstore.pin(cid);
    }
}