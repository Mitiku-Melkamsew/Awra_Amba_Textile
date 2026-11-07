import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
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

  const message = err instanceof Error ? err.message : "Internal server error";

  // Check for common error prefixes
  if (message.startsWith("VALIDATION:")) {
    res.status(400).json({ error: message.replace("VALIDATION:", "").trim() });
    return;
  }
  if (message.startsWith("NOT_FOUND:")) {
    res.status(404).json({ error: message.replace("NOT_FOUND:", "").trim() });
    return;
  }
  if (message.startsWith("CONFLICT:")) {
    res.status(409).json({ error: message.replace("CONFLICT:", "").trim() });
    return;
  }
  if (message.startsWith("BLOCKED:")) {
    res.status(422).json({ error: message.replace("BLOCKED:", "").trim() });
    return;
  }

  console.error("Unhandled Application Error:", err);
  res.status(500).json({ error: "Internal server error" });
}
