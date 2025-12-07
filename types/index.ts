export type UserRole = "admin" | "mechanic" | "customer" | "driver";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  approval_status?: "pending_approval" | "approved";
  last_seen_at?: string;
  isOnline?: boolean;
  // Airtable migration fields
  airtable_id?: string;
  member_legacy_id?: string;
  level_certification?: string;
  notes?: string;
  preferred_language?: string;
  equipment_oversight?: string;
  createdAt: string;
}

export type VehicleStatus =
  | "operational" // Fully active and operational
  | "active" // Active and ready for use (legacy support)
  | "in_service" // Currently in service/repair
  | "broken_down" // Broken down, needs repair
  | "for_sale" // Marked for sale
  | "idle" // Sitting unused, needs attention
  | "upcoming" // Upcoming/new vehicle not yet in service
  | "retired" // Retired from service
  | "maintenance" // In maintenance
  | "reserved" // Reserved for specific use
  | "out_of_service"; // Out of service (temporary)

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: VehicleStatus;
  lastServiceDate?: string;
  nextServiceDue?: string;
  mileage: number;
  serviceHistory?: ServiceRecord[];
  driverId?: string | null;
  driverName?: string;
  driverPhone?: string;
  driverEmail?: string;
  driverRole?: string;
  driverAssignedDate?: string;
  photoUrl?: string;
  // Enhanced Airtable Fields
  department?: string;
  supervisor?: string;
  vehicleNumber?: string;
  tagExpiry?: string;
  loanLender?: string;
  firstAidFire?: string;
  title?: string;
  photoUrls?: string[];
  airtableId?: string;
  vehicleType?: "Vehicle" | "Equipment" | "Trailer";
  createdAt: string;
  repairRequests?: RepairRequest[];
  mileageHistory?: MileageHistory[];
  // Usage tracking
  lastUsedDate?: string;
  daysSinceLastUse?: number;
  usageCategory?: string;
}

export type ServiceRecordStatus = "in_progress" | "completed" | "cancelled" | "open";

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string;
  serviceType: string;
  description: string;
  cost: number;
  mechanicId?: string;
  mechanicName?: string;
  mechanicRole?: string;
  partsUsed?: Part[];
  status?: string;
  mileage?: number;
  nextServiceDue?: string;
  repairRequestId?: string;
  airtableId?: string;
  createdAt?: string;
  vehicleIdentifier?: string;
  vehicleLabel?: string;
  division?: string;
  vehicleType?: string;
  makeModel?: string;
}

export interface Part {
  id?: string;
  name: string;
  quantity: number;
  cost: number;
}

export interface MileageHistory {
  id: string;
  vehicleId: string;
  mileage: number;
  previousMileage?: number | null;
  updatedByServiceRecordId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  vehicleId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  mechanicId?: string;
  repairRequestId?: string;
  vehicleInfo?: string;
  smsConsent?: boolean;
  complianceAccepted?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  repairRequest?: {
    id: string;
    status?: RepairRequestStatus;
    urgency?: RepairRequest["urgency"];
    description?: string;
    aiCategory?: string;
  } | null;
}

export interface Job {
  id: string;
  bookingId: string;
  vehicleId: string;
  mechanicId: string;
  status: "assigned" | "in_progress" | "waiting_parts" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  startTime?: string;
  endTime?: string;
  estimatedHours?: number;
  actualHours?: number;
  partsUsed: Part[];
  laborCost?: number;
  totalCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  currentJobs: string[];
  availability: "available" | "busy" | "unavailable";
  createdAt: string;
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInService: number;
  totalBookings: number;
  pendingBookings: number;
  completedJobs: number;
  totalMechanics: number;
  availableMechanics: number;
  totalRepairRequests: number;
  openRepairRequests: number;
  waitingBookingRepairRequests: number;
  completedRepairRequests: number;
  urgentRepairRequests: number;
  totalMaintenanceCost: number;
  recentBookings: Booking[];
  vehiclesByStatus: Record<string, number>;
  maintenanceCostTrend: { date: string; cost: number }[];
  bookingTrend: { date: string; count: number; completed: number }[];
  bookingStatusBreakdown: { status: string; count: number }[];
  serviceTypeBreakdown: { type: string; count: number }[];
  jobStatusBreakdown: { status: string; count: number }[];
  jobPriorityBreakdown: { priority: string; count: number }[];
  repairUrgencyBreakdown: { urgency: string; count: number }[];
  departmentVehicleBreakdown: { department: string; count: number }[];
  topVehiclesByMaintenanceCost: { vehicleId: string; label: string; cost: number }[];
  avgBookingLeadTimeDays: number;
  openRepairAgingDays: number;
}

export type RepairRequestStatus = "submitted" | "triaged" | "waiting_booking" | "scheduled" | "in_progress" | "completed" | "cancelled";

export interface RepairRequest {
  id: string;
  requestNumber?: number; // Sequential number for display (shorter than UUID)
  driverId?: string;
  driverName: string;
  driverPhone?: string;
  driverEmail?: string;
  preferredLanguage?: "en" | "es";
  smsConsent?: boolean;
  vehicleId?: string;
  vehicleIdentifier?: string;
  odometer?: number;
  location?: string;
  description: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: RepairRequestStatus;
  aiCategory?: string;
  aiTags?: string[];
  aiSummary?: string;
  aiConfidence?: number;
  incidentType?: string;
  photoUrls: string[];
  thumbUrls: string[];
  bookingId?: string;
  bookingLink?: string;
  bookingLinkSentAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  division?: string;
  vehicleType?: string;
  makeModel?: string;
  incidentDate?: string;
  isImmediate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepairReport {
  id: string;
  repairRequestId: string;
  mechanicId?: string;
  summary: string;
  partsUsed?: Part[];
  laborHours?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  createdAt: string;
}
