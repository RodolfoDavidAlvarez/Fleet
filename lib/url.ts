import { NextRequest } from "next/server";

/**
 * Normalize a base URL so it always includes a scheme and no trailing slash.
 * Falls back to http://localhost:3000 for development if nothing is provided.
 */
export function normalizeBaseUrl(raw?: string | null): string {
  if (!raw) return "http://localhost:3000";

  const trimmed = raw.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Prefer http for local development hosts
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  // Default to https for production-like domains
  return `https://${trimmed}`;
}

/**
 * Resolve the best-known application base URL from environment variables or request context.
 * Ensures the result is safe to embed in SMS/Email links.
 */
export function getBaseUrl(request?: NextRequest): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.BOOKING_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
    request?.headers.get("origin"),
  ].filter(Boolean) as string[];

  const raw = candidates.find(Boolean);
  return normalizeBaseUrl(raw);
}
