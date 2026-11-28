import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { UserRole } from "../../domain/types/enums.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  workOrder: {
    count: vi.fn(),
  },
  settlement: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  settlementPayment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  yarnVariant: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  yarnPurchase: {
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const mockPassword = vi.hoisted(() => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

const mockUserService = vi.hoisted(() => ({
  getUserById: vi.fn(),
  getUserBalance: vi.fn(),
}));

const mockReportService = vi.hoisted(() => ({
  exportSettlementHisabCsv: vi.fn(),
  getSettlementHisab: vi.fn(),
  exportPaymentHisabCsv: vi.fn(),
  getPaymentHisab: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({ prisma: mockPrisma }));
vi.mock("../../infrastructure/auth/password.js", () => ({ PasswordService: mockPassword }));
vi.mock("./user.service.js", () => ({ UserService: mockUserService }));
vi.mock("./report.service.js", () => ({ ReportService: mockReportService }));
vi.mock("./audit.service.js", () => ({
  AuditService: { record: vi.fn().mockResolvedValue(undefined) },
}));

import { AuthService } from "./auth.service.js";
import { WeaverPortalService } from "./weaver-portal.service.js";
import { ProcurementService } from "./procurement.service.js";
import { mapPrismaError } from "../../infrastructure/persistence/prisma-error-mapper.js";
import { createErrorHandler } from "../../presentation/middleware/error-handler.js";
import { verifyToken } from "../../utils/jwt.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthService", () => {
  it("logs in active users with matching passwords and issues a JWT", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      userId: 7,
      username: "weaver7",
      firstName: "Demo",
      lastName: "Weaver",
      isActive: true,
      tokenVersion: 2,
      passwordHash: "hashed",
      roles: [{ role: UserRole.weaver }],
    });
    mockPassword.verify.mockResolvedValueOnce(true);

    const result = await AuthService.login("weaver7", "Pass123!");
    expect(verifyToken(result.token)).toMatchObject({
      userId: 7,
      username: "weaver7",
      roles: [UserRole.weaver],
      tokenVersion: 2,
    });
    expect(result.user.userId).toBe(7);
  });

  it("rejects invalid passwords on login", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      userId: 7,
      username: "weaver7",
      isActive: true,
      passwordHash: "hashed",
      roles: [],
    });
    mockPassword.verify.mockResolvedValueOnce(false);

    await expect(AuthService.login("weaver7", "wrong")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects duplicate usernames on signup and creates merchant/weaver accounts otherwise", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ userId: 1 });
    await expect(
      AuthService.signup({ username: "taken", password: "Password1!", firstName: "A" }),
    ).rejects.toBeInstanceOf(ConflictError);

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPassword.hash.mockResolvedValueOnce("argon-hash");
    mockPrisma.user.create.mockResolvedValueOnce({
      userId: 12,
      username: "newm",
      firstName: "New",
      lastName: null,
      tokenVersion: 0,
      roles: [{ role: UserRole.merchant }],
    });

    const created = await AuthService.signup({
      username: "newm",
      password: "Password1!",
      firstName: "New",
      role: "merchant",
    });
    expect(verifyToken(created.token).roles).toEqual([UserRole.merchant]);
  });

  it("rotates tokenVersion when changing password", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      userId: 7,
      passwordHash: "old-hash",
    });
    mockPassword.verify.mockResolvedValueOnce(true);
    mockPassword.hash.mockResolvedValueOnce("new-hash");
    mockPrisma.user.update.mockResolvedValueOnce({
      userId: 7,
      username: "weaver7",
      tokenVersion: 3,
      roles: [{ role: UserRole.weaver }],
    });

    const res = await AuthService.changePassword(7, "Old123!", "New456!");
    expect(verifyToken(res.token).tokenVersion).toBe(3);
  });
});

