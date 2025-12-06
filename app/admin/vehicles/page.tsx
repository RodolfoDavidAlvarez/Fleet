'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, Plus, User as UserIcon, Wrench, Calendar, Gauge, X, Loader2, Save, Grid3x3, List, Search, UserPlus, FileText, Download, Truck, Box, Container } from 'lucide-react'
import { Vehicle } from '@/types'
import { getStatusColor, formatDate } from '@/lib/utils'
import { useVehicles, useCreateVehicle, useDrivers } from '@/hooks/use-vehicles'
import { VehicleCardSkeleton } from '@/components/ui/loading-states'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/toast'
import { Pagination } from '@/components/ui/pagination'
import { exportVehicles } from '@/lib/export-utils'

export default function VehiclesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const { data: vehicles = [], isLoading, error: vehiclesError } = useVehicles()
  const createVehicle = useCreateVehicle()
  const { data: drivers = [], isLoading: driversLoading } = useDrivers()
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    mileage: 0,
    status: 'active' as 'active' | 'in_service' | 'retired',
    vehicleNumber: '',
    vehicleType: 'Vehicle' as 'Vehicle' | 'Equipment' | 'Trailer',
    driverId: '' as string | undefined,
  })
  const activeCount = vehicles.filter((v) => v.status === 'active').length
  const inServiceCount = vehicles.filter((v) => v.status === 'in_service').length
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/login')
      return
    }
    setUser(parsedUser)
  }, [router])

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('vehicles-view-mode')
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView)
    }
    const savedItemsPerPage = localStorage.getItem('vehicles-items-per-page')
    if (savedItemsPerPage) {
      const parsed = parseInt(savedItemsPerPage, 10)
      if (!isNaN(parsed) && parsed > 0) {
        setItemsPerPage(parsed)
      }
    }
  }, [])

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('vehicles-view-mode', mode)
  }

  // Filter vehicles based on search term
  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) {
      return vehicles
    }
    const searchLower = searchTerm.toLowerCase().trim()
    return vehicles.filter((vehicle) => {
      const make = (vehicle.make || '').toLowerCase()
      const model = (vehicle.model || '').toLowerCase()
      const vin = (vehicle.vin || '').toLowerCase()
      const licensePlate = (vehicle.licensePlate || '').toLowerCase()
      const vehicleNumber = (vehicle.vehicleNumber || '').toLowerCase()
      const year = vehicle.year?.toString() || ''
      const driverName = (vehicle.driverName || '').toLowerCase()
      
      return (
        make.includes(searchLower) ||
        model.includes(searchLower) ||
        vin.includes(searchLower) ||
        licensePlate.includes(searchLower) ||
        vehicleNumber.includes(searchLower) ||
        year.includes(searchLower) ||
        driverName.includes(searchLower) ||
        `${make} ${model}`.includes(searchLower)
      )
    })
  }, [vehicles, searchTerm])

  // Calculate pagination
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredVehicles.slice(startIndex, endIndex)
  }, [filteredVehicles, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage)

  // Reset to page 1 when items per page changes or search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, searchTerm])

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    localStorage.setItem('vehicles-items-per-page', newItemsPerPage.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        driverId: formData.driverId || undefined,
      }
      await createVehicle.mutateAsync(submitData)
      setShowAddModal(false)
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        licensePlate: '',
        mileage: 0,
        status: 'active',
        vehicleNumber: '',
        vehicleType: 'Vehicle',
        driverId: '',
      })
      showToast('Vehicle added successfully!', 'success')
    } catch (error) {
      console.error('Error creating vehicle:', error)
      showToast('Failed to add vehicle. Please try again.', 'error')
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'admin'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
                <p className="text-gray-600">Manage your fleet vehicles and their status.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="card-surface p-3 rounded-xl text-sm">
                  <p className="text-xs text-gray-500">Active</p>
                  <p className="text-lg font-semibold text-gray-900">{activeCount}</p>
                </div>
                <div className="card-surface p-3 rounded-xl text-sm">
                  <p className="text-xs text-gray-500">In Service</p>
                  <p className="text-lg font-semibold text-gray-900">{inServiceCount}</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <button 
                  onClick={() => exportVehicles(filteredVehicles)} 
                  className="btn btn-secondary flex items-center gap-2"
                  disabled={filteredVehicles.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Vehicle
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md relative">
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search vehicles, VIN, license plate, driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-with-icon-left pr-12"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-600">
                  {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
                </div>
              )}
            </div>

            {vehiclesError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                Failed to load vehicles. Please try again.
              </div>
            )}

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <motion.div 
                    layout 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <AnimatePresence>
                      {paginatedVehicles.map((vehicle, i) => (
                        <motion.div
                          key={vehicle.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="card-surface rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/60 group cursor-pointer"
                          onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                        >
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                <Car className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-primary-700 transition-colors">
                                  {vehicle.make && vehicle.model
                                    ? `${vehicle.make} ${vehicle.model}`
                                    : vehicle.vehicleNumber || vehicle.vin}
                                </h3>
                                {vehicle.year && (
                                  <p className="text-sm font-medium text-gray-500">{vehicle.year}</p>
                                )}
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${getStatusColor(vehicle.status)}`}>
                              {vehicle.status?.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {vehicle.licensePlate && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plate</p>
                                <p className="text-sm font-bold text-gray-900 font-mono">{vehicle.licensePlate}</p>
                              </div>
                            )}
                            {vehicle.vin && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VIN</p>
                                <p className="text-xs font-mono text-gray-900 truncate" title={vehicle.vin}>{vehicle.vin}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                            {vehicle.mileage !== undefined && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-primary-50 p-1.5 rounded-lg">
                                  <Gauge className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Mileage</p>
                                  <p className="text-sm font-semibold text-gray-900">{vehicle.mileage.toLocaleString()} mi</p>
                                </div>
                              </div>
                            )}
                            {vehicle.driverName && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-primary-50 p-1.5 rounded-lg">
                                  <UserIcon className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Driver</p>
                                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={vehicle.driverName}>{vehicle.driverName}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {(vehicle.nextServiceDue || vehicle.lastServiceDate) && (
                            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 space-y-2">
                              {vehicle.nextServiceDue && (
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-blue-600 font-medium">Next Service</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(vehicle.nextServiceDue)}</p>
                                  </div>
                                </div>
                              )}
                              {vehicle.lastServiceDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                    <Wrench className="h-4 w-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-indigo-600 font-medium">Last Service</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(vehicle.lastServiceDate)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 font-medium">
                                {vehicle.serviceHistory?.length || 0} service {vehicle.serviceHistory?.length === 1 ? 'record' : 'records'}
                              </span>
                            </div>
                            <button 
                              className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/vehicles/${vehicle.id}`)
                              }}
                            >
                              View Details
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {filteredVehicles.length === 0 && (
                      <div className="p-6 text-center text-gray-500 col-span-full">
                        {searchTerm ? `No vehicles found matching "${searchTerm}".` : 'No vehicles found.'}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="card-surface rounded-xl border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 hidden lg:block">
                      <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="w-12">Type</div>
                        <div className="w-16">Co. ID</div>
                        <div className="w-32 flex-shrink-0">Vehicle</div>
                        <div className="w-36 flex-shrink-0">VIN</div>
                        <div className="w-20">Plate</div>
                        <div className="w-28 flex-shrink-0">Dept</div>
                        <div className="flex-1 min-w-[100px]">Driver</div>
                        <div className="w-20">Status</div>
                        <div className="w-16"></div>
                      </div>
                    </div>
                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {paginatedVehicles.map((vehicle, i) => {
                          const VehicleTypeIcon = vehicle.vehicleType === 'Trailer' ? Container :
                                                  vehicle.vehicleType === 'Equipment' ? Box : Truck;
                          const typeColor = vehicle.vehicleType === 'Trailer' ? 'text-orange-600 bg-orange-50' :
                                           vehicle.vehicleType === 'Equipment' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50';
                          return (
                            <motion.div
                              key={vehicle.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.02 }}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                              onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                            >
                              {/* Desktop View */}
                              <div className="hidden lg:flex items-center gap-3">
                                {/* Type */}
                                <div className="w-12">
                                  <div className={`p-2 rounded-lg w-fit ${typeColor}`} title={vehicle.vehicleType || 'Vehicle'}>
                                    <VehicleTypeIcon className="h-4 w-4" />
                                  </div>
                                </div>
                                {/* Company ID */}
                                <div className="w-16">
                                  <span className="font-mono font-bold text-gray-900 text-sm">
                                    {vehicle.vehicleNumber || '-'}
                                  </span>
                                </div>
                                {/* Vehicle Name */}
                                <div className="w-32 flex-shrink-0">
                                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                    {vehicle.make && vehicle.model
                                      ? `${vehicle.make} ${vehicle.model}`
                                      : vehicle.vehicleNumber || 'Unknown'}
                                  </h3>
                                  {vehicle.year && (
                                    <p className="text-xs text-gray-500">{vehicle.year}</p>
                                  )}
                                </div>
                                {/* VIN */}
                                <div className="w-36 flex-shrink-0">
                                  <span className="font-mono text-xs text-gray-600 truncate block" title={vehicle.vin}>
                                    {vehicle.vin && !vehicle.vin.startsWith('AIRTABLE-') && !vehicle.vin.startsWith('FLEET-')
                                      ? vehicle.vin
                                      : <span className="text-gray-400">-</span>}
                                  </span>
                                </div>
                                {/* License Plate */}
                                <div className="w-20">
                                  <span className="font-mono font-semibold text-sm text-gray-900">
                                    {vehicle.licensePlate || '-'}
                                  </span>
                                </div>
                                {/* Department */}
                                <div className="w-28 flex-shrink-0">
                                  {vehicle.department ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 truncate max-w-full">
                                      {vehicle.department}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </div>
                                {/* Driver */}
                                <div className="flex-1 min-w-[100px]">
                                  {vehicle.driverName ? (
                                    <div className="flex items-center gap-1.5">
                                      <UserIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm text-gray-700 truncate" title={vehicle.driverName}>
                                        {vehicle.driverName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </div>
                                {/* Status */}
                                <div className="w-20">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(vehicle.status)}`}>
                                    {vehicle.status?.replace('_', ' ')}
                                  </span>
                                </div>
                                {/* Action */}
                                <div className="w-16 text-right">
                                  <button
                                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/admin/vehicles/${vehicle.id}`)
                                    }}
                                  >
                                    View
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Mobile/Tablet View */}
                              <div className="lg:hidden flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg flex-shrink-0 ${typeColor}`}>
                                  <VehicleTypeIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {vehicle.vehicleNumber && (
                                      <span className="font-mono font-bold text-primary-600 text-sm">{vehicle.vehicleNumber}</span>
                                    )}
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                      {vehicle.status?.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {vehicle.make && vehicle.model
                                      ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`
                                      : vehicle.vehicleNumber || 'Unknown'}
                                  </h3>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                    {vehicle.department && (
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{vehicle.department}</span>
                                    )}
                                    {vehicle.licensePlate && (
                                      <span className="font-mono">{vehicle.licensePlate}</span>
                                    )}
                                    {vehicle.driverName && (
                                      <span className="flex items-center gap-1">
                                        <UserIcon className="h-3 w-3" />
                                        {vehicle.driverName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                    {filteredVehicles.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        {searchTerm ? `No vehicles found matching "${searchTerm}".` : 'No vehicles found.'}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Pagination */}
                {filteredVehicles.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredVehicles.length}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddModal(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Add New Vehicle</h2>
                      <p className="text-xs text-gray-500">Fill in the vehicle details below</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-primary-600" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Make *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                          placeholder="e.g., Ford"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Model *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="e.g., F-150"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Year *</span>
                        <input
                          type="number"
                          required
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          className="input-field w-full"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Company ID / Vehicle Number</span>
                        <input
                          type="text"
                          className="input-field w-full"
                          value={formData.vehicleNumber}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                          placeholder="e.g., 1582"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Type *</span>
                        <select
                          required
                          className="input-field w-full"
                          value={formData.vehicleType}
                          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                        >
                          <option value="Vehicle">Vehicle (Truck, Car, Van)</option>
                          <option value="Equipment">Equipment (Loader, Mower, Gator)</option>
                          <option value="Trailer">Trailer (Flatbed, Cargo)</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      Identification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">VIN *</span>
                        <input
                          type="text"
                          required
                          minLength={3}
                          className="input-field w-full font-mono"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                          placeholder="Vehicle Identification Number"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">License Plate *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full font-mono"
                          value={formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                          placeholder="ABC-1234"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Status & Mileage */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Gauge className="h-4 w-4 text-indigo-600" />
                      </div>
                      Status & Mileage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Status *</span>
                        <select
                          required
                          className="input-field w-full"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        >
                          <option value="active">Active</option>
                          <option value="in_service">In Service</option>
                          <option value="retired">Retired</option>
                        </select>
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Mileage</span>
                        <input
                          type="number"
                          min="0"
                          className="input-field w-full"
                          value={formData.mileage}
                          onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Driver Assignment */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-purple-600" />
                      </div>
                      Driver Assignment
                    </h3>
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Assign Driver (Optional)</span>
                      <select
                        className="input-field w-full"
                        value={formData.driverId || ''}
                        onChange={(e) => setFormData({ ...formData, driverId: e.target.value || '' })}
                        disabled={driversLoading}
                      >
                        <option value="">No driver assigned</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} {driver.email ? `(${driver.email})` : ''}
                          </option>
                        ))}
                      </select>
                      {driversLoading && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading drivers...
                        </p>
                      )}
                      {!driversLoading && drivers.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">No drivers available. Add drivers first.</p>
                      )}
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn btn-secondary flex-1"
                      disabled={createVehicle.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                      disabled={createVehicle.isPending}
                    >
                      {createVehicle.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Add Vehicle
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}