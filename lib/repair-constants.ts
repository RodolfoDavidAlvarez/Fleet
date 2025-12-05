// Shared constants for repair request forms
// Used across public form and admin interfaces

export const DIVISION_OPTIONS = [
  "Construction",
  "Salvage",
  "Enhancements",
  "Maintenance",
  "Tree",
  "Office/Sales",
  "SSW",
  "UFE",
  "Misc. Use Vehicles/Fleet",
] as const;

export const VEHICLE_TYPE_OPTIONS = ["Vehicle", "Heavy Equipment", "Trailer", "Not listed"] as const;

export type DivisionOption = (typeof DIVISION_OPTIONS)[number];
export type VehicleTypeOption = (typeof VEHICLE_TYPE_OPTIONS)[number];
