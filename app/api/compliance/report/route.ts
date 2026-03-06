import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// GET - Cron endpoint for monthly compliance report (called by Vercel cron on 1st of each month)
export async function GET() {
  return generateAndSendReport({});
}

// POST - Manual send from compliance dashboard
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return generateAndSendReport(body);
}

async function generateAndSendReport(body: any) {
  try {
    const supabase = createServerClient();
    const { recipients, scheduledAt } = body;

    // Fetch compliance data directly (not via HTTP to avoid localhost issues)
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model, year, vin, license_plate, mileage, status, department, driver_id, vehicle_type")
      .order("vehicle_number");

    if (!vehicles) {
      return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }

    // Fetch inspection data (last 90 days)
    const { data: inspections } = await supabase
      .from("vehicle_inspections")
      .select("id, vehicle_id, created_at, tire_condition, brake_condition, fluid_levels, body_condition, warning_lights_on")
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    // Inspection stats
    const now = Date.now();
    const inspectedVehicleIds = new Set<string>();
    const overdueVehicleIds = new Set<string>();
    const criticalVehicleIds = new Set<string>();
    const latestByVehicle = new Map<string, any>();

    for (const insp of inspections || []) {
      if (!insp.vehicle_id) continue;
      if (!latestByVehicle.has(insp.vehicle_id)) {
        latestByVehicle.set(insp.vehicle_id, insp);
        inspectedVehicleIds.add(insp.vehicle_id);
      }
    }

    const operationalVehicles = vehicles.filter(v => v.status === "operational" || v.status === "active");
    for (const v of operationalVehicles) {
      const latest = latestByVehicle.get(v.id);
      if (!latest) {
        overdueVehicleIds.add(v.id);
      } else {
        const daysSince = Math.floor((now - new Date(latest.created_at).getTime()) / (24 * 60 * 60 * 1000));
        if (daysSince > 60) overdueVehicleIds.add(v.id);
        const hasCritical = ["tire_condition", "brake_condition", "fluid_levels", "body_condition"]
          .some(f => latest[f] === "critical" || latest[f] === "poor");
        if (hasCritical || latest.warning_lights_on) criticalVehicleIds.add(v.id);
      }
    }

    // Vehicle-type-aware compliance checks
    const FIELD_REQUIREMENTS: Record<string, string[]> = {
      Vehicle: ["vehicleNumber", "make", "model", "year", "vin", "licensePlate", "mileage", "department"],
      Equipment: ["vehicleNumber", "make", "model", "year", "department"],
      "Small Equipment": ["vehicleNumber", "make", "model", "department"],
      Trailer: ["vehicleNumber", "make", "model", "year", "licensePlate", "department"],
    };

    const CHECKS: Record<string, (v: any) => boolean> = {
      vehicleNumber: (v) => !!v.vehicle_number?.trim(),
      make: (v) => !!v.make?.trim() && v.make !== "-",
      model: (v) => !!v.model?.trim() && v.model !== "-",
      year: (v) => !!v.year && v.year > 1900,
      vin: (v) => !!v.vin?.trim() && !v.vin.startsWith("AIRTABLE-") && !v.vin.startsWith("FLEET-"),
      licensePlate: (v) => !!v.license_plate?.trim() && v.license_plate !== "-",
      mileage: (v) => v.mileage != null && v.mileage > 0,
      department: (v) => !!v.department?.trim(),
    };

    const LABELS: Record<string, string> = {
      vehicleNumber: "Vehicle #", make: "Make", model: "Model", year: "Year",
      vin: "VIN", licensePlate: "Plate", mileage: "Mileage", department: "Dept",
    };

    // Per-vehicle compliance
    let completeCount = 0;
    const vehicleDetails: any[] = [];
    const fieldMissing: Record<string, number> = {};
    const fieldApplicable: Record<string, number> = {};

    for (const v of vehicles) {
      const vType = v.vehicle_type || "Vehicle";
      const required = FIELD_REQUIREMENTS[vType] || FIELD_REQUIREMENTS.Vehicle;
      let complete = 0;
      const missing: string[] = [];

      for (const field of required) {
        if (!fieldApplicable[field]) fieldApplicable[field] = 0;
        if (!fieldMissing[field]) fieldMissing[field] = 0;
        fieldApplicable[field]++;

        if (CHECKS[field](v)) {
          complete++;
        } else {
          fieldMissing[field]++;
          missing.push(LABELS[field]);
        }
      }

      const pct = required.length > 0 ? Math.round((complete / required.length) * 100) : 100;
      const isComplete = complete === required.length;
      if (isComplete) completeCount++;

      vehicleDetails.push({
        vehicleNumber: v.vehicle_number || "-",
        make: v.make || "",
        model: v.model || "",
        vehicleType: vType,
        completeness: pct,
        isComplete,
        missingFields: missing,
      });
    }

    vehicleDetails.sort((a: any, b: any) => a.completeness - b.completeness);

    const totalVehicles = vehicles.length;
    const incompleteCount = totalVehicles - completeCount;
    const overallPct = totalVehicles > 0
      ? Math.round(vehicleDetails.reduce((s: number, v: any) => s + v.completeness, 0) / totalVehicles)
      : 0;

    // Recipients
    const toEmails = recipients || [];
    if (toEmails.length === 0) {
      const { data: admins } = await supabase
        .from("users")
        .select("email")
        .eq("role", "admin")
        .not("email", "is", null);
      for (const a of admins || []) if (a.email) toEmails.push(a.email);
    }

    if (toEmails.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Build HTML
    const monthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const overallColor = overallPct >= 80 ? "#16a34a" : overallPct >= 50 ? "#ca8a04" : "#dc2626";
    const overallBg = overallPct >= 80 ? "#f0fdf4" : overallPct >= 50 ? "#fefce8" : "#fef2f2";

    // Field rows — only show fields that have missing records
    const fieldRows = Object.keys(CHECKS)
      .filter(key => (fieldMissing[key] || 0) > 0)
      .sort((a, b) => {
        const pctA = fieldApplicable[a] > 0 ? ((fieldApplicable[a] - (fieldMissing[a] || 0)) / fieldApplicable[a]) * 100 : 100;
        const pctB = fieldApplicable[b] > 0 ? ((fieldApplicable[b] - (fieldMissing[b] || 0)) / fieldApplicable[b]) * 100 : 100;
        return pctA - pctB;
      })
      .map(key => {
        const applicable = fieldApplicable[key] || 0;
        const miss = fieldMissing[key] || 0;
        const pct = applicable > 0 ? Math.round(((applicable - miss) / applicable) * 100) : 100;
        const barColor = pct >= 90 ? "#22c55e" : pct >= 70 ? "#eab308" : "#ef4444";
        return `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 16px; font-weight: 600; color: #374151; font-size: 14px;">${LABELS[key]}</td>
            <td style="padding: 10px 16px; width: 180px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                <td style="background: #f3f4f6; border-radius: 4px; height: 8px; width: 100%;">
                  <table cellpadding="0" cellspacing="0" border="0" width="${pct}%"><tr>
                    <td style="background: ${barColor}; border-radius: 4px; height: 8px;"></td>
                  </tr></table>
                </td>
              </tr></table>
            </td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #111; font-size: 14px;">${pct}%</td>
            <td style="padding: 10px 12px; text-align: right; color: #dc2626; font-size: 12px; font-weight: 600;">${miss} missing</td>
          </tr>
        `;
      })
      .join("");

    // Top incomplete vehicles (limit 8)
    const worstRows = vehicleDetails
      .filter((v: any) => !v.isComplete)
      .slice(0, 8)
      .map((v: any) => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 16px; font-weight: 700; font-family: 'Courier New', monospace; font-size: 13px; color: #111;">${v.vehicleNumber}</td>
          <td style="padding: 8px 12px; font-size: 13px; color: #374151;">${v.make && v.model ? `${v.make} ${v.model}` : "-"}</td>
          <td style="padding: 8px 12px; text-align: center; font-weight: 700; font-size: 13px; color: ${v.completeness >= 70 ? "#ca8a04" : "#dc2626"};">${v.completeness}%</td>
          <td style="padding: 8px 12px; font-size: 11px; color: #6b7280;">${v.missingFields.join(", ")}</td>
        </tr>
      `)
      .join("");

    const inspectionPct = operationalVehicles.length > 0
      ? Math.round(((operationalVehicles.length - overdueVehicleIds.size) / operationalVehicles.length) * 100)
      : 100;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f3f4f6;">
<tr><td align="center" style="padding: 24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">

  <!-- Header -->
  <tr><td style="background: #1e3a5f; border-radius: 12px 12px 0 0; padding: 28px 32px; text-align: center;">
    <h1 style="color: white; margin: 0 0 4px; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">Agave Fleet — Monthly Report</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px;">${monthYear}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <!-- Overall Score — Simple big number, no circle -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding: 28px 32px 20px; text-align: center;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
        <tr>
          <td style="background: ${overallBg}; border-radius: 12px; padding: 20px 40px; text-align: center;">
            <p style="margin: 0; font-size: 48px; font-weight: 800; color: ${overallColor}; line-height: 1;">${overallPct}%</p>
            <p style="margin: 6px 0 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Record Completeness</p>
          </td>
        </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- 3 Stats Row -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 24px 24px;">
    <tr>
      <td width="33%" style="padding: 0 4px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="background: #f0fdf4; border-radius: 8px; padding: 14px; text-align: center;">
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #16a34a;">${completeCount}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #6b7280; font-weight: 600;">Complete</p>
          </td>
        </tr></table>
      </td>
      <td width="33%" style="padding: 0 4px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="background: #fef2f2; border-radius: 8px; padding: 14px; text-align: center;">
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #dc2626;">${incompleteCount}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #6b7280; font-weight: 600;">Need Work</p>
          </td>
        </tr></table>
      </td>
      <td width="33%" style="padding: 0 4px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="background: #eff6ff; border-radius: 8px; padding: 14px; text-align: center;">
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #2563eb;">${totalVehicles}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #6b7280; font-weight: 600;">Total Fleet</p>
          </td>
        </tr></table>
      </td>
    </tr>
    </table>

    <!-- Inspection Health Section -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 24px 24px;">
    <tr><td>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr><td style="padding: 16px 20px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #111827; font-weight: 700;">Inspection Health</h3>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="33%" style="padding: 0 4px 0 0;">
            <p style="margin: 0; font-size: 11px; color: #6b7280; font-weight: 600;">Inspected (90d)</p>
            <p style="margin: 2px 0 0; font-size: 22px; font-weight: 800; color: #16a34a;">${inspectedVehicleIds.size}</p>
          </td>
          <td width="33%" style="padding: 0 4px;">
            <p style="margin: 0; font-size: 11px; color: #6b7280; font-weight: 600;">Overdue</p>
            <p style="margin: 2px 0 0; font-size: 22px; font-weight: 800; color: ${overdueVehicleIds.size > 0 ? "#dc2626" : "#16a34a"};">${overdueVehicleIds.size}</p>
          </td>
          <td width="33%" style="padding: 0 0 0 4px;">
            <p style="margin: 0; font-size: 11px; color: #6b7280; font-weight: 600;">Critical Issues</p>
            <p style="margin: 2px 0 0; font-size: 22px; font-weight: 800; color: ${criticalVehicleIds.size > 0 ? "#dc2626" : "#16a34a"};">${criticalVehicleIds.size}</p>
          </td>
        </tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 10px;">
        <tr><td style="background: #e5e7eb; border-radius: 4px; height: 6px;">
          <table cellpadding="0" cellspacing="0" border="0" width="${inspectionPct}%"><tr>
            <td style="background: ${inspectionPct >= 80 ? "#22c55e" : inspectionPct >= 50 ? "#eab308" : "#ef4444"}; border-radius: 4px; height: 6px;"></td>
          </tr></table>
        </td></tr>
        </table>
        <p style="margin: 6px 0 0; font-size: 11px; color: #6b7280;">${inspectionPct}% of operational vehicles inspected and up to date</p>
      </td></tr>
      </table>
    </td></tr>
    </table>

    <!-- Field Breakdown -->
    ${fieldRows ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 24px 20px;">
    <tr><td>
      <h3 style="margin: 0 0 8px; font-size: 14px; color: #111827; font-weight: 700;">Fields Needing Attention</h3>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${fieldRows}
      </table>
    </td></tr>
    </table>
    ` : ""}

    <!-- Worst Vehicles -->
    ${worstRows ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 24px 20px;">
    <tr><td>
      <h3 style="margin: 0 0 8px; font-size: 14px; color: #111827; font-weight: 700;">Vehicles Needing Attention</h3>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <th style="padding: 10px 16px; text-align: left; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700;">ID</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700;">Vehicle</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700;">Score</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700;">Missing</th>
        </tr>
        ${worstRows}
      </table>
    </td></tr>
    </table>
    ` : ""}

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 8px 24px 32px;">
    <tr><td align="center">
      <a href="https://agavefleet.com/admin/compliance"
         style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: -0.2px;">
        View Compliance Dashboard
      </a>
    </td></tr>
    </table>

  </td></tr>
</table>

<!-- Footer -->
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
<tr><td style="padding: 16px 0; text-align: center;">
  <p style="margin: 0; color: #9ca3af; font-size: 11px;">Agave Fleet Management System &mdash; agavefleet.com</p>
</td></tr>
</table>

</td></tr></table>
</body></html>`;

    // Send to all recipients (with optional scheduling)
    let sentCount = 0;
    const emailOptions = scheduledAt ? { scheduledAt } : undefined;
    for (const email of toEmails) {
      const sent = await sendEmail(email, `Fleet Report — ${monthYear} | ${overallPct}% Compliance`, html, undefined, emailOptions);
      if (sent) sentCount++;
    }

    return NextResponse.json({
      ok: true,
      sentCount,
      recipients: toEmails,
      summary: {
        totalVehicles,
        completeRecords: completeCount,
        incompleteRecords: incompleteCount,
        overallCompleteness: overallPct,
        inspected: inspectedVehicleIds.size,
        overdue: overdueVehicleIds.size,
        critical: criticalVehicleIds.size,
      },
    });
  } catch (err: any) {
    console.error("Compliance report error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
