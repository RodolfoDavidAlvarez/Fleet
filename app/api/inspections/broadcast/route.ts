import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";

// POST - Create campaign and SMS all drivers with the inspection link
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await req.json();

    const {
      title,
      description,
      dueDate,
      frequency,
      driverIds,
    } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: "Title and due date are required" },
        { status: 400 }
      );
    }

    // Get drivers — either specific ones or all approved drivers with phone numbers
    let query = supabase
      .from("users")
      .select("id, name, phone, preferred_language")
      .not("phone", "is", null);

    if (driverIds && Array.isArray(driverIds) && driverIds.length > 0) {
      query = query.in("id", driverIds);
    } else {
      query = query.in("role", ["driver", "customer"]).eq("approval_status", "approved");
    }

    const { data: drivers } = await query;

    const driverCount = drivers?.length || 0;

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("inspection_campaigns")
      .insert({
        title,
        description: description || null,
        due_date: dueDate,
        frequency: frequency || "one_time",
        status: "active",
        total_drivers: driverCount,
        submissions_count: 0,
        sms_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    // Send SMS to each driver
    const inspectUrl = `https://agavefleet.com/inspect?campaign=${campaign.id}`;
    let sentCount = 0;
    const errors: string[] = [];

    for (const driver of drivers || []) {
      if (!driver.phone) continue;

      const isSpanish = driver.preferred_language === "es";
      const message = isSpanish
        ? `AGAVE FLEET: Se requiere inspección de vehículo antes del ${new Date(dueDate).toLocaleDateString("es-US")}. Complete su formulario aquí: ${inspectUrl}`
        : `AGAVE FLEET: Vehicle inspection required by ${new Date(dueDate).toLocaleDateString("en-US")}. Complete your form here: ${inspectUrl}`;

      try {
        await sendSMS(driver.phone, message);
        sentCount++;
      } catch (err: any) {
        errors.push(`${driver.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      campaign,
      sentCount,
      totalDrivers: driverCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Broadcast error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
