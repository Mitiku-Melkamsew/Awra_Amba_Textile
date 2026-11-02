# Admin and Role Capabilities

## 1. Purpose

This document defines the capabilities, responsibilities, and access
boundaries for the application roles.

The current operational focus is admin management of production, inventory,
settlements, direct transactions, and financial records. Weavers and merchants
can log in with read-only access to the information currently supported by the
database. Ordering, credit requests, settlement agreement, and settlement
dispute workflows are deferred until the database is redesigned for them.

## 2. Roles

The system has three business roles:

```text
admin
weaver
merchant
```

A user may have more than one role. Roles are stored independently from the
common user record.

### Common user information

All roles may have:

- Full name
- Phone number
- Email address
- Login credentials
- Active/inactive status
- Created and updated timestamps

Role-specific profile tables are deferred for now. Additional fields can be
added later when the corresponding workflow is fully designed.

## 3. Permission principles

1. The server is the authority for authorization.
2. The frontend and mobile applications must not rely on hidden buttons as
   security controls.
3. Admin-only operations must be protected by server middleware.
4. Users can access only records permitted by their role and ownership.
5. Historical financial records are not deleted or silently rewritten.
6. Users with historical activity are deactivated instead of deleted.
7. Financial calculations are performed by the server.
8. Sensitive actions should be auditable with actor and timestamp information.

## 4. Admin capabilities

Admins have full operational access.

### 4.1 User and role management

Admins can:

- Create users.
- Update common user information.
- Activate or deactivate users.
- Assign one or more roles.
- Remove a role when it is no longer needed.
- Reset credentials.
- View a user's activity and balances.

Admins cannot:

- Delete a user who has historical activity.
- Remove history by changing a user's name or role.

### 4.2 Catalog management

Admins can:

- Create, view, update, activate, and deactivate fabrics.
- Update fabric standard length, width, and weight.
- Create, view, update, activate, and deactivate yarns.
- Create and manage colors.
- Create and manage designs.
- Create and manage suppliers.
- Create and manage fabric variants.
- Create and manage yarn variants.
- Search catalog records by name, attributes, and SKU.
- View current prices and price history.
- Add a new price version.
- Close or deactivate an old price.
- Manage global quality rules.

Catalog protections:

- Fabric IDs cannot change.
- Fabric names cannot change after creation.
- Historical prices cannot change.
- A catalog record used by transactions is deactivated rather than deleted.
- Every fabric variant must have a design.

### 4.3 Production and zig management

Admins can:

- Create work orders.
- Assign a zig to a weaver.
- Select the fabric variant for the zig.
- Issue yarn to the zig.
- Edit unsettled yarn-given records.
- Record and edit unsettled unused-yarn returns.
- Accept fabric returns.
- Edit unsettled fabric returns.
- Record fabric returned to a weaver before settlement.
- View all work orders and their status.
- Change status where permitted by the workflow.
- Mark a zig as returned when production is complete.
- Cancel a zig before settlement.
- View incomplete, returned, and reconciled zigs.

Production status:

```text
assigned → in_progress → returned → reconciled
     └────────────────────────────→ cancelled
```

Admins should not edit production facts after their settlement is reconciled.

### 4.4 Quality management

Admins can:

- View global quality rules.
- Add a rule for a factor such as weight, length, or width.
- Set the unit.
- Set the deduction per unit.
- Activate or deactivate a rule.
- Review how a rule affects a settlement preview.

The system calculates quality server-side.

The deduction grouping is:

```text
zig_id + fabric_id / fabric type
```

Fabric variants do not split the quality calculation for now. For a given zig
and fabric type, the server combines the returns, floors the average
measurement, and calculates the deduction once. An overweight result has zero
deduction and never creates a bonus.

Bonus rules are not part of the current application.

### 4.5 Zig settlement management

Admins can:

- Select completed/returned zigs for settlement.
- Create a settlement preview for one weaver.
- Review fabric quantities and values.
- Review total and average measurements.
- Review the applicable standard measurements.
- Review grouped quality deductions.
- Review yarn issued and yarn cost.
- Review the net amount payable.
- Correct eligible unsettled production data.
- Record an explicit calculation override when authorized, including the
  original value, replacement value, reason, acting admin, and timestamp.
- Record the payment.
- View settlement history and printable reports.
- Reprint a historical settlement.

Settlement rules:

- A settlement payment belongs to one weaver.
- Multiple zigs for the same weaver may be included in one payment.
- Zigs for different weavers require separate payments.
- A zig cannot be included in two completed settlements.
- A settlement remains unpaid if payment recording fails.
- One full payment changes the settlement to `paid`.
- The included zigs then become `reconciled`.
- Once paid, its calculation snapshot is immutable.

### 4.6 Manual yarn purchases

Admins can:

- Record a manual yarn purchase.
- Select the supplier.
- Select yarn variants.
- Record quantity and historical purchase price.
- View purchase history.
- View purchase expense totals.

Recording a yarn purchase:

- Increases yarn stock.
- Adds to expense reporting.
- Does not create a supplier payment.
- Does not create a supplier payable.

### 4.7 Direct transactions

Admins can record:

1. Fabric purchased directly from a weaver.
2. Yarn sold directly to a weaver.
3. Fabric sold directly to a merchant.

Admins can:

- Create direct transaction lines.
- Record positive quantities and historical unit prices.
- Record immediate payments.
- Record later or partial payments.
- Review outstanding balances.
- Cancel eligible transactions.
- View transaction history and reports.

Stock direction:

