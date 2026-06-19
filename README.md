# StatusGate Frontend

React + Vite frontend for [StatusGate](https://github.com/IMKolganov/StatusGateFrontend): public status pages, uptime timelines, incident history, and admin dashboard.

## Stack

- React, TypeScript, Vite
- Orval-generated API client from OpenAPI

## Quick start (Docker)

Run the backend first, then:

```bash
cp .env.example .env
docker compose up -d --build
```

App: http://localhost:3000

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
