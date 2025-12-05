import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { type, recipientGroups, individualRecipients, customRecipients, subject, messageEn, messageEs } = body;

    let allRecipients: any[] = [];
    let sentCount = 0;

    // Fetch recipients from groups
    if (recipientGroups && recipientGroups.length > 0) {
      for (const group of recipientGroups) {
        let query = supabase.from("users").select("id, name, email, phone, role");

        switch (group) {
          case "all_admins":
            query = query.eq("role", "admin");
            break;
          case "all_mechanics":
            query = query.eq("role", "mechanic");
            break;
          case "all_drivers":
            query = query.eq("role", "driver");
            break;
          case "pending_users":
            query = query.eq("approval_status", "pending_approval");
            break;
        }

        const { data, error } = await query;
        if (!error && data) {
          allRecipients = [...allRecipients, ...data];
        }
      }
    }

    // Add individual recipients
    if (individualRecipients && individualRecipients.length > 0) {
      allRecipients = [...allRecipients, ...individualRecipients];
    }

    // Remove duplicates based on email
    const uniqueRecipients = Array.from(new Map(allRecipients.map((r) => [r.email, r])).values());

    // Send to unique recipients
    for (const recipient of uniqueRecipients) {
      try {
        // Send email
        if (type === "email" || type === "both") {
          if (recipient.email) {
            await sendEmail({
              to: recipient.email,
              subject: subject || "Announcement from FleetPro",
              text: messageEn,
              html: `<p>${messageEn.replace(/\n/g, "<br>")}</p>`,
            });
            sentCount++;
          }
        }

        // Send SMS
        if (type === "sms" || type === "both") {
          if (recipient.phone) {
            await sendSMS(recipient.phone, messageEn);
            sentCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.email || recipient.phone}:`, error);
      }
    }

    // Send to custom recipients
    if (customRecipients && customRecipients.length > 0) {
      for (const recipient of customRecipients) {
        try {
          const cleanRecipient = recipient.trim();
          if (!cleanRecipient) continue;

          // Check if it's an email or phone
          if (cleanRecipient.includes("@")) {
            // It's an email
            if (type === "email" || type === "both") {
              await sendEmail({
                to: cleanRecipient,
                subject: subject || "Announcement from FleetPro",
                text: messageEn,
                html: `<p>${messageEn.replace(/\n/g, "<br>")}</p>`,
              });
              sentCount++;
            }
          } else {
            // It's a phone number
            if (type === "sms" || type === "both") {
              await sendSMS(cleanRecipient, messageEn);
              sentCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, sentCount }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/admin/send-announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
