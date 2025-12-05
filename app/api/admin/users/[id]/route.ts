import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Delete user by ID (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creating Supabase client:", clientError);
      }
      return NextResponse.json(
        { 
          error: clientError.message || "Failed to initialize database connection. Check SUPABASE_SERVICE_ROLE_KEY environment variable." 
        },
        { status: 500 }
      );
    }

    // First, delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError && authError.message !== 'User not found') {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error deleting auth user:", authError);
      }
      // Continue to delete public user even if auth deletion fails
    }

    // Then, delete the public user record
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error deleting user:", deleteError);
      }
      return NextResponse.json(
        { 
          error: "Failed to delete user",
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in DELETE /api/admin/users/[id]:", error);
    }
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}


