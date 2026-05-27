# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.0.0

COPY log-monitoring-platform/package.json ./
COPY log-monitoring-platform/pnpm-workspace.yaml ./
COPY log-monitoring-platform/pnpm-lock.yaml ./
COPY log-monitoring-platform/packages ./packages
COPY log-monitoring-platform/apps/api ./apps/api

WORKDIR /app/apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm build

# ── Stage 2: Run ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk update && apk upgrade --no-cache

WORKDIR /app

RUN npm install -g pnpm@9.0.0

COPY --from=builder /app/apps/api/package.json ./

# Runner has only the api package.json with no workspace lockfile context
# so we use --no-frozen-lockfile and install prod deps only
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]