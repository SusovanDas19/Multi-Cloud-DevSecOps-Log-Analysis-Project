# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace files including the lockfile
COPY log-monitoring-platform/package.json ./
COPY log-monitoring-platform/pnpm-workspace.yaml ./
COPY log-monitoring-platform/pnpm-lock.yaml ./
COPY log-monitoring-platform/packages ./packages

# Copy web app
COPY log-monitoring-platform/apps/web ./apps/web

# Install deps
WORKDIR /app/apps/web
RUN pnpm install --frozen-lockfile

# Build arg for API URL — injected by CI pipeline
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the React app
RUN pnpm build

# ── Stage 2: Serve with nginx ─────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY log-monitoring-platform/apps/web/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built React app from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]