describe("WeaverPortalService", () => {
  it("builds weaver profile with active order count and balance", async () => {
    mockUserService.getUserById.mockResolvedValueOnce({
      userId: 5,
      username: "w5",
      firstName: "W",
      lastName: "Five",
      roles: [{ role: UserRole.weaver }],
    });
    mockUserService.getUserBalance.mockResolvedValueOnce({
      userId: 5,
      roles: [UserRole.weaver],
      weaverBalance: { directPurchasePayable: 100, unsettledReturnedZigsCount: 2 },
    });
    mockPrisma.workOrder.count.mockResolvedValueOnce(3);

    const profile = await WeaverPortalService.getProfile(5);
    expect(profile.activeOrdersCount).toBe(3);
    expect(profile.balance.weaverBalance?.directPurchasePayable).toBe(100);
  });

  it("enforces weaver ownership on settlement statements and supports CSV vs JSON", async () => {
    mockPrisma.settlement.findUnique.mockResolvedValueOnce(null);
    await expect(
      WeaverPortalService.getMySettlementStatement(99, {
        userId: 5,
        username: "w5",
        roles: [UserRole.weaver],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    mockPrisma.settlement.findUnique.mockResolvedValueOnce({
      settlementId: 10,
      weaverUserId: 999,
    });
    await expect(
      WeaverPortalService.getMySettlementStatement(10, {
        userId: 5,
        username: "w5",
        roles: [UserRole.weaver],
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    mockPrisma.settlement.findUnique.mockResolvedValueOnce({
      settlementId: 10,
      weaverUserId: 5,
    });
    mockReportService.exportSettlementHisabCsv.mockResolvedValueOnce("col1,col2\n");
    const csvRes = await WeaverPortalService.getMySettlementStatement(
      10,
      { userId: 5, username: "w5", roles: [UserRole.weaver] },
      "csv",
    );
    expect(csvRes).toEqual({ format: "csv", csv: "col1,col2\n" });
  });
});

describe("ProcurementService.createPurchase supplier fallback", () => {
  it("resolves supplierId from the first yarnVariant when omitted", async () => {
    mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => cb(mockPrisma));
    mockPrisma.yarnVariant.findUnique
      .mockResolvedValueOnce({ supplierId: 14 })
      .mockResolvedValueOnce({ yarnVariantId: 3, supplierId: 14 });
    mockPrisma.yarnPurchase.create.mockResolvedValueOnce({
      purchaseId: 55,
      supplierId: 14,
      lines: [{ lineId: 1, yarnVariantId: 3, quantity: 10, unitPrice: 80 }],
    });
    mockPrisma.yarnVariant.update.mockResolvedValueOnce({});

    const purchase = await ProcurementService.createPurchase(
      {
        supplierId: null,
        lines: [{ yarnVariantId: 3, quantity: 10, unitPrice: 80 }],
      },
      1,
    );
    expect(purchase.supplierId).toBe(14);
  });

  it("throws ValidationError when supplierId cannot be resolved", async () => {
    mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => cb(mockPrisma));
    mockPrisma.yarnVariant.findUnique.mockResolvedValueOnce(null);

    await expect(
      ProcurementService.createPurchase(
        {
          supplierId: null,
          lines: [{ yarnVariantId: 999, quantity: 5, unitPrice: 50 }],
        },
        1,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("mapPrismaError + createErrorHandler", () => {
  it("maps Prisma known request errors cleanly without presentation importing Prisma", () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    const p2003 = new Prisma.PrismaClientKnownRequestError("fk", {
      code: "P2003",
      clientVersion: "test",
    });
    const p2025 = new Prisma.PrismaClientKnownRequestError("missing", {
      code: "P2025",
      clientVersion: "test",
    });

    expect(mapPrismaError(p2002)).toBeInstanceOf(ConflictError);
    expect(mapPrismaError(p2003)).toBeInstanceOf(ValidationError);
    expect(mapPrismaError(p2025)).toBeInstanceOf(NotFoundError);

    const handler = createErrorHandler(mapPrismaError);
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    handler(p2002, {} as any, { status } as any, vi.fn());
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: "A record with this combination or identifier already exists.",
    });
  });
});
