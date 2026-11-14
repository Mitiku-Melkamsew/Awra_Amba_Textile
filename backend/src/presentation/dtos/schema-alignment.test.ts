import { describe, it, expect } from "vitest";
import { SignupSchema } from "./auth.dto.js";
import {
  CreateDirectTransactionSchema,
  AddDirectTxnPaymentSchema,
} from "./direct-transaction.dto.js";
import {
  AddYarnGivenSchema,
  AddYarnReturnSchema,
  CreateWorkOrderSchema,
} from "./work-order.dto.js";
import { CreateProcurementSchema } from "./procurement.dto.js";

/**
 * The schema-alignment refactor renamed DTO fields to match the Prisma schema.
 * These tests pin the behaviour that existing web and Flutter clients rely on:
 * canonical fields are preferred, legacy aliases are still accepted.
 */

describe("SignupSchema schema alignment", () => {
  const base = { username: "aster", password: "Passw0rd", role: "weaver" as const };

  it("accepts the canonical fullName field", () => {
    const parsed = SignupSchema.safeParse({ ...base, fullName: "Aster Aweke" });
    expect(parsed.success).toBe(true);
  });

  it("still accepts the legacy firstName/lastName client payload", () => {
    const parsed = SignupSchema.safeParse({
      ...base,
      firstName: "Aster",
      lastName: "Aweke",
      companyName: undefined,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a payload with no name at all", () => {
    const parsed = SignupSchema.safeParse(base);
    expect(parsed.success).toBe(false);
  });
});

describe("Direct transaction DTO schema alignment", () => {
  const line = { fabricVariantId: 7, quantity: 2, unitPrice: 150 };

  it("normalises the legacy short type names", () => {
    const parsed = CreateDirectTransactionSchema.parse({
      type: "fabric_purchase",
      weaverId: 4,
      lines: [line],
    });
    expect(parsed.type).toBe("fabric_purchase_from_weaver");
  });

  it("preserves yarn_purchase so the controller can route it to procurement", () => {
    const parsed = CreateDirectTransactionSchema.parse({
      transactionType: "yarn_purchase",
      supplierId: 2,
      items: [{ yarnId: 3, quantity: 5, unitPrice: 20 }],
    });
    expect(parsed.type).toBeUndefined();
    expect(parsed.transactionType).toBe("yarn_purchase");
  });

  it("accepts the legacy line identifiers sent by the web client", () => {
    const parsed = CreateDirectTransactionSchema.safeParse({
      type: "fabric_purchase",
      weaverId: 4,
      lines: [
        {
          fabricId: 7,
          productId: 7,
          designId: null,
          quantity: "2",
          unitPrice: "150",
          description: undefined,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a payment with a reference number", () => {
    const parsed = AddDirectTxnPaymentSchema.safeParse({
      amount: 500,
      paymentMethod: "cash",
      referenceNumber: "RC-1",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("Work order DTO schema alignment", () => {
  it("accepts yarn given as a single line using the legacy yarnId", () => {
    const parsed = AddYarnGivenSchema.safeParse({
      lines: [{ yarnId: 3, quantity: 1.5, unitPrice: 0 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a yarn return that only sends yarnId + quantityKg", () => {
    const parsed = AddYarnReturnSchema.safeParse({
      yarnId: 3,
      quantityKg: 1.5,
      returnDate: new Date().toISOString(),
    });
    expect(parsed.success).toBe(true);
  });

  it("requires a weaver when creating a work order, under either name", () => {
    const canonical = CreateWorkOrderSchema.safeParse({
      weaverUserId: 4,
      fabricVariantId: 7,
    });
    const legacy = CreateWorkOrderSchema.safeParse({
      weaverId: 4,
      fabricVariantId: 7,
    });
    const missing = CreateWorkOrderSchema.safeParse({ fabricVariantId: 7 });
    expect(canonical.success).toBe(true);
    expect(legacy.success).toBe(true);
    expect(missing.success).toBe(false);
  });
});

describe("Procurement DTO schema alignment", () => {
  it("accepts canonical and legacy line fields together", () => {
    const parsed = CreateProcurementSchema.safeParse({
      supplierId: "2",
      lines: [{ yarnVariantId: 3, quantity: 10, unitPrice: 5, quantityKg: 10, unitCost: 5 }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.supplierId).toBe(2);
    }
  });
});