# ZeroPoll Web App

A private voting system powered by zero-knowledge proofs

Visit: [zeropoll.xyz](https://zeropoll.xyz).

## Overview

ZeroPoll Web App is the official frontend implementation of the ZeroPoll voting system.

It provides a user-friendly interface for creating and participating in private polls using zero-knowledge proof technology.

## Technology Stack

- [Next.js](https://nextjs.org/) - React framework for production
- [React](https://reactjs.org/) - Frontend library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [@zeropoll/react](https://www.npmjs.com/package/@zeropoll/react) - Core ZeroPoll React components
- [@zeropoll/react-ui](https://www.npmjs.com/package/@zeropoll/react-ui) - ZeroPoll UI components

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18)
- [pnpm](https://pnpm.io/) (v9)

### Installation

```bash
# Clone the repository
git clone https://github.com/anarkrypto/zeropoll.git
cd zeropoll/apps/web

# Install dependencies
pnpm install
```

### Development

To run the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
# Create a production build
pnpm build

# Start the production server
pnpm start
```

## License

MIT
