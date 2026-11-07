# Planned Business and Database Update

## 1. Purpose

This document defines the proposed update to the Awra Amba Textile system
before implementation. It translates the current manual workflow, the legacy
`Hisab-5` report, `report_generator_3.py`, and `albasat_zigs.xlsx` into a
clearer application policy and database design.

This is a design document only. It does not change the database or application
code.

## 2. Source workflow review

The legacy materials show the following established process:

- Zigs are assigned to weavers.
- Yarn issued to a zig is recorded with quantity, unit price, and subtotal.
- Fabric returns are recorded with quantity, total weight, average weight,
  fabric type, and unit price.
- Returns are grouped by `zig_id` and fabric type.
- The average weight for that group is used for quality deduction.
- Fabric value is reduced by the quality deduction.
- Yarn cost is deducted from the fabric value.
- The resulting net amount is used for payment.
- Reports are prepared for completed zigs, grouped by weaver, with totals and
  signatures/approval.

The legacy Python implementation confirms the central calculation:

```text
average_weight = total_weight / total_quantity
deduction_per_piece = max(0, standard_weight - floor(average_weight))
                       × deduction_per_unit
fabric_net_value = fabric_gross_value
                   - deduction_per_piece × total_quantity
zig_net_amount = fabric_net_value - yarn_cost
```

The current report generator uses a cutoff date and includes only completed
zigs. The workbook contains separate sheets for weavers, zigs, yarn given,
fabric returned, reports, catalog data, stock, and sales.

## 3. Policy changes

### 3.1 User and role policy

For the current admin-focused scope:

- Merchants, weavers, and admins share one `users` table.
- Common fields are stored only once.
- A user may have multiple roles.
- Roles are stored in `user_roles`.
- Merchant- and weaver-specific profile tables are deferred.
- Users with historical activity are deactivated, not deleted.

### 3.2 Catalog policy

- `products` becomes `fabrics`.
- The yarn catalog table is named `yarns`, not `yarn_types`.
- Fabric identity is protected after use:
  - `fabric_id` is immutable.
  - `name` is immutable.
  - Incorrect or obsolete fabrics are deactivated.
- Fabric standards are editable:
  - standard length
  - standard width
  - standard weight
- Fabric variants require a design.
- `color_code` is removed.
- Catalog prices are stored separately from catalog identity.
- Historical transaction prices are never rewritten when current prices change.
- SKUs are stable system identifiers for search, reports, and future barcode/QR
  support. Users do not need to memorize them.

### 3.3 Yarn purchase policy

Yarn purchases are manual historical records:

- The purchase has already been paid outside the software.
- The system records supplier, yarn, quantity, price, and date.
- Stock increases.
- The purchase is included in expense reporting.
- No supplier payment is created.
- No accounts-payable balance is created.

### 3.4 Production policy

A zig represents production assigned to one weaver:

```text
assigned → in_progress → returned → reconciled
     └────────────────────────────→ cancelled
```

- `assigned`: the zig was issued but production has not started.
- `in_progress`: yarn or production activity has started.
- `returned`: the fabric return has been accepted and the zig is eligible for
  settlement review.
- `reconciled`: the settlement was accepted and paid.
- `cancelled`: an admin cancelled the zig before settlement. Cancelled zigs
  cannot receive new production records or enter a settlement.

Zigs do not store a target quantity for now. An admin explicitly marks a zig
as returned when production is complete.

### 3.5 Quality policy

Each fabric stores its own standard measurements:

- standard weight
- standard length
- standard width

Quality rules are global and apply to all fabrics:

- factor
- unit
- deduction per unit
- active status

There is no `fabric_id` in `quality_rules` and no separate factors table.

Quality is calculated on the server. Rounding and other calculation rules are
not delegated to frontend or mobile clients.

The deduction is calculated once for each:

```text
zig_id + fabric_id / fabric type
```

It is based on the combined average for all returns of that fabric type in the
zig, not on each individual return or fabric variant. Fabric variants may still
be retained for inventory and catalog identity, but they do not split the
quality deduction group for now.

Bonus rules are removed from the current scope.

For the current weight rule, the server floors the average measurement before
calculating the deficit. If the average is greater than or equal to the
standard, the deduction is zero and no bonus is created.

### 3.6 Settlement policy

The system accepts returns first. The admin later selects completed/returned
zigs for settlement:

```text
returns recorded
→ settlement preview
→ deduction displayed
→ payment recorded
→ settlement reconciled
```

