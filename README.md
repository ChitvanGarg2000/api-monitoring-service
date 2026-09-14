# 📡 API Monitoring Service

> A lightweight, self-hosted API observability platform — think of it as a **miniature Grafana** purpose-built for tracking API hits, latency, error rates, and performance trends across your services.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Role & Permission System](#role--permission-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [Frontend](#frontend)
- [Reliability Patterns](#reliability-patterns)

---

## Overview

The **API Monitoring Service** is a full-stack observability tool that lets you track every API call made across any of your services. You instrument your services by sending a lightweight HTTP event payload to the ingestion endpoint, and the platform takes care of storing, aggregating, and visualising the data in real time.

**Key capabilities:**

- 📊 Real-time dashboard with stats cards, time-series charts, and top-endpoint rankings
- 🔑 Multi-tenant API key management with per-key permission scoping
- 👥 Role-based access control (`super_admin`, `client_admin`, `client_viewer`)
- ⚡ Async processing via RabbitMQ — ingestion never blocks your service
- 🔁 Resilient message processing with retry strategies, dead-letter queues, and a circuit breaker
- 🐳 Fully containerised via Docker Compose — one command to run everything

---

## Architecture

The project follows a **Modular Monolith** pattern with **SOLID principles**, where each domain (auth, client, ingest, analytics, processor) is an isolated module with its own controller, service, repository, and DI container. Modules communicate through well-defined interfaces and a shared event bus (RabbitMQ).

```
┌──────────────────────────────────────────────────────────────┐
│                       React Frontend                         │
│          (Vite + TypeScript + TanStack Query + Recharts)     │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTP (JWT Auth)
┌─────────────────────────▼────────────────────────────────────┐
│                  Express.js API Server                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Auth   │  │  Client  │  │  Ingest  │  │ Analytics  │  │
│  │ Service  │  │ Service  │  │ Service  │  │  Service   │  │
│  └──────────┘  └──────────┘  └────┬─────┘  └─────┬──────┘  │
└───────────────────────────────────┼───────────────┼─────────┘
                                    │ Publish        │ Query
                         ┌──────────▼──────┐         │
                         │   RabbitMQ      │         │
                         │  (api_hits Q)   │         │
                         └──────────┬──────┘         │
                                    │ Consume         │
                         ┌──────────▼──────┐         │
                         │    Processor    │         │
                         │   (Consumer)    │         │
                         └──────┬──────────┘         │
                                │                    │
                   ┌────────────▼───┐   ┌────────────▼──────┐
                   │    MongoDB     │   │    PostgreSQL      │
                   │  (Raw Events)  │   │ (Aggregated Metrics│
                   │   api_hits     │   │ endpoint_metrics)  │
                   └────────────────┘   └───────────────────-┘
```

### Module Breakdown

| Module | Responsibility |
|---|---|
| **Auth** | Login, registration, super-admin onboarding, JWT token lifecycle |
| **Client** | Multi-tenant client (organisation) management, user provisioning, API key CRUD |
| **Ingest** | Receives raw API hit events, validates them, and publishes to RabbitMQ |
| **Processor** | RabbitMQ consumer — persists raw events to MongoDB and upserts aggregated metrics into PostgreSQL |
| **Analytics** | Serves dashboard stats, time-series data, and top-endpoint rankings from PostgreSQL |

---

## Features

### 📊 Dashboard & Analytics
- **Stats Overview**: Total hits, successful requests, error rate, average latency, unique services, unique endpoints
- **Time-Series Chart**: Visualise hit volume and latency over 24h / 7d / 30d windows (powered by Recharts)
- **Top Endpoints Table**: Ranked list of endpoints by traffic with error rates and latency stats
- **Time Bucket Aggregation**: Raw events are bucketed by the hour in PostgreSQL for efficient time-series queries

### 🔑 API Key Management
- API keys scoped per client / environment (`production`, `staging`, `development`, `testing`)
- Per-key permissions: `canIngest`, `canReadAnalytics`, `allowedServices`
- IP allowlisting and origin restrictions per key
- TTL-based expiry with configurable rotation warnings
- Keys auto-expire using MongoDB TTL indexes

### 👥 Multi-Tenancy & RBAC
- `super_admin` — manages all clients and users across the platform
- `client_admin` — manages users and API keys within their organisation
- `client_viewer` — read-only access to analytics

### 📥 Event Ingestion
- Single `POST /api/hit` endpoint authenticated via `x-api-key` header
- Rate limited per IP (configurable window & max requests)
- Event validated and published to RabbitMQ — **zero synchronous DB writes on the hot path**
- Each event carries: `serviceName`, `endpoint`, `method`, `statusCode`, `latencyMs`, `ip`, `userAgent`

### 🔄 Reliable Message Processing
- **Idempotency**: Processed message IDs are tracked to prevent double-counting
- **Retry Strategy**: Exponential backoff with jitter for transient failures
- **Dead Letter Queue**: Permanently failed or non-retryable messages are routed to `{queue}.dlq`
- **Circuit Breaker**: Opens on repeated failures, preventing cascade during outages
- **Poison Message Detection**: Consecutive failures per event type are tracked and flagged
- **Graceful Shutdown**: Handles `SIGINT` / `SIGTERM` by draining the channel cleanly

### 🔒 Security
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT-based authentication with configurable expiry (stored in httpOnly cookies)
- Helmet.js HTTP security headers
- Password policy enforcement (min length, uppercase, lowercase, numbers, symbols)
- Request logging (method, path, IP, user agent) via Winston

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js 20, Express.js 5 |
| **Frontend** | React 19, TypeScript 6, Vite 8 |
| **Primary DB** | MongoDB (raw events, users, clients, API keys) |
| **Analytics DB** | PostgreSQL 15 (aggregated endpoint metrics) |
| **Message Broker** | RabbitMQ 3 (with management UI) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Validation** | Zod (both frontend and backend) |
| **HTTP Client** | Axios (frontend) |
| **Charts** | Recharts |
| **State Management** | TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod resolvers |
| **Containerisation** | Docker + Docker Compose |
| **Logging** | Winston |
| **Styling** | Tailwind CSS v4 |

---

## Project Structure

```
api-monitoring-service/
├── server/                          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── server.js                # App entry point — wires middleware and routes
│   │   ├── db/
│   │   │   └── init.js              # Initialises MongoDB, PostgreSQL, and RabbitMQ connections
│   │   ├── middlewares/
│   │   │   ├── authenticate.js      # JWT validation middleware
│   │   │   ├── authorize.js         # Role-based access control
│   │   │   ├── validate.js          # Zod schema request validation
│   │   │   ├── validateApiKey.js    # x-api-key header validation
│   │   │   ├── errorHandler.js      # Centralised error handling
│   │   │   └── requestLogger.js     # Per-request Winston logging
│   │   ├── services/
│   │   │   ├── auth/                # Auth module (login, register, onboard)
│   │   │   ├── client/              # Client & API key management
│   │   │   ├── ingest/              # API hit ingestion
│   │   │   ├── analytics/           # Analytics queries
│   │   │   └── processor/           # RabbitMQ consumer
│   │   │       └── consumer.js      # EventConsumer with circuit breaker & retry
│   │   └── shared/
│   │       ├── config/              # App config, logger, DB clients
│   │       ├── constants/           # Role definitions
│   │       ├── events/              # eventContract, EventProducer, RetryStrategy, CircuitBreaker
│   │       ├── models/              # Mongoose schemas (ApiHit, ApiKey, Client, User)
│   │       └── utils/               # AppError, ResponseFormatter, SecurityUtils
│   ├── scripts/
│   │   └── init.postgres.sql        # PostgreSQL schema + indexes + triggers
│   ├── Dockerfile                   # API server image
│   ├── Dockerfile.consumer          # Message consumer image
│   └── docker-compose.yaml          # Full stack orchestration
│
└── web/                             # Frontend (React + TypeScript + Vite)
    └── src/
        ├── features/
        │   ├── auth/                # Login & onboarding pages
        │   ├── dashboard/           # DashboardPage, StatsCards, HitsChart, TopEndpointsTable
        │   ├── clients/             # Client management
        │   ├── api-keys/            # API key management
        │   └── users/               # User management
        ├── components/
        │   ├── layout/              # Header, Sidebar, ProtectedRoute
        │   └── ui/                  # Card, Button, Select, Skeleton, etc.
        ├── hooks/                   # useAuth, useAnalytics (TanStack Query)
        ├── context/                 # ClientContext (active client selection)
        ├── routes/                  # React Router v7 config
        ├── types/                   # TypeScript type definitions
        └── lib/                     # Formatters, axios instance, utils
```

---

## Data Flow

### Ingestion Path (Hot Path)
```
Your Service  →  POST /api/hit (x-api-key)
              →  validateApiKey middleware (MongoDB lookup)
              →  Rate Limiter
              →  IngestService.ingestApiHit()
              →  Publishes to RabbitMQ queue
              →  Returns { eventId, status: "queued" }
```

### Processing Path (Async)
```
RabbitMQ  →  EventConsumer._handleMessage()
          →  Idempotency check (in-memory Set)
          →  ProcessorService.processEvent()
              ├── Step 1: Save raw event to MongoDB (api_hits collection)
              └── Step 2: Upsert hourly aggregates into PostgreSQL (endpoint_metrics)
```

### Analytics Path (Read Path)
```
Dashboard  →  GET /api/analytics/dashboard (JWT)
           →  AnalyticService
               ├── getOverallStats()  → PostgreSQL
               ├── getTopEndpoints()  → PostgreSQL
               └── getTimeSeries()    → PostgreSQL
```

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/onboard-super-admin` | None | One-time super admin setup |
| `POST` | `/api/auth/login` | None | Login and receive JWT cookie |
| `POST` | `/api/auth/register` | JWT + super_admin | Register a new user under a client |
| `GET` | `/api/auth/get-profile` | JWT | Get authenticated user profile |
| `POST` | `/api/auth/logout` | JWT | Clear auth cookie |

### Client Management — `/api/admin/client`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/client/` | JWT | List all clients |
| `POST` | `/api/admin/client/onboard` | JWT | Create a new client organisation |
| `POST` | `/api/admin/client/:clientId/users` | JWT | Create a user under a client |
| `POST` | `/api/admin/client/:clientId/api-keys` | JWT | Generate an API key for a client |
| `GET` | `/api/admin/client/:clientId/get/api-keys` | JWT | List API keys for a client |

### Event Ingestion — `/api/hit`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/hit` | `x-api-key` header | Submit an API hit event |

**Request body:**
```json
{
  "serviceName": "my-service",
  "endpoint": "/api/users",
  "method": "GET",
  "statusCode": 200,
  "latencyMs": 45,
  "clientId": "<client-mongo-id>",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0"
}
```

**Quick integration snippets:**

```javascript
// JavaScript (axios)
await axios.post('http://localhost:8001/api/hit', {
  serviceName: 'my-service',
  endpoint: '/api/users',
  method: 'GET',
  statusCode: 200,
  latencyMs: 45,
}, { headers: { 'x-api-key': 'am-your-api-key' } });
```

```python
# Python
import requests
requests.post("http://localhost:8001/api/hit",
  headers={"x-api-key": "am-your-api-key"},
  json={"serviceName": "my-service", "endpoint": "/api/users",
        "method": "GET", "statusCode": 200, "latencyMs": 45})
```

```bash
# cURL
curl -X POST http://localhost:8001/api/hit \
  -H "Content-Type: application/json" \
  -H "x-api-key: am-your-api-key" \
  -d '{"serviceName":"my-service","endpoint":"/api/users","method":"GET","statusCode":200,"latencyMs":45}'
```

### Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/stats` | JWT | Time-series metrics (query: `startTime`, `endTime`, `serviceName`, `endpoint`, `limit`) |
| `GET` | `/api/analytics/dashboard` | JWT | Full dashboard payload (query: `startTime`, `endTime`, `clientId`) |

---

## Database Schema

### MongoDB Collections

#### `api_hits` — Raw event log

| Field | Type | Description |
|---|---|---|
| `eventId` | String | UUID, unique per event |
| `timestamp` | Date | When the hit occurred |
| `serviceName` | String | Source service name |
| `endpoint` | String | API endpoint path |
| `method` | String | HTTP method |
| `statusCode` | Number | HTTP response code |
| `latencyMs` | Number | Response time in milliseconds |
| `clientId` | ObjectId | Reference to Client |
| `apiKeyId` | ObjectId | Reference to ApiKey |
| `ip` | String | Caller IP address |
| `userAgent` | String | Caller user agent |

> **TTL**: Documents expire automatically after **30 days** via a MongoDB TTL index.

#### `clients` — Organisations

Fields: `name`, `slug`, `email`, `description`, `website`, `createdBy`, `isActive`, `settings.dataRetentionDays`, `settings.alertsEnabled`, `settings.timezone`

#### `api_keys` — API Keys

Fields: `keyId`, `keyValue`, `clientId`, `name`, `environment`, `isActive`, `permissions.canIngest`, `permissions.canReadAnalytics`, `permissions.allowedServices`, `security.allowedIPs`, `security.allowedOrigins`, `expiresAt`

> **TTL**: Keys expire automatically on the `expiresAt` field.

#### `users` — Users

Fields: `username`, `email`, `password` (bcrypt hashed), `role`, `clientId`, `isActive`, `permissions.canManageUsers`, `permissions.canCreateApiKeys`, `permissions.canViewAnalytics`, `permissions.canExportData`

### PostgreSQL Tables

#### `endpoint_metrics` — Aggregated time-series

| Column | Type | Description |
|---|---|---|
| `client_id` | VARCHAR(24) | MongoDB client ObjectId |
| `service_name` | VARCHAR(255) | Service name |
| `endpoint` | VARCHAR(500) | Endpoint path |
| `method` | VARCHAR(10) | HTTP method |
| `total_hits` | INTEGER | Total requests in this time bucket |
| `error_hits` | INTEGER | Requests with status ≥ 400 |
| `avg_latency_ms` | NUMERIC(10,3) | Average response latency |
| `min_latency_ms` | NUMERIC(10,3) | Minimum response latency |
| `max_latency_ms` | NUMERIC(10,3) | Maximum response latency |
| `time_bucket` | TIMESTAMP | Hourly time bucket |

A unique constraint on `(client_id, service_name, endpoint, method, time_bucket)` allows safe upserts.

---

## Role & Permission System

```
super_admin
  ├── Manages all clients and users across the platform
  └── Can view analytics for any client (client selector on dashboard)

client_admin
  ├── Manages users and API keys within their organisation
  └── Can view analytics for their client

client_viewer
  └── Read-only analytics access for their client
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### Option A — Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd api-monitoring-service/server

# Start all services
docker compose up -d

# Services available at:
# API Server:           http://localhost:8081
# RabbitMQ Management:  http://localhost:15672  (user: api_user)
# PgAdmin:              http://localhost:8080
```

### Option B — Local Development

**Backend:**
```bash
cd server

# Start infrastructure only (DBs + RabbitMQ)
docker compose up -d postgres mongo rabbitmq

# Install dependencies
npm install

# Start the API server
npm run dev                                      # http://localhost:8001

# In a second terminal — start the message consumer
node src/services/processor/consumer.js
```

**Frontend:**
```bash
cd web
cp .env.example .env    # Set VITE_API_URL=http://localhost:8001

npm install
npm run dev             # http://localhost:5173
```

### First-Time Setup

1. **Onboard the super admin** (works only when zero users exist in the system):
   ```bash
   curl -X POST http://localhost:8001/api/auth/onboard-super-admin \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","email":"admin@example.com","password":"Admin@1234"}'
   ```

2. **Login** via the dashboard at `/login` or the API.

3. **Create a Client** (organisation) via `/clients` or the API.

4. **Generate an API Key** for the client and start sending hit events to `/api/hit`.

---

## Environment Variables

**`server/.env`**

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server listening port | `8001` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/api_monitoring_db` |
| `MONGODB_DB` | MongoDB database name | `api_monitoring_db` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_USER` | PostgreSQL username | — |
| `POSTGRES_PASSWORD` | PostgreSQL password | — |
| `POSTGRES_DB` | PostgreSQL database name | `api_monitoring` |
| `RABBITMQ_URI` | RabbitMQ AMQP connection URI | `amqp://localhost:5672` |
| `RABBITMQ_QUEUE` | Queue name for API hit events | `api_monitoring_queue` |
| `RABBITMQ_PUBLISHER_CONFIRM` | Enable publisher confirms | `false` |
| `RABBITMQ_RETRY_ATTEMPTS` | Max consumer retry attempts | `5` |
| `RABBITMQ_RETRY_DELAY` | Base retry delay in ms | `1000` |
| `JWT_SECRET` | JWT signing secret (keep this secret!) | — |
| `JWT_EXPIRES_IN` | JWT token expiry duration | `1d` |
| `API_KEY_EXPIRY_DAYS` | Days until API keys expire | `365` |
| `PASSWORD_MIN_LENGTH` | Minimum password length | `8` |
| `PASSWORD_REQUIRE_UPPERCASE` | Require uppercase characters | `true` |
| `PASSWORD_REQUIRE_LOWERCASE` | Require lowercase characters | `true` |
| `PASSWORD_REQUIRE_NUMBERS` | Require numeric characters | `true` |
| `PASSWORD_REQUIRE_SYMBOLS` | Require symbol characters | `true` |

**`web/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API server |

---

## Docker Setup

The `docker-compose.yaml` in `server/` orchestrates the full stack:

| Service | Image | Exposed Port | Purpose |
|---|---|---|---|
| `postgres` | postgres:15-alpine | 5432 | Aggregated metrics (endpoint_metrics table) |
| `mongo` | mongo:latest | 27017 | Raw events, users, clients, API keys |
| `rabbitmq` | rabbitmq:3-management-alpine | 5672 / 15672 | Message broker + management dashboard |
| `pgadmin` | dpage/pgadmin4 | 8080 | PostgreSQL browser UI |
| `api-app` | Custom (Dockerfile) | 8081 | Express.js REST API server |
| `consumer` | Custom (Dockerfile.consumer) | — | RabbitMQ message consumer process |

**Health checks** are configured for `postgres` and `rabbitmq`. The API server and consumer wait for these to be healthy before starting.

**Persistent volumes**: `postgres_data`, `mongo_data`, `rabbitmq_data`, `pgadmin_data` — your data survives container restarts.

---

## Frontend

The React frontend provides:

| Page | Route | Access |
|---|---|---|
| Login | `/login` | Public |
| Super Admin Onboard | `/onboard` | Public (one-time only) |
| Dashboard | `/dashboard` | All authenticated users |
| Clients | `/clients` | super_admin |
| API Keys | `/api-keys` | super_admin, client_admin |
| Users | `/users` | super_admin, client_admin |

Key frontend highlights:
- **TanStack Query** handles server state caching, background refetching, and loading states
- **Recharts** powers the time-series hit volume charts
- **Integration Guide** card on the dashboard provides ready-to-copy code snippets (JS / Python / cURL)
- Super admins see a **client selector** on the dashboard to switch between organisations
- All routes are **lazy-loaded** for optimal bundle splitting

---

## Reliability Patterns

| Pattern | Implementation |
|---|---|
| **Retry with Exponential Backoff** | `RetryStrategy` class — configurable max retries, base delay, max delay cap, and jitter factor |
| **Circuit Breaker** | `CircuitBreaker` class — opens on N consecutive failures, half-open probe after cooldown window |
| **Dead Letter Queue** | Messages exceeding max retries or marked non-retryable are routed to `{queue}.dlq` |
| **Idempotency** | In-memory `Set<messageId>` with LRU-style eviction at 10,000 entries |
| **Poison Message Detection** | Consecutive failure counter per event type; logged and flagged at threshold |
| **Graceful Shutdown** | `SIGTERM` / `SIGINT` handlers drain the RabbitMQ channel and close DB connections |
| **Publisher Confirms** | Configurable via `RABBITMQ_PUBLISHER_CONFIRM` for at-least-once delivery guarantee |
| **Dual Database Strategy** | MongoDB for high-write raw events; PostgreSQL for efficient analytical aggregate queries |

---

## License

ISC
