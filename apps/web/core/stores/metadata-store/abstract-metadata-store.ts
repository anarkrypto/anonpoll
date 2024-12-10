/*
* This is a basic, agnostic interface to a fixed content storage system.
* That type of storage system is often called a "content-addressable storage" (CAS) or "content-based addressing" system.
* In these systems, the key is generated from the content itself, usually through a hash function.
* Feel free to implement your own solution or something like IPFS, GIT, Bittorrent, etc.
*/

export abstract class AbstractMetadataStore<Data = Record<string, any>> {
  abstract get(key: string): Promise<Data>;
  abstract put(data: Data): Promise<{ key: string }>;
}
