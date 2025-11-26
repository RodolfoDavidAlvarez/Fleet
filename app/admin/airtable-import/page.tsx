'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Download, Database, Users, Calendar, Wrench, Building, CheckCircle, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react'

export default function AirtableImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [selectedTypes, setSelectedTypes] = useState(['all'])
  const [dryRun, setDryRun] = useState(true)
  const [statusData, setStatusData] = useState<any>(null)
  const [statusError, setStatusError] = useState<string>('')
  const [statusLoading, setStatusLoading] = useState(false)

  const dataTypes = [
    { id: 'all', label: 'All Data Types', icon: Database, description: 'Import everything' },
    { id: 'vehicles', label: 'Enhanced Vehicles', icon: Database, description: 'Vehicles with photos, departments, supervisors' },
    { id: 'departments', label: 'Departments', icon: Building, description: 'Construction, Salvage, Administrative divisions' },
    { id: 'serviceRecords', label: 'Service Records', icon: Wrench, description: 'Historical service and maintenance data' },
    { id: 'members', label: 'Staff/Members', icon: Users, description: 'Drivers, mechanics, and administrative staff' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, description: 'Scheduled services and bookings' },
    { id: 'repairRequests', label: 'Repair Requests', icon: AlertTriangle, description: 'Issue reports, triage status, and urgency' },
  ]

  const summaryCards = [
    { key: 'vehicles', label: 'Vehicles', icon: Database },
    { key: 'serviceRecords', label: 'Service Records', icon: Wrench },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'repairRequests', label: 'Repair Requests', icon: AlertTriangle },
    { key: 'users', label: 'Members/Users', icon: Users },
    { key: 'mechanics', label: 'Mechanics', icon: Wrench },
    { key: 'departments', label: 'Departments', icon: Building },
  ]

  const sampleSections = [
    { key: 'vehicles', title: 'Vehicles', description: 'Department, tag expiry, photos, and supervisors' },
    { key: 'serviceRecords', title: 'Service Records', description: 'Service type, mileage, and next service due' },
    { key: 'bookings', title: 'Bookings/Appointments', description: 'Customer, service type, date/time, and status' },
    { key: 'repairRequests', title: 'Repair Requests', description: 'Vehicle identifiers, urgency, and triage status' },
    { key: 'users', title: 'Members / Staff', description: 'Roles, contacts, and Airtable linkage' },
    { key: 'departments', title: 'Departments', description: 'Managers and vehicle counts' },
  ]

  const loadStatus = async () => {
    setStatusLoading(true)
    setStatusError('')

    try {
      const response = await fetch('/api/airtable/status')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load database snapshot')
      }

      setStatusData(data)
    } catch (err: any) {
      setStatusError(err.message)
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleImport = async () => {
    setIsImporting(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/airtable/import-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataTypes: selectedTypes,
          dryRun,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsImporting(false)
    }
  }

  const handleTypeSelection = (typeId: string, checked: boolean) => {
    if (typeId === 'all') {
      setSelectedTypes(checked ? ['all'] : [])
    } else {
      const newTypes = checked
        ? [...selectedTypes.filter(t => t !== 'all'), typeId]
        : selectedTypes.filter(t => t !== typeId)
      
      setSelectedTypes(newTypes.length === 0 ? [] : newTypes)
    }
  }

  const getProgressValue = () => {
    if (!results) return 0
    const total = Object.values(results.results || {}).reduce((sum: number, r: any) => sum + r.imported + r.skipped, 0)
    const imported = Object.values(results.results || {}).reduce((sum: number, r: any) => sum + r.imported, 0)
    return total > 0 ? (imported / total) * 100 : 0
  }

  const renderSample = (sectionKey: string, item: any) => {
    switch (sectionKey) {
      case 'vehicles':
        return (
          <div className="space-y-1">
            <div className="font-medium">{[item.make, item.model, item.year].filter(Boolean).join(' ') || 'Unnamed vehicle'}</div>
            <div className="text-xs text-muted-foreground">
              {(item.department || 'No department')} • {item.status || '—'} • {item.mileage ? `${item.mileage} mi` : 'Mileage —'}
            </div>
            <div className="text-[11px] text-muted-foreground/80">
              {`Vehicle #: ${item.vehicle_number || '—'} | Tag: ${item.tag_expiry || '—'} | Airtable: ${item.airtable_id || '—'}`}
            </div>
          </div>
        )
      case 'serviceRecords':
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.service_type || 'Service record'}</div>
            <div className="text-xs text-muted-foreground">
              {(item.date || 'No date')} • {item.mileage ? `${item.mileage} mi` : 'Mileage —'} • {item.status || 'Status —'}
            </div>
            <div className="text-[11px] text-muted-foreground/80">
              {`Next due: ${item.next_service_due || '—'} | Airtable: ${item.airtable_id || '—'}`}
            </div>
          </div>
        )
      case 'bookings':
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.customer_name || 'Booking'}</div>
            <div className="text-xs text-muted-foreground">
              {(item.service_type || 'Service')} • {(item.scheduled_date || 'Date —')} {item.scheduled_time ? `@ ${item.scheduled_time}` : ''}
            </div>
            <div className="text-[11px] text-muted-foreground/80">
              {`Status: ${item.status || 'pending'} | Airtable: ${item.airtable_id || '—'}`}
            </div>
          </div>
        )
      case 'repairRequests':
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.vehicle_identifier || 'Repair request'}</div>
            <div className="text-xs text-muted-foreground">
              {(item.driver_name || 'Unknown driver')} • {(item.urgency || 'urgency —')} • {(item.status || 'status —')}
            </div>
            <div className="text-[11px] text-muted-foreground/80">
              {`Airtable: ${item.airtable_id || '—'}`}
            </div>
          </div>
        )
      case 'users':
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.name || 'Member'}</div>
            <div className="text-xs text-muted-foreground">{item.email || 'No email'} • {item.role || 'No role'}</div>
            <div className="text-[11px] text-muted-foreground/80">Airtable: {item.airtable_id || '—'}</div>
          </div>
        )
      case 'departments':
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.name || 'Department'}</div>
            <div className="text-xs text-muted-foreground">
              {(item.manager || 'No manager')} • {item.vehicle_count ? `${item.vehicle_count} vehicles` : '0 vehicles'}
            </div>
            <div className="text-[11px] text-muted-foreground/80">Airtable: {item.airtable_id || '—'}</div>
          </div>
        )
      default:
        return <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <Download className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Enhanced Airtable Import</h1>
      </div>

      {/* Data Snapshot Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Database Snapshot</CardTitle>
          <CardDescription>See what Airtable data is already in Supabase so you can surface it in the UI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Refresh this after imports to understand which tables/fields you can display (vehicles, members, repairs, bookings, etc.).
            </p>
            <Button variant="outline" size="sm" onClick={loadStatus} disabled={statusLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh snapshot
            </Button>
          </div>

          {statusError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusError}</AlertDescription>
            </Alert>
          )}

          {statusLoading && (
            <div className="text-sm text-muted-foreground">Loading snapshot from Supabase...</div>
          )}

          {statusData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {summaryCards.map((card) => {
                  const Icon = card.icon
                  const summary = statusData?.summary?.[card.key] || {}
                  return (
                    <div key={card.key} className="rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{card.label}</span>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{summary.total ?? 0}</div>
                      <div className="text-xs text-muted-foreground">
                        Airtable: {summary.fromAirtable ?? 0} • Other: {summary.legacy ?? 0}
                      </div>
                    </div>
                  )
                })}
              </div>

              {(statusData?.duplicates?.emails?.length > 0 || statusData?.duplicates?.vins?.length > 0) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Possible duplicates detected — Emails: {statusData?.duplicates?.emails?.length || 0}, VINs:{' '}
                    {statusData?.duplicates?.vins?.length || 0}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleSections.map((section) => (
                  <div key={section.key} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(statusData?.samples?.[section.key] || []).length} rows
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(statusData?.samples?.[section.key] || []).slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="rounded bg-muted p-2">
                          {renderSample(section.key, item)}
                        </div>
                      ))}
                      {(statusData?.samples?.[section.key] || []).length === 0 && (
                        <div className="text-sm text-muted-foreground">No rows yet.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!statusLoading && !statusData && !statusError && (
            <div className="text-sm text-muted-foreground">
              No snapshot yet. Click "Refresh snapshot" to load the current counts from Supabase.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
          <CardDescription>
            Select which data types to import from your Airtable base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Data Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedTypes.includes(type.id) || 
                  (selectedTypes.includes('all') && type.id !== 'all')
                
                return (
                  <div key={type.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleTypeSelection(type.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dry Run Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <label className="font-medium">
              Dry Run (Preview only - don't actually import)
            </label>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting || selectedTypes.length === 0}
            className="w-full"
          >
            {isImporting ? (
              <>Importing...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {dryRun ? 'Preview Import' : 'Start Import'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Results
            </CardTitle>
            <CardDescription>
              {results.dryRun ? 'Preview completed' : 'Import completed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {results.summary && Object.entries(results.summary).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{value as number}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/Count$/, '').replace(/([A-Z])/g, ' $1')}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Import Progress</span>
                <span>{Math.round(getProgressValue())}%</span>
              </div>
              <Progress value={getProgressValue()} />
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h3 className="font-medium">Detailed Results</h3>
              {results.results && Object.entries(results.results).map(([key, result]: [string, any]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✓ {result.imported}</span>
                    {result.skipped > 0 && <span className="text-yellow-600">⚠ {result.skipped}</span>}
                    {result.errors.length > 0 && <span className="text-red-600">✗ {result.errors.length}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Error Details */}
            {results.results && Object.entries(results.results).some(([_, r]: [string, any]) => r.errors.length > 0) && (
              <div className="space-y-2">
                <h3 className="font-medium text-red-600">Import Errors</h3>
                {Object.entries(results.results).map(([key, result]: [string, any]) =>
                  result.errors.length > 0 && (
                    <div key={key} className="space-y-1">
                      <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                      {result.errors.map((error: string, idx: number) => (
                        <div key={idx} className="text-sm text-red-600 pl-4">• {error}</div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Configure Airtable API Key</h3>
            <p className="text-sm text-muted-foreground">
              Run the setup script: <code className="bg-muted px-1 rounded">./setup-airtable-credentials.sh</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">2. Run Database Migration</h3>
            <p className="text-sm text-muted-foreground">
              Apply the enhanced schema: run <code className="bg-muted px-1 rounded">supabase/migration_enhanced_data_fixed.sql</code> in your Supabase SQL editor
            </p>
            <p className="text-sm text-muted-foreground">
              For repair request Airtable IDs, also run <code className="bg-muted px-1 rounded">supabase/migration_final_columns.sql</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">3. Data Available for Import</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enhanced vehicle data with photos and department assignments</li>
              <li>• Department/division structure (Construction, Salvage, etc.)</li>
              <li>• Complete service and maintenance history</li>
              <li>• Staff members with roles and specializations</li>
              <li>• Appointments and scheduling data</li>
              <li>• Repair requests with urgency/triage info and AI categories</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
