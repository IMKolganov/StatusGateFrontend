# StatusGate Frontend

React + Vite frontend for [StatusGate](https://github.com/IMKolganov/StatusGateFrontend): public status pages, uptime timelines, incident history, and admin dashboard.

## Stack

- React, TypeScript, Vite
- Orval-generated API client from OpenAPI

## Quick start (Docker)

Run the backend first, then:

```bash
cp .env.example .env
# Optional: VITE_BRAND_* for white-label
# Optional: VITE_DEFAULT_SPEED_TEST_URL_TEMPLATE, VITE_DEFAULT_PROBE_URL, VITE_INTERNET_PING_HOST, …
docker compose up -d --build
```

App: http://localhost:3000

## Configuration

Build-time env (see `.env.example`). Branding uses `VITE_BRAND_*`. Probe/speed placeholders (`VITE_DEFAULT_*`, `VITE_CLOUDFLARE_SPEED_TEST_ORIGIN`, `VITE_INTERNET_PING_HOST`) should usually match the backend defaults so admin forms and chart labels stay consistent.

The tunnel status page shows VPN download/upload and host WAN series when the API provides those fields.

## Local development

```bash
npm ci
npm run dev
```

Regenerate API client after backend OpenAPI changes:

```bash
OPENAPI_URL=http://localhost:8000/openapi.json npm run api:generate
```

## Build

```bash
npm run build
```
