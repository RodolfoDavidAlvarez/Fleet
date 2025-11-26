// Enhanced Airtable extraction for fleet management
// Handles departments, enhanced vehicle data, service records, and staff management

import { getAirtableBase, getAirtableRecords, normalizePhoneNumber, normalizeEmail } from './airtable'

// Enhanced vehicle extraction with departments and photos
export async function extractEnhancedVehicles() {
  console.log('🚚 Extracting enhanced vehicle data...')
  
  const records = await getAirtableRecords('Equipment Inventory') // Your main vehicle table
  
  return records.map((record: any) => {
    const fields = record.fields
    
    return {
      // Basic vehicle info
      make: fields.Make || fields.Brand || '',
      model: fields.Model || '',
      year: fields['Vehicle year'] || new Date().getFullYear(),
      vin: fields.VIN || '',
      licensePlate: fields['License plate'] || '',
      vehicleNumber: fields['Vehicle number'] || fields['Asset Number'] || '',
      
      // Enhanced data from Equipment Inventory
      department: fields.Department || 'General',
      type: fields.Type || 'Vehicle',
      serviceStatus: 'active', // Will be determined by inspection records
      currentMileage: parseFloat(fields['* Current Mileage'] || '0'),
      yearAge: fields['Number of years old'] || 0,
      reminderNumber: fields['* Reminder Number'] || '',
      uniqueId: fields['* Unique ID'] || '',
      
      // Driver information (linked record)
      driverId: Array.isArray(fields.Driver) ? fields.Driver[0] : fields.Driver,
      
      // Photo handling
      photoUrls: extractPhotoUrls(fields.Photos || fields.Images),
      
      // Service information
      nextServiceDue: calculateNextService(null, fields['* Current Mileage']),
      
      // Metadata
      airtableId: record.id,
      lastUpdated: record._rawJson?.createdTime || new Date().toISOString(),
    }
  })
}

// Extract department/division data
export async function extractDepartments() {
  console.log('🏢 Extracting department data...')
  
  try {
    // Try to get departments from a dedicated table first
    const departmentRecords = await getAirtableRecords('Departments').catch(() => [])
    
    if (departmentRecords.length > 0) {
      return departmentRecords.map((record: any) => ({
        name: record.fields.Name || record.fields.Department || '',
        description: record.fields.Description || '',
        manager: record.fields.Manager || '',
        vehicleCount: parseInt(record.fields['Vehicle Count'] || '0'),
        airtableId: record.id,
      }))
    }
    
    // Fallback: extract departments from vehicle records
    const vehicles = await getAirtableRecords('Vehicles')
    const departmentSet = new Set<string>()
    
    vehicles.forEach((record: any) => {
      const dept = record.fields.Department
      if (dept && typeof dept === 'string') {
        departmentSet.add(dept)
      }
    })
    
    return Array.from(departmentSet).map(name => ({
      name,
      description: `${name} Department`,
      manager: '',
      vehicleCount: vehicles.filter(v => v.fields.Department === name).length,
      airtableId: `dept-${name.toLowerCase().replace(/\s+/g, '-')}`,
    }))
    
  } catch (error) {
    console.error('Error extracting departments:', error)
    return [
      { name: 'Construction', description: 'Construction Department', manager: '', vehicleCount: 0, airtableId: 'dept-construction' },
      { name: 'Salvage', description: 'Salvage Department', manager: '', vehicleCount: 0, airtableId: 'dept-salvage' },
      { name: 'Fleet Administrative', description: 'Fleet Administrative Department', manager: '', vehicleCount: 0, airtableId: 'dept-admin' },
    ]
  }
}

// Extract service records
export async function extractServiceRecords() {
  console.log('🔧 Extracting service records...')
  
  try {
    const records = await getAirtableRecords('Service recors')
    
    return records.map((record: any) => {
      const fields = record.fields
      
      return {
        vehicleId: fields['Vehicle ID'] || fields.Vehicle || '',
        serviceDate: parseDate(fields.Date || fields['Service Date']),
        serviceType: fields['Service Type'] || fields.Type || '',
        description: fields.Description || fields.Notes || '',
        mileage: parseFloat(fields.Mileage || '0'),
        cost: parseFloat(fields.Cost || '0'),
        mechanicName: fields.Mechanic || fields.Technician || '',
        status: fields.Status || 'completed',
        nextServiceDue: parseDate(fields['Next Service Due']),
        airtableId: record.id,
      }
    })
  } catch (error) {
    console.error('Error extracting service records:', error)
    return []
  }
}

