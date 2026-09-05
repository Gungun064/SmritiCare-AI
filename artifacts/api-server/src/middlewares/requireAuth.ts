import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export function getRequestUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!getRequestUserId(req)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}