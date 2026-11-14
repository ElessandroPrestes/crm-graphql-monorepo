# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.13.0
ARG PNPM_VERSION=12.18.0

FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# Install, build and deploy in a single layer. Keeping the pnpm store in the
# same writable layer as `pnpm deploy` avoids the overlayfs copy-up that made
# deploy take minutes when the store lived in a lower layer.
FROM base AS build
COPY . .
RUN --mount=type=cache,id=nexo-turbo-cache,target=/cache/turbo,sharing=locked \
    pnpm install --frozen-lockfile --prefer-offline \
 && pnpm exec turbo run build \
      --filter=@nexo/api \
      --filter=@nexo/worker \
      --filter=@nexo/web \
      --concurrency=1 \
      --cache-dir=/cache/turbo \
 && pnpm --filter @nexo/api --prod --offline --trust-lockfile deploy /prod/api \
 && pnpm --filter @nexo/worker --prod --offline --trust-lockfile deploy /prod/worker \
 && rm -rf /app/node_modules /app/apps/*/node_modules /app/packages/*/node_modules /app/.turbo /pnpm/store

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
WORKDIR /app

FROM runtime AS api
COPY --from=build --chown=nestjs:nodejs /prod/api ./
USER nestjs
EXPOSE 3202
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3202/health/live >/dev/null || exit 1
CMD ["node", "dist/main.js"]

FROM runtime AS worker
COPY --from=build --chown=nestjs:nodejs /prod/worker ./
USER nestjs
EXPOSE 3203
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3203/health/live >/dev/null || exit 1
CMD ["node", "dist/main.js"]

FROM nginxinc/nginx-unprivileged:1.31.7-alpine AS web
COPY infra/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
