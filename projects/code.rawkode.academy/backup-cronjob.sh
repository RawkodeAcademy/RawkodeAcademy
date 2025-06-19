#!/bin/bash
# Forgejo backup script for Cloudflare R2
# This script should be run as a systemd timer or cron job

set -euo pipefail

# Load environment variables from secrets
source /run/secrets/forgejo-secrets

# Configuration
BACKUP_DIR="/tmp/forgejo-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="forgejo-backup-${TIMESTAMP}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Execute Forgejo backup
podman exec forgejo forgejo dump -c /etc/forgejo/app.ini -f "${BACKUP_DIR}/${BACKUP_NAME}.zip"

# Upload to Cloudflare R2 using rclone
rclone copy "${BACKUP_DIR}/${BACKUP_NAME}.zip" "r2:${R2_BUCKET_NAME}/forgejo-backups/" \
  --s3-provider=Cloudflare \
  --s3-access-key-id="${R2_ACCESS_KEY_ID}" \
  --s3-secret-access-key="${R2_SECRET_ACCESS_KEY}" \
  --s3-endpoint="${R2_ENDPOINT}" \
  --s3-no-check-bucket

# Clean up local backup
rm -f "${BACKUP_DIR}/${BACKUP_NAME}.zip"

# Keep only last 30 days of backups in R2
rclone delete "r2:${R2_BUCKET_NAME}/forgejo-backups/" \
  --s3-provider=Cloudflare \
  --s3-access-key-id="${R2_ACCESS_KEY_ID}" \
  --s3-secret-access-key="${R2_SECRET_ACCESS_KEY}" \
  --s3-endpoint="${R2_ENDPOINT}" \
  --min-age 30d

echo "Backup completed: ${BACKUP_NAME}"