#!/bin/sh
set -e

echo "==> Running pre-migration (enum updates)..."
node scripts/pre-migrate.js

echo "==> Running database migrations..."
node scripts/migrate.js

echo "==> Starting application..."
exec node dist/main
