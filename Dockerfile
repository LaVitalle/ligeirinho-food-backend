# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# ============================================
# Stage 2: Build application
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production image
# ============================================
FROM node:22-alpine AS production

# dumb-init handles PID 1 signal forwarding (graceful shutdown)
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Install production dependencies only
COPY --chown=nestjs:nodejs package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application
COPY --chown=nestjs:nodejs --from=build /app/dist ./dist

# Copy Drizzle SQL migration files
COPY --chown=nestjs:nodejs --from=build /app/src/shared/infra/database/drizzle ./migrations

# Copy migration runner and entrypoint
COPY --chown=nestjs:nodejs scripts/migrate.js ./scripts/migrate.js
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(() => process.exit(0)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
