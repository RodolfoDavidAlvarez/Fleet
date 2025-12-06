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
    let failedCount = 0;
    const errors: string[] = [];

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
            try {
              const emailSuccess = await sendEmail(
                recipient.email,
                subject || "Announcement from FleetPro",
                `<p>${messageEn.replace(/\n/g, "<br>")}</p>`,
                messageEn
              );
              if (emailSuccess) {
                sentCount++;
              } else {
                failedCount++;
                errors.push(`Email to ${recipient.email} failed`);
              }
            } catch (emailError: any) {
              failedCount++;
              errors.push(`Email to ${recipient.email}: ${emailError?.message || "Unknown error"}`);
              console.error(`Failed to send email to ${recipient.email}:`, emailError);
            }
          }
        }

        // Send SMS
        if (type === "sms" || type === "both") {
          if (recipient.phone) {
            try {
              const smsSuccess = await sendSMS(recipient.phone, messageEn);
              if (smsSuccess) {
                sentCount++;
              } else {
                failedCount++;
                errors.push(`SMS to ${recipient.phone} failed - Check Twilio credentials`);
              }
            } catch (smsError: any) {
              failedCount++;
              errors.push(`SMS to ${recipient.phone}: ${smsError?.message || "Unknown error"}`);
              console.error(`Failed to send SMS to ${recipient.phone}:`, smsError?.message || smsError);
            }
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
              try {
                const emailSuccess = await sendEmail(
                  cleanRecipient,
                  subject || "Announcement from FleetPro",
                  `<p>${messageEn.replace(/\n/g, "<br>")}</p>`,
                  messageEn
                );
                if (emailSuccess) {
                  sentCount++;
                } else {
                  failedCount++;
                  errors.push(`Email to ${cleanRecipient} failed`);
                }
              } catch (emailError: any) {
                failedCount++;
                errors.push(`Email to ${cleanRecipient}: ${emailError?.message || "Unknown error"}`);
                console.error(`Failed to send email to ${cleanRecipient}:`, emailError);
              }
            }
          } else {
            // It's a phone number
            if (type === "sms" || type === "both") {
              try {
                const smsSuccess = await sendSMS(cleanRecipient, messageEn);
                if (smsSuccess) {
                  sentCount++;
                } else {
                  failedCount++;
                  errors.push(`SMS to ${cleanRecipient} failed - Check Twilio credentials`);
                }
              } catch (smsError: any) {
                failedCount++;
                errors.push(`SMS to ${cleanRecipient}: ${smsError?.message || "Unknown error"}`);
                console.error(`Failed to send SMS to ${cleanRecipient}:`, smsError?.message || smsError);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error);
        }
      }
    }

    // Check for Twilio/Email configuration issues
    const smsEnabled = process.env.ENABLE_SMS === "true";
    const emailEnabled = process.env.ENABLE_EMAIL !== "false";
    const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const emailConfigured = !!process.env.RESEND_API_KEY;

    const warnings: string[] = [];
    if ((type === "sms" || type === "both") && !smsEnabled) {
      warnings.push("SMS is disabled. Set ENABLE_SMS=true to enable SMS notifications.");
    }
    if ((type === "sms" || type === "both") && smsEnabled && !twilioConfigured) {
      warnings.push("SMS enabled but Twilio credentials are missing. Please configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    }
    if ((type === "email" || type === "both") && !emailConfigured) {
      warnings.push("Email credentials missing. Please configure RESEND_API_KEY.");
    }

    return NextResponse.json(
      {
        success: true,
        sentCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        configuration: {
          smsEnabled,
          twilioConfigured,
          emailEnabled,
          emailConfigured,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/send-announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
