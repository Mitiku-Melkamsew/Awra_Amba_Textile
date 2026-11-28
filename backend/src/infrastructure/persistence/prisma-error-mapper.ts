import { Prisma } from "@prisma/client";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  type DomainError,
} from "../../domain/errors/domain-errors.js";

export function mapPrismaError(err: unknown): DomainError | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (err.code === "P2002") {
    return new ConflictError("A record with this combination or identifier already exists.");
  }
  if (err.code === "P2003") {
    return new ValidationError(
      "The referenced counterparty or variant does not exist in the database.",
    );
  }
  if (err.code === "P2025") {
    return new NotFoundError("Requested record not found.");
  }

  return null;
}
