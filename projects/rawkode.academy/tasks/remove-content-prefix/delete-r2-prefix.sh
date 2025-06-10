#!/usr/bin/env bash

set -euo pipefail

# Check if required environment variables are set
if [[ -z "${R2_ACCOUNT_ID:-}" ]]; then
    echo "Error: R2_ACCOUNT_ID is not set" >&2
    exit 1
fi

if [[ -z "${R2_ACCESS_KEY_ID:-}" ]]; then
    echo "Error: R2_ACCESS_KEY_ID is not set" >&2
    exit 1
fi

if [[ -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
    echo "Error: R2_SECRET_ACCESS_KEY is not set" >&2
    exit 1
fi

if [[ -z "${R2_BUCKET_NAME:-}" ]]; then
    echo "Error: R2_BUCKET_NAME is not set" >&2
    exit 1
fi

# Check if prefix is provided as argument
if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <prefix>" >&2
    echo "Example: $0 'path/to/delete/'" >&2
    exit 1
fi

PREFIX="$1"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "Configuration:"
echo "  Bucket: ${R2_BUCKET_NAME}"
echo "  Prefix: ${PREFIX}"
echo "  Endpoint: ${R2_ENDPOINT}"
echo ""

# Prompt for confirmation
read -p "Are you sure you want to delete all objects with prefix '${PREFIX}'? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Configure AWS CLI for R2
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"

# List all objects with the prefix
echo "Listing objects with prefix '${PREFIX}'..."
OBJECTS=$(aws s3api list-objects-v2 \
    --endpoint-url "${R2_ENDPOINT}" \
    --bucket "${R2_BUCKET_NAME}" \
    --prefix "${PREFIX}" \
    --query 'Contents[].Key' \
    --output text)

if [[ -z "${OBJECTS}" ]]; then
    echo "No objects found with prefix '${PREFIX}'"
    exit 0
fi

# Count objects
OBJECT_COUNT=$(echo "${OBJECTS}" | wc -l)
echo "Found ${OBJECT_COUNT} objects to delete"

# Delete objects one by one
DELETED=0

while IFS= read -r key; do
    if [[ -n "${key}" ]]; then
        echo "Deleting: ${key}"
        aws s3api delete-object \
            --endpoint-url "${R2_ENDPOINT}" \
            --bucket "${R2_BUCKET_NAME}" \
            --key "${key}"
        ((DELETED++))
    fi
done <<< "${OBJECTS}"

echo ""
echo "Successfully deleted ${DELETED} objects with prefix '${PREFIX}'"