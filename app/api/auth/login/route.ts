import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
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

    // Check if password_hash exists
    if (!user.password_hash) {
      // For demo purposes, allow login with default passwords if no hash exists
      // In production, this should be removed
      const defaultPasswords: Record<string, string> = {
        "admin@fleetpro.com": "admin123",
        "mechanic@fleetpro.com": "mechanic123",
      };

      if (defaultPasswords[email.toLowerCase()] === password) {
        // Check approval status for admin access
        if (user.role === "admin" && user.approval_status !== "approved") {
          return NextResponse.json({ error: "Your account is pending approval. Please contact an administrator." }, { status: 403 });
        }

        // Update last_seen_at
        await supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);

        // Return user without password_hash
        const { password_hash, ...userWithoutPassword } = user;
        return NextResponse.json({ user: userWithoutPassword });
      }

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
