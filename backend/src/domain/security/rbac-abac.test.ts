import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import { Capability } from "./capabilities.js";
import { RbacService } from "../../application/security/rbac.service.js";
import { AbacService } from "../../application/security/abac.service.js";

describe("RBAC Service", () => {
  it("grants admin full capabilities", () => {
    expect(RbacService.hasCapability([UserRole.admin], Capability.USERS_MANAGE)).toBe(true);
    expect(RbacService.hasCapability([UserRole.admin], Capability.CATALOG_MANAGE)).toBe(true);
    expect(RbacService.hasCapability([UserRole.admin], Capability.SETTLEMENTS_PAY)).toBe(true);
    expect(RbacService.hasCapability([UserRole.admin], Capability.WORK_ORDERS_MANAGE)).toBe(true);
  });

  it("restricts weaver to weaver capabilities", () => {
    expect(RbacService.hasCapability([UserRole.weaver], Capability.WORK_ORDERS_READ_OWN)).toBe(true);
    expect(RbacService.hasCapability([UserRole.weaver], Capability.SETTLEMENTS_READ_OWN)).toBe(true);
    expect(RbacService.hasCapability([UserRole.weaver], Capability.CATALOG_READ)).toBe(true);
    expect(RbacService.hasCapability([UserRole.weaver], Capability.USERS_MANAGE)).toBe(false);
    expect(RbacService.hasCapability([UserRole.weaver], Capability.WORK_ORDERS_MANAGE)).toBe(false);
    expect(RbacService.hasCapability([UserRole.weaver], Capability.SETTLEMENTS_PAY)).toBe(false);
  });

  it("restricts merchant to merchant capabilities", () => {
    expect(RbacService.hasCapability([UserRole.merchant], Capability.CATALOG_READ)).toBe(true);
    expect(RbacService.hasCapability([UserRole.merchant], Capability.DIRECT_TRANSACTIONS_READ_OWN)).toBe(true);
    expect(RbacService.hasCapability([UserRole.merchant], Capability.WORK_ORDERS_READ_ALL)).toBe(false);
    expect(RbacService.hasCapability([UserRole.merchant], Capability.PRICES_MANAGE)).toBe(false);
  });
});

describe("ABAC Service", () => {
  it("allows weaver to access own work order", () => {
    const decision = AbacService.evaluateWeaverOwnership(
      { userId: 42, username: "weaver1", roles: [UserRole.weaver] },
      { entityType: "work_order", weaverUserId: 42 },
    );
    expect(decision.allow).toBe(true);
  });

  it("denies weaver from accessing another weaver's work order", () => {
    const decision = AbacService.evaluateWeaverOwnership(
      { userId: 42, username: "weaver1", roles: [UserRole.weaver] },
      { entityType: "work_order", weaverUserId: 99 },
    );
    expect(decision.allow).toBe(false);
  });

  it("allows admin to access any weaver's work order", () => {
    const decision = AbacService.evaluateWeaverOwnership(
      { userId: 1, username: "admin", roles: [UserRole.admin] },
      { entityType: "work_order", weaverUserId: 99 },
    );
    expect(decision.allow).toBe(true);
  });

  it("masks weaver rate and raw costs for merchant role", () => {
    const rawData = {
      fabricId: 1,
      name: "Gabi",
      sellingPrice: 1500,
      weaverRate: 350,
      rawYarnCost: 200,
      margin: 950,
    };

    const masked = AbacService.maskForRole([UserRole.merchant], rawData);
    expect(masked.sellingPrice).toBe(1500);
    expect((masked as any).weaverRate).toBeUndefined();
    expect((masked as any).rawYarnCost).toBeUndefined();
    expect((masked as any).margin).toBeUndefined();
  });

  it("does not mask data for admin role", () => {
    const rawData = {
      fabricId: 1,
      name: "Gabi",
      sellingPrice: 1500,
      weaverRate: 350,
    };

    const unmasked = AbacService.maskForRole([UserRole.admin], rawData);
    expect(unmasked.weaverRate).toBe(350);
  });

  it("prevents modifying settled fabric returns", () => {
    const decision = AbacService.evaluateResourceState("update", {
      entityType: "fabric_return",
      settlementLineId: 10,
    });
    expect(decision.allow).toBe(false);
  });

  it("allows modifying unsettled fabric returns", () => {
    const decision = AbacService.evaluateResourceState("update", {
      entityType: "fabric_return",
      settlementLineId: null,
    });
    expect(decision.allow).toBe(true);
  });
});
