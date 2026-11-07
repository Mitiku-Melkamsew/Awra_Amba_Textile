# Awra Amba Textile - API & Security Specification

This document defines the backend architecture, security policies (RBAC and ABAC), and the canonical REST API endpoints for the Awra Amba Textile system.

---

## 1. Clean Architecture Overview

The backend is organized into four concentric layers following Clean Architecture principles:

```text
backend/src/
├── domain/                               # Enterprise Business Rules & Entities
│   ├── rules/                            # Pure domain rules (calculation, stock, pricing)
│   ├── security/                         # Capabilities and ABAC policy definitions
│   └── errors/                           # Standard domain error hierarchy
│
├── application/                          # Application Business Rules (Use Cases)
│   ├── security/                         # RbacService, AbacService
│   └── services/                         # UserService, CatalogService, WorkOrderService,
│                                         # SettlementService, DirectTransactionService,
│                                         # ProcurementService, StockService, ReportService, AuditService
│
├── presentation/                         # Interface Adapters (Express HTTP)
│   ├── middleware/                       # authenticate, requireCapability, requireOwnership, validate, errorHandler
│   ├── dtos/                             # Zod request validation schemas
│   ├── controllers/                      # Thin controllers handling request/response
│   └── routes/                           # Clean router definitions mounted at /api/v1/*
│
└── infrastructure/                       # Frameworks, Drivers & External Tools
    ├── db/                               # Prisma client singleton
    ├── auth/                             # Argon2 password hashing & JWT signing
    └── utils/                            # Amharic numeral formatting and date utils
```

---

## 2. Security Architecture: RBAC & ABAC

### 2.1 Role-Based Access Control (RBAC)

Every user has one or more roles assigned in `user_role_assignments`: `admin`, `weaver`, or `merchant`. Access to API endpoints is governed by granular **Capabilities**:

| Capability | Admin | Weaver | Merchant | Description |
|---|:---:|:---:|:---:|---|
| `users.read` | ✅ | ❌ | ❌ | Read user profiles, role assignments, and account balances |
| `users.manage` | ✅ | ❌ | ❌ | Create, update, deactivate users, reset passwords |
| `roles.manage` | ✅ | ❌ | ❌ | Assign or revoke roles from users |
| `catalog.read` | ✅ | ✅ | ✅ | View active fabric and yarn catalog items |
| `catalog.manage` | ✅ | ❌ | ❌ | Create, update, or deactivate master catalog items |
| `prices.read` | ✅ | ❌ | ❌ | View complete pricing matrix (weaver rates + selling prices) |
| `prices.manage` | ✅ | ❌ | ❌ | Version new fabric and yarn prices with effective dates |
| `quality_rules.manage` | ✅ | ❌ | ❌ | Create and update global quality deduction rules |
| `work_orders.read_all` | ✅ | ❌ | ❌ | View all production work orders across weavers |
| `work_orders.read_own` | ❌ | ✅ | ❌ | View authenticated weaver's assigned work orders |
| `work_orders.manage` | ✅ | ❌ | ❌ | Assign work orders, update status, cancel orders |
| `yarn_given.manage` | ✅ | ❌ | ❌ | Issue yarn to zigs, edit unsettled yarn records |
| `fabric_returns.manage` | ✅ | ❌ | ❌ | Record fabric returns, edit unsettled return records |
| `settlements.preview` | ✅ | ❌ | ❌ | Preview grouped quality deduction calculations |
| `settlements.commit` | ✅ | ❌ | ❌ | Commit settlement batches and durable lines |
| `settlements.pay` | ✅ | ❌ | ❌ | Record settlement payments, reconcile work orders |
| `settlements.override` | ✅ | ❌ | ❌ | Record authorized deduction overrides with audit log |
| `settlements.read_own` | ❌ | ✅ | ❌ | View authenticated weaver's own payouts and HISAB statements |
| `procurement.manage` | ✅ | ❌ | ❌ | Record supplier yarn purchases and update stock |
| `direct_transactions.manage` | ✅ | ❌ | ❌ | Record direct fabric/yarn sales and purchases |
| `direct_transactions.read_all` | ✅ | ❌ | ❌ | View all commercial direct transactions and balances |
| `direct_transactions.read_own` | ❌ | ✅ | ✅ | View authenticated actor's own direct transactions |
| `stock.read` | ✅ | ❌ | ❌ | View stock snapshots and ledger movement history |
| `reports.read_financial` | ✅ | ❌ | ❌ | View financial summaries, balance sheets, and HISAB reports |
| `audit.read` | ✅ | ❌ | ❌ | Query immutable system audit logs |

