# @zeropoll/react-ui

Ready-to-use React components for integrating ZeroPoll into your application.

Built with:

- React >=18
- Tailwind CSS
- shadcn/ui (for UI components)
- @zeropoll/react
- lucide-react (for icons)
- react-hook-form (for form handling)

## Installation

```bash
# Install the package
npm install @zeropoll/react-ui
# or
yarn add @zeropoll/react-ui
# or
pnpm add @zeropoll/react-ui
# or
bun add @zeropoll/react-ui
```

## Setup

1. First, import and include the styles in your app:

```tsx
import '@zeropoll/react-ui/styles.css';
```

2. Wrap your application with the `ZeroPollProvider`:

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

## Components

### PollCard

Display a poll and allow users to vote.

```tsx
import { PollCard } from '@zeropoll/react-ui';

function MyPoll() {
	return (
		<PollCard
			id="poll-id"
			encryptionKey="optional-encryption-key"
			onLoadSuccess={() => console.log('Poll loaded')}
			onLoadError={message => console.error('Load error:', message)}
			onVoteSuccess={() => console.log('Vote success')}
			onVoteError={message => console.error('Vote error:', message)}
		/>
	);
}
```

#### PollCard Props

| Prop           | Type                      | Description                                 |
| -------------- | ------------------------- | ------------------------------------------- |
| id             | string                    | The poll identifier                         |
| encryptionKey? | string                    | Optional encryption key for encrypted polls |
| className?     | string                    | Additional CSS classes                      |
| onLoadSuccess? | () => void                | Called when poll loads successfully         |
| onLoadError?   | (message: string) => void | Called when poll fails to load              |
| onVoteSuccess? | () => void                | Called when vote is successful              |
| onVoteError?   | (message: string) => void | Called when vote fails                      |

### PollFormCard

Component for creating new polls.

```tsx
import { PollFormCard } from '@zeropoll/react-ui';

function CreatePoll() {
	return (
		<PollFormCard
			onSuccess={result => {
				console.log('Poll created:', result.id);
			}}
			onError={message => {
				console.error('Error:', message);
			}}
		/>
	);
}
```

#### PollFormCard Props

| Prop       | Type                                                                  | Description                     |
| ---------- | --------------------------------------------------------------------- | ------------------------------- |
| className? | string                                                                | Additional CSS classes          |
| onSuccess? | (result: { id: string; hash: string; encryptionKey: string }) => void | Called when poll is created     |
| onError?   | (message: string) => void                                             | Called when poll creation fails |

## Features

### PollCard

- Display poll title, description, and options
- Real-time vote counting and percentages
- Wallet connection integration
- Vote casting functionality
- Eligible voters list
- Share functionality
- Loading and error states
- Responsive design

### PollFormCard

- Two-step form process
- Title and description inputs
- Dynamic option management (add/remove)
- Voter wallet address management
- Form validation
- Loading states
- Error handling

## Styling

The components use Tailwind CSS and shadcn/ui. You can customize the appearance by:

1. Modifying the Tailwind configuration
2. Using the `className` prop
3. Overriding the base styles in your CSS

## License

This package is part of the ZeroPoll monorepo and is licensed under the MIT License. See the root [LICENSE](../../LICENSE) file for details.
