# Production deployment

The production architecture is:

1. GitHub Actions tests and builds the application.
2. Backend and frontend images are pushed to GHCR.
3. GitHub Actions connects to the Ubuntu server over SSH.
4. Docker Compose runs the containers on loopback ports.
5. Host Nginx serves both public HTTPS domains.
6. FastAPI connects to the external PostgreSQL database configured in GitHub Secrets.

## DNS

Create these A records pointing to `52.38.137.85`:

- `api-fast-fs.chenchangchao.com`
- `fast-dashboard.chenchangchao.com`

## Server prerequisites

The `ubuntu` user needs SSH key authentication and permission to run Docker without `sudo`:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo usermod -aG docker ubuntu
```

Log out and back in after changing the Docker group.

Install the Nginx configuration from `deploy/nginx/full-stack-fastapi.conf`:

```bash
sudo cp deploy/nginx/full-stack-fastapi.conf /etc/nginx/sites-available/full-stack-fastapi
sudo ln -s /etc/nginx/sites-available/full-stack-fastapi /etc/nginx/sites-enabled/full-stack-fastapi
sudo nginx -t
sudo systemctl reload nginx
```

After DNS resolves, enable HTTPS:

```bash
sudo certbot --nginx \
  -d api-fast-fs.chenchangchao.com \
  -d fast-dashboard.chenchangchao.com
```

## GitHub production environment

Create a GitHub Environment named `production`.

Required environment secrets:

- `DEPLOY_SSH_KEY`
- `SECRET_KEY`
- `FIRST_SUPERUSER`
- `FIRST_SUPERUSER_PASSWORD`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAILS_FROM_EMAIL`
- `POSTGRES_SERVER`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `SENTRY_DSN`

Required environment variables:

- `DEPLOY_ENABLED`
- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `PROJECT_NAME`

Keep `DEPLOY_ENABLED=false` until SSH, Docker, Nginx, and DNS are ready. Set it to `true` and run the `Publish and deploy` workflow for the first deployment.

## Runtime files

The workflow uploads these files to `~/apps/full-stack-fastapi/` on the server:

- `compose.production.yml`
- generated `production.env`

The environment file is generated from GitHub Secrets and is never committed.

## Manual verification

On the server:

```bash
cd ~/apps/full-stack-fastapi
docker compose --env-file production.env -f compose.production.yml ps
curl --fail http://127.0.0.1:8000/api/v1/utils/health-check/
curl --fail http://127.0.0.1:8080/
```
