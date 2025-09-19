'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Job } from '@/lib/stores/jobStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPinIcon, 
  NavigationIcon, 
  ZoomInIcon, 
  ZoomOutIcon,
  LayersIcon,
  FilterIcon,
  MaximizeIcon,
  MinimizeIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobMapProps {
  jobs: Job[]
  center?: { lat: number; lng: number }
  zoom?: number
  onJobSelect?: (job: Job) => void
  onLocationChange?: (location: { lat: number; lng: number; address: string }) => void
  className?: string
}

interface MapMarker {
  id: string
  position: { lat: number; lng: number }
  job: Job
  isSelected?: boolean
}

// Mock Google Maps component - in production, you'd use @googlemaps/react-wrapper
const GoogleMap = ({ 
  center, 
  zoom, 
  markers, 
  onMarkerClick,
  onMapClick,
  className 
}: {
  center: { lat: number; lng: number }
  zoom: number
  markers: MapMarker[]
  onMarkerClick: (marker: MapMarker) => void
  onMapClick: (location: { lat: number; lng: number }) => void
  className?: string
}) => {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // In production, initialize Google Maps here
    // For now, we'll create a mock map interface
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border-radius: 8px;
        ">
          <div style="text-align: center; color: #1976d2;">
            <MapPinIcon style="width: 48px; height: 48px; margin: 0 auto 16px;" />
            <p style="font-size: 16px; font-weight: 500;">Google Maps Integration</p>
            <p style="font-size: 14px; opacity: 0.7;">Center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</p>
            <p style="font-size: 14px; opacity: 0.7;">Zoom: ${zoom}</p>
            <p style="font-size: 14px; opacity: 0.7;">Markers: ${markers.length}</p>
          </div>
        </div>
      `
    }
  }, [center, zoom, markers])

  return (
    <div 
      ref={mapRef}
      className={cn("w-full h-full", className)}
      onClick={(e) => {
        // Mock map click - in production, get actual coordinates
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const lat = center.lat + (y - rect.height / 2) * 0.001
        const lng = center.lng + (x - rect.width / 2) * 0.001
        onMapClick({ lat, lng })
      }}
    />
  )
}

export default function JobMap({ 
  jobs, 
  center = { lat: 37.7749, lng: -122.4194 }, 
  zoom = 10,
  onJobSelect,
  onLocationChange,
  className 
}: JobMapProps) {
  const [mapCenter, setMapCenter] = useState(center)
  const [mapZoom, setMapZoom] = useState(zoom)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filteredJobs, setFilteredJobs] = useState(jobs)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Convert jobs to map markers
  const markers: MapMarker[] = filteredJobs.map(job => ({
    id: job.id,
    position: { lat: job.location.lat, lng: job.location.lng },
    job,
    isSelected: selectedJob?.id === job.id
  }))

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  // Update filtered jobs when jobs change
  useEffect(() => {
    setFilteredJobs(jobs)
  }, [jobs])

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedJob(marker.job)
    onJobSelect?.(marker.job)
  }, [onJobSelect])

  const handleMapClick = useCallback((location: { lat: number; lng: number }) => {
    // In production, you'd reverse geocode to get address
    const mockAddress = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    onLocationChange?.({ ...location, address: mockAddress })
  }, [onLocationChange])

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 20))
  }

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 1))
  }

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation)
    }
  }

  const handleCenterOnJob = (job: Job) => {
    setMapCenter({ lat: job.location.lat, lng: job.location.lng })
    setSelectedJob(job)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const getJobTypeColor = (jobType: string) => {
    const colors = {
      greenskeeping: 'bg-green-500',
      equipment_operation: 'bg-blue-500',
      irrigation: 'bg-cyan-500',
      landscaping: 'bg-emerald-500',
      general_maintenance: 'bg-gray-500'
    }
    return colors[jobType as keyof typeof colors] || 'bg-gray-500'
  }

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      normal: 'border-gray-300',
      high: 'border-yellow-400',
      emergency: 'border-red-500'
    }
    return colors[urgency as keyof typeof colors] || 'border-gray-300'
  }

  return (
    <div className={cn(
      "relative",
      isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-96",
      className
    )}>
      {/* Map container */}
      <div className="relative w-full h-full">
        <GoogleMap
          center={mapCenter}
          zoom={mapZoom}
          markers={markers}
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
          className="w-full h-full"
        />

        {/* Map controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="bg-white shadow-md"
          >
            <ZoomInIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="bg-white shadow-md"
          >
            <ZoomOutIcon className="h-4 w-4" />
          </Button>
          {userLocation && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCenterOnUser}
              className="bg-white shadow-md"
            >
              <NavigationIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="bg-white shadow-md"
          >
            {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filter toggle */}
        <div className="absolute top-4 left-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white shadow-md"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Job count badge */}
        <div className="absolute bottom-4 left-4">
          <Badge variant="secondary" className="bg-white shadow-md">
            {filteredJobs.length} jobs
          </Badge>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="absolute top-16 left-4 w-64 bg-white shadow-lg z-10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filter Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Job Type</label>
              <div className="space-y-1">
                {['greenskeeping', 'equipment_operation', 'irrigation', 'landscaping', 'general_maintenance'].map((type) => (
                  <label key={type} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded"
                    />
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium mb-1 block">Urgency Level</label>
              <div className="space-y-1">
                {['normal', 'high', 'emergency'].map((urgency) => (
                  <label key={urgency} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded"
                    />
                    <span className="capitalize">{urgency}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job list sidebar */}
      {!isFullscreen && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t max-h-48 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Nearby Jobs</h3>
            <div className="space-y-2">
              {filteredJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleCenterOnJob(job)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                    selectedJob?.id === job.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    getJobTypeColor(job.job_type)
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">${job.hourly_rate}/hr • {job.location.address}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getUrgencyColor(job.urgency_level))}
                  >
                    {job.urgency_level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected job details */}
      {selectedJob && isFullscreen && (
        <Card className="absolute bottom-4 right-4 w-80 bg-white shadow-lg z-10">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm">{selectedJob.title}</CardTitle>
                <p className="text-xs text-gray-500">{selectedJob.location.address}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedJob(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={getJobTypeColor(selectedJob.job_type)}>
                {selectedJob.job_type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={getUrgencyColor(selectedJob.urgency_level)}>
                {selectedJob.urgency_level}
              </Badge>
            </div>
            
            <div className="text-sm">
              <p className="font-semibold">${selectedJob.hourly_rate}/hour</p>
              <p className="text-gray-600 line-clamp-2">{selectedJob.description}</p>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                View Details
              </Button>
              <Button size="sm" variant="outline">
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
