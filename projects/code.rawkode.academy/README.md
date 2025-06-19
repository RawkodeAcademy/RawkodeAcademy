# Forgejo Production Deployment

This repository contains production-ready Podman Quadlet configurations for Forgejo with PostgreSQL, automated setup via Justfile, and comprehensive backup solutions.

## Features

- Forgejo Git service with PostgreSQL database
- OIDC authentication via Zitadel
- ngrok integration for secure external access
- Automated backups to Cloudflare R2 with retention policies
- Secret management using Podman Quadlet secrets
- SSH access disabled (HTTPS only)
- Fully automated setup and management via Justfile

## Prerequisites

- Ubuntu system (required)
- `just` command runner installed
- Root or sudo access

## Quick Setup

```bash
# Install dependencies (if not already installed)
just install-deps

# Configure secrets interactively
just configure-secrets

# Install and start all services
just deploy
```

## Detailed Setup Instructions

### 1. Install Dependencies

```bash
just install-deps
```

This will install:
- Podman (with Quadlet support)
- rclone (for R2 backups)
- OpenSSL (for token generation)
- curl

### 2. Configure Secrets

```bash
just configure-secrets
```

This interactive command will:
- Generate secure passwords for PostgreSQL
- Create Forgejo security tokens
- Configure Cloudflare R2 credentials for backups
- Set up the public URL for Forgejo
- Create `forgejo-secrets` file containing all necessary secrets

### 3. Deploy Services

```bash
just deploy
```

This will:
- Install all Quadlet files to `/etc/containers/systemd/`
- Set up the backup service and timer
- Start all services (PostgreSQL, Forgejo, ngrok)

## Service Management

```bash
# Start all services
just start

# Stop all services
just stop

# Check service status
just status

# View logs
just logs

# Clean up (stop services and remove data)
just cleanup
```

## Backup Management

Backups are automatically scheduled daily at 2 AM.

```bash
# Run manual backup
just backup

# Restore from backup
just restore <backup-file>

# List available backups
just list-backups
```

## OIDC Configuration

After deployment, configure OIDC in the Forgejo admin panel:
- Provider: OpenID Connect
- Client ID: 303319482200293448
- Discovery URL: https://zitadel.rawkode.academy/.well-known/openid-configuration
- Enable PKCE

## Access

- URL: Configured during `just configure-secrets`
- External access: Via ngrok (requires auth token in secrets)
- Authentication: Via Zitadel OIDC

## Security Notes

- All sensitive credentials are stored in Podman secrets
- Database passwords are never exposed in environment variables
- Backup service runs as root to access container data
- Secrets files have restricted permissions (600)

## Troubleshooting

```bash
# Check Quadlet generation
just check-quadlets

# Debug service issues
sudo journalctl -u forgejo.service
sudo journalctl -u postgres.service
sudo journalctl -u ngrok.service

# Verify secrets
sudo podman secret ls
```

## Architecture

- **PostgreSQL**: Stores Forgejo data
- **Forgejo**: Git service
- **ngrok**: Provides secure external access
- **Backup Service**: Daily automated backups to Cloudflare R2
- **Podman Quadlets**: Systemd integration for container management