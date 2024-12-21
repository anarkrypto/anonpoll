<p align="center">
  <a href="https://zeropoll.xyz">
    <picture>
      <img src="https://github.com/user-attachments/assets/39f708cd-5d6a-4e8a-a2af-32b7ddbb704f" height="128">
    </picture>
    <h1 align="center">ZeroPoll.xyz</h1>
  </a>
</p>

A private voting system powered by zero-knowledge proofs.

Secure, anonymous and verifiable!

https://zeropoll.xyz

---

- This project is funded by Mina Protocol: [Check the proposal](https://forums.minaprotocol.com/t/zeropoll-voting-polls/6482) 🎉
- This project is based on [Protokit framework](https://protokit.dev) and was set up with [`proto-kit/starter-kit`](https://github.com/proto-kit/starter-kit).

### Key Features

- **Private Voting**: Vote counts are public while keeping individual votes confidential
- **Double-Vote Prevention**: Uses nullifier system to prevent multiple votes from same user
- **Verifiable Results**: All votes include zero-knowledge proofs for eligibility verification
- **Flexible Polls**: Support for up to 10 options per poll with real-time result tracking
- **Decentralized**: Fully on-chain implementation with no central authority

### Technical Stack

- Built with o1js for zero-knowledge proofs
- Proto-kit for blockchain runtime implementation
- Merkle trees for efficient voter verification
- React with TypeScript for frontend implementation

### Security Features

- Zero-knowledge proofs for voter eligibility
- Poseidon hash function for option privacy
- Nullifier-based double-vote prevention
- Commitment-based voter set management

## Quick start

The monorepo contains 1 package and 1 app:

- `packages/chain` contains everything related to our app-chain
- `packages/core` contains the core logic of ZeroPoll
- `packages/react` contains hooks and a contex provider to implement ZeroPoll in a React app
- `packages/react-ui` contains React components to implement the ZeroPoll UI
- `apps/ipfs-storage` contains a simple IPFS storage node service
- `apps/web` contains the web interface for ZeroPoll

**Prerequisites:**

- Node.js `v18` (we recommend using NVM)
- pnpm `v9.8`
- nvm

For running with persistance / deploying on a server

- docker `>= 24.0`

## Setup

```zsh
git clone https://github.com/anarkrypto/zeropoll zeropoll
cd zeropoll

# ensures you have the right node.js version
nvm install && nvm use

# ensure you have the right pnpm version
corepack enable

# install dependencies
pnpm install
```

## Running

### Environments

The starter-kit offers different environments to run you appchain.
You can use those environments to configure the mode of operation for your appchain depending on which stage of development you are in.

The starter kit comes with a set of pre-configured environments:

- `inmemory`: Runs everything in-memory without persisting the data. Useful for early stages of runtime development.
- `development`: Runs the sequencer locally and persists all state in databases running in docker.
- `sovereign`: Runs your appchain fully in docker (except the UI) for testnet deployments without settlement.

Every command you execute should follow this pattern:

`pnpm env:<environment> <command>`

This makes sure that everything is set correctly and our tooling knows which environment you want to use.

### Running in-memory

```zsh
# starts both UI and sequencer locally
pnpm env:inmemory dev

# starts UI only
pnpm env:inmemory dev --filter @zeropoll/web
# starts sequencer only
pnpm env:inmemory dev --filter @zeropoll/chain
```

> Be aware, the dev command will automatically restart your application when your sources change.
> If you don't want that, you can alternatively use `pnpm run build` and `pnpm run start`

Navigate to `localhost:3000` to see the example UI, or to `localhost:8080/graphql` to see the GQL interface of the locally running sequencer.

### Running tests

```zsh
# run and watch tests for the `chain` package
pnpm run test --filter=@zeropoll/chain -- --watchAll
```

### Running with persistence

```zsh
# start databases
pnpm env:development docker:up -d
# generate prisma client
pnpm env:development prisma:generate
# migrate database schema
pnpm env:development prisma:migrate

# build & start sequencer, make sure to prisma:generate & migrate before
pnpm build --filter=@zeropoll/chain
pnpm env:development start --filter=@zeropoll/chain

# Watch sequencer for local filesystem changes
# Be aware: Flags like --prune won't work with 'dev'
pnpm env:development dev --filter=@zeropoll/chain

# Start the UI
pnpm env:development dev --filter @zeropoll/web
```

### Deploying to a server

When deploying to a server, you should push your code along with your forked starter-kit to some repository,
then clone it on your remote server and execute it.

```zsh
# start every component with docker
pnpm env:sovereign docker:up -d
```

UI will be accessible at `https://localhost` and GQL inspector will be available at `https://localhost/graphql`

#### Configuration

For security reasons, modify the `POSTGRES_PASSWORD` and `REDIS_PASSWORD` envs found in the `packages/chain/src/environments/sovereign/.env` file.

Go to `docker/proxy/Caddyfile` and replace the `*` matcher with your domain.

```
yourdomain.com {
    ...
}
```

> HTTPS is handled automatically by Caddy, you can (learn more about automatic https here.)[https://caddyserver.com/docs/automatic-https]

In most cases, you will need to change the `NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL` property in the `.env` file to the domain your graphql endpoint is running in.
By default, the graphql endpoint is running on the same domain as your UI with the `/graphql` suffix.

#### Running sovereign chain locally

The caddy reverse-proxy automatically uses https for all connections, use this guide to remove certificate errors when accessing localhost sites

<https://caddyserver.com/docs/running#local-https-with-docker>

## CLI Options

- `logLevel`: Overrides the loglevel used. Also configurable via the `PROTOKIT_LOG_LEVEL` environment variable.
- `pruneOnStartup`: If set, prunes the database before startup, so that your chain is starting from a clean, genesis state. Alias for environment variable `PROTOKIT_PRUNE_ON_STARTUP`

In order to pass in those CLI option, add it at the end of your command like this

`pnpm env:inmemory dev --filter @zeropoll/chain -- --logLevel DEBUG --pruneOnStartup`

### Building the framework from source

1. Make sure the framework is located under ../framework from the starter-kit's location
2. Adapt your starter-kit's package.json to use the file:// references to framework
3. Go into the framework folder, and build a docker image containing the sources with `docker build -f ./packages/deployment/docker/development-base/Dockerfile -t protokit-base .`

4. Comment out the first line of docker/base/Dockerfile to use protokit-base

## Contributing

Contributions to ZeroPoll are welcome and highly appreciated!

Consider [Open an Issue](https://github.com/anarkrypto/zeropoll/issues/new) or send a Pull Request

## Authors

- Kaique Nunes ([@anarkrypto](https://github.com/anarkrypto))

## Security

If you believe you have found a security vulnerability in ZeroPoll, we encourage you to responsibly disclose this and NOT open a public issue.
We will investigate all legitimate reports. Email anarkrypto@gmail.com to disclose any security vulnerabilities

## License

MIT
