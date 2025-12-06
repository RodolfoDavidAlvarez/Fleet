const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeData() {
  console.log("=== AGAVEFLEET DATA ANALYSIS ===\n");

  // 1. Get all vehicles
  console.log("--- VEHICLES ANALYSIS ---");
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("*")
    .order("vehicle_number", { ascending: true });

  if (vErr) {
    console.error("Error fetching vehicles:", vErr);
    return;
  }

  console.log(`Total vehicles: ${vehicles.length}\n`);

  // Check for key fields
  const vehiclesWithVIN = vehicles.filter(v => v.vin && v.vin.trim() !== "");
  const vehiclesWithLicensePlate = vehicles.filter(v => v.license_plate && v.license_plate.trim() !== "");
  const vehiclesWithVehicleNumber = vehicles.filter(v => v.vehicle_number && v.vehicle_number.trim() !== "");
  const vehiclesWithDriver = vehicles.filter(v => v.driver_id);
  const vehiclesWithType = vehicles.filter(v => v.vehicle_type && v.vehicle_type.trim() !== "");

  console.log(`Vehicles with VIN: ${vehiclesWithVIN.length}`);
  console.log(`Vehicles with License Plate: ${vehiclesWithLicensePlate.length}`);
  console.log(`Vehicles with Company ID (vehicle_number): ${vehiclesWithVehicleNumber.length}`);
  console.log(`Vehicles with assigned driver: ${vehiclesWithDriver.length}`);
  console.log(`Vehicles with type: ${vehiclesWithType.length}\n`);

  // Get unique vehicle types
  const vehicleTypes = [...new Set(vehicles.map(v => v.vehicle_type).filter(Boolean))];
  console.log("Current vehicle types in DB:");
  vehicleTypes.forEach(t => console.log(`  - ${t}`));

  // 2. Get all users/drivers
  console.log("\n--- MEMBERS/DRIVERS ANALYSIS ---");
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("*")
    .order("name", { ascending: true });

  if (uErr) {
    console.error("Error fetching users:", uErr);
    return;
  }

  console.log(`Total members: ${users.length}`);
  const usersWithPhone = users.filter(u => u.phone && u.phone.trim() !== "");
  const usersWithEmail = users.filter(u => u.email && u.email.trim() !== "");
  const usersWithLegacyId = users.filter(u => u.member_legacy_id);

  console.log(`Members with phone: ${usersWithPhone.length}`);
  console.log(`Members with email: ${usersWithEmail.length}`);
  console.log(`Members with legacy ID (Mem ID#): ${usersWithLegacyId.length}\n`);

  // Check roles
  const roleCount = {};
  users.forEach(u => {
    const role = u.role || "unknown";
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  console.log("Members by role:");
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`  - ${role}: ${count}`);
  });

  // 3. Check vehicle-driver relationships
  console.log("\n--- VEHICLE-DRIVER RELATIONSHIPS ---");
  const { data: vehicleDrivers, error: vdErr } = await supabase
    .from("vehicle_drivers")
    .select("*, vehicle:vehicles(*), driver:users(*)");

  if (vdErr) {
    console.error("Error fetching vehicle_drivers:", vdErr);
  } else {
    console.log(`Total vehicle-driver assignments: ${vehicleDrivers?.length || 0}`);

    // Find primary assignments
    const primaryAssignments = vehicleDrivers?.filter(vd => vd.is_primary) || [];
    console.log(`Primary assignments: ${primaryAssignments.length}\n`);
  }

  // 4. Sample vehicles with all key fields
  console.log("\n--- SAMPLE VEHICLES (first 10 with key data) ---");
  const sampleVehicles = vehicles
    .filter(v => v.vehicle_number && (v.vin || v.license_plate))
    .slice(0, 10);

  sampleVehicles.forEach(v => {
    console.log(`\nVehicle: ${v.make} ${v.model} (${v.year || "N/A"})`);
    console.log(`  Company ID: ${v.vehicle_number || "N/A"}`);
    console.log(`  VIN: ${v.vin || "N/A"}`);
    console.log(`  License Plate: ${v.license_plate || "N/A"}`);
    console.log(`  Type: ${v.vehicle_type || "N/A"}`);
    console.log(`  Driver ID: ${v.driver_id || "None assigned"}`);
    console.log(`  Department: ${v.department || "N/A"}`);
  });

  // 5. Find vehicles with assigned drivers (with driver details)
  console.log("\n\n--- VEHICLES WITH ASSIGNED DRIVERS ---");
  const vehiclesWithDriverDetails = vehicles.filter(v => v.driver_id);

  for (const v of vehiclesWithDriverDetails.slice(0, 15)) {
    const driver = users.find(u => u.id === v.driver_id);
    console.log(`\n${v.make || ""} ${v.model || ""} [Co. ID: ${v.vehicle_number || "N/A"}]`);
    console.log(`  -> Driver: ${driver?.name || "Unknown"}`);
    console.log(`  -> Phone: ${driver?.phone || "N/A"}`);
    console.log(`  -> VIN: ${v.vin || "N/A"}`);
    console.log(`  -> License: ${v.license_plate || "N/A"}`);
  }

  // 6. Check for potential issues
  console.log("\n\n--- POTENTIAL DATA ISSUES ---");

  // Vehicles without company ID
  const noCompanyId = vehicles.filter(v => !v.vehicle_number || v.vehicle_number.trim() === "");
  console.log(`Vehicles missing Company ID: ${noCompanyId.length}`);

  // Vehicles without VIN (that are actual vehicles, not equipment)
  const noVin = vehicles.filter(v =>
    v.vehicle_type !== "Equipment" &&
    v.vehicle_type !== "Trailer" &&
    (!v.vin || v.vin.trim() === "")
  );
  console.log(`Vehicles (non-equipment) missing VIN: ${noVin.length}`);

  // Drivers without phone
  const driversNoPhone = users.filter(u =>
    (u.role === "driver" || u.role?.includes("driver")) &&
    (!u.phone || u.phone.trim() === "")
  );
  console.log(`Drivers missing phone: ${driversNoPhone.length}`);

  // 7. Check department distribution
  console.log("\n--- DEPARTMENT DISTRIBUTION ---");
  const deptCount = {};
  vehicles.forEach(v => {
    const dept = v.department || "Unassigned";
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });
  Object.entries(deptCount).sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
    console.log(`  ${dept}: ${count}`);
  });

  console.log("\n=== ANALYSIS COMPLETE ===");
}

analyzeData().catch(console.error);
