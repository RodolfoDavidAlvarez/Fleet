// Test script to send all 5 Orchard Protocol email variations
require("dotenv").config({ path: ".env.local" });

// Import the email functions
const {
  sendOrchardProtocolEmail1,
  sendOrchardProtocolEmail2,
  sendOrchardProtocolEmail3,
  sendOrchardProtocolEmail4,
  sendOrchardProtocolEmail5,
} = require("../lib/email.ts");

async function sendAllTestEmails() {
  console.log("🧪 Sending 5 Orchard Protocol Test Emails...\n");

  // Use test email from env or default
  const testEmail = process.env.TEST_EMAIL || "ralvarez@bettersystems.ai";
  const testName = "Test Grower";

  console.log(`📧 Sending to: ${testEmail}`);
  console.log(`📤 From: ${process.env.RESEND_FROM_EMAIL || "ralvarez@bettersystems.ai"}\n`);

  const emails = [
    { name: "Email 1", func: sendOrchardProtocolEmail1, desc: "Welcome & Protocol Overview" },
    { name: "Email 2", func: sendOrchardProtocolEmail2, desc: "Soil Health Focus" },
    { name: "Email 3", func: sendOrchardProtocolEmail3, desc: "Seasonal Application Reminder" },
    { name: "Email 4", func: sendOrchardProtocolEmail4, desc: "Results & Success Story" },
    { name: "Email 5", func: sendOrchardProtocolEmail5, desc: "Expert Support & Consultation" },
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    try {
      console.log(`📨 Sending ${email.name} (${email.desc})...`);
      const result = await email.func(testEmail, testName);

      if (result) {
        console.log(`✅ ${email.name} sent successfully!\n`);
        successCount++;
      } else {
        console.log(`❌ ${email.name} failed to send\n`);
        failCount++;
      }

      // Wait 2 seconds between each email to ensure they're sent one by one
      if (i < emails.length - 1) {
        console.log("⏳ Waiting 2 seconds before next email...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ ERROR sending ${email.name}:`, error.message);
      failCount++;
      // Wait even if there's an error before trying next email
      if (i < emails.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successCount}/${emails.length}`);
  console.log(`❌ Failed: ${failCount}/${emails.length}`);
  console.log(`\n📬 Check the inbox for: ${testEmail}`);
  console.log("   (Also check spam folder if not in inbox)");

  if (failCount > 0) {
    console.log("\n⚠️  Some emails failed. Check your RESEND_API_KEY and RESEND_FROM_EMAIL configuration");
    process.exit(1);
  }
}

sendAllTestEmails().catch((error) => {
  console.error("❌ FATAL ERROR:", error);
  process.exit(1);
});