---

### 2.2 Attribute-Based Access Control (ABAC)

Fine-grained contextual authorization is enforced using ABAC policies:

1. **Weaver Ownership Policy**:
   - Weavers are restricted to resources where `weaverUserId === req.user.userId`.
   - Protects work orders, yarn given records, fabric return receipts, and settlement statements.
2. **Merchant Ownership Policy**:
   - Merchants are restricted to direct transactions where `merchantUserId === req.user.userId`.
3. **State & Immutability Policy**:
   - *Fabric Returns & Yarn Given*: Strictly immutable (`409 Conflict`) once committed to a settlement (`settlementLineId !== null` or `settlementYarnLines.length > 0`).
   - *Work Orders*: Can only be cancelled while in `assigned` status with zero issued yarn or returns. Reconciled work orders cannot be modified.
   - *Direct Transactions*: Paid transactions cannot be cancelled.
4. **Field-Level Data Masking Policy**:
   - When a merchant queries fabrics, prices, or transactions, internal rates (`weaverRate`), raw yarn costs, supplier identities, and gross profit margins are automatically stripped.

---

## 3. Canonical REST API Routes

### 3.1 Public & Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/auth/login` | Public | Authenticate with username and password, returns JWT token |
| `POST` | `/auth/signup` | Public | Self-registration for Weaver or Merchant accounts |
| `GET` | `/auth/me` | Bearer | Retrieve authenticated user profile and roles |
| `POST` | `/auth/change-password` | Bearer | Update authenticated user's password |

---

