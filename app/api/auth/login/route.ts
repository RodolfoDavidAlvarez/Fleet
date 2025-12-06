import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "unknown";

    // Check rate limit: 5 attempts per minute per IP
    const rateLimitResult = checkRateLimit(`login:${ip}`, 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter),
          },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Query user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, role, phone, password_hash, approval_status")
      .eq("email", email.toLowerCase())
      .single();

    if (error) {
      // PGRST116 is the error code when no rows are returned
      if (error.code === "PGRST116" || error.message?.includes("No rows")) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
      console.error("Database error:", error);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check if password_hash exists - require proper password for all users
    if (!user.password_hash) {
      // User needs to set a password via password reset flow
      return NextResponse.json({
        error: "Password not set. Please use the 'Forgot Password' link to set your password.",
        needsPasswordReset: true
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check approval status for admin access
    if (user.role === "admin" && user.approval_status !== "approved") {
      return NextResponse.json({ error: "Your account is pending approval. Please contact an administrator." }, { status: 403 });
    }

    // Update last_seen_at
    await supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
