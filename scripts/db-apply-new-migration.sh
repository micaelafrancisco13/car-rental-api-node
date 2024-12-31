#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: Migration name is required."
  echo "Usage: ./db-apply-new-migration.sh <migration-name>"
  exit 1
fi

MIGRATION_NAME=$1

echo "Regenerating Prisma client..."
docker-compose exec app npx prisma generate

echo "Running Prisma migration with name: $MIGRATION_NAME..."
docker-compose exec app npx prisma migrate dev --name "$MIGRATION_NAME"

echo "Restarting app container..."
docker-compose restart app

echo "Done!"
