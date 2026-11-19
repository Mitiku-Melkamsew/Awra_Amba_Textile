import { describe, it, expect } from "vitest";
import { SignupSchema } from "./auth.dto.js";
import {
  CreateDirectTransactionSchema,
  AddDirectTxnPaymentSchema,
} from "./direct-transaction.dto.js";
import {
  CreateWorkOrderSchema,
  AddFabricReturnSchema,
} from "./work-order.dto.js";
import { CreateProcurementSchema } from "./procurement.dto.js";
import {
  CreateFabricPriceSchema,
  CreateYarnPriceSchema,
  CreateYarnSchema,
} from "./catalog.dto.js";

describe("Canonical Schema Alignment Tests", () => {
  describe("SignupSchema", () => {
    it("accepts canonical fullName", () => {
      const res = SignupSchema.safeParse({
        fullName: "Almaz Ayana",
        username: "almaz",
        password: "Password123!",
        role: "weaver",
      });
      expect(res.success).toBe(true);
    });

    it("rejects when fullName is omitted", () => {
      const res = SignupSchema.safeParse({
        firstName: "Almaz",
        lastName: "Ayana",
        username: "almaz",
        password: "Password123!",
        role: "weaver",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Direct Transaction DTOs", () => {
    it("accepts canonical fabric_purchase_from_weaver with weaverUserId and fabricVariantId", () => {
      const res = CreateDirectTransactionSchema.safeParse({
        type: "fabric_purchase_from_weaver",
        weaverUserId: 3,
        lines: [{ fabricVariantId: 10, quantity: 5, unitPrice: 1200 }],
      });
      expect(res.success).toBe(true);
    });

    it("rejects legacy short type name (e.g. fabric_purchase)", () => {
      const res = CreateDirectTransactionSchema.safeParse({
        type: "fabric_purchase",
        weaverUserId: 3,
        lines: [{ fabricVariantId: 10, quantity: 5, unitPrice: 1200 }],
      });
      expect(res.success).toBe(false);
    });

    it("rejects lines without fabricVariantId or yarnVariantId", () => {
      const res = CreateDirectTransactionSchema.safeParse({
        type: "fabric_purchase_from_weaver",
        weaverUserId: 3,
        lines: [{ productId: 10, quantity: 5, unitPrice: 1200 }],
      });
      expect(res.success).toBe(false);
    });

    it("rejects legacy weaverId alias", () => {
      const res = CreateDirectTransactionSchema.safeParse({
        type: "fabric_purchase_from_weaver",
        weaverId: 3,
        lines: [{ fabricVariantId: 10, quantity: 5, unitPrice: 1200 }],
      });
      expect(res.success).toBe(false);
    });

    it("accepts AddDirectTxnPaymentSchema with canonical fields", () => {
      const res = AddDirectTxnPaymentSchema.safeParse({
        amount: 2500,
        paymentMethod: "CBE Birr",
        notes: "Partial payment",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("Work Order DTOs", () => {
    it("requires weaverUserId (not weaverId)", () => {
      const canonical = CreateWorkOrderSchema.safeParse({
        weaverUserId: 5,
        fabricVariantId: 12,
      });
      expect(canonical.success).toBe(true);

      const legacy = CreateWorkOrderSchema.safeParse({
        weaverId: 5,
        fabricVariantId: 12,
      });
      expect(legacy.success).toBe(false);
    });

    it("accepts AddFabricReturnSchema with totalWeight and fabricVariantId", () => {
      const res = AddFabricReturnSchema.safeParse({
        fabricVariantId: 12,
        quantityReturned: 10,
        totalWeight: 640,
        unitPrice: 1300,
      });
      expect(res.success).toBe(true);
    });

    it("rejects AddFabricReturnSchema without totalWeight", () => {
      const res = AddFabricReturnSchema.safeParse({
        fabricVariantId: 12,
        quantityReturned: 10,
        actualWeightG: 640,
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Procurement DTOs", () => {
    it("accepts canonical procurement line with yarnVariantId, quantity, unitPrice", () => {
      const res = CreateProcurementSchema.safeParse({
        supplierId: 2,
        lines: [{ yarnVariantId: 4, quantity: 50, unitPrice: 380 }],
      });
      expect(res.success).toBe(true);
    });

    it("rejects procurement line with legacy unitCost or quantityKg only", () => {
      const res = CreateProcurementSchema.safeParse({
        supplierId: 2,
        lines: [{ yarnVariantId: 4, quantityKg: 50, unitCost: 380 }],
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Catalog DTOs", () => {
    it("accepts CreateFabricPriceSchema with weaverRate and sellingPrice", () => {
      const res = CreateFabricPriceSchema.safeParse({
        fabricId: 1,
        weaverRate: 150,
        sellingPrice: 1800,
      });
      expect(res.success).toBe(true);
    });

    it("rejects CreateFabricPriceSchema with legacy weaverUnitPrice", () => {
      const res = CreateFabricPriceSchema.safeParse({
        fabricId: 1,
        weaverUnitPrice: 150,
        sellingUnitPrice: 1800,
      });
      expect(res.success).toBe(false);
    });

    it("accepts CreateYarnPriceSchema with purchasePrice and sellingPrice", () => {
      const res = CreateYarnPriceSchema.safeParse({
        yarnId: 1,
        supplierId: 2,
        purchasePrice: 350,
        sellingPrice: 420,
      });
      expect(res.success).toBe(true);
    });

    it("accepts CreateYarnSchema with name only", () => {
      const res = CreateYarnSchema.safeParse({ name: "Cotton 100%" });
      expect(res.success).toBe(true);

      const legacy = CreateYarnSchema.safeParse({ materialName: "Cotton 100%" });
      expect(legacy.success).toBe(false);
    });
  });
});
