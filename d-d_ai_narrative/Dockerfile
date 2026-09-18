# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN corepack enable

# ---- deps: install with full lockfile, incl. devDependencies (needed for build) ----
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- builder: generate prisma client + build Next.js in standalone mode ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL n'a besoin que d'etre presente (pas valide/joignable) : le Pool pg
# est instancie au chargement du module mais ne se connecte qu'a la 1ere requete.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm prisma generate
RUN pnpm build

# ---- runner: minimal runtime image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/generated ./app/generated

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