A settlement batch may contain multiple weavers. It contains one settlement
record per weaver, and each settlement may contain multiple zigs for that
weaver. Zigs belonging to different weavers require separate payments. Weaver agreement and dispute are handled in person and are
not application capabilities for now.

The settlement must preserve the calculation used for payment. It must remain
auditable even if prices, fabric standards, or quality rules change later.

The settlement calculation rules are:

- Use `floor(average measurement)` for the current weight calculation, matching
  the legacy report.
- Clamp overweight measurements to zero deduction; no bonus is created.
- If a deduction would exceed the fabric unit price, block settlement for
  manual admin review.
- If yarn cost exceeds fabric credit, block settlement for manual review.
- Direct transaction balances are not offset against zig settlements.
- One full payment marks the settlement paid and the related zigs reconciled.

### 3.7 Direct transaction policy

The application supports these non-zig transactions:

1. Fabric purchased directly from a weaver.
2. Yarn sold directly to a weaver.
3. Fabric sold directly to a merchant.

All direct transaction quantities are positive. The transaction type determines
the stock direction.

| Transaction | Stock movement | Financial effect |
|---|---|---|
| Fabric purchase from weaver | Fabric stock increases | Amount owed to weaver |
| Yarn sale to weaver | Yarn stock decreases | Cash increases or weaver balance increases |
| Fabric sale to merchant | Fabric stock decreases | Cash increases or merchant balance increases |

Direct sales support immediate, partial, and later payment.

## 4. Target database model

### 4.1 `users`

```text
user_id          primary key
full_name        required
phone            nullable
email            nullable
password_hash    nullable
is_active        default true
created_at       required
updated_at       required
```

The exact authentication fields may retain the existing username convention if
needed, but actor-specific foreign keys are removed from this table.

### 4.2 `user_roles`

```text
user_id          foreign key → users
role             admin | weaver | merchant
```

Primary key and unique constraint:

```text
(user_id, role)
```

### 4.3 `fabrics`

```text
fabric_id              primary key
name                   required, unique, immutable
standard_length_cm     required, updateable
standard_width_cm      required, updateable
standard_weight_g      required, updateable
is_active              default true
created_at             required
updated_at             required
```

### 4.4 `colors`

```text
color_id        primary key
name            required, unique
```

`color_code` is removed.

### 4.5 `designs`

```text
design_id       primary key
name            required, unique
```

### 4.6 `suppliers`

```text
supplier_id     primary key
name            required, unique
contact_phone   nullable
is_active       default true
```

For yarn, the supplier also represents the brand.

### 4.7 `yarns`

```text
yarn_id         primary key
name            required, unique
is_active       default true
```

This is a naming correction from `yarn_types`. It is not intended to represent
an abstract type table.

### 4.8 `fabric_variants`

```text
fabric_variant_id     primary key
fabric_id             foreign key → fabrics
design_id             foreign key → designs, required
warp_color_id         foreign key → colors
weft_color_id         foreign key → colors
sku                   required, unique
stock_snapshot        default 0
is_active             default true
```

The identity is the combination of:

```text
fabric + design + warp color + weft color
```

### 4.9 `yarn_variants`

```text
yarn_variant_id       primary key
yarn_id               foreign key → yarns
color_id              foreign key → colors
supplier_id           foreign key → suppliers
sku                   required, unique
stock_snapshot        default 0
is_active              default true
```

Color identifies the stock item but does not determine the price.

### 4.10 `fabric_prices`

```text
fabric_price_id       primary key
fabric_id             foreign key → fabrics
weaver_rate           required
selling_price         required
effective_from       required
effective_to         nullable
is_active             default true
created_at            required
```

`weaver_rate` is the production payment rate used for fabric returned from a
zig. `selling_price` is the current price used when fabric is sold to a
merchant.

### 4.11 `yarn_prices`

```text
yarn_price_id        primary key
yarn_id              foreign key → yarns
supplier_id          foreign key → suppliers
purchase_price       required
selling_price        required
effective_from       required
effective_to         nullable
is_active             default true
created_at            required
```

Yarn color is intentionally absent from prices. All colors of the same yarn
from the same supplier use the same price.

For production and direct transactions, the active price is prefilled on the
form based on the event date. An admin may change the prefilled price before
saving; the selected price is stored as the historical transaction price. If
no active price exists, the transaction is blocked.

### 4.12 `quality_rules`

```text
quality_rule_id       primary key
factor                weight | length | width | future factor
unit                  g | cm | future unit
deduction_per_unit    required
is_active             default true
```

No `fabric_id` is stored because the rules are global.

### 4.13 `yarn_purchases`

