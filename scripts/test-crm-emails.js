// Test script to send all 8 CRM email variations to Rodolfo and Mike
require("dotenv").config({ path: ".env.local" });

// Import the email functions
const {
  sendCRMEmail1,
  sendCRMEmail2,
  sendCRMEmail3,
  sendCRMEmail4,
  sendCRMEmail5,
  sendCRMEmail6,
  sendCRMEmail7,
  sendCRMEmail8,
} = require("../lib/email.ts");

async function sendAllCRMEmails() {
  console.log("🧪 Sending 8 CRM Email Variations...\n");

  // Send to both Rodolfo and Mike
  const recipients = [
    { email: "rodolfodavid110@gmail.com", name: "Rodolfo" },
    { email: "mike.mcmahon@agave-inc.com", name: "Mike" },
  ];

  console.log(`📧 Sending to: ${recipients.map((r) => r.email).join(", ")}`);
  console.log(`📤 From: ${process.env.RESEND_FROM_EMAIL || "ralvarez@bettersystems.ai"}\n`);

  const emails = [
    { name: "Email 1", func: sendCRMEmail1, desc: "Welcome & Onboarding" },
    { name: "Email 2", func: sendCRMEmail2, desc: "Post-Purchase Follow-Up" },
    { name: "Email 3", func: sendCRMEmail3, desc: "Educational Content" },
    { name: "Email 4", func: sendCRMEmail4, desc: "Re-engagement" },
    { name: "Email 5", func: sendCRMEmail5, desc: "Product Recommendation" },
    { name: "Email 6", func: sendCRMEmail6, desc: "Seasonal Reminder" },
    { name: "Email 7", func: sendCRMEmail7, desc: "Customer Success Story" },
    { name: "Email 8", func: sendCRMEmail8, desc: "Special Offer" },
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

sendAllCRMEmails().catch((error) => {
  console.error("❌ FATAL ERROR:", error);
  process.exit(1);
});

