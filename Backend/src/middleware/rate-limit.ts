import type { NextFunction, Request, Response } from "express";

const MAX_RESTAURANT_REQUESTS_PER_DAY = 160;
const MAX_RESTAURANT_REQUESTS_PER_MINUTE = 20;
const MINUTE_WINDOW_MS = 60_000;

let dailyCount = 0;
let currentUtcDay = new Date().toISOString().slice(0, 10);
const recentRequests: number[] = [];

function resetDailyCounterIfNeeded(now: number): void {
  const utcDay = new Date(now).toISOString().slice(0, 10);

  if (utcDay !== currentUtcDay) {
    currentUtcDay = utcDay;
    dailyCount = 0;
  }
}

function reject(
  res: Response,
  status: number,
  code: string,
  message: string,
  retryAfterSeconds?: number,
) {
  if (retryAfterSeconds !== undefined) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
  }

  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

/**
 * Global process-level guard for restaurant/provider routes.
 *
 * This intentionally counts incoming API requests before the route runs,
 * including failed requests, to prevent repeated retries from exhausting
 * upstream services. It is not a durable, multi-instance quota store.
 */
export function restaurantSearchLimiter(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const now = Date.now();
  resetDailyCounterIfNeeded(now);

  while (
    recentRequests.length > 0 &&
    now - recentRequests[0] >= MINUTE_WINDOW_MS
  ) {
    recentRequests.shift();
  }

  if (dailyCount >= MAX_RESTAURANT_REQUESTS_PER_DAY) {
    reject(
      res,
      429,
      "DAILY_SEARCH_LIMIT_REACHED",
      "La limite quotidienne de recherches est atteinte. Réessaie demain.",
      60 * 60,
    );
    return;
  }

  if (recentRequests.length >= MAX_RESTAURANT_REQUESTS_PER_MINUTE) {
    reject(
      res,
      429,
      "RATE_LIMIT_EXCEEDED",
      "Trop de recherches. Réessaie dans une minute.",
      60,
    );
    return;
  }

  // Count before entering the route so concurrent requests cannot bypass
  // the limits within this Node.js process.
  dailyCount += 1;
  recentRequests.push(now);
  next();
}
