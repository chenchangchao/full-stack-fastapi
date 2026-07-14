# Full Stack FastAPI

Production-ready FastAPI and React application deployed with Docker, GitHub Actions, GHCR, and Nginx.

## Production URLs

- Frontend: <https://fast-dashboard.chenchangchao.com>
- API: <https://api-fast-fs.chenchangchao.com>
- API documentation: <https://api-fast-fs.chenchangchao.com/docs>

## Local development

Create the local environment file:

```bash
cp .env.example .env
```

Replace the placeholder secrets, then start the stack:

```bash
docker compose watch
```

The frontend is available at <http://localhost:5173> and the API at <http://localhost:8000>.

You can also run the backend and frontend directly:

```bash
uv sync --all-packages
cd backend
uv run fastapi dev app/main.py
```

```bash
bun install
bun run dev
```

## Validation

```bash
cd backend
uv run pytest
```

```bash
bun run build
```

```bash
docker build -f backend/Dockerfile -t full-stack-fastapi-backend:test .
docker build \
  --build-arg VITE_API_URL=https://api-fast-fs.chenchangchao.com \
  -f frontend/Dockerfile \
  -t full-stack-fastapi-frontend:test .
```

## Deployment

GitHub Actions builds both images and publishes them to GHCR. Production deployment uses `compose.production.yml`, an external PostgreSQL database, and the host Nginx reverse proxy.

See [deployment.md](deployment.md) for server preparation and deployment details. Never commit `.env` or `production.env`.