| Transaction | Stock effect |
|---|---|
| Fabric purchase from weaver | Fabric stock increases |
| Yarn sale to weaver | Yarn stock decreases |
| Fabric sale to merchant | Fabric stock decreases |

### 4.8 Future merchant ordering and credit

Merchant ordering, credit requests, credit approval, merchant balances, and
merchant-submitted payments are deferred. They are not current capabilities for
any role and will be added after the supporting transaction and approval tables
are redesigned.

### 4.9 Inventory and reporting

Admins can:

- View current yarn stock.
- View current fabric stock.
- Review stock increases and decreases.
- View settlement reports.
- View manual yarn purchase expenses.
- View direct transaction income and expenses.
- View merchant outstanding balances.
- View weaver balances from direct fabric purchases.
- Export or print financial reports.
- Review historical calculation snapshots.

## 5. Weaver capabilities

Weavers have limited login access.

### 5.1 Weaver can view

- Their own profile and active status.
- Work orders assigned to them.
- Zig status.
- Yarn issued to their zigs.
- Fabric returns recorded for their zigs.
- Settlement previews involving their zigs.
- Their settlement previews and paid settlements.
- Their payment history.

### 5.2 Weaver can perform

For now, a weaver has no financial or production write capabilities. The
weaver may only browse their own records.

### 5.3 Weaver cannot

- Create or assign work orders.
- Issue or edit yarn records.
- Create or edit fabric returns.
- Change catalog data.
- Change quality rules.
- Agree to or dispute a settlement.
- Create or approve settlements.
- Record payments.
- View direct transaction balances or internal financial balances.
- View another weaver's private records.
- Delete historical records.

The admin remains responsible for accepting production records, calculating
settlements, handling the in-person discussion, and recording payments.

## 6. Merchant capabilities

Merchants have limited login access.

### 6.1 Merchant can view

- Browse available fabrics.
- View current fabric selling prices.

### 6.2 Merchant cannot

- Place an order.
- Request credit.
- View or modify merchant balances.
- Reduce or change inventory.
- Finalize a sale.
- Approve credit.
- Change prices or catalog data.
- Record payments.
- View internal costs, yarn expenses, or weaver settlement details.

Merchant ordering and credit requests are future capabilities.

## 7. Capability matrix

| Capability | Admin | Weaver | Merchant |
|---|---:|---:|---:|
| Log in | Yes | Yes | Yes |
| Manage users | Yes | No | No |
| Manage roles | Yes | No | No |
| Manage catalog | Yes | No | No |
| Manage prices | Yes | No | No |
| Manage quality rules | Yes | No | No |
| Create work orders | Yes | No | No |
| View own work orders | Yes | Yes | No |
| Issue yarn | Yes | No | No |
| Record fabric returns | Yes | No | No |
| Record yarn returns | Yes | No | No |
| Record fabric returned to weaver | Yes | No | No |
| Cancel zig before settlement | Yes | No | No |
| Review own returns | Yes | Yes | No |
| Create settlement preview | Yes | No | No |
| Review own settlement | Yes | Yes | No |
| Agree/dispute settlement | No | No | No |
| Record weaver payment | Yes | No | No |
| Record manual yarn purchase | Yes | No | No |
| Create direct fabric purchase | Yes | No | No |
| Create yarn sale to weaver | Yes | No | No |
| Create fabric sale to merchant | Yes | No | No |
| Request merchant credit | Deferred | No | Deferred |
| Approve merchant credit | Deferred | No | Deferred |
| Record official transaction payment | Yes | No | No |
| View own balance | Yes | No | No |
| View all balances | Yes | No | No |
| View stock | Yes | No | Available fabrics only |
| View current purchase prices | Yes | Yes | No |
| View current fabric selling prices | Yes | No | Yes |
| View financial reports | Yes | Own zig/payment details | Available fabrics/prices only |
| Delete historical records | No | No | No |

## 8. Proposed authorization areas

The backend should authorize by capability rather than only by route name.
Suggested capability names:

```text
users.read
users.manage
roles.manage
catalog.read
catalog.manage
prices.manage
quality_rules.manage
work_orders.read_all
work_orders.read_own
work_orders.manage
yarn_given.manage
fabric_returns.manage
settlements.create
settlements.review_own
settlements.pay
procurement.manage
direct_transactions.create
direct_transactions.read_all
direct_transactions.read_own
direct_transactions.payments.manage
reports.read_all
reports.read_own
```

The server must combine role checks with ownership checks. For example, a
weaver with `settlements.review_own` may access only settlements whose
`weaver_user_id` is that user's ID.

## 9. Audit requirements

The following actions should record the acting user and timestamp:

- User and role changes
- Catalog creation and deactivation
- Price changes
- Quality-rule changes
- Work-order creation and assignment
- Yarn issue
- Fabric return creation and editing
- Yarn return creation and editing
- Fabric returned-to-weaver creation and editing
- Zig cancellation
- Settlement preview creation
- Settlement payment
- Direct transaction creation and cancellation
- Direct transaction payments

## 10. Deferred capabilities

The following are intentionally outside the current role scope:

- Weaver settlement acceptance.
- Weaver settlement disputes.
- Weaver correction requests.
- Weaver direct-transaction balances.
- Merchant ordering.
- Merchant credit requests.
- Merchant payment submission.
- Merchant balance management.
- Merchant transaction history.
- Weaver confirmation of direct fabric purchases.

These capabilities can be designed after the supporting transaction, approval,
credit, and audit tables are finalized.
