import type { Request } from "express";
import { ValidationError } from "../../domain/errors/domain-errors.js";

/**
 * Reads a numeric route parameter that is expected to have been coerced by
 * `validateParams(NumericIdParamSchema)`.
 *
 * The fallback parse keeps the endpoint at 400 instead of 500 if a future
 * route forgets the validation middleware. Centralising the read means
 * controllers never hand a raw string to a service.
 */
export function numericParam(req: Request, key = "id"): number {
  const raw: unknown = req.params[key];
  const value = typeof raw === "number" ? raw : Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`Invalid numeric route parameter "${key}"`);
  }

  return value;
}
