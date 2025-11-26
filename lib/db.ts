// Simple in-memory database for development
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)

import { Vehicle, Booking, Job, Mechanic, User, DashboardStats } from '@/types'

// In-memory storage
let vehicles: Vehicle[] = []
let bookings: Booking[] = []
let jobs: Job[] = []
let mechanics: Mechanic[] = []
let users: User[] = []

// Initialize with sample data
export function initializeDB() {
  if (vehicles.length === 0) {
    vehicles = [
      {
        id: '1',
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        vin: '1FTFW1E50NFA12345',
        licensePlate: 'ABC-1234',
        status: 'active',
        mileage: 15000,
        serviceHistory: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2021,
        vin: '1GCVKREC1MZ123456',
        licensePlate: 'XYZ-5678',
        status: 'in_service',
        mileage: 25000,
        serviceHistory: [],
        createdAt: new Date().toISOString(),
      },
    ]
  }

  if (mechanics.length === 0) {
    mechanics = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@fleetpro.com',
        phone: '+1234567890',
        specializations: ['Engine', 'Transmission'],
        currentJobs: [],
        availability: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@fleetpro.com',
        phone: '+1234567891',
        specializations: ['Brakes', 'Suspension'],
        currentJobs: [],
        availability: 'available',
        createdAt: new Date().toISOString(),
      },
    ]
  }

  if (users.length === 0) {
    users = [
      {
        id: '1',
        email: 'admin@fleetpro.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ]
  }
}

// Vehicle operations
export const vehicleDB = {
  getAll: (): Vehicle[] => vehicles,
  getById: (id: string): Vehicle | undefined => vehicles.find(v => v.id === id),
  create: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    vehicles.push(newVehicle)
    return newVehicle
  },
  update: (id: string, updates: Partial<Vehicle>): Vehicle | null => {
    const index = vehicles.findIndex(v => v.id === id)
    if (index === -1) return null
    vehicles[index] = { ...vehicles[index], ...updates }
    return vehicles[index]
  },
  delete: (id: string): boolean => {
    const index = vehicles.findIndex(v => v.id === id)
    if (index === -1) return false
    vehicles.splice(index, 1)
    return true
  },
}

// Booking operations
export const bookingDB = {
  getAll: (): Booking[] => bookings,
  getById: (id: string): Booking | undefined => bookings.find(b => b.id === id),
  create: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Booking => {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    bookings.push(newBooking)
    return newBooking
  },
  update: (id: string, updates: Partial<Booking>): Booking | null => {
    const index = bookings.findIndex(b => b.id === id)
    if (index === -1) return null
    bookings[index] = {
      ...bookings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return bookings[index]
  },
  delete: (id: string): boolean => {
    const index = bookings.findIndex(b => b.id === id)
    if (index === -1) return false
    bookings.splice(index, 1)
    return true
  },
}

// Job operations
export const jobDB = {
  getAll: (): Job[] => jobs,
  getById: (id: string): Job | undefined => jobs.find(j => j.id === id),
  getByMechanic: (mechanicId: string): Job[] => jobs.filter(j => j.mechanicId === mechanicId),
  create: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Job => {
    const newJob: Job = {
      ...job,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    jobs.push(newJob)
    return newJob
  },
  update: (id: string, updates: Partial<Job>): Job | null => {
    const index = jobs.findIndex(j => j.id === id)
    if (index === -1) return null
    jobs[index] = {
      ...jobs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return jobs[index]
  },
}

// Mechanic operations
export const mechanicDB = {
  getAll: (): Mechanic[] => mechanics,
  getById: (id: string): Mechanic | undefined => mechanics.find(m => m.id === id),
  create: (mechanic: Omit<Mechanic, 'id' | 'createdAt'>): Mechanic => {
    const newMechanic: Mechanic = {
      ...mechanic,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    mechanics.push(newMechanic)
    return newMechanic
  },
  update: (id: string, updates: Partial<Mechanic>): Mechanic | null => {
    const index = mechanics.findIndex(m => m.id === id)
    if (index === -1) return null
    mechanics[index] = { ...mechanics[index], ...updates }
    return mechanics[index]
  },
}

// Dashboard stats
export function getDashboardStats(): DashboardStats {
  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    vehiclesInService: vehicles.filter(v => v.status === 'in_service').length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    completedJobs: jobs.filter(j => j.status === 'completed').length,
    totalMechanics: mechanics.length,
    availableMechanics: mechanics.filter(m => m.availability === 'available').length,
  }
}

// Initialize on import
initializeDB()

