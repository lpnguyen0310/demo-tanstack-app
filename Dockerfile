FROM node:24.12.0-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nitro

COPY --from=builder /app ./
USER nitro

EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "start"]
