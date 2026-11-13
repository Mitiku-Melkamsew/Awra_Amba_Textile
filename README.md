# Awra Amba Textile Cooperative

Enterprise web and mobile management platform for weaver settlements, inventory management, commercial transactions, and HISAB reporting.

## Stack

| Layer | Technology |
|-------|------------|
| API | Express + TypeScript + Prisma ORM |
| Database | PostgreSQL 16+ |
| Web Frontend | React 19 + Vite + TypeScript |
| Mobile | Flutter + Dart (iOS / Android / Web) |

## Quick Start (Development)

### 1. Database

```bash
docker compose up -d postgres
```

PostgreSQL runs on **port 5433** by default.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run admin:create     # Interactively create your initial admin account
npm run db:triggers
npm run dev
```

API runs at `http://localhost:3001/api/v1`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

UI runs at `http://localhost:5173`.

## Authentication & Initial Accounts

For security, hardcoded default credentials have been removed. 
- In development and production, use `npm run admin:create` in `backend/` to initialize or update your admin user with a strong password.
- New weavers and merchants can register via the registration page or be invited by an administrator.

## API Documentation & Postman

The complete standardized REST API collection is available in:
- [`docs/postman-collection.json`](docs/postman-collection.json)

Import this JSON collection directly into Postman to test all endpoints. It includes automatic Bearer token capturing upon login and parameterized `{{base_url}}`.

For production deployment instructions, checklist, and security policies, see:
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
