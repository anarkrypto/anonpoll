# @zeropoll/chain

The zk-blockchain runtime implementation for ZeroPoll - a private voting system powered by zero-knowledge proofs, built as a Layer 2 solution on Mina Protocol.

## Overview

@zeropoll/chain implements the core blockchain logic for ZeroPoll using [ProtoKit](https://protokit.dev) framework and [o1js](https://www.npmjs.com/package/o1js). It provides:

- Zero-knowledge proof generation and verification for vote privacy
- On-chain state management for polls and votes
- Double-vote prevention using nullifier system
- Merkle tree management for voter verification
- GraphQL API for frontend interactions

## Architecture

The chain package implements several key components:

- **State Management**: Handles poll creation, vote storage, and result tabulation
- **ZK Circuits**: Implements the proof systems for vote privacy and verification
- **Nullifier System**: Prevents double voting while maintaining anonymity
- **Merkle Trees**: Efficiently manages voter eligibility verification
- **ProtoKit Runtime**: Configures the Layer 2 chain behavior and settlement

The Poll specific module can be found at [src/runtime/modules/poll.ts](src/runtime/modules/poll.ts).

## Getting Started

### Prerequisites

- Node.js v18 or higher (we recommend using NVM)
- pnpm v9.8 or higher
- Docker (for persistence mode)

### Installation

From the root of the monorepo:

```bash
# Install dependencies
pnpm install
```

### Development Environments

The chain can be run in different environments:

#### In-Memory Mode

```bash
# Start the chain in-memory (no persistence)
pnpm env:inmemory dev --filter @zeropoll/chain

# Or with specific options
pnpm env:inmemory dev --filter @zeropoll/chain -- --logLevel DEBUG
```

#### Development Mode (with persistence)

```bash
# Start required databases
pnpm env:development docker:up -d

# Generate Prisma client
pnpm env:development prisma:generate

# Run migrations
pnpm env:development prisma:migrate

# Start the chain
pnpm env:development dev --filter @zeropoll/chain
```

#### Production Mode

```bash
# Build the package
pnpm build --filter @zeropoll/chain

# Start in production mode
pnpm env:sovereign start --filter @zeropoll/chain
```

### CLI Options

- `--logLevel`: Sets logging level (DEBUG, INFO, etc.). Also configurable via `PROTOKIT_LOG_LEVEL`
- `--pruneOnStartup`: Cleans database before startup. Also configurable via `PROTOKIT_PRUNE_ON_STARTUP`

Example:

```bash
pnpm env:inmemory dev --filter @zeropoll/chain -- --logLevel DEBUG --pruneOnStartup
```

### Testing

```bash
# Run tests
pnpm test --filter @zeropoll/chain

# Watch mode
pnpm test --filter @zeropoll/chain -- --watchAll
```

## GraphQL API

The chain exposes a GraphQL API for frontend interactions. When running locally:

- GraphQL Playground: http://localhost:8080/graphql
- API Endpoint: http://localhost:8080/graphql

## Security

If you discover any security issues, please report them by email to anarkrypto@gmail.com instead of using the public issue tracker.

## License

This package is part of the ZeroPoll monorepo and is licensed under the MIT License. See the root [LICENSE](../../LICENSE) file for details.
