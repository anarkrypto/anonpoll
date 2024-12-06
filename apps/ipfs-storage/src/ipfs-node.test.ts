import { IPFSNode } from "./ipfs-node";
import { rm } from "fs/promises";
import { join } from "path";
import { CID } from "multiformats/cid";
import { DATASTORE_DIR } from "./config";

describe("IPFSNode", () => {
	const testDir = join(process.cwd(), DATASTORE_DIR);
	let node: IPFSNode;

	beforeEach(async () => {
		node = new IPFSNode({ storagePath: testDir });
		await node.start();
	});

	afterEach(async () => {
		await node.stop();
		await rm(testDir, { recursive: true });
	});

	it("should store and retrieve a block", async () => {
		const testData = new TextEncoder().encode("test data");

		// Store block
		const cid = await node.putBlock(testData);
		expect(cid).toBeInstanceOf(CID);

		// Retrieve block
		const block = await node.getBlock(cid);
		const retrievedData = new TextDecoder().decode(block.Data);
		expect(retrievedData).toBe("test data");
	});

	it("should pin a block", async () => {
		const testData = new TextEncoder().encode("test data");
		const cid = await node.putBlock(testData);

		// Pin the block
		await expect(node.pinBlock(cid)).resolves.not.toThrow();
	});
});
