import { UserRole, DirectTxnType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PasswordService } from "../../infrastructure/auth/password.js";
import { AuditService } from "./audit.service.js";
import { NotFoundError, ConflictError, ValidationError } from "../../domain/errors/domain-errors.js";

export interface ListUsersFilter {
  role?: UserRole;
  isActive?: boolean;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface CreateUserInput {
  username?: string | null;
  password?: string | null;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  roles?: UserRole[];
  role?: UserRole;
  companyName?: string | null;
}

export function generateUsernameFromName(fullName: string): string {
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".");

  if (cleaned.length >= 3) {
    return cleaned.slice(0, 30);
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `user.${randomSuffix}`;
}

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

export interface UpdateUserInput {
  fullName?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export class UserService {
  static async listUsers(filter: ListUsersFilter = {}) {
    const where: any = {};

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.role) {
      where.roles = {
        some: { role: filter.role },
      };
    }

    if (filter.query) {
      const q = filter.query.trim();
      where.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            select: { role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filter.limit ?? 100,
        skip: filter.offset ?? 0,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        userId: u.userId,
        username: u.username,
        fullName: u.fullName,
        phone: u.phone,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        roles: u.roles.map((r) => r.role),
      })),
      total,
    };
  }

  static async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        roles: { select: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    return {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.roles.map((r) => r.role),
    };
  }

  static async createUser(input: CreateUserInput, actorUserId: number) {
    if (!input.fullName || !input.fullName.trim()) {
      throw new ValidationError("Full name is required");
    }
    const fullName = input.fullName.trim();

    // 1. Resolve roles (default to weaver if none provided)
    let roles = input.roles;
    if (!roles || roles.length === 0) {
      if (input.role) {
        roles = [input.role];
      } else {
        roles = [UserRole.weaver];
      }
    }
    roles = Array.from(new Set(roles));

    // 2. Resolve username (auto-generate from name if omitted/empty)
    let username = input.username?.trim();
    let isAutoUsername = false;
    if (!username) {
      username = generateUsernameFromName(fullName);
      isAutoUsername = true;
    }

    let existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      if (isAutoUsername) {
        let counter = 1;
        let candidate = `${username}${counter}`;
        while (await prisma.user.findUnique({ where: { username: candidate } })) {
          counter++;
          candidate = `${username}${counter}`;
        }
        username = candidate;
      } else {
        throw new ConflictError(`Username '${username}' is already taken`);
      }
    }

    // 3. Resolve password (auto-generate from name if omitted/empty)
    let plainPassword = input.password?.trim();
    if (!plainPassword || plainPassword.length < 4) {
      plainPassword = generatePasswordFromName(fullName);
    }

    const passwordHash = await PasswordService.hash(plainPassword);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          fullName,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          passwordHash,
          roles: {
            create: roles.map((role) => ({ role })),
          },
        },
        include: {
          roles: { select: { role: true } },
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "user.create",
          entityType: "user",
          entityId: created.userId,
          details: {
            username: created.username,
            fullName: created.fullName,
            roles,
          },
        },
        tx,
      );

      return created;
    });

    return {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      isActive: user.isActive,
      roles: user.roles.map((r) => r.role),
      initialPassword: plainPassword,
    };
  }

  static async updateUser(userId: number, input: UpdateUserInput, actorUserId: number) {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.user.update({
        where: { userId },
        data: {
          fullName: input.fullName ?? undefined,
          phone: input.phone ?? undefined,
          email: input.email ?? undefined,
          isActive: input.isActive ?? undefined,
        },
        include: {
          roles: { select: { role: true } },
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "user.update",
          entityType: "user",
          entityId: userId,
          details: input as any,
        },
        tx,
      );

      return res;
    });

    return {
      userId: updated.userId,
      username: updated.username,
      fullName: updated.fullName,
      phone: updated.phone,
      email: updated.email,
      isActive: updated.isActive,
      roles: updated.roles.map((r) => r.role),
    };
  }

  static async setUserStatus(userId: number, isActive: boolean, actorUserId: number) {
    return this.updateUser(userId, { isActive }, actorUserId);
  }

  static async assignRole(userId: number, role: UserRole, actorUserId: number) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { roles: true },
    });
    if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

    if (user.roles.some((r) => r.role === role)) {
      return { success: true, message: "Role already assigned" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.create({
        data: { userId, role },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "user.role_assign",
          entityType: "user",
          entityId: userId,
          details: { assignedRole: role },
        },
        tx,
      );
    });

    return { success: true, role };
  }

  static async revokeRole(userId: number, role: UserRole, actorUserId: number) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { roles: true },
    });
    if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

    if (user.roles.length <= 1) {
      throw new ConflictError("Cannot revoke the user's only role");
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.deleteMany({
        where: { userId, role },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "user.role_revoke",
          entityType: "user",
          entityId: userId,
          details: { revokedRole: role },
        },
        tx,
      );
    });

    return { success: true, revokedRole: role };
  }

  static async resetPassword(userId: number, newPass: string, actorUserId: number) {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

    const passwordHash = await PasswordService.hash(newPass);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userId },
        data: { passwordHash },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "user.reset_password",
          entityType: "user",
          entityId: userId,
        },
        tx,
      );
    });

    return { success: true };
  }

  static async getUserBalance(userId: number) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { roles: true },
    });
    if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

    const roles = user.roles.map((r) => r.role);
    let merchantReceivable = 0;
    let weaverPayable = 0;

    if (roles.includes(UserRole.merchant)) {
      const merchantTxns = await prisma.directTransaction.findMany({
        where: {
          merchantUserId: userId,
          type: DirectTxnType.fabric_sale_to_merchant,
          status: { not: "cancelled" },
        },
        select: { totalAmount: true, amountPaid: true },
      });

      for (const t of merchantTxns) {
        const remaining = Number(t.totalAmount) - Number(t.amountPaid);
        if (remaining > 0) merchantReceivable += remaining;
      }
    }

    if (roles.includes(UserRole.weaver)) {
      // 1. Direct fabric purchases from weaver unpaid
      const weaverPurchases = await prisma.directTransaction.findMany({
        where: {
          weaverUserId: userId,
          type: DirectTxnType.fabric_purchase_from_weaver,
          status: { not: "cancelled" },
        },
        select: { totalAmount: true, amountPaid: true },
      });

      for (const t of weaverPurchases) {
        const remaining = Number(t.totalAmount) - Number(t.amountPaid);
        if (remaining > 0) weaverPayable += remaining;
      }

      // 2. Unsettled work order estimates
      const unsettledZigs = await prisma.workOrder.count({
        where: {
          weaverUserId: userId,
          status: "returned",
        },
      });

      return {
        userId,
        roles,
        weaverBalance: {
          directPurchasePayable: Number(weaverPayable.toFixed(2)),
          unsettledReturnedZigsCount: unsettledZigs,
        },
        merchantBalance: roles.includes(UserRole.merchant)
          ? { outstandingReceivable: Number(merchantReceivable.toFixed(2)) }
          : undefined,
      };
    }

    return {
      userId,
      roles,
      merchantBalance: roles.includes(UserRole.merchant)
        ? { outstandingReceivable: Number(merchantReceivable.toFixed(2)) }
        : undefined,
    };
  }
}
