#!/usr/bin/env node

/**
 * Test sending SMS via the announcements API endpoint
 * This tests the complete end-to-end flow
 */

const TEST_PHONE = "+19285501649";

async function testAnnouncementSMS() {
  console.log("=== Testing Announcement API SMS ===\n");

  const payload = {
    type: "sms",
    subject: "Test SMS",
    messageEn: "FleetPro Announcement: This is a test message from the announcement system. Your SMS messaging is working!",
    messageEs: "Anuncio de FleetPro: Este es un mensaje de prueba del sistema de anuncios.",
    recipientGroups: [],
    individualRecipients: [],
    customRecipients: [TEST_PHONE],
    sendNow: true,
  };

  console.log("Sending to:", TEST_PHONE);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("");

  try {
    const response = await fetch("http://localhost:3000/api/admin/send-announcement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ API Response:", JSON.stringify(data, null, 2));
    } else {
      console.error("❌ API Error:", response.status, data);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

testAnnouncementSMS();