### 3.2 User Management (`/api/v1/users`)
*Required Capability: `users.read`, `users.manage`, `roles.manage`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/users` | `users.read` | List all users (filters: `role`, `isActive`, `query`, pagination) |
| `GET` | `/users/:id` | `users.read` | Get user details and assigned roles |
| `POST` | `/users` | `users.manage` | Create new user, set credentials, and assign initial roles [Audit Logged] |
| `PATCH` | `/users/:id` | `users.manage` | Update user details (name, phone, email) [Audit Logged] |
| `PATCH` | `/users/:id/status` | `users.manage` | Activate / deactivate user account [Audit Logged] |
| `POST` | `/users/:id/roles` | `roles.manage` | Assign a role (`admin`, `weaver`, `merchant`) [Audit Logged] |
| `DELETE` | `/users/:id/roles/:role` | `roles.manage` | Revoke a role from user [Audit Logged] |
| `POST` | `/users/:id/reset-password` | `users.manage` | Admin reset of user password [Audit Logged] |
| `GET` | `/users/:id/balance` | `users.read` | Get account balance breakdown for weaver or merchant |

---

### 3.3 Master Catalog & Pricing (`/api/v1/catalog`)
*Required Capability: `catalog.read`, `catalog.manage`, `prices.manage`, `quality_rules.manage`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/catalog/lookup` | `catalog.read` | Aggregate lookup bundle: fabrics, yarns, colors, designs, suppliers, rules |
| `GET` | `/catalog/fabrics` | `catalog.read` | List fabrics with standard dimensions and active prices |
| `GET` | `/catalog/fabrics/:id` | `catalog.read` | Get fabric details and variants |
| `POST` | `/catalog/fabrics` | `catalog.manage` | Create new fabric type [Audit Logged] |
| `PATCH` | `/catalog/fabrics/:id` | `catalog.manage` | Update fabric standard dimensions or status [Audit Logged] |
| `GET` | `/catalog/yarns` | `catalog.read` | List all yarn types |
| `POST` | `/catalog/yarns` | `catalog.manage` | Create new yarn type [Audit Logged] |
| `PATCH` | `/catalog/yarns/:id` | `catalog.manage` | Update yarn name or status [Audit Logged] |
| `GET` | `/catalog/colors` | `catalog.read` | List all colors |
| `POST` | `/catalog/colors` | `catalog.manage` | Create new color [Audit Logged] |
| `PATCH` | `/catalog/colors/:id` | `catalog.manage` | Update color name [Audit Logged] |
| `DELETE` | `/catalog/colors/:id` | `catalog.manage` | Delete color (checks referencing variants first) [Audit Logged] |
| `GET` | `/catalog/designs` | `catalog.read` | List all designs / patterns |
| `POST` | `/catalog/designs` | `catalog.manage` | Create new design [Audit Logged] |
| `PATCH` | `/catalog/designs/:id` | `catalog.manage` | Update design name [Audit Logged] |
| `DELETE` | `/catalog/designs/:id` | `catalog.manage` | Delete design (checks referencing variants first) [Audit Logged] |
| `GET` | `/catalog/suppliers` | `catalog.read` | List raw material suppliers |
| `POST` | `/catalog/suppliers` | `catalog.manage` | Register new supplier [Audit Logged] |
| `PATCH` | `/catalog/suppliers/:id` | `catalog.manage` | Update supplier contact details [Audit Logged] |
| `GET` | `/catalog/fabric-variants` | `catalog.read` | List fabric SKU variants |
| `POST` | `/catalog/fabric-variants` | `catalog.manage` | Create fabric variant [Audit Logged] |
| `PATCH` | `/catalog/fabric-variants/:id`| `catalog.manage` | Toggle fabric variant active status [Audit Logged] |
| `GET` | `/catalog/yarn-variants` | `catalog.read` | List yarn SKU variants |
| `POST` | `/catalog/yarn-variants` | `catalog.manage` | Create yarn variant [Audit Logged] |
| `PATCH` | `/catalog/yarn-variants/:id` | `catalog.manage` | Toggle yarn variant active status [Audit Logged] |
| `GET` | `/catalog/fabric-prices` | `catalog.read` | List fabric price history (weaver rate masked for merchants) |
| `POST` | `/catalog/fabric-prices` | `prices.manage` | Version new fabric price (`effectiveFrom`, closes prior) [Audit Logged] |
| `PATCH` | `/catalog/fabric-prices/:id` | `prices.manage` | Deactivate fabric price version [Audit Logged] |
| `GET` | `/catalog/yarn-prices` | `prices.read` | List yarn price history |
| `POST` | `/catalog/yarn-prices` | `prices.manage` | Version new yarn price [Audit Logged] |
| `PATCH` | `/catalog/yarn-prices/:id` | `prices.manage` | Deactivate yarn price version [Audit Logged] |
| `GET` | `/catalog/quality-rules` | `catalog.read` | List global quality deduction rules |
| `POST` | `/catalog/quality-rules` | `quality_rules.manage` | Create quality rule (`factor`, `unit`, `deductionPerUnit`) [Audit Logged] |
| `PATCH` | `/catalog/quality-rules/:id` | `quality_rules.manage` | Update quality deduction rule [Audit Logged] |

---

