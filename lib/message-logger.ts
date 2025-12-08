import { createServerClient } from "@/lib/supabase";

export interface MessageLogEntry {
  type: "email" | "sms" | "both";
  subject?: string;
  messageContent: string;
  recipientType: "individual" | "group" | "custom";
  recipientIdentifier: string;
  recipientName?: string;
  status: "sent" | "failed" | "bounced";
  errorMessage?: string;
  scheduledMessageId?: string;
  wasScheduled?: boolean;
  sentBy?: string;
  batchId?: string;
  batchSubject?: string;
}

/**
 * Logs a sent message to the message_logs table
 */
export async function logMessage(entry: MessageLogEntry): Promise<boolean> {
  try {
    const supabase = createServerClient();

    const { error } = await supabase.from("message_logs").insert({
      type: entry.type,
      subject: entry.subject,
      message_content: entry.messageContent,
      recipient_type: entry.recipientType,
      recipient_identifier: entry.recipientIdentifier,
      recipient_name: entry.recipientName,
      status: entry.status,
      error_message: entry.errorMessage,
      scheduled_message_id: entry.scheduledMessageId,
      was_scheduled: entry.wasScheduled || false,
      sent_by: entry.sentBy,
      sent_at: new Date().toISOString(),
      batch_id: entry.batchId,
      batch_subject: entry.batchSubject,
    });

    if (error) {
      // If table doesn't exist yet, fail silently
      if (error.code === "42P01") {
        console.warn("[Message Logger] message_logs table does not exist yet. Skipping log.");
        return true;
      }
      console.error("[Message Logger] Error logging message:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Message Logger] Exception logging message:", error);
    return false;
  }
}

/**
 * Logs multiple messages in bulk
 */
export async function logMessages(entries: MessageLogEntry[]): Promise<number> {
  let successCount = 0;

  for (const entry of entries) {
    const success = await logMessage(entry);
    if (success) successCount++;
  }

  return successCount;
}
