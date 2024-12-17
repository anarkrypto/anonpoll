import { FSBlockstore } from "./fs-blockstore";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { rmdir, mkdir } from "fs/promises";
import { join } from "path";

describe("FSBlockstore", () => {
  const testDir = join(process.cwd(), "test-storage");
  let blockstore: FSBlockstore;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    blockstore = new FSBlockstore(testDir);
    await blockstore.open();
  });

  afterEach(async () => {
    await blockstore.close();
    await rmdir(testDir, { recursive: true });
  });

  it("should store and retrieve a block", async () => {
    // Create a test block
    const testData = new TextEncoder().encode("test data");

    const hash = await sha256.digest(testData);
    const rawCode = 0x55; // raw format code
    const cid = CID.createV1(rawCode, hash);

    // Store the block
    await blockstore.put(cid, testData);

    // Verify block exists
    const exists = await blockstore.has(cid);
    expect(exists).toBe(true);

    // Retrieve and verify the block
    const retrieved = await blockstore.get(cid);
    expect(new Uint8Array(retrieved as Buffer)).toEqual(testData);
  });

  it("should handle invalid CIDs", async () => {
    const invalidCID = "not a CID" as any;

    await expect(blockstore.put(invalidCID, new Uint8Array())).rejects.toThrow(
      "Invalid CID",
    );

    await expect(blockstore.get(invalidCID)).rejects.toThrow("Invalid CID");

    await expect(blockstore.has(invalidCID)).rejects.toThrow("Invalid CID");
  });
});
