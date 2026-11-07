import { UserRole } from "@prisma/client";

export enum Capability {
  // Users & Roles
  USERS_READ = "users.read",
  USERS_MANAGE = "users.manage",
  ROLES_MANAGE = "roles.manage",

  // Master Catalog & Pricing
  CATALOG_READ = "catalog.read",
  CATALOG_MANAGE = "catalog.manage",
  PRICES_READ = "prices.read",
  PRICES_MANAGE = "prices.manage",
  QUALITY_RULES_MANAGE = "quality_rules.manage",

  // Work Orders & Production
  WORK_ORDERS_READ_ALL = "work_orders.read_all",
  WORK_ORDERS_READ_OWN = "work_orders.read_own",
  WORK_ORDERS_MANAGE = "work_orders.manage",
  YARN_GIVEN_MANAGE = "yarn_given.manage",
  FABRIC_RETURNS_MANAGE = "fabric_returns.manage",

  // Settlements & Quality Calculations
  SETTLEMENTS_PREVIEW = "settlements.preview",
  SETTLEMENTS_COMMIT = "settlements.commit",
  SETTLEMENTS_PAY = "settlements.pay",
  SETTLEMENTS_OVERRIDE = "settlements.override",
  SETTLEMENTS_READ_OWN = "settlements.read_own",

  // Procurement
  PROCUREMENT_MANAGE = "procurement.manage",

  // Direct Commercial Transactions
  DIRECT_TRANSACTIONS_MANAGE = "direct_transactions.manage",
  DIRECT_TRANSACTIONS_READ_ALL = "direct_transactions.read_all",
  DIRECT_TRANSACTIONS_READ_OWN = "direct_transactions.read_own",

  // Inventory & Stock
  STOCK_READ = "stock.read",

  // Reports & Financials
  REPORTS_READ_FINANCIAL = "reports.read_financial",

  // Audit Logs
  AUDIT_READ = "audit.read",
}

/**
 * Role to Capabilities Mapping Matrix
 */
export const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  [UserRole.admin]: [
    Capability.USERS_READ,
    Capability.USERS_MANAGE,
    Capability.ROLES_MANAGE,
    Capability.CATALOG_READ,
    Capability.CATALOG_MANAGE,
    Capability.PRICES_READ,
    Capability.PRICES_MANAGE,
    Capability.QUALITY_RULES_MANAGE,
    Capability.WORK_ORDERS_READ_ALL,
    Capability.WORK_ORDERS_MANAGE,
    Capability.YARN_GIVEN_MANAGE,
    Capability.FABRIC_RETURNS_MANAGE,
    Capability.SETTLEMENTS_PREVIEW,
    Capability.SETTLEMENTS_COMMIT,
    Capability.SETTLEMENTS_PAY,
    Capability.SETTLEMENTS_OVERRIDE,
    Capability.PROCUREMENT_MANAGE,
    Capability.DIRECT_TRANSACTIONS_MANAGE,
    Capability.DIRECT_TRANSACTIONS_READ_ALL,
    Capability.STOCK_READ,
    Capability.REPORTS_READ_FINANCIAL,
    Capability.AUDIT_READ,
  ],
  [UserRole.weaver]: [
    Capability.CATALOG_READ,
    Capability.PRICES_READ,
    Capability.WORK_ORDERS_READ_OWN,
    Capability.SETTLEMENTS_READ_OWN,
    Capability.DIRECT_TRANSACTIONS_READ_OWN,
  ],
  [UserRole.merchant]: [
    Capability.CATALOG_READ,
    Capability.DIRECT_TRANSACTIONS_READ_OWN,
  ],
};
