# Comprehensive Security Vulnerability & Production Readiness Audit
**Repository**: `Awra_Amba_Textile`  
**Branch Audited**: `production-hardening` (Commit `9bb342b`)  
**Scope**: Full Stack — Backend (Node.js/Express/TypeScript + Prisma), Frontend (React 19/Vite), Database (PostgreSQL), Mobile (Flutter), Infrastructure (Docker/Nginx/CI)  
**Date**: November 2026  
**Auditor**: Antigravity Security & Architecture Agent  

---

## 1. Executive Assessment

The `production-hardening` branch was created to address vulnerabilities identified in development. A review of commit `9bb342b` confirms that several foundational security improvements were made:
- 1-click demo logins were removed from the web login page.
- Direct seeding of hardcoded passwords in production was disabled via a guard in `backend/prisma/seed.ts`.
- An interactive administrative creation script (`backend/scripts/create-admin.ts`) was created.
- HTTP security headers (`nosniff`, `DENY`, `HSTS`, `Permissions-Policy`) and express body limits (`1mb`) were introduced.
- Basic sliding-window rate limiting was added to `/api/v1/auth/login` and `/api/v1/auth/signup`.
- Route-level and capability-based authorization (`RbacService` and `AbacService`) was introduced with domain error handling.

> **Production Readiness Verdict: NOT YET PRODUCTION READY.**  
> While the baseline improvements are positive, our deep audit identified **1 Critical configuration flaw** that causes a **Denial of Service for all users behind a reverse proxy**, **1 High-Severity financial inventory race condition**, **4 Medium-Severity security vulnerabilities**, and **6 major operational/infrastructure blockers** that will cause deployment and CI/CD failures.

---

## 2. Vulnerability Register

| Finding ID | Severity | Category | File & Line | Summary |
|---|---|---|---|---|
| **VULN-01** | **HIGH / CRITICAL** | Denial of Service (DoS) | `backend/src/app.ts:19-75`<br>`rate-limit.ts:22` | Missing `trust proxy` setting causes rate limiter to treat all users behind Nginx/ALB as `127.0.0.1`, locking out the entire application after 10 requests. |
| **VULN-02** | **HIGH** | Financial / Inventory Integrity | `direct-transaction.service.ts:282-308`<br>`work-order.service.ts:186-204, 298-318` | Concurrent inventory transactions cause race condition overselling and negative stock due to non-locking reads in `READ COMMITTED` and missing DB check constraint. |
| **VULN-03** | **MEDIUM** | Authentication / Credential Security | `user.service.ts:43-54, 186-189`<br>`user.dto.ts:5-15` | Default user password generation is completely predictable (`CapitalizedFirstWord@123`), and `CreateUserSchema` lacks password complexity validation. |
| **VULN-04** | **MEDIUM** | Session / Token Management | `auth.controller.ts:129-150`<br>`jwt.ts:12-18` | Changing password or disabling a user does not revoke active JWTs; compromised tokens remain valid for up to 8 hours. |
| **VULN-05** | **MEDIUM** | Rate Limiting Architecture | `rate-limit.ts:8-16` | In-memory `Map` rate limiter is process-local (fails in multi-process/cluster deployments like PM2 or Docker replicas) and lacks an upper-bound size limit. |
| **VULN-06** | **MEDIUM** | Mobile Credential Storage | `mobile/lib/core/storage/token_storage.dart:18` | Flutter mobile client stores JWT in unencrypted `SharedPreferences` rather than OS secure storage (`flutter_secure_storage`). |

---

## 3. Deep-Dive Vulnerability Analysis & Technical Remediation

