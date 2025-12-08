import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";
import { phoenixToUTC } from "@/lib/timezone";
import { logMessage } from "@/lib/message-logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { type, recipientGroups, individualRecipients, customRecipients, subject, messageEn, messageEs, scheduledAt } = body;

    // If scheduledAt is provided, save as scheduled message instead of sending immediately
    if (scheduledAt) {
      // scheduledAt should be in format "YYYY-MM-DDTHH:MM" (Phoenix local time)
      // We need to convert it to UTC for storage
      let scheduledDateTimeUTC: Date;

      if (scheduledAt.includes("T")) {
        // Already in ISO format, parse it
        const [datePart, timePart] = scheduledAt.split("T");
        scheduledDateTimeUTC = new Date(phoenixToUTC(datePart, timePart));
      } else {
        // Legacy format or direct date string
        scheduledDateTimeUTC = new Date(scheduledAt);
      }

      if (scheduledDateTimeUTC <= new Date()) {
        return NextResponse.json({ error: "Scheduled date and time must be in the future" }, { status: 400 });
      }

      // Get current user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user record
      const { data: userData } = await supabase.from("users").select("id").eq("id", authUser.id).single();

      // Save scheduled message
      const { data: scheduledMessage, error: scheduleError } = await supabase
        .from("scheduled_messages")
        .insert({
          type,
          subject,
          message_en: messageEn,
          message_es: messageEs || null,
          recipient_groups: recipientGroups || [],
          individual_recipients: individualRecipients || [],
          custom_recipients: customRecipients || [],
          scheduled_at: scheduledDateTimeUTC.toISOString(),
          status: "pending",
          created_by: userData?.id || null,
        })
        .select()
        .single();

      if (scheduleError) {
        console.error("[Send Announcement] Error saving scheduled message:", scheduleError);
        console.error("[Send Announcement] Schedule error details:", JSON.stringify(scheduleError, null, 2));
        return NextResponse.json(
          {
            error: "Failed to schedule message",
            details: scheduleError.message || "Unknown database error",
          },
          { status: 500 }
        );
      }

      console.log(
        `[Send Announcement] Message scheduled successfully: ${scheduledMessage.id}, scheduled for ${scheduledDateTimeUTC.toISOString()} (UTC)`
      );

      return NextResponse.json(
        {
          success: true,
          scheduled: true,
          scheduledMessageId: scheduledMessage.id,
          scheduledAt: scheduledDateTimeUTC.toISOString(),
          message: "Message scheduled successfully",
        },
        { status: 200 }
      );
    }

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

    // For SMS-only messages, filter out recipients without phone numbers upfront
    let validRecipients = uniqueRecipients;
    const recipientsWithoutPhone: string[] = [];

    if (type === "sms") {
      validRecipients = uniqueRecipients.filter((r) => {
        const hasPhone = r.phone && r.phone.trim().length > 0;
        if (!hasPhone) {
          recipientsWithoutPhone.push(r.name || r.email || "Unknown");
        }
        return hasPhone;
      });

      // If no valid recipients after filtering, return error
      if (validRecipients.length === 0 && uniqueRecipients.length > 0) {
        return NextResponse.json(
          {
            error: `None of the selected recipients have phone numbers. ${recipientsWithoutPhone.length} recipient(s) were skipped: ${recipientsWithoutPhone.join(", ")}`,
            recipientsWithoutPhone,
            skippedCount: recipientsWithoutPhone.length,
          },
          { status: 400 }
        );
      }

      // If all recipients were filtered out and no custom recipients, return error
      if (validRecipients.length === 0 && (!customRecipients || customRecipients.length === 0)) {
        return NextResponse.json(
          {
            error: "No recipients with valid phone numbers found. Please select recipients with phone numbers or add custom phone numbers.",
          },
          { status: 400 }
        );
      }
    }

    // For "both" type, we still want to send SMS to those with phones and email to those with emails
    // But for SMS-only, we've already filtered above

    // Get current user for logging
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Send to valid recipients
    for (const recipient of validRecipients) {
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
                // Log successful email send
                await logMessage({
                  type: type === "both" ? "both" : "email",
                  subject: subject,
                  messageContent: messageEn,
                  recipientType: "individual",
                  recipientIdentifier: recipient.email,
                  recipientName: recipient.name,
                  status: "sent",
                  wasScheduled: false,
                  sentBy: authUser?.id,
                });
              } else {
                failedCount++;
                errors.push(`Email to ${recipient.email} failed`);
                // Log failed email send
                await logMessage({
                  type: type === "both" ? "both" : "email",
                  subject: subject,
                  messageContent: messageEn,
                  recipientType: "individual",
                  recipientIdentifier: recipient.email,
                  recipientName: recipient.name,
                  status: "failed",
                  errorMessage: "Email delivery failed",
                  wasScheduled: false,
                  sentBy: authUser?.id,
                });
              }
            } catch (emailError: any) {
              failedCount++;
              errors.push(`Email to ${recipient.email}: ${emailError?.message || "Unknown error"}`);
              console.error(`Failed to send email to ${recipient.email}:`, emailError);
              // Log failed email send
              await logMessage({
                type: type === "both" ? "both" : "email",
                subject: subject,
                messageContent: messageEn,
                recipientType: "individual",
                recipientIdentifier: recipient.email,
                recipientName: recipient.name,
                status: "failed",
                errorMessage: emailError?.message || "Unknown error",
                wasScheduled: false,
                sentBy: authUser?.id,
              });
            }
          }
        }

        // Send SMS
        if (type === "sms" || type === "both") {
          // For SMS-only type, we've already filtered, but for "both" we still need to check
          const phone = recipient.phone?.trim();
          if (phone && phone.length > 0) {
            try {
              const smsSuccess = await sendSMS(phone, messageEn);
              if (smsSuccess) {
                sentCount++;
                // Log successful SMS send
                await logMessage({
                  type: type === "both" ? "both" : "sms",
                  subject: subject,
                  messageContent: messageEn,
                  recipientType: "individual",
                  recipientIdentifier: phone,
                  recipientName: recipient.name,
                  status: "sent",
                  wasScheduled: false,
                  sentBy: authUser?.id,
                });
              } else {
                failedCount++;
                errors.push(`SMS to ${phone} failed - Check Twilio credentials`);
                // Log failed SMS send
                await logMessage({
                  type: type === "both" ? "both" : "sms",
                  subject: subject,
                  messageContent: messageEn,
                  recipientType: "individual",
                  recipientIdentifier: phone,
                  recipientName: recipient.name,
                  status: "failed",
                  errorMessage: "SMS delivery failed - Check Twilio credentials",
                  wasScheduled: false,
                  sentBy: authUser?.id,
                });
              }
            } catch (smsError: any) {
              failedCount++;
              errors.push(`SMS to ${phone}: ${smsError?.message || "Unknown error"}`);
              console.error(`Failed to send SMS to ${phone}:`, smsError?.message || smsError);
              // Log failed SMS send
              await logMessage({
                type: type === "both" ? "both" : "sms",
                subject: subject,
                messageContent: messageEn,
                recipientType: "individual",
                recipientIdentifier: recipient.phone,
                recipientName: recipient.name,
                status: "failed",
                errorMessage: smsError?.message || "Unknown error",
                wasScheduled: false,
                sentBy: authUser?.id,
              });
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
                  // Log successful email send
                  await logMessage({
                    type: type === "both" ? "both" : "email",
                    subject: subject,
                    messageContent: messageEn,
                    recipientType: "custom",
                    recipientIdentifier: cleanRecipient,
                    status: "sent",
                    wasScheduled: false,
                    sentBy: authUser?.id,
                  });
                } else {
                  failedCount++;
                  errors.push(`Email to ${cleanRecipient} failed`);
                  // Log failed email send
                  await logMessage({
                    type: type === "both" ? "both" : "email",
                    subject: subject,
                    messageContent: messageEn,
                    recipientType: "custom",
                    recipientIdentifier: cleanRecipient,
                    status: "failed",
                    errorMessage: "Email delivery failed",
                    wasScheduled: false,
                    sentBy: authUser?.id,
                  });
                }
              } catch (emailError: any) {
                failedCount++;
                errors.push(`Email to ${cleanRecipient}: ${emailError?.message || "Unknown error"}`);
                console.error(`Failed to send email to ${cleanRecipient}:`, emailError);
                // Log failed email send
                await logMessage({
                  type: type === "both" ? "both" : "email",
                  subject: subject,
                  messageContent: messageEn,
                  recipientType: "custom",
                  recipientIdentifier: cleanRecipient,
                  status: "failed",
                  errorMessage: emailError?.message || "Unknown error",
                  wasScheduled: false,
                  sentBy: authUser?.id,
                });
              }
            }
          } else {
            // It's a phone number
            if (type === "sms" || type === "both") {
              try {
                const smsSuccess = await sendSMS(cleanRecipient, messageEn);
                if (smsSuccess) {
                  sentCount++;
                  // Log successful SMS send
                  await logMessage({
                    type: type === "both" ? "both" : "sms",
                    subject: subject,
                    messageContent: messageEn,
                    recipientType: "custom",
                    recipientIdentifier: cleanRecipient,
                    status: "sent",
                    wasScheduled: false,
                    sentBy: authUser?.id,
                  });
                } else {
                  failedCount++;
                  errors.push(`SMS to ${cleanRecipient} failed - Check Twilio credentials`);
                  // Log failed SMS send
                  await logMessage({
                    type: type === "both" ? "both" : "sms",
                    subject: subject,
                    messageContent: messageEn,
                    recipientType: "custom",
                    recipientIdentifier: cleanRecipient,
                    status: "failed",
                    errorMessage: "SMS delivery failed - Check Twilio credentials",
                    wasScheduled: false,
                    sentBy: authUser?.id,
                  });
                }
              } catch (smsError: any) {
                failedCount++;
                errors.push(`SMS to ${cleanRecipient}: ${smsError?.message || "Unknown error"}`);
                console.error(`Failed to send SMS to ${cleanRecipient}:`, smsError?.message || smsError);
                // Log failed SMS send
                await logMessage({
                  type: type === "both" ? "both" : "sms",
                  subject: subject,
                  messageContent: messageEn,
                  recipientType: "custom",
                  recipientIdentifier: cleanRecipient,
                  status: "failed",
                  errorMessage: smsError?.message || "Unknown error",
                  wasScheduled: false,
                  sentBy: authUser?.id,
                });
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
