import { IPFSNode } from "../ipfs/node";
import { IPFSAPIServer } from "./server";
import { rm } from "fs/promises";
import { join } from "path";
import { DATASTORE_DIR } from "../config/config";

describe("IPFSAPIServer", () => {
  const testDir = join(process.cwd(), DATASTORE_DIR);
  let node: IPFSNode;
  let server: IPFSAPIServer;
  let port: number;
  let API_URL: string;

  beforeEach(async () => {
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
    const formData = new FormData();
    formData.append("file", new Blob([testData]));

    // Store block
    const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
      method: "POST",
      body: formData,
    });

    expect(putResponse.status).toBe(200);
    const putResult = await putResponse.json();
    expect(putResult.Key).toBeDefined();
    expect(putResult.Size).toBe(testData.length);

    // Retrieve block
    const getResponse = await fetch(
      `${API_URL}/api/v0/block/get?arg=${putResult.Key}`,
      {
        method: "POST",
      },
    );
    expect(getResponse.status).toBe(200);

    const buffer = await getResponse.arrayBuffer();
    const data = Buffer.from(buffer).toString();
    expect(data).toBe(testData);
  });

  describe("API error handling", () => {
    it("should handle missing file in block put", async () => {
      const formData = new FormData();
      const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
        method: "POST",
        body: formData,
      });
      expect(putResponse.status).toBe(400);
      const error = await putResponse.json();
      expect(error.Message).toBe("file is required");
    });

    it("should handle invalid CID in block get", async () => {
      const getResponse = await fetch(
        `${API_URL}/api/v0/block/get?arg=invalid-cid`,
        {
          method: "POST",
        },
      );
      expect(getResponse.status).toBe(500);
    });

    it("should handle missing arg parameter in block get", async () => {
      const getResponse = await fetch(`${API_URL}/api/v0/block/get`, {
        method: "POST",
      });
      expect(getResponse.status).toBe(400);
      const error = await getResponse.json();
      expect(error.Message).toBe('argument "arg" is required');
    });
  });

  it("should handle binary files", async () => {
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    const formData = new FormData();
    formData.append("file", new Blob([binaryData]), "binary.bin");

    const putResponse = await fetch(`${API_URL}/api/v0/block/put`, {
      method: "POST",
      body: formData,
    });

    expect(putResponse.status).toBe(200);
    const putResult = await putResponse.json();

    const getResponse = await fetch(
      `${API_URL}/api/v0/block/get?arg=${putResult.Key}`,
      {
        method: "POST",
      },
    );
    const buffer = await getResponse.arrayBuffer();
    expect(Buffer.from(buffer)).toEqual(binaryData);
  });
});
