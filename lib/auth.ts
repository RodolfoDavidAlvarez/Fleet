import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";

export type UserRole = "admin" | "mechanic" | "driver" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  approval_status?: string;
}

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return null;
    }

    // Get user details from users table
    const dbSupabase = createServerClient();
    const { data: user, error } = await dbSupabase
      .from("users")
      .select("id, email, name, role, phone, approval_status")
      .eq("email", authUser.email.toLowerCase())
      .single();

    if (error || !user) {
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Check if the current request is authenticated
 * Returns the user if authenticated, or a 401 response if not
 */
export async function requireAuth(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { user };
}

/**
 * Check if the current request is from an admin user
 * Returns the user if admin, or appropriate error response
 */
export async function requireAdmin(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const authResult = await requireAuth();

  if (authResult.error) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  // Check approval status for admins
  if (authResult.user.approval_status !== "approved") {
    return {
      error: NextResponse.json(
        { error: "Your admin account is pending approval" },
        { status: 403 }
      ),
    };
  }

  return { user: authResult.user };
}

/**
 * Check if the current request is from an admin or mechanic
 * Returns the user if authorized, or appropriate error response
 */
export async function requireStaff(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const authResult = await requireAuth();

  if (authResult.error) {
    return authResult;
  }

  if (!["admin", "mechanic"].includes(authResult.user.role)) {
    return {
      error: NextResponse.json(
        { error: "Staff access required" },
        { status: 403 }
      ),
    };
  }

  return { user: authResult.user };
}

/**
 * Simple rate limiter using in-memory store
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // First attempt or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    // Rate limited
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  // Increment count
  record.count++;
  return { allowed: true };
}