```text
purchase_id           primary key
supplier_id           foreign key → suppliers
purchase_date         required
created_by_user_id    foreign key → users
notes                 nullable
```

### 4.14 `yarn_purchase_lines`

```text
line_id               primary key
purchase_id           foreign key → yarn_purchases
yarn_variant_id       foreign key → yarn_variants
quantity              required, positive
unit_price            required
```

The line total is:

```text
quantity × unit_price
```

### 4.15 `work_orders`

```text
zig_id                primary key
weaver_user_id        foreign key → users
fabric_variant_id     foreign key → fabric_variants
status                assigned | in_progress | returned | reconciled | cancelled
date_issued           required
issued_by_user_id     foreign key → users
```

### 4.16 `yarn_given`

```text
yarn_given_id         primary key
zig_id                foreign key → work_orders
yarn_variant_id       foreign key → yarn_variants
quantity              required, positive
unit_price            required historical cost
date_given            required
recorded_by_user_id   foreign key → users
```

Settlement membership should be represented by settlement lines rather than
using a generic payment foreign key on the production fact.

### 4.17 `yarn_returns`

Unused yarn returned from a zig is recorded before settlement:

```text
yarn_return_id         primary key
zig_id                 foreign key → work_orders
yarn_variant_id        foreign key → yarn_variants
quantity               required, positive
date_returned          required
recorded_by_user_id    foreign key → users
remark                 nullable
```

Yarn returns increase yarn stock and reduce the yarn cost included in the
settlement. Returned quantity cannot exceed issued quantity for the same zig
and yarn variant.

### 4.18 `fabric_returns`

```text
return_id             primary key
zig_id                foreign key → work_orders
fabric_variant_id     foreign key → fabric_variants
quantity_returned     required, positive
total_weight          required
length_cm             nullable
width_cm              nullable
unit_price            required historical price
date_returned         required
recorded_by_user_id   foreign key → users
remark                nullable
```

An average weight may be generated or calculated by the server, but deduction,
net credit, and settlement payment values do not belong on this table.

### 4.19 `fabric_returns_to_weavers`

This records fabric rejected after the company receives it and returned to the
weaver before settlement:

```text
fabric_return_to_weaver_id  primary key
zig_id                      foreign key → work_orders
fabric_variant_id           foreign key → fabric_variants
quantity                    required, positive
date_returned               required
recorded_by_user_id         foreign key → users
remark                      nullable
```

It reduces company fabric stock and excludes the returned quantity from the
settlement calculation. It is allowed only before settlement.

### 4.20 `settlements`

```text
settlement_id         primary key
weaver_user_id        foreign key → users
status                draft | paid | cancelled
gross_fabric_value    required
total_deductions      required
total_yarn_cost       required
net_amount            required
created_by_user_id    foreign key → users
created_at            required
paid_at               nullable
notes                 nullable
```

One full payment changes the settlement to `paid` and marks its included zigs
as `reconciled`. There are no partial settlement payments.

### 4.21 `settlement_lines`

Each row represents one `zig_id + fabric_id` calculation group:

```text
settlement_line_id       primary key
settlement_id            foreign key → settlements
zig_id                   foreign key → work_orders
fabric_id               foreign key → fabrics
total_quantity           required
total_weight             required
average_weight           required
standard_weight_g        required snapshot
standard_length_cm       nullable snapshot
standard_width_cm        nullable snapshot
unit_price               required snapshot
deduction_factor         required snapshot
deduction_unit           required snapshot
deduction_per_piece      required
deduction_amount         required
gross_fabric_value       required
net_fabric_value         required
```

### 4.22 `settlement_line_returns`

This table makes the settlement scope explicit and prevents the same return
from being settled twice:

```text
settlement_line_id       foreign key → settlement_lines
return_id                foreign key → fabric_returns, unique
```

Only returns included in a completed settlement may be linked. The same
pattern may be used for returned-to-weaver exclusions if a separate audit trail
is needed.

### 4.23 `settlement_yarn_lines`

Yarn settlement lines are a required structural component of a complete
settlement, but a zig with no yarn issued may have zero yarn lines:

```text
settlement_yarn_line_id  primary key
settlement_id            foreign key → settlements
zig_id                   foreign key → work_orders
yarn_given_id            foreign key → yarn_given
yarn_variant_id          foreign key → yarn_variants
issued_quantity          required
returned_quantity        required
net_quantity             required
unit_price               required snapshot
total_cost               required
```

Every yarn-given record selected for settlement must be represented. Yarn
returns reduce `net_quantity` and `total_cost`.

### 4.24 `settlement_payments`

