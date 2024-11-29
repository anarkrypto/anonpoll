import { IPFSNode } from "./ipfs-node";
import { IPFSAPIServer } from "./api-server";
import { rm } from "fs/promises";
import { join } from "path";

describe("IPFSAPIServer", () => {
	const testDir = join(process.cwd(), "ipfs-storage");
	let node: IPFSNode;
	let server: IPFSAPIServer;
	let port: number;
	let API_URL: string;

	beforeEach(async () => {
		// Use random port for each test
		port = Math.floor(Math.random() * 10000) + 50000;
		API_URL = `http://localhost:${port}`;

		node = new IPFSNode({ storagePath: testDir });
		await node.start();

		server = new IPFSAPIServer(node);
		server.start(port);
	});

	afterEach(async () => {
		await server.stop();
		await node.stop();
		await rm(testDir, { recursive: true });
	});

	it("should handle block put and get via API", async () => {
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
		const data = Buffer.from(getResult.Data).toString();
		expect(data).toBe(testData);
	});

	it("should handle block pinning via API", async () => {
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

	describe("API error handling", () => {
		it("should handle missing data in block put", async () => {
			const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({})
			});
			expect(putResponse.status).toBe(400);
			const error = await putResponse.json();
			expect(error.Message).toBe("data is required");
		});

		it("should handle invalid CID in block get", async () => {
			const getResponse = await fetch(
				`${API_URL}/api/v0/block/get?arg=invalid-cid`
			);
			expect(getResponse.status).toBe(500);
		});

		it("should handle missing CID in pin add", async () => {
			const pinResponse = await fetch(`${API_URL}/api/v0/pin/add`, {
				method: "POST"
			});
			expect(pinResponse.status).toBe(400);
			const error = await pinResponse.json();
			expect(error.Message).toBe('argument "key" is required');
		});
	});
});
