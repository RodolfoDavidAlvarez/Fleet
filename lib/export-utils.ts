/**
 * Utility functions for exporting data to CSV
 */

export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    // Headers row
    headers.map(h => escapeCSV(h)).join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (value instanceof Date) return value.toISOString()
        return escapeCSV(String(value))
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function escapeCSV(value: string): string {
  if (!value) return ''
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Export service records to CSV
 */
export function exportServiceRecords(records: any[]) {
  const exportData = records.map(record => ({
    'Service Type': record.serviceType || '',
    'Description': record.description || '',
    'Mechanic Name': record.mechanicName || '',
    'Mechanic Role': record.mechanicRole || (record.mechanicName ? 'mechanic' : ''),
    'Vehicle': record.vehicleLabel || record.vehicleIdentifier || '',
    'Vehicle Number': record.vehicleNumber || '',
    'Date': record.date || '',
    'Cost': record.cost || 0,
    'Mileage': record.mileage || 0,
    'Status': record.status || '',
    'Division': record.division || '',
    'Vehicle Type': record.vehicleType || '',
    'Created At': record.createdAt || '',
  }))
  
  downloadCSV(exportData, 'service_records')
}

/**
 * Export drivers to CSV
 */
export function exportDrivers(drivers: any[]) {
  const exportData = drivers.map(driver => ({
    'Name': driver.name || '',
    'Email': driver.email || '',
    'Phone': driver.phone || '',
    'Role': driver.role || 'driver',
    'Approval Status': driver.approval_status || '',
    'Joined Date': driver.createdAt || '',
  }))
  
  downloadCSV(exportData, 'drivers')
}

/**
 * Export vehicles to CSV
 */
export function exportVehicles(vehicles: any[]) {
  const exportData = vehicles.map(vehicle => ({
    'Make': vehicle.make || '',
    'Model': vehicle.model || '',
    'Year': vehicle.year || '',
    'VIN': vehicle.vin || '',
    'License Plate': vehicle.licensePlate || '',
    'Vehicle Number': vehicle.vehicleNumber || '',
    'Status': vehicle.status || '',
    'Mileage': vehicle.mileage || 0,
    'Driver Name': vehicle.driverName || '',
    'Driver Email': vehicle.driverEmail || '',
    'Driver Phone': vehicle.driverPhone || '',
    'Driver Role': vehicle.driverRole || (vehicle.driverName ? 'driver' : ''),
    'Last Service Date': vehicle.lastServiceDate || '',
    'Next Service Due': vehicle.nextServiceDue || '',
    'Created At': vehicle.createdAt || '',
  }))
  
  downloadCSV(exportData, 'vehicles')
}

/**
 * Export bookings to CSV
 */
export function exportBookings(bookings: any[]) {
  const exportData = bookings.map(booking => ({
    'Customer Name': booking.customerName || '',
    'Customer Email': booking.customerEmail || '',
    'Customer Phone': booking.customerPhone || '',
    'Service Type': booking.serviceType || '',
    'Scheduled Date': booking.scheduledDate || '',
    'Scheduled Time': booking.scheduledTime || '',
    'Vehicle Info': booking.vehicleInfo || '',
    'Status': booking.status || '',
    'Mechanic Name': booking.mechanicName || '',
    'Mechanic Role': booking.mechanicRole || 'mechanic',
    'Notes': booking.notes || '',
    'Created At': booking.createdAt || '',
  }))
  
  downloadCSV(exportData, 'bookings')
}

