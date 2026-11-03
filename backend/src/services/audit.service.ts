import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function recordAudit(
  input: {
    actorUserId: number;
    action: string;
    entityType: string;
    entityId?: string | number;
    details?: Prisma.InputJsonValue;
  },
  db: DbClient = prisma,
) {
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
