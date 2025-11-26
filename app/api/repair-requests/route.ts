import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairRequestDB } from "@/lib/db";
import { analyzeRepairRequest } from "@/lib/ai";
import { optimizeAndStoreImages } from "@/lib/media";
import { notifyAdminOfRepair, sendRepairSubmissionNotice } from "@/lib/twilio";
import { sendRepairSubmissionEmail, notifyAdminNewRepairRequest } from "@/lib/email";

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

    const ai = await analyzeRepairRequest({
      description: parsed.data.description,
      vehicleIdentifier: parsed.data.vehicleIdentifier,
      urgency: parsed.data.urgency,
      preferredLanguage: parsed.data.preferredLanguage,
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
    });

    if (record.driverPhone) {
      await sendRepairSubmissionNotice(record.driverPhone, {
        requestId: record.id,
        summary: ai.summary,
        language: record.preferredLanguage,
      });
    }

    // Send email to driver if email provided
    if (record.driverEmail) {
      await sendRepairSubmissionEmail(record.driverEmail, {
        driverName: record.driverName,
        requestId: record.id,
        summary: ai.summary,
        urgency: record.urgency,
        language: record.preferredLanguage,
      });
    }

    // Notify admin via SMS
    await notifyAdminOfRepair({
      requestId: record.id,
      driverName: record.driverName,
      driverPhone: record.driverPhone,
      urgency: record.urgency,
    });

    // Notify admin via email
    const adminEmail = process.env.ADMIN_EMAIL || 'ralvarez@bettersystems.ai';
    await notifyAdminNewRepairRequest(adminEmail, {
      requestId: record.id,
      driverName: record.driverName,
      driverPhone: record.driverPhone,
      driverEmail: record.driverEmail,
      urgency: record.urgency,
      summary: ai.summary,
      vehicleIdentifier: record.vehicleIdentifier,
    });

    return NextResponse.json({ request: record, ai }, { status: 201 });
  } catch (error) {
    console.error("Error creating repair request", error);
    return NextResponse.json({ error: "Failed to create repair request" }, { status: 500 });
  }
}
