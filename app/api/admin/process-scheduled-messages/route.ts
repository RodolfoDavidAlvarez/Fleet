import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job to process scheduled messages
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional: Protect this endpoint with a secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all pending messages that are due (scheduled_at <= now)
    // scheduled_at is stored in UTC, so we compare with UTC time
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`[Process Scheduled Messages] Checking for messages due before ${nowISO}`);

    const { data: pendingMessages, error: fetchError } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", nowISO);

    if (fetchError) {
      console.error("Error fetching pending messages:", fetchError);
      return NextResponse.json({ error: "Failed to fetch pending messages" }, { status: 500 });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log(`[Process Scheduled Messages] No pending messages found`);
      return NextResponse.json({
        message: "No scheduled messages to process",
        processed: 0,
      });
    }

    console.log(`[Process Scheduled Messages] Found ${pendingMessages.length} message(s) to process`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const scheduledMessage of pendingMessages) {
      try {
        console.log(`[Process Scheduled Messages] Processing message ${scheduledMessage.id}, scheduled for ${scheduledMessage.scheduled_at}`);

        // Update status to processing
        const { error: updateError } = await supabase
          .from("scheduled_messages")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("id", scheduledMessage.id);

        if (updateError) {
          console.error(`[Process Scheduled Messages] Error updating status to processing:`, updateError);
          throw new Error(`Failed to update status: ${updateError.message}`);
        }

        let allRecipients: any[] = [];
        let sentCount = 0;
        let failedCountForMessage = 0;
        const messageErrors: string[] = [];

        // Fetch recipients from groups
        if (scheduledMessage.recipient_groups && scheduledMessage.recipient_groups.length > 0) {
          for (const group of scheduledMessage.recipient_groups) {
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
        if (scheduledMessage.individual_recipients && scheduledMessage.individual_recipients.length > 0) {
          allRecipients = [...allRecipients, ...scheduledMessage.individual_recipients];
        }

        // Remove duplicates based on email
        const uniqueRecipients = Array.from(new Map(allRecipients.map((r) => [r.email || r.phone, r])).values());

        // Send to unique recipients
        for (const recipient of uniqueRecipients) {
          try {
            // Send email
            if (scheduledMessage.type === "email" || scheduledMessage.type === "both") {
              if (recipient.email) {
                try {
                  const emailSuccess = await sendEmail(
                    recipient.email,
                    scheduledMessage.subject || "Announcement from FleetPro",
                    `<p>${scheduledMessage.message_en.replace(/\n/g, "<br>")}</p>`,
                    scheduledMessage.message_en
                  );
                  if (emailSuccess) {
                    sentCount++;
                  } else {
                    failedCountForMessage++;
                    messageErrors.push(`Email to ${recipient.email} failed`);
                  }
                } catch (emailError: any) {
                  failedCountForMessage++;
                  messageErrors.push(`Email to ${recipient.email}: ${emailError?.message || "Unknown error"}`);
                  console.error(`Failed to send email to ${recipient.email}:`, emailError);
                }
              }
            }

            // Send SMS
            if (scheduledMessage.type === "sms" || scheduledMessage.type === "both") {
              if (recipient.phone) {
                try {
                  const smsSuccess = await sendSMS(recipient.phone, scheduledMessage.message_en);
                  if (smsSuccess) {
                    sentCount++;
                  } else {
                    failedCountForMessage++;
                    messageErrors.push(`SMS to ${recipient.phone} failed`);
                  }
                } catch (smsError: any) {
                  failedCountForMessage++;
                  messageErrors.push(`SMS to ${recipient.phone}: ${smsError?.message || "Unknown error"}`);
                  console.error(`Failed to send SMS to ${recipient.phone}:`, smsError);
                }
              }
            }
          } catch (error) {
            console.error(`Failed to send to ${recipient.email || recipient.phone}:`, error);
          }
        }

        // Send to custom recipients
        if (scheduledMessage.custom_recipients && scheduledMessage.custom_recipients.length > 0) {
          for (const recipient of scheduledMessage.custom_recipients) {
            try {
              const cleanRecipient = recipient.trim();
              if (!cleanRecipient) continue;

              // Check if it's an email or phone
              if (cleanRecipient.includes("@")) {
                // It's an email
                if (scheduledMessage.type === "email" || scheduledMessage.type === "both") {
                  try {
                    const emailSuccess = await sendEmail(
                      cleanRecipient,
                      scheduledMessage.subject || "Announcement from FleetPro",
                      `<p>${scheduledMessage.message_en.replace(/\n/g, "<br>")}</p>`,
                      scheduledMessage.message_en
                    );
                    if (emailSuccess) {
                      sentCount++;
                    } else {
                      failedCountForMessage++;
                      messageErrors.push(`Email to ${cleanRecipient} failed`);
                    }
                  } catch (emailError: any) {
                    failedCountForMessage++;
                    messageErrors.push(`Email to ${cleanRecipient}: ${emailError?.message || "Unknown error"}`);
                    console.error(`Failed to send email to ${cleanRecipient}:`, emailError);
                  }
                }
              } else {
                // It's a phone number
                if (scheduledMessage.type === "sms" || scheduledMessage.type === "both") {
                  try {
                    const smsSuccess = await sendSMS(cleanRecipient, scheduledMessage.message_en);
                    if (smsSuccess) {
                      sentCount++;
                    } else {
                      failedCountForMessage++;
                      messageErrors.push(`SMS to ${cleanRecipient} failed`);
                    }
                  } catch (smsError: any) {
                    failedCountForMessage++;
                    messageErrors.push(`SMS to ${cleanRecipient}: ${smsError?.message || "Unknown error"}`);
                    console.error(`Failed to send SMS to ${cleanRecipient}:`, smsError);
                  }
                }
              }
            } catch (error) {
              console.error(`Failed to send to ${recipient}:`, error);
            }
          }
        }

        // Update message status
        const finalStatus = failedCountForMessage === 0 && sentCount > 0 ? "sent" : sentCount > 0 ? "sent" : "failed";

        console.log(
          `[Process Scheduled Messages] Message ${scheduledMessage.id} completed: ${finalStatus}, sent: ${sentCount}, failed: ${failedCountForMessage}`
        );

        const { error: finalUpdateError } = await supabase
          .from("scheduled_messages")
          .update({
            status: finalStatus,
            sent_count: sentCount,
            failed_count: failedCountForMessage,
            error_details: messageErrors.length > 0 ? messageErrors : null,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduledMessage.id);

        if (finalUpdateError) {
          console.error(`[Process Scheduled Messages] Error updating final status:`, finalUpdateError);
          throw new Error(`Failed to update final status: ${finalUpdateError.message}`);
        }

        processedCount++;
        if (finalStatus === "sent") {
          successCount++;
        } else {
          failedCount++;
          errors.push(`Message ${scheduledMessage.id}: ${messageErrors.join("; ")}`);
        }
      } catch (error: any) {
        console.error(`[Process Scheduled Messages] Error processing message ${scheduledMessage.id}:`, error);
        const errorMessage = error?.message || error?.toString() || "Unknown error";

        const { error: failUpdateError } = await supabase
          .from("scheduled_messages")
          .update({
            status: "failed",
            error_details: [errorMessage],
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduledMessage.id);

        if (failUpdateError) {
          console.error(`[Process Scheduled Messages] Error updating failed status:`, failUpdateError);
        }

        failedCount++;
        errors.push(`Message ${scheduledMessage.id}: ${errorMessage}`);
      }
    }

    return NextResponse.json(
      {
        message: "Scheduled messages processing completed",
        processed: processedCount,
        success: successCount,
        failed: failedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/process-scheduled-messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