### 3.4 Work Orders & Production (`/api/v1/work-orders`)
*Required Capability: `work_orders.read_all`, `work_orders.manage`, `yarn_given.manage`, `fabric_returns.manage`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/work-orders` | `work_orders.read_all` | List work orders (filters: `status`, `weaverUserId`, pagination) |
| `GET` | `/work-orders/next-id` | `work_orders.manage` | Generate next sequential zig ID (`z-N`) |
| `GET` | `/work-orders/:zigId` | `work_orders.read_all` | Get full zig details (yarn given, fabric returns, returns to weaver) |
| `POST` | `/work-orders` | `work_orders.manage` | Assign new work order to a weaver [Audit Logged] |
| `PATCH` | `/work-orders/:zigId/status` | `work_orders.manage` | Transition status (`assigned` -> `in_progress` -> `returned`) [Audit Logged] |
| `POST` | `/work-orders/:zigId/cancel` | `work_orders.manage` | Cancel work order (prohibited if yarn or returns exist) [Audit Logged] |
| `POST` | `/work-orders/:zigId/yarn-given` | `yarn_given.manage` | Issue yarn lines to zig (decrements yarn stock) [Audit Logged] |
| `PATCH` | `/work-orders/yarn-given/:id` | `yarn_given.manage` | Update unsettled yarn issue [Audit Logged] |
| `DELETE` | `/work-orders/yarn-given/:id` | `yarn_given.manage` | Delete unsettled yarn issue (restores yarn stock) [Audit Logged] |
| `POST` | `/work-orders/:zigId/fabric-returns` | `fabric_returns.manage` | Record fabric return (increments fabric stock) [Audit Logged] |
| `PATCH` | `/work-orders/fabric-returns/:id` | `fabric_returns.manage` | Update unsettled fabric return [Audit Logged] |
| `DELETE` | `/work-orders/fabric-returns/:id` | `fabric_returns.manage` | Delete unsettled fabric return (restores fabric stock) [Audit Logged] |
| `POST` | `/work-orders/:zigId/yarn-returns` | `yarn_given.manage` | Record unused yarn returned by weaver (restores yarn stock) [Audit Logged] |
| `POST` | `/work-orders/:zigId/returns-to-weaver` | `fabric_returns.manage` | Record defective fabric returned to weaver (decrements fabric stock) [Audit Logged] |

---

### 3.5 Settlements & HISAB (`/api/v1/settlements`)
*Required Capability: `settlements.preview`, `settlements.commit`, `settlements.pay`, `settlements.override`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/settlements/unsettled` | `settlements.preview` | Query returned, unsettled work orders grouped by weaver |
| `GET` | `/settlements/preview` | `settlements.preview` | Preview grouped calculations, deductions, and payouts for cutoff date |
| `POST` | `/settlements/batches` | `settlements.commit` | Commit settlement batch and generate immutable settlement lines [Audit Logged] |
| `POST` | `/settlements/single` | `settlements.commit` | Commit a settlement for a single weaver [Audit Logged] |
| `GET` | `/settlements/batches` | `settlements.commit` | List historical settlement batches |
| `GET` | `/settlements/batches/:id` | `settlements.commit` | Get batch detail with lines, totals, and Amharic words |
| `POST` | `/settlements/:id/pay` | `settlements.pay` | Record payment for settlement, marks work orders as `reconciled` [Audit Logged] |
| `POST` | `/settlements/lines/:id/override`| `settlements.override` | Record authorized quality deduction override [Audit Logged] |

---

### 3.6 Direct Commercial Transactions (`/api/v1/direct-transactions`)
*Required Capability: `direct_transactions.read_all`, `direct_transactions.manage`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/direct-transactions` | `direct_transactions.read_all` | List transactions (filters: `type`, `status`, `weaverUserId`, `merchantUserId`) |
| `GET` | `/direct-transactions/:id` | `direct_transactions.read_all` | Get transaction details, lines, and payment history |
| `POST` | `/direct-transactions` | `direct_transactions.manage` | Create direct transaction (updates inventory automatically) [Audit Logged] |
| `POST` | `/direct-transactions/:id/payments` | `direct_transactions.manage`| Record installment/payment against transaction [Audit Logged] |
| `POST` | `/direct-transactions/:id/cancel` | `direct_transactions.manage` | Cancel unpaid transaction (restores inventory) [Audit Logged] |

---

### 3.7 Procurement (`/api/v1/procurement`)
*Required Capability: `procurement.manage`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/procurement/yarn-purchases` | `procurement.manage` | List manual supplier yarn purchases |
| `GET` | `/procurement/yarn-purchases/:id` | `procurement.manage` | Get purchase detail and lines |
| `POST` | `/procurement/yarn-purchases` | `procurement.manage` | Record paid yarn purchase (increments yarn stock & expense) [Audit Logged] |

