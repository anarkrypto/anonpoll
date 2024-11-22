import { IPFSNode } from "./ipfs-node";

const node = new IPFSNode({
	storagePath: process.env.IPFS_STORAGE_PATH || "./ipfs-storage"
});

node.start().catch(console.error);

process.on("SIGINT", async () => {
	await node.stop();
	process.exit(0);
});

export default IPFSNode;
