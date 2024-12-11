FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS builder
WORKDIR /app

# Copy root workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy the app from workspace
COPY ./apps/ipfs-storage/package.json ./apps/ipfs-storage/package.json

# Enable pnpm
RUN corepack enable pnpm

# Copy typescript configuration
COPY ./apps/ipfs-storage/tsconfig.json ./apps/ipfs-storage/tsconfig.json

# Install dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source files
COPY ./apps ./apps

# Build the application
RUN cd apps/ipfs-storage && pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy package files and set up clean install
COPY --from=builder /app/apps/ipfs-storage/package.json ./package.json
COPY --from=builder /app/apps/ipfs-storage/dist ./dist

# Install production dependencies only for this app
RUN corepack enable pnpm && \
    pnpm install

EXPOSE 5001

ENV PORT 5001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "./dist/index.js"]