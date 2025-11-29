import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairRequestDB } from "@/lib/db";
import { analyzeRepairRequest } from "@/lib/ai";
import { optimizeAndStoreImages } from "@/lib/media";
import { notifyAdminOfRepair, sendRepairSubmissionNotice } from "@/lib/twilio";
import { sendRepairSubmissionEmail, notifyAdminNewRepairRequest } from "@/lib/email";
import { createServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB per image

const createSchema = z.object({
  driverId: z.string().uuid().optional(),
  driverName: z.string().min(1, "driverName is required"),
  driverPhone: z.string().optional(),
  driverEmail: z.string().email().optional(),
  preferredLanguage: z.enum(["en", "es"]).default("en"),
  vehicleId: z.string().uuid().optional(),
  vehicleIdentifier: z.string().optional(),
  odometer: z.coerce.number().optional(),
  location: z.string().optional(),
  description: z.string().min(5, "description is required"),
  urgency: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  division: z.string().optional(),
  vehicleType: z.string().optional(),
  makeModel: z.string().optional(),
  incidentDate: z.string().optional(),
  isImmediate: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : null;

  try {
    const requests = await repairRequestDB.getAll(status || undefined);
    return NextResponse.json({ requests: limit ? requests.slice(0, limit) : requests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch repair requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const odometerRaw = formData.get("odometer");
    const payload = {
      driverId: formData.get("driverId")?.toString(),
      driverName: formData.get("driverName")?.toString() || "",
      driverPhone: formData.get("driverPhone")?.toString(),
      driverEmail: formData.get("driverEmail")?.toString(),
      preferredLanguage: (formData.get("preferredLanguage")?.toString() as "en" | "es" | undefined) || "en",
      vehicleId: formData.get("vehicleId")?.toString(),
      vehicleIdentifier: formData.get("vehicleIdentifier")?.toString(),
      odometer: odometerRaw && odometerRaw.toString().trim() !== "" ? odometerRaw.toString() : undefined,
      location: formData.get("location")?.toString(),
      description: formData.get("description")?.toString() || "",
      urgency: (formData.get("urgency")?.toString() as "low" | "medium" | "high" | "critical" | undefined) || "medium",
      division: formData.get("division")?.toString(),
      vehicleType: formData.get("vehicleType")?.toString(),
      makeModel: formData.get("makeModel")?.toString(),
      incidentDate: formData.get("incidentDate")?.toString(),
      isImmediate: formData.get("isImmediate") === "true",
    };

    const parsed = createSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const photoFiles = formData.getAll("photos").filter((p): p is File => p instanceof File && p.size > 0);
    const validPhotos: File[] = [];

    for (const file of photoFiles) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Images must be 5MB or smaller." }, { status: 400 });
      }
      validPhotos.push(file);
    }

    const stored = await optimizeAndStoreImages(validPhotos);

    // Analyze with AI - include photo URLs for vision analysis
    const ai = await analyzeRepairRequest({
      description: parsed.data.description,
      vehicleIdentifier: parsed.data.vehicleIdentifier,
      urgency: parsed.data.urgency,
      preferredLanguage: parsed.data.preferredLanguage,
      photoUrls: stored.map((s) => s.url), // Pass photo URLs for vision analysis
    });

    const record = await repairRequestDB.create({
      ...parsed.data,
      odometer: parsed.data.odometer ?? undefined,
      status: "submitted",
      aiCategory: ai.category,
      aiTags: ai.tags,
      aiSummary: ai.summary,
      aiConfidence: ai.confidence,
      photoUrls: stored.map((s) => s.url),
      thumbUrls: stored.map((s) => s.thumbUrl || s.url),
      bookingLink: undefined,
      bookingId: undefined,
      scheduledDate: undefined,
      scheduledTime: undefined,
      division: parsed.data.division,
      vehicleType: parsed.data.vehicleType,
      makeModel: parsed.data.makeModel,
      incidentDate: parsed.data.incidentDate,
      isImmediate: parsed.data.isImmediate,
    });

    const asyncNotifications: Promise<unknown>[] = [];

    if (record.driverPhone) {
      asyncNotifications.push(
        sendRepairSubmissionNotice(record.driverPhone, {
          requestId: record.id,
          summary: ai.summary,
          language: record.preferredLanguage,
        })
      );
    }

    // Send email to driver if email provided
    if (record.driverEmail) {
      asyncNotifications.push(
        sendRepairSubmissionEmail(record.driverEmail, {
          driverName: record.driverName,
          requestId: record.id,
          summary: ai.summary,
          urgency: record.urgency,
          language: record.preferredLanguage,
        })
      );
    }

    // Notify admins and mechanics who have opted in
    const supabase = createServerClient();
    let subscribedUsers: any[] | null = null;

    try {
      const { data } = await supabase.from("users").select("phone, email").eq("notify_on_repair", true);
      subscribedUsers = data;
    } catch (err) {
      console.warn("Failed to fetch subscribed users for notifications (column might be missing)", err);
    }

    if (subscribedUsers && subscribedUsers.length > 0) {
      subscribedUsers.forEach((user) => {
        // SMS
        if (user.phone) {
          asyncNotifications.push(
            notifyAdminOfRepair(
              {
                requestId: record.id,
                driverName: record.driverName,
                driverPhone: record.driverPhone,
                urgency: record.urgency,
              },
              user.phone
            )
          );
        }
        // Email
        if (user.email) {
          asyncNotifications.push(
            notifyAdminNewRepairRequest(user.email, {
              requestId: record.id,
              driverName: record.driverName,
              driverPhone: record.driverPhone,
              driverEmail: record.driverEmail,
              urgency: record.urgency,
              summary: ai.summary,
              vehicleIdentifier: record.vehicleIdentifier,
            })
          );
        }
      });
    } else {
      // Fallback to env var if no users subscribed (legacy behavior)
      asyncNotifications.push(
        notifyAdminOfRepair({
          requestId: record.id,
          driverName: record.driverName,
          driverPhone: record.driverPhone,
          urgency: record.urgency,
        })
      );

      const adminEmail = process.env.ADMIN_EMAIL || "ralvarez@bettersystems.ai";
      asyncNotifications.push(
        notifyAdminNewRepairRequest(adminEmail, {
          requestId: record.id,
          driverName: record.driverName,
          driverPhone: record.driverPhone,
          driverEmail: record.driverEmail,
          urgency: record.urgency,
          summary: ai.summary,
          vehicleIdentifier: record.vehicleIdentifier,
        })
      );
    }

    Promise.allSettled(asyncNotifications).catch((err) => {
      console.error("Background repair notifications failed", err);
    });

    // Booking link will be generated and sent by admin via the schedule endpoint
    // No automatic sending on submission

    return NextResponse.json({ request: record, ai }, { status: 201 });
  } catch (error) {
    console.error("Error creating repair request", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      {
        error: "Failed to create repair request",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