### VULN-01: Missing `trust proxy` Setting Causes Reverse-Proxy Denial of Service
- **Location**: `backend/src/app.ts` & `backend/src/presentation/middleware/rate-limit.ts:22`
- **Mechanism**:
  In `rate-limit.ts`, the client IP is extracted as:
  ```typescript
  const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
  ```
  However, in `backend/src/app.ts`, Express does not have `app.set("trust proxy", 1)` enabled. As documented in `docs/DEPLOYMENT.md`, production deploys behind an Nginx or ALB reverse proxy. Without `trust proxy`, Express ignores `X-Forwarded-For` and reports `req.ip` as `127.0.0.1` (or the proxy's IP) for **every single client request**.
- **Impact**:
  When any user attempts 10 logins (or an attacker sends 10 requests from anywhere), the rate limiter blocks `127.0.0.1`. **All legitimate users, merchants, weavers, and administrators worldwide are immediately locked out with HTTP 429 for 15 minutes.**
- **Remediation**:
  In `backend/src/app.ts`, configure proxy trust:
  ```typescript
  export function createApp() {
    const app = express();
    app.set("trust proxy", 1); // Trust first hop reverse proxy (Nginx / Cloudflare / AWS ALB)
    app.disable("x-powered-by");
    // ...
  ```

---

### VULN-02: Inventory Stock Decrement Concurrency Race Condition (Double-Spend)
- **Location**:
  - `backend/src/services/direct-transaction.service.ts` lines 282–308
  - `backend/src/application/services/work-order.service.ts` lines 186–204, 298–318, 378–386, 722–740
- **Mechanism**:
  When selling fabric/yarn or issuing yarn to weavers, the code executes:
  ```typescript
  // 1. Non-locking SELECT
  const current = await tx.fabricVariant.findUniqueOrThrow({
    where: { fabricVariantId: line.fabricVariantId! },
  });
  // 2. In-memory quantity check
  if (Number(current.stockSnapshot) < Number(line.quantity)) {
    throw new Error("INSUFFICIENT_STOCK...");
  }
  // 3. Decrement
  await tx.fabricVariant.update({
    where: { fabricVariantId: line.fabricVariantId! },
    data: { stockSnapshot: { decrement: line.quantity } },
  });
  ```
  In PostgreSQL under the default `READ COMMITTED` isolation level, `findUniqueOrThrow` does **not** acquire a lock (`FOR UPDATE`). When two requests execute concurrently for the same variant with low stock, both read the same snapshot, both pass the check, and both execute the decrement.
  Furthermore, `prisma/schema.prisma` does not have a database check constraint (`CHECK (stock_snapshot >= 0)`).
- **Impact**:
  Stock snapshots drop into negative numbers, creating physical inventory discrepancies, duplicate allocations to weavers, or overselling to merchants.
- **Remediation**:
  1. Add a PostgreSQL check constraint via Prisma migration:
     ```sql
     ALTER TABLE "fabric_variants" ADD CONSTRAINT "chk_fabric_stock_non_negative" CHECK ("stock_snapshot" >= 0);
     ALTER TABLE "yarn_variants" ADD CONSTRAINT "chk_yarn_stock_non_negative" CHECK ("stock_snapshot" >= 0);
     ```
  2. Perform atomic conditional updates or row-level locking inside the transaction:
     ```typescript
     const updated = await tx.fabricVariant.updateMany({
       where: {
         fabricVariantId: line.fabricVariantId!,
         stockSnapshot: { gte: line.quantity },
       },
       data: { stockSnapshot: { decrement: line.quantity } },
     });
     if (updated.count === 0) {
       throw new ConflictError(`Insufficient stock for fabric variant ${line.fabricVariantId}`);
     }
     ```

---

### VULN-03: Predictable Default User Passwords & Missing Creation Validation
- **Location**: `backend/src/application/services/user.service.ts:43-54, 186-189` and `backend/src/presentation/dtos/user.dto.ts:5-15`
- **Mechanism**:
  When an administrator creates a user without explicitly supplying a password (or if it is shorter than 4 characters), the system falls back to:
  ```typescript
  export function generatePasswordFromName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstWord = parts[0] || "User";
    const cleanedFirst = firstWord.replace(/[^a-zA-Z0-9]/g, "");

    if (cleanedFirst.length >= 2) {
      const capitalized = cleanedFirst.charAt(0).toUpperCase() + cleanedFirst.slice(1).toLowerCase();
      return `${capitalized}@123`;
    }
    return `Awra@${Math.floor(1000 + Math.random() * 9000)}`;
  }
  ```
  Additionally, in `backend/src/presentation/dtos/user.dto.ts`, `CreateUserSchema` does not apply the password complexity regex (unlike `SignupSchema` and `ResetPasswordSchema`).
- **Impact**:
  An attacker who knows or observes the full name of a new weaver or merchant (which is visible in public reports or portal records) can trivially authenticate as that user on first login.
- **Remediation**:
  1. Generate cryptographically random temporary passwords (e.g. `crypto.randomBytes(9).toString("base64")`) or require an activation link/token.
  2. Enforce complexity validation on `CreateUserSchema`:
     ```typescript
     password: passwordSchema.optional().nullable(),
     ```

---

### VULN-04: Lack of JWT Invalidation on Credential Change / Deactivation
- **Location**: `backend/src/presentation/controllers/auth.controller.ts:129-150` & `backend/src/utils/jwt.ts`
- **Mechanism**:
  JWT tokens are signed with an 8-hour expiry (`JWT_EXPIRES_IN="8h"`). When a user changes their password (`/change-password`), when an admin resets their password (`/:id/reset-password`), or when a user is deactivated (`/:id/status`), existing JWTs issued prior to that action remain completely valid until natural expiration.
- **Impact**:
  If an administrator discovers a compromised account and changes the password or disables the user, the attacker retains full API access for up to 8 hours.
- **Remediation**:
  Add a `tokenVersion Int @default(1)` field to the `User` model. Include `tokenVersion` in the JWT payload. On password change or user deactivation, increment `tokenVersion`. In `authenticate.ts`, verify that `user.tokenVersion === payload.tokenVersion` (or maintain a token invalidation timestamp).

---

### VULN-05: In-Memory Rate Limiting Not Production-Clustered
- **Location**: `backend/src/presentation/middleware/rate-limit.ts:8-16`
- **Mechanism**:
  The rate limiter uses an in-memory JavaScript `Map<string, RateLimitEntry>`.
  1. When deploying with PM2 cluster mode or across multiple Docker/Kubernetes replicas, each worker process maintains an isolated map. An attacker has `N * 10` attempts before hitting limits.
  2. The map has no maximum size limit. A distributed attack using random spoofed IP headers could cause high memory consumption.
- **Remediation**:
  In multi-replica production environments, integrate standard Redis-backed rate limiting (e.g. `rate-limit-redis` with `express-rate-limit`).

---

### VULN-06: Mobile App Unencrypted Token Storage
- **Location**: `mobile/lib/core/storage/token_storage.dart:18`
- **Mechanism**:
  The mobile client stores authentication tokens using `SharedPreferences`:
  ```dart
  await _prefs.setString(_keyToken, token);
  ```
  `SharedPreferences` writes data in plain XML on Android and plist on iOS, unprotected from local extraction on rooted/jailbroken devices or physical device backups.
- **Remediation**:
  Replace `SharedPreferences` with `flutter_secure_storage` which utilizes Android Keystore and iOS Keychain.

---

## 4. Production Readiness Operational Gaps

### PROD-01: Test Suite Fails in Clean CI/CD Pipelines
- **Evidence**: Executing `npm test` inside `backend/` results in test exit code `1`:
  ```
  FAIL src/services/system-redesign.integration.test.ts > System Redesign Integration
  PrismaClientInitializationError: Can't reach database server at localhost:5433
  ```
- **Root Cause**:
  `system-redesign.integration.test.ts` connects to a live database at port 5433 and attempts to fetch hardcoded accounts (`admin`, `demo`, `merchant`). It runs alongside unit tests during `npm test`.
- **Fix**:
  1. Split test scripts in `backend/package.json`:
     ```json
     "test": "vitest run --exclude '**/*.integration.test.ts'",
     "test:integration": "vitest run --include '**/*.integration.test.ts'"
     ```
  2. In `system-redesign.integration.test.ts`, dynamically provision test users rather than relying on legacy seed data.

---

### PROD-02: Health Check Does Not Verify Database Liveness
- **Evidence**: `backend/src/presentation/routes/health.routes.ts`:
  ```typescript
  healthRouter.get("/", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  ```
- **Root Cause**:
  The endpoint returns HTTP 200 without testing the database connection. If PostgreSQL crashes, connection limits are reached, or database migrations fail, orchestrators (Kubernetes, AWS ALB, Docker health checks) will still treat the backend as healthy and route client requests into failures.
- **Fix**:
  ```typescript
  healthRouter.get("/", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "unhealthy", error: "Database unreachable" });
    }
  });
  ```

---

### PROD-03: Missing Graceful Process Shutdown
- **Evidence**: `backend/src/index.ts`:
  ```typescript
  const app = createApp();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Awra Amba API listening on http://localhost:${port}`);
  });
  ```
- **Root Cause**:
  No listeners for `SIGTERM` or `SIGINT`. When the application is restarted by PM2, Docker, or Kubernetes during rolling deployments, all running requests and open Prisma database connections are abruptly severed.
- **Fix**:
  ```typescript
  const server = app.listen(port, "0.0.0.0", () => { ... });
  
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  ```

---

### PROD-04: Missing Containerization for Backend & Frontend
- **Evidence**:
  `docker-compose.yml` only defines the `postgres` service. Neither `backend/Dockerfile` nor `frontend/Dockerfile` exists.
- **Impact**:
  Production deployments cannot be reliably packaged into immutable container images, making cloud deployment (AWS ECS, GCP Cloud Run, Kubernetes) manual and host-dependent.
- **Fix**:
  Create multi-stage production Dockerfiles for `backend` (using Node 22-alpine, non-root user) and `frontend` (building static dist and serving via Nginx alpine). Update `docker-compose.yml` to orchestrate all services.

---

### PROD-05: Missing Structured Production Logger & Observability
- **Evidence**:
  The application uses `console.log` and `console.error` in `errorHandler` and services.
- **Impact**:
  In production, logs cannot be easily filtered, indexed, or monitored by log aggregation systems (Datadog, Grafana Loki, CloudWatch). There are no request IDs to trace requests from frontend through to backend database queries.
- **Fix**:
  Introduce a structured logger like `pino` or `winston` with an HTTP logging middleware (e.g. `pino-http`) that tags each request with a unique UUID (`X-Request-Id`).

---

### PROD-06: Dead / Broken Scripts in `package.json`
- **Evidence**:
  - `backend/package.json` has `"db:triggers": "tsx scripts/apply-triggers.ts"`, which fails because `prisma/sql/post-migrate.sql` does not exist.
  - `backend/scripts/test-triggers.ts` queries obsolete models (`prisma.weaver`) that no longer exist in Prisma client.
- **Fix**:
  Remove or update obsolete scripts to maintain clean build hygiene.

---

## 5. Prioritized Production Remediation Plan

1. **Phase 1 (Immediate / Blockers)**:
   - Add `app.set("trust proxy", 1)` in `backend/src/app.ts`.
   - Add DB check constraints on `stock_snapshot >= 0` and implement row locking or atomic update guards.
   - Enforce password complexity on `CreateUserSchema` and replace deterministic password generation with secure random tokens.
2. **Phase 2 (Reliability & CI)**:
   - Separate unit tests from integration tests so `npm test` passes reliably in CI.
   - Add database ping to `/api/v1/health`.
   - Add graceful shutdown handlers (`SIGTERM`/`SIGINT`) to `backend/src/index.ts`.
3. **Phase 3 (Operational Hardening)**:
   - Create production multi-stage `Dockerfile` for backend and frontend.
   - Replace in-memory rate limiting with Redis-backed storage for multi-instance deployments.
   - Migrate mobile token storage to `flutter_secure_storage`.
