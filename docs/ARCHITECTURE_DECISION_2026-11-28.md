# Architecture Decision — Selective Decoupling vs. Full Rewrite

**Date:** 28 Nov 2026
**Status:** Proposed — awaiting decision
**Supersedes:** nothing
**Related:** `docs/AUDIT_2026-11-27.md`, `docs/SRS.md`

---

## 1. Context

The backend is a modular monolith:

```
backend/src/
  domain/          errors, rules, security (8 files)
  application/     services + security (15 non-test files)
  infrastructure/  password hashing (1 file)
  presentation/    controllers, DTOs, middleware, routes (40 files)
  lib/prisma.ts    Prisma singleton
```

It works. Builds are clean, 108 tests pass, and the audit remediation commit fixed every non-mobile critical/high finding. But the layers are separated by **folder**, not by **dependency direction**:

- 14 of 15 application files import `lib/prisma` directly.
- 3 controllers and the auth middleware also query Prisma.
- Domain rules import `@prisma/client` enums.
- Three pure rule modules (`calculation.rules.ts`, `stock.rules.ts`, `pricing.rules.ts`) are used only by tests; production re-implements the logic inline.
- Services return Prisma rows with `include` graphs, so the HTTP contract is the database schema. The H2 field-name bug was a direct symptom.
- On the frontend, a 1,180-line `api.ts` facade is still imported by 50 files, next to 12 infrastructure services.

A previous review proposed a full ports-and-adapters refactor: repository interfaces for every aggregate, domain entities, mappers, a unit-of-work, and dependency-boundary linting.

The question: **should we keep the current code, or refactor to that full design?**

---

## 2. Decision

**Keep the current architecture. Refactor selectively. Do not do a full hexagonal rewrite.**

Adopt a **modular monolith with explicit contracts**:

1. **Stabilize the HTTP contract** with response serializers/DTOs — presentation stops depending on database shape.
2. **Remove persistence from presentation** — controllers and middleware call use cases only.
3. **Introduce repository ports only for the 4–5 high-churn domains** (auth/session, users, settlements, work orders, direct transactions).
4. **Make the domain rules real** — wire them into production or delete them.
5. **Leave low-churn CRUD and report queries on Prisma** — a pass-through repository over Prisma adds indirection without benefit.
6. **Enforce boundaries with tooling** so the code does not drift back.

Phases 0 and 1 are mandatory. Phase 2 is recommended. Phase 3 (full entity mapping for every table) is optional and deferred until a trigger in §8 fires.

---

## 3. Why not the full rewrite

The full design is correct in the textbook sense, but it is a poor trade for this codebase today.

| Cost | Impact |
|---|---|
| Repository interface + Prisma implementation + mapper for ~25 tables | ~60–80 new files, mostly pass-through |
| Dependency injection / composition root | Rewires every service and test |
| Domain entities duplicated from Prisma models | Two models to keep in sync, more mapping bugs |
| Estimated effort | 6–10 weeks, high regression risk |
| Ongoing cost | Every new field touches entity + mapper + DTO + repo + serializer |

Most of the backend is CRUD (catalog, colors, designs, suppliers, stock lookups) or read-only reporting. For those modules, a repository over Prisma is a wrapper that forwards calls. The decoupling benefit is near zero; the file count and cognitive load are not.

**Uniform architecture is itself a complexity trap.** Applying the same pattern to every module treats low-risk CRUD as if it were high-risk financial logic.

## 4. Why not keep everything as-is

The current coupling already causes real defects and slows changes:

- **API = DB shape** — the H2 bug (UI reading `netPayableBalance` while the backend returned `directPurchasePayable`) came from having no response contract.
- **Duplicated business rules** — stock and pricing logic exists twice (dead rules + inline service code), so a change can fix one copy and miss the other.
- **Persistence in controllers** — auth, weaver portal, and direct transactions cannot be tested or reused without HTTP and Prisma.
- **Untestable without the ORM** — 5 of 13 test files mock `lib/prisma`; tests know the database.
- **God services** — `settlement.service.ts` is 1,262 lines, `catalog.service.ts` 1,015.

Doing nothing means these costs keep compounding, and the next audit finds the same class of bug.

---

## 5. What "decoupled" should mean here

There are three levels. We should buy level 1 and 2, and only selectively buy level 3.

### Level 1 — Contract decoupling (mandatory, cheap, high value)
Presentation owns the response shape. Services may still use Prisma internally, but controllers return serialized DTOs, never raw rows.

- **Removes:** "rename a DB column → break the UI".
- **Cost:** low. Serializers for auth/user, work order, catalog, settlement, report.
- **Payoff:** immediate. This is where most production bugs came from.

### Level 2 — Persistence decoupling (recommended for core domains)
Application defines ports; infrastructure implements them with Prisma. Controllers and middleware never import `lib/prisma`.

- **Removes:** "change the ORM/DB → rewrite business logic"; "test business logic without a database".
- **Cost:** medium. Worth it for auth/session, users, settlements, work orders, direct transactions.
- **Not worth it for:** colors, designs, suppliers, catalog lookups, report queries.

### Level 3 — Model decoupling (optional, defer)
Domain entities and value objects independent of Prisma; enums mapped at the repository edge.

- **Removes:** "the domain cannot be understood without `@prisma/client`".
- **Cost:** high. Two models to maintain, mapper code for every aggregate.
- **Trigger:** only when a condition in §8 is met.

### A note on reports
Reports are **read models**, not aggregates. Forcing them through entity repositories is an anti-pattern. Keep report queries on Prisma, but give them typed response DTOs. This is a legitimate CQRS-lite split, not a compromise.

