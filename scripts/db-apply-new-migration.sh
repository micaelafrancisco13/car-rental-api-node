#!/bin/bash

# Check if a migration name is provided
if [ -z "$1" ]; then
  echo "Error: Migration name is required."
  echo "Usage: ./db-apply-new-migration.sh <migration-name>"
  exit 1
fi

# Get the migration name from the argument
MIGRATION_NAME="$1"

# Regenerate Prisma client
echo "Regenerating Prisma client..."
export NODE_TLS_REJECT_UNAUTHORIZED=0
docker-compose exec app npx prisma generate

# Apply the migration
echo "Running Prisma migration with name: $MIGRATION_NAME..."
docker-compose exec app npx prisma migrate dev --name "$MIGRATION_NAME"

# Optionally restart the app container
# echo "Restarting app container..."
# docker-compose restart app

echo "Done!"
