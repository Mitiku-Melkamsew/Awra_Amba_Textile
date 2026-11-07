import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export interface RecordAuditInput {
  actorUserId: number;
  action: string;
  entityType: string;
  entityId?: string | number;
  details?: Prisma.InputJsonValue;
}

export interface QueryAuditInput {
  actorUserId?: number;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  static async record(input: RecordAuditInput, db: DbClient = prisma) {
    return db.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId === undefined ? undefined : String(input.entityId),
        details: input.details,
      },
    });
  }

  static async query(input: QueryAuditInput = {}) {
    const where: Prisma.AuditLogWhereInput = {};

    if (input.actorUserId) where.actorUserId = input.actorUserId;
    if (input.entityType) where.entityType = input.entityType;
    if (input.entityId) where.entityId = input.entityId;

    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) where.createdAt.gte = input.startDate;
      if (input.endDate) where.createdAt.lte = input.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              userId: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit ?? 50,
        skip: input.offset ?? 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
