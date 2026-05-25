# Stage 1: Build
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Rebuild better-sqlite3 for the target platform (discard dev-platform binary)
RUN npm rebuild better-sqlite3

# Stage 2: Production
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "next", "start"]
