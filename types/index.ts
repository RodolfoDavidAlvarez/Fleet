export type UserRole = 'admin' | 'mechanic' | 'customer' | 'driver'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
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
  createdAt: string
}

export interface ServiceRecord {
  id: string
  vehicleId: string
  date: string
  serviceType: string
  description: string
  cost: number
  mechanicId?: string
  partsUsed?: Part[]
}

export interface Part {
  id: string
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
  vehicleId?: string
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
}
