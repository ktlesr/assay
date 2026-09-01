# Assay hosted katmanı.
#
# Üç aşama: bağımlılıklar, derleme, koşum. Koşum aşaması pnpm ağacını değil,
# Next'in standalone çıktısını taşır — imaj küçük kalır ve içinde derleme
# aracı bulunmaz.
#
# Migration'lar açılışta uygulanır (docker-entrypoint.sh). Bunun için Prisma
# CLI ve şema koşum aşamasında da bulunur; tek fazladan yük bu.

# ---------------------------------------------------------------------------
FROM node:22.20.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/runner/package.json packages/runner/
COPY packages/adapters/package.json packages/adapters/
COPY packages/cli/package.json packages/cli/
COPY packages/db/package.json packages/db/
COPY packages/ui/package.json packages/ui/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @ktlsr/assay-db exec prisma generate
RUN pnpm -r --filter=!web build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_STANDALONE=1
RUN pnpm --filter web build

# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Kök olarak koşmuyor: konteyner kaçışının bedelini düşürmenin en ucuz yolu.
RUN groupadd --system --gid 1001 assay \
 && useradd --system --uid 1001 --gid assay assay

COPY --from=build --chown=assay:assay /app/apps/web/.next/standalone ./
COPY --from=build --chown=assay:assay /app/apps/web/.next/static ./apps/web/.next/static

# Migration için gereken en küçük küme.
COPY --from=build --chown=assay:assay /app/packages/db/prisma ./packages/db/prisma
COPY --from=build --chown=assay:assay /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --from=build --chown=assay:assay /app/packages/db/node_modules ./packages/db/node_modules
COPY --chown=assay:assay docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER assay
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
