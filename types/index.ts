export type UserRole = 'admin' | 'mechanic' | 'customer' | 'driver'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  approval_status?: 'pending_approval' | 'approved'
  last_seen_at?: string
  isOnline?: boolean
  createdAt: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: 'active' | 'in_service' | 'retired'
  lastServiceDate?: string
  nextServiceDue?: string
  mileage: number
  serviceHistory: ServiceRecord[]
  driverId?: string
  driverName?: string
  driverPhone?: string
  driverEmail?: string
  driverAssignedDate?: string
  photoUrl?: string
  // Enhanced Airtable Fields
  department?: string
  supervisor?: string
  vehicleNumber?: string
  tagExpiry?: string
  loanLender?: string
  firstAidFire?: string
  title?: string
  photoUrls?: string[]
  airtableId?: string
  createdAt: string
  repairRequests?: RepairRequest[]
}

export interface ServiceRecord {
  id: string
  vehicleId: string
  date: string
  serviceType: string
  description: string
  cost: number
  mechanicId?: string
  mechanicName?: string
  partsUsed?: Part[]
  status?: string
  mileage?: number
  nextServiceDue?: string
}

export interface Part {
  id?: string
  name: string
  quantity: number
  cost: number
}

export interface Booking {
  id: string
  vehicleId?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceType: string
  scheduledDate: string
  scheduledTime: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  mechanicId?: string
  repairRequestId?: string
  vehicleInfo?: string
  smsConsent?: boolean
  complianceAccepted?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  bookingId: string
  vehicleId: string
  mechanicId: string
  status: 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startTime?: string
  endTime?: string
  estimatedHours?: number
  actualHours?: number
  partsUsed: Part[]
  laborCost?: number
  totalCost?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Mechanic {
  id: string
  name: string
  email: string
  phone: string
  specializations: string[]
  currentJobs: string[]
  availability: 'available' | 'busy' | 'unavailable'
  createdAt: string
}

export interface DashboardStats {
  totalVehicles: number
  activeVehicles: number
  vehiclesInService: number
  totalBookings: number
  pendingBookings: number
  completedJobs: number
  totalMechanics: number
  availableMechanics: number
  totalRepairRequests: number
  openRepairRequests: number
  waitingBookingRepairRequests: number
  completedRepairRequests: number
  urgentRepairRequests: number
  totalMaintenanceCost: number
  recentBookings: Booking[]
  vehiclesByStatus: Record<string, number>
}

export type RepairRequestStatus =
  | 'submitted'
  | 'triaged'
  | 'waiting_booking'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface RepairRequest {
  id: string
  driverId?: string
  driverName: string
  driverPhone?: string
  driverEmail?: string
  preferredLanguage?: 'en' | 'es'
  vehicleId?: string
  vehicleIdentifier?: string
  odometer?: number
  location?: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: RepairRequestStatus
  aiCategory?: string
  aiTags?: string[]
  aiSummary?: string
  aiConfidence?: number
  photoUrls: string[]
  thumbUrls: string[]
  bookingId?: string
  bookingLink?: string
  scheduledDate?: string
  scheduledTime?: string
  division?: string
  vehicleType?: string
  makeModel?: string
  incidentDate?: string
  isImmediate?: boolean
  createdAt: string
  updatedAt: string
}

export interface RepairReport {
  id: string
  repairRequestId: string
  mechanicId?: string
  summary: string
  partsUsed?: Part[]
  laborHours?: number
  laborCost?: number
  partsCost?: number
  totalCost?: number
  createdAt: string
}

export type ServiceRecordStatus = 'in_progress' | 'completed' | 'cancelled' | 'open'

export interface ServiceRecord {
  id: string
  repairRequestId?: string
  vehicleId?: string
  mechanicId?: string
  mechanicName?: string
  serviceType?: string
  description?: string
  cost?: number
  mileage?: number
  status?: ServiceRecordStatus
  date?: string
  nextServiceDue?: string
  airtableId?: string
  createdAt: string
  vehicleIdentifier?: string
  vehicleLabel?: string
  division?: string
  vehicleType?: string
  makeModel?: string
}
