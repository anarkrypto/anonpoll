# @zeropoll/react

React hooks and context provider for integrating ZeroPoll into React applications.

## Installation

```bash
npm install @zeropoll/react
# or
pnpm add @zeropoll/react
# or
yarn add @zeropoll/react
# or
bun add @zeropoll/react
```

## Provider Setup

Wrap your application with the `ZeroPollProvider`:

```tsx
import { ZeroPollProvider } from '@zeropoll/react';

function App() {
	return (
		<ZeroPollProvider
			protokitGraphqlUrl="https://chain.zeropoll.xyz/graphql"
			ipfsApiUrl="https://ipfs.zeropoll.xyz"
			tickInterval={1000}
		>
			<YourApp />
		</ZeroPollProvider>
	);
}
```

### Provider Props

| Prop               | Type   | Description                                    |
| ------------------ | ------ | ---------------------------------------------- |
| protokitGraphqlUrl | string | GraphQL endpoint for the ProtoKit chain        |
| ipfsApiUrl         | string | IPFS API endpoint for metadata storage         |
| tickInterval?      | number | Optional interval for chain state updates (ms) |

## Hooks

### useZeroPoll

Access the core ZeroPoll instance and initialization state.

```tsx
const { zeroPoll, initialized } = useZeroPoll();
```

### useWallet

Manage wallet connection and state.

```tsx
const {
	account, // Current account address
	connected, // Wallet connection status
	loading, // Loading state
	transactions, // Transaction history
	connect, // Connect wallet function
} = useWallet();
```

### useChain

Access chain state and block information.

```tsx
const {
	loading, // Chain loading state
	online, // Chain connection status
	block, // Current block data
} = useChain();
```

### usePoll

Load and interact with a specific poll.

```tsx
interface UsePollOptions {
	encryptionKey?: string;
	onError?: (message: string) => void;
	onSuccess?: (result: { hash: string }) => void;
}

const {
	data, // Poll metadata and options
	isLoading, // Loading state
	isSuccess, // Success state
	isError, // Error state
	error, // Error message
	refetch, // Reload poll data
} = usePoll(pollId, options);
```

#### Poll Data Structure

```tsx
interface PollData {
	metadata: {
		title: string;
		description: string;
		options: string[];
		votersWallets: string[];
		id: string;
	};
	options: {
		text: string;
		hash: string;
		votesCount: number;
		votesPercentage: number;
	}[];
	commitment: string;
}
```

### useVote

Cast votes in a poll.

```tsx
interface UseVoteOptions {
	encryptionKey?: string;
	onError?: (message: string) => void;
	onSuccess?: (result: { hash: string }) => void;
}

const {
	vote, // Function to cast a vote
	isPending, // Loading state
	isSuccess, // Success state
	isError, // Error state
	error, // Error message
	data, // Transaction data
} = useVote(pollId, options);

// Usage
await vote(optionHash);
```

### useCreatePoll

Create new polls.

```tsx
interface CreatePollData {
	title: string;
	description: string;
	options: string[];
	votersWallets: string[];
	salt: string;
}

interface UseCreatePollOptions {
	onError?: (message: string) => void;
	onSuccess?: (result: CreatePollResult) => void;
}

const {
	createPoll, // Function to create a poll
	isPending, // Loading state
	isSuccess, // Success state
	isError, // Error state
	error, // Error message
	data, // Created poll data
} = useCreatePoll(options);

// Usage
await createPoll({
	title: 'My Poll',
	description: 'Poll description',
	options: ['Option 1', 'Option 2'],
	votersWallets: ['wallet1', 'wallet2'],
	salt: 'random-salt',
});
```

## Examples

### Creating a Poll

```tsx
function CreatePollForm() {
	const { createPoll, isPending, error } = useCreatePoll({
		onSuccess: result => {
			console.log('Poll created:', result.id);
		},
	});

	const handleSubmit = async (data: CreatePollData) => {
		try {
			await createPoll(data);
		} catch (err) {
			console.error('Failed to create poll:', err);
		}
	};

	return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Displaying a Poll

```tsx
function PollDisplay({ pollId }: { pollId: string }) {
	const { data, isLoading, error } = usePoll(pollId);
	const { vote } = useVote(pollId);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div>
			<h1>{data.metadata.title}</h1>
			<p>{data.metadata.description}</p>
			{data.options.map(option => (
				<button key={option.hash} onClick={() => vote(option.hash)}>
					{option.text} ({option.votesPercentage.toFixed(2)}%)
				</button>
			))}
		</div>
	);
}
```

## License

This package is part of the ZeroPoll monorepo and is licensed under the MIT License. See the root [LICENSE](../../LICENSE) file for details.