// Extract member/staff data
export async function extractMembers() {
  console.log('👥 Extracting member data...')
  
  try {
    const records = await getAirtableRecords('Members')
    
    return records.map((record: any) => {
      const fields = record.fields
      
      return {
        name: fields.Name || '',
        email: normalizeEmail(fields.Email),
        phone: normalizePhoneNumber(fields.Phone),
        role: fields.Role || fields.Position || 'staff',
        department: fields.Department || '',
        supervisor: fields.Supervisor || '',
        hireDate: parseDate(fields['Hire Date']),
        status: fields.Status || 'active',
        specializations: Array.isArray(fields.Specializations) 
          ? fields.Specializations 
          : (fields.Specializations || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        airtableId: record.id,
      }
    })
  } catch (error) {
    console.error('Error extracting members:', error)
    return []
  }
}

// Extract appointments/scheduling
export async function extractAppointments() {
  console.log('📅 Extracting appointment data...')
  
  try {
    const records = await getAirtableRecords('Appointments')
    
    return records.map((record: any) => {
      const fields = record.fields
      
      return {
        vehicleId: fields['Vehicle ID'] || fields.Vehicle || '',
        customerName: fields['Customer Name'] || fields.Customer || '',
        customerPhone: normalizePhoneNumber(fields['Customer Phone']),
        customerEmail: normalizeEmail(fields['Customer Email']),
        serviceType: fields['Service Type'] || '',
        scheduledDate: parseDate(fields['Scheduled Date'] || fields.Date),
        scheduledTime: fields['Scheduled Time'] || fields.Time || '',
        status: fields.Status || 'pending',
        mechanicAssigned: fields['Mechanic Assigned'] || '',
        notes: fields.Notes || '',
        estimatedDuration: fields['Estimated Duration'] || '',
        airtableId: record.id,
      }
    })
  } catch (error) {
    console.error('Error extracting appointments:', error)
    return []
  }
}

// Utility functions
function extractModelFromMakeModel(makeModel: string): string {
  if (!makeModel) return ''
  const parts = makeModel.split(' ')
  if (parts.length >= 2) {
    return parts.slice(1, -1).join(' ') // Everything except first (make) and last (year)
  }
  return ''
}

function extractYearFromMakeModel(makeModel: string): number {
  if (!makeModel) return new Date().getFullYear()
  const parts = makeModel.split(' ')
  const lastPart = parts[parts.length - 1]
  const year = parseInt(lastPart)
  return isNaN(year) ? new Date().getFullYear() : year
}

function parseDate(dateValue: any): string | undefined {
  if (!dateValue) return undefined
  
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0]
  }
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0]
  }
  
  return undefined
}

function extractPhotoUrls(photos: any): string[] {
  if (!photos || !Array.isArray(photos)) return []
  
  return photos.map((photo: any) => photo.url).filter(Boolean)
}

function calculateNextService(lastServiceDate: string | undefined, currentMileage: number): string | undefined {
  if (!lastServiceDate) return undefined
  
  const lastDate = new Date(lastServiceDate)
  const nextDate = new Date(lastDate)
  nextDate.setMonth(nextDate.getMonth() + 3) // 3 months from last service
  
  return nextDate.toISOString().split('T')[0]
}

// Main extraction coordinator
export async function extractAllEnhancedData() {
  console.log('🚀 Starting enhanced Airtable data extraction...')
  
  try {
    const [
      vehicles,
      departments,
      serviceRecords,
      members,
      appointments
    ] = await Promise.all([
      extractEnhancedVehicles(),
      extractDepartments(),
      extractServiceRecords(),
      extractMembers(),
      extractAppointments()
    ])
    
    return {
      vehicles,
      departments,
      serviceRecords,
      members,
      appointments,
      summary: {
        vehiclesCount: vehicles.length,
        departmentsCount: departments.length,
        serviceRecordsCount: serviceRecords.length,
        membersCount: members.length,
        appointmentsCount: appointments.length,
      }
    }
  } catch (error) {
    console.error('Error in enhanced data extraction:', error)
    throw error
  }
}