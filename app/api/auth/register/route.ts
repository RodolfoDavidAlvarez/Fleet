import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    // Default role is 'driver' unless specified otherwise (but public registration should probably be 'driver' or 'customer')
    // Actually, for now let's default to 'driver' as per typical flow, or 'customer'. 
    // Since the user mentioned "admin changes status to user or admin", pending users might need to be generic.
    // But the schema requires a valid role. Let's use 'driver' as a safe default or 'customer'.
    // Given the context of fleet management, 'driver' seems common, but 'customer' is safer for public.
    // Let's stick to 'driver' as it seems to be the main workforce, or maybe 'customer'.
    // Checking schema: role IN ('admin', 'mechanic', 'customer', 'driver')
    // Let's default to 'driver' as they are likely employees signing up.
    
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        phone: phone || null,
        role: 'driver', // Default role
        approval_status: 'pending_approval'
      })
      .select("id, email, name, role, approval_status")
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

