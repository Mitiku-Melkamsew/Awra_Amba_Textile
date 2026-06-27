import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
    return;
  }

  if (err.message.startsWith("CONFLICT:")) {
    res.status(409).json({ error: err.message.replace("CONFLICT:", "").trim() });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}