---

## 6. Scope by module

| Module | Current pain | Decision |
|---|---|---|
| Auth / session | Login, signup, profile, password, token all in `auth.controller.ts`; middleware queries Prisma | **Level 2.** Extract `AuthService` + `SessionService`, repository port, serializer |
| Users | Service + controller mix; DTO duplicates input type | **Level 2.** Repository port, serializer, reuse validated params |
| Settlements | 1,262-line service; calculations inline | **Level 2 + rule extraction.** Repository port, move rules to `domain/` |
| Work orders | 722-line service; `tx: any`; inline stock checks | **Level 2 + rule extraction.** Repository port, typed transaction runner |
| Direct transactions | 665-line service; stock logic duplicated | **Level 2.** Repository port, wire `stock.rules.ts` |
| Reports | Raw rows to API; some N+1 already fixed | **Level 1 only.** Typed read DTOs; keep Prisma queries |
| Catalog (fabrics, yarns, variants, prices, quality rules) | 1,015-line service, but mostly CRUD | **Level 1 only.** Serializers; leave Prisma |
| Colors / designs / suppliers / stock lookups | CRUD | **Leave as-is.** Serializer at most |
| Audit | Already thin, typed `DbClient` leak | **Low priority.** Replace `DbClient` with a transaction port when touched |

---

## 7. Phased plan

Effort estimates assume one developer familiar with the code.

### Phase 0 — Contract boundary (3–5 days)
- Add `presentation/serializers/` and typed response DTOs.
- Stop returning raw Prisma rows from controllers.
- Replace `Number(req.params.id)` (39 occurrences) with the validated params object.
- Delete the leftover `VALIDATION:` string protocol.
- **Stop point:** API is stable against schema renames. This alone justifies the work.

### Phase 1 — Remove persistence from presentation (3–5 days)
- Create `AuthService` / `SessionService`; move login, signup, profile, password change, token issuance out of the controller.
- Move Prisma queries out of `authenticate.ts`, `weaver-portal.controller.ts`, `direct-transaction.controller.ts`.
- **Stop point:** `presentation/` has zero `lib/prisma` and zero `@prisma/client` imports.

### Phase 2 — Repository ports for core domains (2–3 weeks)
- Define ports in `application/ports/`; implement in `infrastructure/persistence/`.
- Add a `TransactionRunner` / `UnitOfWork` so application code no longer sees `Prisma.TransactionClient`.
- Move `PasswordService` behind a `PasswordHasher` port.
- **Stop point:** the five core domains have no direct Prisma imports; the rest may keep them.

### Phase 3 — Model layer (optional, 2–3 weeks)
- Domain entities + mappers for core aggregates only.
- Replace Prisma enums in `domain/` with domain enums.
- Decide the fate of the three dead rule modules (wire or delete).
- **Do not** map every table.

### Phase 4 — Frontend (1–2 weeks, can run in parallel)
- Move `api.ts` adapter logic into `infrastructure/services`.
- Migrate the 50 importers, then delete the facade.
- Add the same boundary rules: pages → hooks/services → domain.

### Guardrails (do in Phase 0, 1 day)
- `dependency-cruiser` or `eslint-plugin-boundaries` in CI:
  - `domain` imports nothing external.
  - `application` cannot import `@prisma/client`, `lib/prisma`, `express`, or `infrastructure/*`.
  - `presentation` cannot import `lib/prisma` or `@prisma/client`.
  - `infrastructure` cannot import `presentation`.
- A violation fails the build, so the architecture does not decay again.

---

## 8. Revisit triggers

Move to Level 3 (full model decoupling) only if one of these becomes true:

1. The team grows beyond ~5 developers.
2. A second database, queue, or external service must be swapped behind the same domain.
3. The API must support multiple versioned contracts for different clients.
4. Prisma is replaced, or the schema changes frequently enough that mapping bugs recur.
5. Regulatory or audit requirements demand a domain model independent of storage.

If none of these apply, Level 1 + Level 2 is the correct long-term shape.

---

## 9. Consequences

**Positive**
- API contract stops tracking the database schema.
- Business rules live in one place.
- Core domains become testable without a database.
- Complexity is added only where change is likely.
- Lower risk and much less work than a rewrite.

**Negative**
- Two architectural styles coexist (repositories for core domains, direct Prisma for CRUD/reports). This must be documented so it does not look accidental.
- Serializers and ports add some boilerplate.
- Boundary linting will initially fail in many places; the allowlist must be burned down deliberately.

**Neutral**
- Prisma remains the ORM. This decision is about boundaries, not about replacing tools.

---

## 10. Alternatives considered

| Option | Effort | Risk | Verdict |
|---|---|---|---|
| **A. Keep as-is** | 0 | Rising | Rejected — coupling already causes defects |
| **B. Full ports & adapters rewrite** | 6–10 weeks | High | Rejected — over-engineered for current scale |
| **C. Selective decoupling (this ADR)** | 4–6 weeks across phases, stoppable | Medium | **Chosen** |
| **D. Rewrite the backend from scratch** | 3+ months | Very high | Rejected — throws away working, tested logic |

---

## 11. Summary

The code is not broken; it is **coupled in a few expensive places**. Fix those places, make the contract explicit, and enforce the boundary. Do not convert a working modular monolith into a textbook hexagon to satisfy a diagram.

**Recommended next action:** Phase 0 (serializers + validated params + boundary lint), then Phase 1 (remove Prisma from presentation). Re-evaluate before committing to Phase 2.
