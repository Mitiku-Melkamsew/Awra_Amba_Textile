import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
    return;
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

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}