# Limi Claw Fleet Management System (LCFMS)

A production-grade, AI-powered fleet management platform built with modern web technologies.

## Architecture

```
lcfms/
├── apps/
│   ├── api/              # Express.js backend API
│   └── web/              # Next.js frontend dashboard
├── packages/
│   ├── database/         # Prisma schema & migrations
│   └── shared/           # Shared types & utilities
├── infra/
│   ├── docker/           # Docker Compose for local dev
│   ├── k8s/              # Kubernetes deployment manifests
│   └── terraform/        # AWS infrastructure (optional)
└── package.json          # Workspace root with Turbo
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript |
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 (ioredis) |
| Real-time | Socket.IO |
| Charts | Recharts |
| Maps | Mapbox GL |
| State | Zustand (client), React Query (server) |
| Auth | JWT (access + refresh tokens) |
| Container | Docker + Kubernetes |

## Features

- **Real-time Vehicle Tracking** — GPS location updates via Socket.IO
- **Driver Management** — Profiles, safety scores, behavior analysis
- **Fuel Management** — Consumption tracking, anomaly detection, cost analysis
- **Maintenance Scheduling** — Automated reminders, predictive maintenance
- **Geofencing** — Inclusion/exclusion zones, speed limits, idle zones
- **Alerts & Notifications** — Over-speeding, geofence violations, maintenance due
- **AI Assistant** — Rule-based fleet health insights, maintenance predictions
- **Reports** — CSV, PDF, JSON exports for all modules
- **Role-based Access** — Admin, Manager, Viewer roles
- **Dark Mode** — Full UI support

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### 1. Install dependencies
```bash
cd lcfms
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start infrastructure (Docker)
```bash
cd infra/docker
docker-compose up -d
```

### 4. Run database migrations
```bash
cd packages/database
npx prisma migrate dev
npx prisma generate
```

### 5. Seed data (optional)
```bash
npx prisma db seed
```

### 6. Start development
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### 7. Access the app
- Frontend: http://localhost:3000
- API: http://localhost:4000
- API docs: http://localhost:4000/health

## API Endpoints

| Module | Routes |
|--------|--------|
| Auth | POST /api/auth/register, /login, /refresh, /logout |
| Vehicles | CRUD + filters + search + history |
| Drivers | CRUD + filters + performance analytics |
| Trips | CRUD + trip replay + end logic |
| Fuel | CRUD + anomaly detection + efficiency analytics |
| Maintenance | CRUD + upcoming due + complete |
| Alerts | List + read + resolve + summary |
| Geofences | CRUD + soft delete |
| Reports | CSV, PDF, JSON exports |
| AI | Chat + predictive maintenance |
| Analytics | Fleet-wide aggregation |
| Settings | Company settings read/update |

## Deployment

### Docker
```bash
cd infra/docker
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/deployment.yaml
```

### Terraform (AWS)
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## Environment Variables

See `.env.example` for all required variables.

## Project Status

This is a fully functional production-ready fleet management system. All core modules are implemented including:

- ✅ Complete backend API with auth, caching, rate limiting
- ✅ Prisma schema with 18 models
- ✅ Frontend dashboard with 12+ pages
- ✅ Real-time socket integration
- ✅ AI assistant with rule-based insights
- ✅ Docker & Kubernetes configs
- ✅ Dark mode support

## License

MIT
