#!/usr/bin/env node

import twilio from "twilio";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TEST_PHONE = "+19285501649"; // User's phone number

async function testSMS() {
  console.log("=== SMS Configuration Test ===\n");

  // Check environment variables
  console.log("Environment Variables:");
  console.log(`  ENABLE_SMS: "${process.env.ENABLE_SMS}"`);
  console.log(`  TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? `"${process.env.TWILIO_ACCOUNT_SID}"` : "NOT SET"}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? "[SET - hidden]" : "NOT SET"}`);
  console.log(`  TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? `"${process.env.TWILIO_PHONE_NUMBER}"` : "NOT SET"}`);
  console.log("");

  // Validate credentials
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !phoneNumber) {
    console.error("Missing Twilio credentials!");
    return;
  }

  // Check for newline characters
  if (accountSid.includes("\n") || authToken.includes("\n") || phoneNumber.includes("\n")) {
    console.error("WARNING: Credentials contain newline characters! This will cause authentication failures.");
    console.log(`  SID has newline: ${accountSid.includes("\n")}`);
    console.log(`  Token has newline: ${authToken.includes("\n")}`);
    console.log(`  Phone has newline: ${phoneNumber.includes("\n")}`);
    return;
  }

  console.log("Credentials look clean (no newlines detected).\n");

  // Create Twilio client
  console.log("Creating Twilio client...");
  const client = twilio(accountSid, authToken);

  // Try to send test SMS
  console.log(`\nAttempting to send test SMS to ${TEST_PHONE}...`);

  try {
    const message = await client.messages.create({
      body: "FleetPro SMS Test: Your messaging system is working correctly! 🚛",
      from: phoneNumber,
      to: TEST_PHONE,
    });

    console.log("\n✅ SUCCESS! SMS sent successfully!");
    console.log(`  Message SID: ${message.sid}`);
    console.log(`  Status: ${message.status}`);
    console.log(`  To: ${message.to}`);
    console.log(`  From: ${message.from}`);
    console.log(`  Date Sent: ${message.dateCreated}`);
  } catch (error) {
    console.error("\n❌ FAILED to send SMS:");
    console.error(`  Error Code: ${error.code}`);
    console.error(`  Error Message: ${error.message}`);

    if (error.code === 20003 || error.status === 401) {
      console.error("\n  This is an authentication error. Check that:");
      console.error("  1. TWILIO_ACCOUNT_SID is correct");
      console.error("  2. TWILIO_AUTH_TOKEN is correct and not expired");
    } else if (error.code === 21608) {
      console.error("\n  The Twilio phone number is not verified or invalid.");
      console.error("  Please verify your phone number in the Twilio console.");
    } else if (error.code === 21211) {
      console.error("\n  Invalid recipient phone number format.");
    }
  }
}

testSMS();
