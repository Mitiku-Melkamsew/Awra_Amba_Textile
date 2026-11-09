import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
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

  if (err.message.startsWith("VALIDATION:")) {
    res.status(400).json({ error: err.message.replace("VALIDATION:", "").trim() });
    return;
  }

  if (err.message.startsWith("NOT_FOUND:")) {
    res.status(404).json({ error: err.message.replace("NOT_FOUND:", "").trim() });
    return;
  }

  if (err.message.startsWith("FORBIDDEN:")) {
    res.status(403).json({ error: err.message.replace("FORBIDDEN:", "").trim() });
    return;
  }

  if (err.message.startsWith("CONFLICT:")) {
    res.status(409).json({ error: err.message.replace("CONFLICT:", "").trim() });
    return;
  }

  if (err.message.startsWith("INSUFFICIENT_STOCK:")) {
    res.status(400).json({ error: err.message.replace("INSUFFICIENT_STOCK:", "").trim() });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}