'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Download, Database, Users, Calendar, Wrench, Building, CheckCircle, AlertCircle } from 'lucide-react'

export default function AirtableImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [selectedTypes, setSelectedTypes] = useState(['all'])
  const [dryRun, setDryRun] = useState(true)

  const dataTypes = [
    { id: 'all', label: 'All Data Types', icon: Database, description: 'Import everything' },
    { id: 'vehicles', label: 'Enhanced Vehicles', icon: Database, description: 'Vehicles with photos, departments, supervisors' },
    { id: 'departments', label: 'Departments', icon: Building, description: 'Construction, Salvage, Administrative divisions' },
    { id: 'serviceRecords', label: 'Service Records', icon: Wrench, description: 'Historical service and maintenance data' },
    { id: 'members', label: 'Staff/Members', icon: Users, description: 'Drivers, mechanics, and administrative staff' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, description: 'Scheduled services and bookings' },
  ]

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <Download className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Enhanced Airtable Import</h1>
      </div>

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
              Apply the enhanced schema: Run <code className="bg-muted px-1 rounded">supabase/migration_enhanced_data.sql</code> in your Supabase SQL editor
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
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}