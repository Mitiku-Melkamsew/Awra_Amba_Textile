# Awra Amba Textile Cooperative

Web application for weaver settlement, stock tracking, and HISAB reporting.

## Stack (simplified)

| Layer | Technology |
|-------|------------|
| API | Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Frontend | React + Vite + TypeScript |

## Quick start

### 1. Database

```bash
docker compose up -d
```

PostgreSQL runs on **port 5433** (avoids conflict with a local Postgres on 5432).

### 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run db:triggers
npm run test:triggers
npm run dev
```

API runs at `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173`.

## API endpoints

**Auth**
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

**Production**
- `GET/POST /api/v1/weavers`
- `GET/POST /api/v1/work-orders`
- `PATCH /api/v1/work-orders/:zigId/status`
- `POST /api/v1/yarn-given`
- `POST /api/v1/fabric-returns`
- `GET /api/v1/catalog/fabric-variants`

**Calculations & Settlement**
- `POST /api/v1/calculations/deduction`
- `POST /api/v1/calculations/bonus`
- `POST /api/v1/calculations/settlements/preview`
- `POST /api/v1/calculations/settlements/commit`
- `GET /api/v1/payments`
- `GET /api/v1/reports/hisab/:paymentId?format=csv`

**Data migration**
- `CSV_DIR="path/to/csv/folder" npm run import:csv` (expects `weavers.csv`, `zigs.csv`, `yarn_given.csv`, `fabric_returned.csv`)

## Default admin (after seed)

- Username: `admin`
- Password: `admin123`