// Test script to send all 4 crop-specific emails to Rodolfo and Mike
require("dotenv").config({ path: ".env.local" });

// Import the email functions
const { sendAvocadoGrowerEmail, sendAppleGrowerEmail, sendPeachGrowerEmail, sendVineyardEmail } = require("../lib/email.ts");

async function sendAllCropEmails() {
  console.log("🧪 Sending 4 Crop-Specific Orchard Protocol Emails...\n");

  // Send to both Rodolfo and Mike
  const recipients = [
    { email: "rodolfodavid110@gmail.com", name: "Rodolfo" },
    { email: "mike.mcmahon@agave-inc.com", name: "Mike" },
  ];

  console.log(`📧 Sending to: ${recipients.map((r) => r.email).join(", ")}`);
  console.log(
    `📤 From: ${process.env.RESEND_FROM_NAME || "Soil Seed and Water"} <${process.env.RESEND_FROM_EMAIL || "ralvarez@soilseedandwater.com"}>\n`
  );

  const emails = [
    { name: "Avocado Email", func: sendAvocadoGrowerEmail, desc: "Avocado Orchard Protocol" },
    { name: "Apple Email", func: sendAppleGrowerEmail, desc: "Apple Orchard Protocol" },
    { name: "Peach Email", func: sendPeachGrowerEmail, desc: "Peach Orchard Protocol" },
    { name: "Vineyard Email", func: sendVineyardEmail, desc: "Vineyard Protocol" },
  ];

  let totalSuccess = 0;
  let totalFail = 0;

  for (const recipient of recipients) {
    console.log(`\n📬 Sending to ${recipient.name} (${recipient.email})...`);
    console.log("=".repeat(60));

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      try {
        console.log(`📨 Sending ${email.name} (${email.desc})...`);
        const result = await email.func(recipient.email, recipient.name);

        if (result) {
          console.log(`✅ ${email.name} sent successfully!`);
          totalSuccess++;
        } else {
          console.log(`❌ ${email.name} failed to send`);
          totalFail++;
        }

        // Wait 2 seconds between each email to ensure they're sent one by one
        if (i < emails.length - 1) {
          console.log("⏳ Waiting 2 seconds before next email...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ ERROR sending ${email.name}:`, error.message);
        totalFail++;
        // Wait even if there's an error before trying next email
        if (i < emails.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    // Wait 3 seconds between recipients
    if (recipients.indexOf(recipient) < recipients.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next recipient...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${totalSuccess}/${emails.length * recipients.length}`);
  console.log(`❌ Failed: ${totalFail}/${emails.length * recipients.length}`);
  console.log(`\n📬 Check inboxes for:`);
  recipients.forEach((r) => {
    console.log(`   • ${r.name}: ${r.email}`);
  });
  console.log("   (Also check spam folders if not in inbox)");

  if (totalFail > 0) {
    console.log("\n⚠️  Some emails failed. Check your RESEND_API_KEY and RESEND_FROM_EMAIL configuration");
    process.exit(1);
  }
}

sendAllCropEmails().catch((error) => {
  console.error("❌ FATAL ERROR:", error);
  process.exit(1);
});