---

### 3.8 Stock & Inventory (`/api/v1/stock`)
*Required Capability: `catalog.read`, `stock.read`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/stock/available-fabrics` | `catalog.read` | Available fabric catalog with dimensions and selling prices |
| `GET` | `/stock/summary` | `stock.read` | Inventory summary of all yarns and fabrics |
| `GET` | `/stock/fabrics` | `stock.read` | Fabric stock breakdown by variant |
| `GET` | `/stock/yarns` | `stock.read` | Yarn stock breakdown by variant |

---

### 3.9 Reports & Statements (`/api/v1/reports`)
*Required Capability: `reports.read_financial`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/reports/hisab/:id` | `reports.read_financial` | Reconstructed legacy HISAB-5 settlement statement (JSON or CSV) |
| `GET` | `/reports/financial-summary` | `reports.read_financial` | Gross commercial revenue, yarn costs, payouts, net operating profit |
| `GET` | `/reports/weavers-balance` | `reports.read_financial` | Accounts payable summary across all weavers |
| `GET` | `/reports/merchants-balance` | `reports.read_financial` | Accounts receivable summary across all merchants |

---

### 3.10 Weaver Portal Self-Service (`/api/v1/weaver`)
*Required Capability: `work_orders.read_own`, `settlements.read_own`, `direct_transactions.read_own`*
*ABAC: Strictly scoped to authenticated weaver (`req.user.userId`)*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/weaver/profile` | Authenticated | Weaver profile, active work order count, and outstanding balance |
| `GET` | `/weaver/work-orders` | `work_orders.read_own` | List work orders assigned strictly to this weaver |
| `GET` | `/weaver/work-orders/:zigId` | `work_orders.read_own` | Detailed zig view (yarn given, fabric returned, status) |
| `GET` | `/weaver/settlements` | `settlements.read_own` | Payout history and settlement statements |
| `GET` | `/weaver/settlements/:id/statement`| `settlements.read_own` | Printable personal HISAB settlement statement |
| `GET` | `/weaver/direct-transactions` | `direct_transactions.read_own`| History of fabric sold directly or yarn purchased |

---

### 3.11 Merchant Portal Self-Service (`/api/v1/merchant`)
*Required Capability: `catalog.read`, `direct_transactions.read_own`*
*ABAC: Strictly scoped to authenticated merchant (`req.user.userId`); internal costs and weaver rates masked*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/merchant/profile` | Authenticated | Merchant company profile and outstanding payable balance |
| `GET` | `/merchant/catalog` | `catalog.read` | Available fabric catalog with dimensions and official selling prices |
| `GET` | `/merchant/transactions` | `direct_transactions.read_own`| Commercial purchase orders and invoice history |
| `GET` | `/merchant/transactions/:id` | `direct_transactions.read_own`| Detailed purchase invoice, items delivered, and payment status |

---

### 3.12 Audit Logging (`/api/v1/audit-logs`)
*Required Capability: `audit.read`*

| Method | Endpoint | Capability | Description |
|---|---|---|---|
| `GET` | `/audit-logs` | `audit.read` | Query audit trail (filters: `actorUserId`, `entityType`, `entityId`, date range) |

---

### 3.13 System Health (`/api/v1/health`)

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/health` | Public | System health check (`{ status: "ok", timestamp }`) |
