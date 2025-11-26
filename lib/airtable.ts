// Airtable API client for data import
import Airtable from 'airtable'

// Initialize Airtable client
export function getAirtableBase() {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID || 'appms3yBT9I2DEGl3' // From your URL

  if (!apiKey) {
    throw new Error('AIRTABLE_API_KEY is not set in environment variables')
  }

  Airtable.configure({ apiKey })
  return Airtable.base(baseId)
}

// Get base schema (tables and fields) using Airtable Meta API
export async function getBaseSchema() {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID || 'appms3yBT9I2DEGl3'

  if (!apiKey) {
    throw new Error('AIRTABLE_API_KEY is not set in environment variables')
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch base schema: ${error}`)
    }

    const data = await response.json()
    return data.tables || []
  } catch (error: any) {
    console.error('Error fetching base schema:', error)
    throw new Error(`Failed to get base schema: ${error.message}`)
  }
}

// Get all tables in the base (legacy function for compatibility)
export async function getAirtableTables() {
  const base = getAirtableBase()
  return base
}

// Get all records from a table
export async function getAirtableRecords(tableName: string) {
  const base = getAirtableBase()
  const records: any[] = []

  try {
    await base(tableName)
      .select({
        // Fetch all fields
        view: 'Grid view', // or specify a view name
      })
      .eachPage((pageRecords, fetchNextPage) => {
        pageRecords.forEach((record) => {
          records.push({
            id: record.id,
            fields: record.fields,
            createdTime: record._rawJson.createdTime,
          })
        })
        fetchNextPage()
      })

    return records
  } catch (error: any) {
    console.error(`Error fetching records from ${tableName}:`, error)
    throw new Error(`Failed to fetch records from ${tableName}: ${error.message}`)
  }
}

// Get table schema (field names and types)
export async function getTableSchema(tableName: string) {
  const base = getAirtableBase()
  
  try {
    // Get first record to understand structure
    const records = await base(tableName)
      .select({
        maxRecords: 1,
      })
      .firstPage()

    if (records.length === 0) {
      return { fields: [], tableName }
    }

    const fields = Object.keys(records[0].fields).map((fieldName) => {
      const value = records[0].fields[fieldName]
      return {
        name: fieldName,
        type: Array.isArray(value) ? 'array' : typeof value,
        sampleValue: value,
      }
    })

    return { fields, tableName }
  } catch (error: any) {
    console.error(`Error getting schema for ${tableName}:`, error)
    throw new Error(`Failed to get schema for ${tableName}: ${error.message}`)
  }
}

// Helper to normalize phone numbers
export function normalizePhoneNumber(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined
  
  // Remove all non-digit characters except +
  let cleaned = phone.toString().replace(/[^\d+]/g, '')
  
  // If it doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned
    } else {
      cleaned = '+1' + cleaned
    }
  }
  
  return cleaned
}

// Helper to normalize email
export function normalizeEmail(email: string | undefined | null): string | undefined {
  if (!email) return undefined
  return email.toString().trim().toLowerCase()
}

// Helper to parse date
export function parseDate(dateValue: any): string | undefined {
  if (!dateValue) return undefined
  
  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0] // Extract date part from ISO string
  }
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0]
  }
  
  return undefined
}

// Helper to parse time
export function parseTime(timeValue: any): string | undefined {
  if (!timeValue) return undefined
  
  if (typeof timeValue === 'string') {
    // If it's a full datetime, extract time
    if (timeValue.includes('T')) {
      return timeValue.split('T')[1]?.split('.')[0]?.substring(0, 5)
    }
    return timeValue.substring(0, 5) // HH:MM format
  }
  
  return undefined
}

