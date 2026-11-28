import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { DomainError } from "../../domain/errors/domain-errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err as any).errors ? { details: (err as any).errors } : {},
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.errors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "A record with this combination or identifier already exists." });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({ error: "The referenced counterparty or variant does not exist in the database." });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Requested record not found." });
      return;
    }
  }

  console.error("Unhandled Application Error:", err);
  res.status(500).json({ error: "Internal server error" });
}
