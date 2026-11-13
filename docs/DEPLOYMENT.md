# Production Deployment & Security Guide

This document describes how to deploy, configure, and operate the **Awra Amba Textile Cooperative** platform in a production environment.

---

## 1. Environment & Architecture Overview

The system consists of:
- **Backend API**: Node.js / Express TypeScript application (`backend/`)
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Web Frontend**: React 19 + TypeScript SPA built with Vite (`frontend/`)
- **Mobile App**: Flutter application (`mobile/`)
- **Reverse Proxy**: Nginx, Caddy, or Cloudflare terminating TLS/HTTPS and routing traffic

---

## 2. Security Baseline

### 2.1 Environment Secrets Protection
- `.env` files are strictly ignored by `.gitignore` (`.env`, `*.env`, `backend/.env`, `frontend/.env`, etc.).
- Never commit `.env` or production credentials to git.
- Only `.env.example` templates with generic placeholders are tracked in git.

### 2.2 JWT Authentication
- The backend verifies that `JWT_SECRET` is set and is **not** a placeholder string. If it is missing or unchanged, the server will intentionally fail to start.
- Minimum recommended secret length: 64 characters (generated via crypto/openssl).
- Tokens expire by default in `8h` (configurable via `JWT_EXPIRES_IN`).

### 2.3 Passwords & RBAC
- Passwords are encrypted using **Argon2id**.
- Password complexity is enforced on signup and password reset: minimum 8 characters, containing at least one uppercase letter, one lowercase letter, and one number.
- 1-Click demo logins and hardcoded credentials (`admin123`, `demo123`, `merchant123`) have been purged from all production-facing UI and documentation.
- Granular capability-based access control (RBAC & ABAC) protects all admin and sensitive endpoints.

### 2.4 Network & Transport Security
- **Security Headers Middleware**: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and strips `X-Powered-By`.
- **CORS**: In production (`NODE_ENV=production`), CORS strictly matches configured origins (`CORS_ORIGIN`). Wildcards and arbitrary localhost ports are disabled in production.
- **Rate Limiting**: Built-in IP rate limiter protects authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/signup`) against brute-force attacks (10 attempts per 15 minutes).
- **Request Body Limits**: JSON payloads are limited to 1MB to prevent memory exhaustion / denial-of-service.

---

## 3. Step-by-Step Production Deployment

### 3.1 Provisioning PostgreSQL

Ensure PostgreSQL 16+ is running. Set strong credentials in your environment.

Example docker-compose configuration:
```bash
POSTGRES_USER=awra_amba_prod \
POSTGRES_PASSWORD=GENERATE_STRONG_RANDOM_PASSWORD \
POSTGRES_DB=awra_amba_textile \
docker compose up -d postgres
```

### 3.2 Backend Configuration

1. In `backend/`, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in production values:
   ```env
   DATABASE_URL="postgresql://awra_amba_prod:GENERATE_STRONG_RANDOM_PASSWORD@your-db-host:5432/awra_amba_textile?schema=public"
   JWT_SECRET="GENERATE_64_CHAR_RANDOM_KEY_HERE_USING_OPENSSL"
   JWT_EXPIRES_IN="8h"
   PORT=3001
   NODE_ENV="production"
   CORS_ORIGIN="https://textile.yourdomain.com"
   ```

3. Install production dependencies and run migrations:
   ```bash
   cd backend
   npm ci --omit=dev
   npx prisma migrate deploy
   ```

4. Create the initial administrative account safely:
   ```bash
   npm run admin:create
   ```
   *Follow the interactive prompt to set a strong, private administrator password.*

5. Build and launch with a process manager (e.g., PM2, systemd, or Docker):
   ```bash
   npm run build
   node dist/index.js
   # Or using PM2:
   pm2 start dist/index.js --name "awra-amba-api"
   ```

### 3.3 Frontend Configuration

1. In `frontend/`, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Configure the production API URL:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api/v1
   ```

3. Build the static assets:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

4. The built files in `frontend/dist/` should be served by Nginx or your static hosting provider.

### 3.4 Reverse Proxy Configuration (Nginx Example)

```nginx
server {
    listen 80;
    server_name textile.yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name textile.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/awra-amba-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. Production Readiness Checklist

Before going live, verify each item:

- [ ] **Secrets**: No `.env` files are tracked in git (`git status` shows clean).
- [ ] **JWT_SECRET**: Set to a cryptographically random string (e.g. `openssl rand -base64 64`).
- [ ] **NODE_ENV**: Set to `production` in the backend environment.
- [ ] **Database Seed**: `prisma/seed.ts` is guarded and will not run in production.
- [ ] **Admin Account**: Created via `npm run admin:create` with a unique, secure password.
- [ ] **HTTPS / TLS**: All traffic is routed over HTTPS with valid certificates.
- [ ] **CORS**: `CORS_ORIGIN` matches the exact frontend domain(s).
- [ ] **Rate Limiting**: Tested and verified on `/api/v1/auth/login`.
- [ ] **Backups**: Automated PostgreSQL dumps (pg_dump) configured on a daily schedule.
- [ ] **Monitoring**: Health check endpoint monitored at `GET /api/v1/health`.
