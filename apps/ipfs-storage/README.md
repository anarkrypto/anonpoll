# ZeroPoll IPFS Storage

A lightweight IPFS node implementation for storing ZeroPoll's off-chain metadata.

This implementation provides Kubo-compatible RPC APIs using libp2p and Bitswap for content routing.

## Overview

This IPFS node implementation focuses on two core functionalities of the IPFS protocol, maintaining compatibility with the standard IPFS HTTP API:

- Block storage (`block/put`)
- Block retrieval (`block/get`)

It automatically generate the identity and private key for the IPFS node on startup, and stores the identity in the `~/.datastore` directory.

Objects are also stored in the `~/.datastore` directory using it's CID as the filename.

## Technology Stack

- [libp2p](https://libp2p.io/) - Modular network stack
- [@helia/bitswap](https://www.npmjs.com/package/@helia/bitswap) - IPFS content routing implementation
- [Node.js HTTP Server](https://nodejs.org) - JavaScript runtime environment
- [Express](https://expressjs.com/) - Web application framework

## API Documentation

Full API documentation is available in our [OpenAPI specification](./src/api/openapi.yml).

### Endpoints

#### Store a Block

```http
POST /api/v0/block/put
Content-Type: multipart/form-data

file: <binary>
```

#### Retrieve a Block

```http
POST /api/v0/block/get?arg=<cid>
```

For detailed API documentation including request/response formats and examples, please refer to our [OpenAPI specification](./openapi.yaml).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v9)

### Installation

```bash

# Clone the repository
git clone https://github.com/anarkrypto/zeropoll.git

# Navigate to the IPFS storage app
cd apps/ipfs-storage

# Install dependencies
pnpm install
```

### Development

To run the development server:

```bash
pnpm dev
```

The IPFS node will be available at `http://localhost:5001`.

### Building for Production

```bash
# From the root of the monorepo
pnpm build

# Start the production server
pnpm start
```

## Testing

```bash
# Run the test suite
pnpm test
```

## License

MIT