```text
settlement_payment_id    primary key
settlement_id            foreign key → settlements
amount                   required
payment_method           nullable
payment_date             required
recorded_by_user_id      foreign key → users
notes                    nullable
```

### 4.25 `direct_transactions`

```text
transaction_id           primary key
type                     fabric_purchase_from_weaver
                         | yarn_sale_to_weaver
                         | fabric_sale_to_merchant
weaver_user_id           nullable foreign key → users
merchant_user_id         nullable foreign key → users
total_amount             required
amount_paid              default 0
status                   unpaid | partially_paid | paid | cancelled
transaction_date         required
created_by_user_id       foreign key → users
notes                    nullable
```

Counterparty constraints:

```text
fabric_purchase_from_weaver → weaver_user_id required
yarn_sale_to_weaver         → weaver_user_id required
fabric_sale_to_merchant     → merchant_user_id required
```

### 4.26 `direct_transaction_lines`

```text
line_id                  primary key
transaction_id            foreign key → direct_transactions
fabric_variant_id         nullable
yarn_variant_id           nullable
quantity                  required, positive
unit_price                required historical price
line_total                required or generated
description               nullable
```

Exactly one of `fabric_variant_id` and `yarn_variant_id` is required. The
transaction type determines the allowed variant and stock direction.

### 4.27 `direct_transaction_payments`

```text
payment_id               primary key
transaction_id           foreign key → direct_transactions
amount                   required, positive
payment_method           nullable
payment_date             required
recorded_by_user_id      foreign key → users
notes                    nullable
```

The server must reject payments that exceed the outstanding transaction
balance, unless an explicit overpayment policy is introduced.

## 5. Route changes

### Catalog routes

Current product, yarn-type, base-price, and color-code endpoints become:

```text
GET/POST/PATCH /catalog/fabrics
GET/POST/PATCH /catalog/yarns
GET/POST/PATCH /catalog/colors
GET/POST/PATCH /catalog/designs
GET/POST/PATCH /catalog/suppliers
GET/POST/PATCH /catalog/fabric-variants
GET/POST/PATCH /catalog/yarn-variants
GET/POST/PATCH /catalog/fabric-prices
GET/POST/PATCH /catalog/yarn-prices
GET/POST/PATCH /catalog/quality-rules
```

Fabric PATCH permits standard measurements and active status, but not ID or
name changes.

### Production routes

The following remain conceptually:

```text
work-orders
yarn-given
fabric-returns
```

They must use `fabrics`, `yarns`, merged users, required designs, and the new
price resolution rules. The active price is prefilled from the event date, but
the admin may edit it before saving. Missing active prices block the form.

Fabric-return routes record production facts only. They do not calculate or
persist a settlement deduction on the return.

Additional production routes support:

```text
POST /work-orders/:zigId/mark-returned
POST /work-orders/:zigId/cancel
POST /yarn-returns
POST /fabric-returns-to-weavers
```

Cancellation is allowed only before settlement. Returned yarn and fabric
returned to a weaver are recorded before settlement.

### Settlement routes

```text
POST /settlements/batches
GET  /settlements/batches/:id
POST /settlements/:id/agree
POST /settlements/:id/pay
GET  /settlements
GET  /settlements/:id
```

The persisted settlement batch snapshot and committed settlement data must use
the same calculation result.

### Direct transaction routes

```text
GET  /direct-transactions
POST /direct-transactions
GET  /direct-transactions/:id
POST /direct-transactions/:id/payments
GET  /direct-transactions/:id/payments
```

The API should reject invalid counterparty, item, and stock-direction
combinations.

### Procurement routes

Manual yarn purchases remain:

```text
GET  /procurement/yarn-purchases
POST /procurement/yarn-purchases
```

No supplier-payment route is required for this workflow.

## 6. Reporting changes

The new settlement report should preserve the useful legacy report columns:

```text
weaver
zig
fabric
quantity
average weight
standard weight
deduction
gross fabric value
net fabric value
yarn quantity
yarn cost
net settlement
```

It should also show:

- settlement status
- payment date
- payment method
- approval/agreement status
- calculation snapshot values

Separate financial reports should cover:

- manual yarn purchases and expenses
- direct fabric purchases from weavers
- yarn sales to weavers
- fabric sales to merchants
- outstanding merchant balances
- outstanding weaver balances from direct purchases
- inventory movements

The old report's Amharic amount-in-words and signature/approval areas can be
preserved in the printable settlement report.

The application does not record an in-app weaver agreement or dispute. Any
in-person approval is represented by the admin's payment action. Therefore,
reports should show settlement status and payment details rather than an
application agreement status.

