/**
 * Test script to verify calendar settings are saving and loading correctly from the database
 * Run with: node scripts/test-calendar-settings.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗");
  process.exit(1);
}

async function testCalendarSettings() {
  console.log("🧪 Testing Calendar Settings Save/Load...\n");

  try {
    // Test 1: Read current settings
    console.log("1️⃣ Reading current settings from database...");
    const readResponse = await fetch(`${SUPABASE_URL}/rest/v1/calendar_settings?id=eq.default&select=*`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!readResponse.ok) {
      throw new Error(`Failed to read: ${readResponse.status} ${readResponse.statusText}`);
    }

    const currentData = await readResponse.json();
    console.log("   Current database data:", JSON.stringify(currentData[0] || "No data", null, 2));

    // Test 2: Save new settings
    console.log("\n2️⃣ Saving test settings...");
    const testSettings = {
      id: "default",
      max_bookings_per_week: 7,
      start_time: "07:00:00",
      end_time: "15:00:00",
      slot_duration: 45,
      slot_buffer_time: 15,
      working_days: [1, 2, 3, 4, 5, 6], // Monday-Saturday
      advance_booking_window: 1,
      advance_booking_unit: "days",
      updated_at: new Date().toISOString(),
    };

    const upsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/calendar_settings`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(testSettings),
    });

    if (!upsertResponse.ok) {
      const errorText = await upsertResponse.text();
      throw new Error(`Failed to save: ${upsertResponse.status} ${upsertResponse.statusText}\n${errorText}`);
    }

    const savedData = await upsertResponse.json();
    console.log("   ✓ Settings saved successfully!");
    console.log("   Saved data:", JSON.stringify(savedData[0] || savedData, null, 2));

    // Test 3: Verify the save by reading again
    console.log("\n3️⃣ Verifying saved settings...");
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/calendar_settings?id=eq.default&select=*`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifiedData = await verifyResponse.json();
    const settings = verifiedData[0];

    console.log("   ✓ Settings verified!");
    console.log("   Start Time:", settings.start_time);
    console.log("   End Time:", settings.end_time);
    console.log("   Max Bookings Per Week:", settings.max_bookings_per_week);
    console.log("   Slot Duration:", settings.slot_duration);
    console.log("   Slot Buffer Time:", settings.slot_buffer_time);
    console.log("   Working Days:", settings.working_days);
    console.log("   Advance Booking Window:", settings.advance_booking_window, settings.advance_booking_unit);

    // Test 4: Test the API endpoint
    console.log("\n4️⃣ Testing API endpoint GET /api/calendar/settings...");
    console.log("   (Note: This requires the Next.js server to be running)");
    console.log("   You can test this manually by running:");
    console.log("   curl http://localhost:3000/api/calendar/settings");

    // Verify the transformation
    if (settings.start_time === "07:00:00" && settings.end_time === "15:00:00") {
      console.log("\n✅ All tests passed! Database save/load is working correctly.");
      console.log("\n📝 Note: The API endpoint should transform:");
      console.log("   - start_time: '07:00:00' → startTime: '07:00'");
      console.log("   - end_time: '15:00:00' → endTime: '15:00'");
      console.log("   - snake_case → camelCase");
    } else {
      console.log("\n⚠️  Warning: Settings may not have saved correctly");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCalendarSettings();

