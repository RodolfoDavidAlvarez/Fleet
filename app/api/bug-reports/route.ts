import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import sharp from "sharp";

// Service role client for storage operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Constants for image optimization
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 85;

// Helper function to safely process images
async function optimizeImage(buffer: Buffer, originalMimeType?: string): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  try {
    const metadata = await sharp(buffer).metadata();
    const format = metadata.format;

    // Determine best format - prefer WebP for better compression
    const useWebP = format !== "gif" && format !== "svg";

    let optimizedBuffer: Buffer;
    let mimeType: string;
    let extension: string;

    if (useWebP) {
      // Use WebP for better compression (smaller file size)
      optimizedBuffer = await sharp(buffer)
        .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ 
          quality: WEBP_QUALITY,
          effort: 4, // Balance between compression and speed
        })
        .toBuffer();
      mimeType = "image/webp";
      extension = "webp";
    } else {
      // Fallback to JPEG for formats that don't support WebP well
      optimizedBuffer = await sharp(buffer)
        .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ 
          quality: JPEG_QUALITY, 
          progressive: true,
          mozjpeg: true, // Better compression
        })
        .toBuffer();
      mimeType = "image/jpeg";
      extension = "jpg";
    }

    return { buffer: optimizedBuffer, mimeType, extension };
  } catch (error) {
    console.error("Error optimizing image:", error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// GET - Fetch bug reports for the logged-in user
export async function GET(request: NextRequest) {
  try {
    // Get user from session using server client
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // If no user session, return empty array
      return NextResponse.json({ reports: [] });
    }

    // Fetch bug reports for this user
    const { data: reports, error } = await supabase
      .from("bug_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bug reports:", error);
      return NextResponse.json({ error: "Failed to fetch bug reports" }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error("Error in GET /api/bug-reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new bug report
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Error parsing form data:", error);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const screenshot = formData.get("screenshot") as File | null;

    // Validate and sanitize required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Sanitize inputs (trim and limit length)
    const sanitizedTitle = title.trim().substring(0, 500);
    const sanitizedDescription = description.trim().substring(0, 10000);

    // Get user from session using server client
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Unauthorized. Please log in to submit a bug report." },
        { status: 401 }
      );
    }

    userId = user.id;

    // Fetch user details using admin client (bypasses RLS)
    let userData: { name?: string; email?: string } | null = null;
    try {
      const { data, error: userError } = await supabaseAdmin
        .from("users")
        .select("name, email")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.warn("Error fetching user data (non-critical):", userError);
      } else {
        userData = data;
      }
    } catch (error) {
      console.warn("Exception fetching user data (non-critical):", error);
    }

    const userName = userData?.name || user.user_metadata?.name || "Unknown User";
    const userEmail = userData?.email || user.email || user.user_metadata?.email || "unknown@example.com";

    let screenshot_url: string | null = null;
    let screenshotError: string | null = null;

    // Handle screenshot upload if provided
    if (screenshot && screenshot.size > 0) {
      try {
        // Validate file size
        if (screenshot.size > MAX_FILE_SIZE) {
          screenshotError = `File size (${(screenshot.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
          console.warn(screenshotError);
        } else {
          // Validate file type
          const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
          const mimeType = screenshot.type || "application/octet-stream";

          if (!validMimeTypes.includes(mimeType)) {
            screenshotError = `Invalid file type: ${mimeType}. Please upload an image file (JPEG, PNG, WebP, or GIF)`;
            console.warn(screenshotError);
          } else {
            try {
              // Read the file as buffer
              const arrayBuffer = await screenshot.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Optimize image
              const { buffer: optimizedBuffer, mimeType: optimizedMimeType, extension } = await optimizeImage(buffer, mimeType);

              // Generate unique filename with user ID to avoid conflicts
              const timestamp = Date.now();
              const randomString = Math.random().toString(36).substring(7);
              const filename = `${user.id}/bug-report-${timestamp}-${randomString}.${extension}`;

              // Upload to Supabase storage using admin client
              const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from("bug-reports")
                .upload(filename, optimizedBuffer, {
                  contentType: optimizedMimeType,
                  upsert: false,
                  cacheControl: "3600",
                });

              if (uploadError) {
                console.error("Error uploading screenshot:", uploadError);
                screenshotError = "Failed to upload screenshot. The bug report will be saved without the screenshot.";
              } else if (uploadData) {
                // Get public URL
                const { data: urlData } = supabaseAdmin.storage.from("bug-reports").getPublicUrl(filename);
                screenshot_url = urlData.publicUrl;
                console.log("Screenshot uploaded successfully:", {
                  filename,
                  size: optimizedBuffer.length,
                  originalSize: buffer.length,
                  compression: `${((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1)}%`,
                });
              }
            } catch (imageError) {
              console.error("Error processing image:", imageError);
              screenshotError = "Failed to process image. The bug report will be saved without the screenshot.";
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error handling screenshot:", error);
        screenshotError = "Unexpected error processing screenshot. The bug report will be saved without the screenshot.";
      }
    }

    // Insert bug report into database using admin client
    const { data: bugReport, error: insertError } = await supabaseAdmin
      .from("bug_reports")
      .insert({
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        title: sanitizedTitle,
        description: sanitizedDescription,
        screenshot_url,
        application_source: "fleet-management",
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting bug report:", {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        userId,
      });

      // Provide more specific error messages
      let errorMessage = "Failed to create bug report";
      if (insertError.code === "23505") {
        errorMessage = "A bug report with this information already exists";
      } else if (insertError.code === "23503") {
        errorMessage = "Invalid user reference";
      } else if (insertError.message) {
        errorMessage = `Database error: ${insertError.message}`;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? insertError.message : undefined,
        },
        { status: 500 }
      );
    }

    if (!bugReport) {
      console.error("Bug report created but no data returned", { userId });
      return NextResponse.json(
        { error: "Failed to create bug report - no data returned" },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log("Bug report created successfully:", {
      id: bugReport.id,
      title: bugReport.title,
      hasScreenshot: !!bugReport.screenshot_url,
      screenshotError: screenshotError || null,
      processingTime: `${processingTime}ms`,
      userId,
    });

    // Send email notification to developer (non-blocking)
    if (resend && process.env.RESEND_API_KEY) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
                .badge-pending { background: #fef3c7; color: #92400e; }
                .field { margin-bottom: 20px; }
                .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
                .value { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
                .screenshot { margin-top: 20px; }
                .screenshot img { max-width: 100%; border-radius: 8px; border: 2px solid #e5e7eb; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                .error-notice { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin: 0;">🐛 New Bug Report</h2>
                  <p style="margin: 8px 0 0 0; opacity: 0.9;">Fleet Management System</p>
                </div>
                <div class="content">
                  <div style="margin-bottom: 20px;">
                    <span class="badge badge-pending">PENDING</span>
                  </div>

                  <div class="field">
                    <div class="label">Title</div>
                    <div class="value"><strong>${sanitizedTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></div>
                  </div>

                  <div class="field">
                    <div class="label">Description</div>
                    <div class="value">${sanitizedDescription.replace(/\n/g, "<br>").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                  </div>

                  <div class="field">
                    <div class="label">Reported By</div>
                    <div class="value">
                      ${userName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}<br>
                      <a href="mailto:${userEmail}">${userEmail}</a>
                    </div>
                  </div>

                  <div class="field">
                    <div class="label">Report ID</div>
                    <div class="value"><code>${bugReport.id}</code></div>
                  </div>

                  ${
                    screenshot_url
                      ? `
                    <div class="screenshot">
                      <div class="label">Screenshot</div>
                      <img src="${screenshot_url}" alt="Bug Screenshot" />
                    </div>
                  `
                      : screenshotError
                      ? `
                    <div class="error-notice">
                      <strong>⚠️ Screenshot Upload Failed:</strong> ${screenshotError}
                    </div>
                  `
                      : ""
                  }

                  <div class="footer">
                    <p>This bug report was submitted on ${new Date().toLocaleString()}</p>
                    <p>Processing time: ${processingTime}ms</p>
                    <p>Manage this ticket in your <a href="https://bettersystems.ai/admin/tickets" style="color: #667eea;">Developer Dashboard</a></p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        // Send email asynchronously (don't await to avoid blocking)
        // Note: Using onboarding@resend.dev until agavefleet.com domain is verified
        // Sending to ralvarez@bettersystems.ai (account owner) - Resend test mode restriction
        // To send to any email: verify agavefleet.com at https://resend.com/domains
        resend.emails
          .send({
            from: "AgaveFleet Bug Reports <onboarding@resend.dev>",
            to: "ralvarez@bettersystems.ai",
            subject: `🐛 New Bug Report: ${sanitizedTitle.substring(0, 50)}${sanitizedTitle.length > 50 ? "..." : ""}`,
            html: emailHtml,
            reply_to: userEmail, // Allow developer to reply directly to the user
          })
          .catch((emailError) => {
            console.error("Error sending email (non-critical):", emailError);
          });
      } catch (emailError) {
        console.error("Error preparing email (non-critical):", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      report: bugReport,
      warning: screenshotError || undefined,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("Error in POST /api/bug-reports:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      processingTime: `${processingTime}ms`,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