## 7. Data integrity requirements

The implementation must enforce:

1. Positive quantities for production and direct transactions.
2. Exactly one catalog item per transaction line.
3. Required design for every fabric variant.
4. Immutable fabric identity after use.
5. Immutable historical prices on recorded lines.
6. No overlapping active periods in either price table.
7. No duplicate settlement of the same zig/fabric calculation group.
8. Every selected yarn-given record is represented in settlement yarn lines.
9. A settlement payment belongs to exactly one weaver.
10. A direct payment cannot exceed its outstanding balance.
11. Stock changes are transaction-type aware.
12. Settled production facts cannot be edited.
13. Cancelled or inactive catalog items cannot be used for new transactions.
14. A zig cannot be cancelled after settlement.
15. Returned yarn cannot exceed issued yarn.
16. Fabric returned to a weaver is allowed only before settlement.
17. A deduction exceeding the fabric unit price blocks settlement for manual
    review.
18. A negative settlement blocks payment for manual review.
19. Settlement calculation snapshots remain readable after catalog changes.

## 8. Migration strategy

The current database contains demo data and is not the authoritative source.
It may be reset or wiped during development. The authoritative historical data
is in `albasat_zigs.xlsx`, with the legacy report and Python generator used for
verification.

The redesign should be implemented in phases:

1. Back up the Excel workbook and preserve the original unchanged.
2. Reset/rebuild the demo database with the target schema.
3. Create fabrics, yarns, suppliers, colors, designs, and variants from the
   workbook catalog sheets.
4. Create initial fabric and yarn price records from the workbook and confirm
   which prices are historical purchase, weaver-rate, and selling prices.
5. Create users and roles from the workbook weaver data.
6. Import zigs, yarn given, and fabric returns as underlying production facts.
7. Import or create yarn-return and fabric-return-to-weaver records where the
   workbook contains evidence for them.
8. Recalculate settlement previews using the target server rules.
9. Compare calculated totals with the workbook reports and legacy PDF.
10. Review and resolve every import discrepancy before enabling payments.
11. Update routes, frontend, and mobile clients to the target schema.
12. Keep the import script repeatable so the database can be rebuilt from the
   workbook during testing.

No complex live-data compatibility layer is required. The import process must
still preserve original IDs or maintain an explicit source-ID mapping so
historical rows can be traced back to the workbook.

### 8.1 Docker rollout strategy

The redesigned system should run in a separate Docker stack rather than
replacing the current containers in place.

```text
Current stack:   awra-old
Redesign stack:  awra-new
```

The two stacks must use:

- Separate application containers or images.
- Separate PostgreSQL containers.
- Separate database volumes.
- Separate environment files and database connection strings.
- Different host ports if both stacks run at the same time.

Example:

```text
Old application:      localhost:3000
Redesigned application: localhost:3001
```

Recommended rollout:

1. Keep the current stack unchanged as a rollback option.
2. Build the redesigned application image.
3. Start a new database container with a new volume.
4. Import and validate the Excel data in the new database.
5. Run backend, frontend, mobile, stock, and settlement verification.
6. Switch the active port or reverse-proxy target to the new stack.
7. Keep the old stack stopped but available until the new system is confirmed.

The old and new applications must never share the same database volume while
their schemas differ. Switching back means stopping the new stack and starting
the old stack; it does not require changing or restoring the database schema.

## 9. Acceptance criteria before implementation is considered complete

- A complete zig can be issued, returned, previewed, paid, and
  reconciled.
- Multiple returns of the same fabric in one zig produce one grouped quality
  calculation.
- Multiple variants of the same fabric type in one zig are grouped together
  for quality calculation.
- Two zigs for one weaver can be paid in one settlement.
- Zigs for different weavers cannot be paid with one settlement payment.
- A zig can be cancelled before settlement and cannot be cancelled afterward.
- Unused yarn can be returned and reduces settlement yarn cost.
- Fabric can be returned to a weaver before settlement and is excluded from
  the settlement.
- Manual yarn purchase updates stock and expense without supplier payable data.
- Direct fabric purchase from a weaver updates stock and creates a weaver
  balance.
- Yarn sale to a weaver reduces yarn stock and handles immediate or delayed
  payment.
- Fabric sale to a merchant reduces fabric stock and handles immediate,
  partial, or delayed payment.
- Current prices can change without rewriting historical transaction values.
- Settlement reports reproduce the important totals from the legacy report.
- Frontend and mobile clients use the same server-calculated financial values.
