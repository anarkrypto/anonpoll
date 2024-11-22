import { IPFSNode } from "./ipfs-node";
import { rm } from "fs/promises";
import { join } from "path";

describe("IPFSNode", () => {
	const testDir = join(process.cwd(), "ipfs-storage");
	let node: IPFSNode;
	let port: number;
	let API_URL: string;

	beforeEach(async () => {
		// Use random port for each test
		port = Math.floor(Math.random() * 10000) + 50000;
		process.env.PORT = port.toString();
		API_URL = `http://localhost:${port}`;

		node = new IPFSNode({ storagePath: testDir });
		await node.start();
	});

	afterEach(async () => {
		await node.stop();
		await rm(testDir, { recursive: true });
		delete process.env.PORT;
	});

	it("should store and retrieve a block", async () => {
		const testData = "test data";

		// Store block
		const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: testData })
		});
		const putResult = await putResponse.json();
		expect(putResult.Key).toBeDefined();

		// Retrieve block
		const getResponse = await fetch(
			`${API_URL}/api/v0/block/get?arg=${putResult.Key}`
		);
		const getResult = await getResponse.json();
		// Convert Buffer to string
		const data = Buffer.from(getResult.Data).toString();
		expect(data).toBe(testData);
	});

	it("should pin a block", async () => {
		// Store block first
		const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: "test data" })
		});
		const putResult = await putResponse.json();

		// Pin the block
		const pinResponse = await fetch(
			`${API_URL}/api/v0/pin/add?arg=${putResult.Key}`,
			{
				method: "POST"
			}
		);
		const pinResult = await pinResponse.json();

		expect(pinResult.Pins).toContain(putResult.Key);
	});

	it("should handle invalid requests", async () => {
		// Test missing data
		const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({})
		});
		expect(putResponse.status).toBe(400);

		// Test invalid CID
		const getResponse = await fetch(
			`${API_URL}/api/v0/block/get?arg=invalid-cid`
		);
		expect(getResponse.status).toBe(500);
	});
});
