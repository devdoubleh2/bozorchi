#!/bin/bash

# Optimized parallel migration script for tenant schemas
# Compatible with macOS (zsh/bash 3.x) and Linux

set -e

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

BASE_URL="$DATABASE_URL"
MAX_PARALLEL=${MAX_PARALLEL:-10}  # Adjust based on your database connection limits

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# Get all schemas into an array (POSIX-compatible, works on macOS)
schemas=()
while IFS= read -r line; do
  trimmed=$(echo "$line" | tr -d ' ')
  if [ -n "$trimmed" ]; then
    schemas+=("$trimmed")
  fi
done < <(psql "$DATABASE_URL" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'org_%';")

total=${#schemas[@]}
echo "=== Found $total schemas to migrate ==="
echo "=== Running with $MAX_PARALLEL parallel jobs ==="
echo ""

if [ "$total" -eq 0 ]; then
  echo "No tenant schemas found. Nothing to migrate."
  exit 0
fi

# Function to migrate a single schema (runs sequentially to allow interactive prompts)
migrate_schema() {
  local schema=$1
  
  echo ""
  echo "======================================"
  echo "[MIGRATING] $schema"
  echo "======================================"
  
  export DATABASE_URL="${BASE_URL}?schema=$schema"
  
  # Run Prisma without suppressing output - allows interactive yes/no prompts
  if npx prisma db push --schema=prisma/tenant/schema.prisma; then
    echo "[SUCCESS] $schema"
    return 0
  else
    echo "[FAILED] $schema"
    return 1
  fi
}

# Run migrations sequentially to allow interactive prompts
failed_schemas=()
for schema in "${schemas[@]}"; do
  if ! migrate_schema "$schema"; then
    failed_schemas+=("$schema")
  fi
done

echo ""
echo "=== Migration complete ==="
echo "Total: $total | Success: $((total - ${#failed_schemas[@]})) | Failed: ${#failed_schemas[@]}"

if [ ${#failed_schemas[@]} -gt 0 ]; then
  echo ""
  echo "Failed schemas:"
  for s in "${failed_schemas[@]}"; do
    echo "  - $s"
  done
  exit 1
fi
