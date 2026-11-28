import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { DomainError } from "../../domain/errors/domain-errors.js";

export type ExternalErrorMapper = (err: unknown) => DomainError | null;

export function createErrorHandler(mapExternalError?: ExternalErrorMapper) {
  return function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) {
    const mapped = mapExternalError ? mapExternalError(err) : null;
    const resolved = mapped ?? err;

    if (resolved instanceof DomainError) {
      res.status(resolved.statusCode).json({
        error: resolved.message,
        ...(resolved as any).errors ? { details: (resolved as any).errors } : {},
      });
      return;
    }

    if (resolved instanceof ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: resolved.errors,
      });
      return;
    }

    console.error("Unhandled Application Error:", err);
    res.status(500).json({ error: "Internal server error" });
  };
}

export const errorHandler = createErrorHandler();
