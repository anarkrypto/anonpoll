import { IPFSNode } from "./ipfs-node";
import { IPFSAPIServer } from "./api-server";

async function main() {
	const node = new IPFSNode();
	await node.start();

	const apiServer = new IPFSAPIServer(node);
	apiServer.start(process.env.PORT ? parseInt(process.env.PORT) : 5001);

	// Handle cleanup on shutdown
	process.on("SIGINT", async () => {
		await apiServer.stop();
		await node.stop();
		process.exit(0);
	});
}

main().catch(console.error);