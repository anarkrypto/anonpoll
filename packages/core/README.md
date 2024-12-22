# @zeropoll/core

Core implementation of the ZeroPoll private voting system. This package provides the controller engine that manages the interaction between different components of the system.

It can be easily integrated with Node.js or browser-based applications and frameworks like React

## Overview

@zeropoll/core implements a state management system that coordinates:

- Chain interactions with the Layer 2
- Wallet connections and transactions
- Poll creation and voting
- Off-chain metadata storage via IPFS

## Architecture

The core package is built around a main `ZeroPoll` controller that orchestrates several sub-controllers:

### Main Controller

- [`ZeroPoll`](src/zeropoll.ts): The root controller that initializes and coordinates all other components

### Sub-controllers

- [`ChainController`](src/controllers/chain-controller.ts): Manages Layer 2 chain interactions and synchronization
- [`WalletController`](src/controllers/wallet-controller.ts): Handles wallet connections and transaction signing
- [`PollController`](src/controllers/poll-controller.ts): Manages individual poll operations and state
- [`PollManagerController`](src/controllers/poll-manager-controller.ts): Coordinates poll creation
- [`BaseController`](src/controllers/base-controller.ts): Provides common controller functionality

### TODO: add signers and stores section

### State Management

Each controller maintains its own state:

```typescript
interface ZeroPollState {
	initialized: boolean;
	wallet: WalletState;
	chain: ChainState;
	poll: PollState;
	pollManager: PollManagerState;
}
```

## Installation

```bash
# From your project root
pnpm add @zeropoll/core

# Or within the monorepo
pnpm install
```

## Usage

### Basic Setup

```typescript
import { ZeroPoll } from '@zeropoll/core';

const zeropoll = new ZeroPoll({
	protokitGraphqlUrl: 'https://chain.zeropoll.xyz/graphql',
	ipfsApiUrl: 'https://ipfs.zeropoll.xyz',
	tickInterval: 1000, // Optional: defaults to 1000ms
});

// Initialize the system
await zeropoll.init();
```

### Configuration

```typescript
interface ZeroPollConfig {
	// GraphQL endpoint for the ProtoKit chain
	protokitGraphqlUrl: string;

	// IPFS API endpoint for metadata storage
	ipfsApiUrl: string;

	// Optional: Interval for chain state updates (ms)
	tickInterval?: number;
}
```

### State Updates

The ZeroPoll controller provides a reactive state system:

```typescript
// Subscribe to state changes
zeropoll.subscribe((state: ZeroPollState) => {
	console.log('New state:', state);
});

// Access current state
const currentState = zeropoll.state;
```

### Controller Access

```typescript
// Access individual controllers
const { wallet, chain, poll, pollManager } = zeropoll;

// Example: Check wallet connection
const isConnected = wallet.state.connected;

// Example: Create a new poll
await pollManager.createPoll({
	// poll configuration
});

// Example: Vote in a poll
await poll.load('pollId');
await poll.vote('optionHash');
```

## IPFS Integration

The system uses IPFS for off-chain metadata storage.

## Development

### Building

```bash
# Build the package
pnpm build
```

### Testing

```bash
# Run tests
pnpm test
```

## License

This package is part of the ZeroPoll monorepo and is licensed under the MIT License. See the root [LICENSE](../../LICENSE) file for details.
