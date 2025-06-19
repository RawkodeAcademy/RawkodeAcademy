# Forgejo Production Deployment

This repository contains production-ready Podman Quadlet configurations for Forgejo with PostgreSQL.

## Features

- Forgejo Git service with PostgreSQL database
- OIDC authentication via Zitadel
- Automated backups to Cloudflare R2
- Secret management using Quadlet secrets
- SSH access disabled (HTTPS only)

## Setup Instructions

1. **Configure Secrets**
   Edit `/home/rawkode/forgejo/forgejo-secrets.secret` and set:
   - `POSTGRES_PASSWORD` and `FORGEJO_DATABASE_PASSWD` (use the same secure password)
   - `FORGEJO_SECRET_KEY` (generate with `openssl rand -hex 32`)
   - `FORGEJO_INTERNAL_TOKEN` (generate with `openssl rand -hex 32`)
   - Cloudflare R2 credentials for backups

2. **Copy Quadlet Files**
   ```bash
   sudo cp *.container *.kube *.volume *.secret /etc/containers/systemd/
   sudo systemctl daemon-reload
   ```

3. **Start Services**
   ```bash
   sudo systemctl start forgejo-pod.service
   ```

4. **Configure OIDC**
   After initial setup, add the OIDC provider in Forgejo admin panel:
   - Provider: OpenID Connect
   - Client ID: 303319482200293448
   - Discovery URL: https://zitadel.rawkode.academy/.well-known/openid-configuration
   - Enable PKCE

5. **Enable Backups**
   ```bash
   sudo cp forgejo-backup.* /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now forgejo-backup.timer
   ```

## Access

- URL: Configured during installation
- Authentication: Via Zitadel OIDC

## Backup Restoration

To restore from R2 backup:
```bash
rclone copy r2:YOUR_BUCKET/forgejo-backups/forgejo-backup-TIMESTAMP.zip /tmp/
podman exec forgejo forgejo restore -c /etc/forgejo/app.ini -f /tmp/forgejo-backup-TIMESTAMP.zip
```
