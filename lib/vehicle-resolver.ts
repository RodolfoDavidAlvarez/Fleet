import { createServerClient } from "@/lib/supabase";

/**
 * Resolve a free-text vehicle identifier (typed by drivers/mechanics in repair forms)
 * to a vehicles.id UUID. Tries vehicle_number first, then license_plate, then VIN.
 *
 * Returns null if no match — caller should still persist the typed identifier
 * so the record isn't lost.
 */
export async function resolveVehicleId(identifier: string | null | undefined): Promise<string | null> {
  if (!identifier) return null;
  const trimmed = identifier.trim().replace(/^#+/, "").replace(/\*+$/, "");
  if (!trimmed) return null;

  const supabase = createServerClient();

  const numericPart = trimmed.split(/\s+/)[0];

  const candidates = Array.from(new Set([numericPart, trimmed].filter(Boolean)));

  const { data: byNumber } = await supabase
    .from("vehicles")
    .select("id")
    .in("vehicle_number", candidates)
    .limit(1)
    .maybeSingle();
  if (byNumber?.id) return byNumber.id;

  const { data: byPlate } = await supabase
    .from("vehicles")
    .select("id")
    .ilike("license_plate", trimmed)
    .limit(1)
    .maybeSingle();
  if (byPlate?.id) return byPlate.id;

  if (/^[A-HJ-NPR-Z0-9]{11,17}$/i.test(trimmed)) {
    const { data: byVin } = await supabase
      .from("vehicles")
      .select("id")
      .ilike("vin", trimmed)
      .limit(1)
      .maybeSingle();
    if (byVin?.id) return byVin.id;
  }

  return null;
}
