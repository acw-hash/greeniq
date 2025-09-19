'use client'

import { useState, useEffect, useCallback } from 'react'
import { useJobSearch } from '@/lib/hooks/useJobs'
import { JobSearchData } from '@/lib/validations/jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  SearchIcon, 
  MapPinIcon, 
  FilterIcon, 
  SlidersHorizontalIcon,
  TrendingUpIcon,
  ClockIcon,
  DollarSignIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobSearchProps {
  onJobSelect?: (job: any) => void
  onLocationChange?: (location: { lat: number; lng: number; address: string }) => void
  className?: string
}

interface SearchSuggestion {
  id: string
  title: string
  type: 'job_type' | 'location' | 'skill'
  count?: number
}

const popularSearches: SearchSuggestion[] = [
  { id: 'greenskeeping', title: 'Greenskeeping', type: 'job_type', count: 45 },
  { id: 'irrigation', title: 'Irrigation Systems', type: 'job_type', count: 32 },
  { id: 'equipment', title: 'Equipment Operation', type: 'job_type', count: 28 },
  { id: 'landscaping', title: 'Landscaping', type: 'job_type', count: 23 },
  { id: 'pesticide', title: 'Pesticide License', type: 'skill', count: 18 },
  { id: 'turf', title: 'Turf Management', type: 'skill', count: 15 }
]

const trendingLocations = [
  { id: '1', name: 'Pebble Beach, CA', count: 12 },
  { id: '2', name: 'Augusta, GA', count: 8 },
  { id: '3', name: 'Pinehurst, NC', count: 15 },
  { id: '4', name: 'Bandon, OR', count: 6 },
  { id: '5', name: 'Kohler, WI', count: 9 }
]

export default function JobSearch({ onJobSelect, onLocationChange, className }: JobSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [selectedRadius, setSelectedRadius] = useState('25')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)

  // Build search filters
  const searchFilters: JobSearchData = {
    search: searchQuery,
    job_type: selectedJobType as any || undefined,
    location: userLocation || undefined,
    radius: parseInt(selectedRadius),
    status: 'open',
    page: 1,
    limit: 20
  }

  const { data, isLoading, error } = useJobSearch(searchFilters)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: 'Current Location'
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const handleSearch = useCallback(() => {
    // Search is automatically triggered by the useJobSearch hook
    // when searchFilters change
  }, [])

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location)
    // In a real app, you'd geocode the location to get lat/lng
    // For now, we'll use a placeholder
    const mockLocation = {
      lat: 37.7749,
      lng: -122.4194,
      address: location
    }
    setUserLocation(mockLocation)
    onLocationChange?.(mockLocation)
  }

  const handleQuickSearch = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'job_type') {
      setSelectedJobType(suggestion.id)
    } else if (suggestion.type === 'location') {
      handleLocationSelect(suggestion.title)
    } else {
      setSearchQuery(suggestion.title)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLocation('')
    setSelectedJobType('')
    setSelectedRadius('25')
    setUserLocation(null)
  }

  const hasActiveFilters = searchQuery || selectedLocation || selectedJobType || selectedRadius !== '25'

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main search interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Find Your Next Job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for jobs, skills, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedJobType} onValueChange={setSelectedJobType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="greenskeeping">Greenskeeping</SelectItem>
                <SelectItem value="equipment_operation">Equipment Operation</SelectItem>
                <SelectItem value="irrigation">Irrigation</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="general_maintenance">General Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={handleLocationSelect}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Location</SelectItem>
                <SelectItem value="current">Use My Location</SelectItem>
                {trendingLocations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name} ({location.count} jobs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRadius} onValueChange={setSelectedRadius}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 miles</SelectItem>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
              Advanced
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Rate ($/hr)</label>
                  <Input
                    type="number"
                    placeholder="15"
                    min="15"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Rate ($/hr)</label>
                  <Input
                    type="number"
                    placeholder="100"
                    min="15"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Search button */}
          <Button onClick={handleSearch} className="w-full" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search Jobs'}
          </Button>
        </CardContent>
      </Card>

      {/* Search suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Popular searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUpIcon className="h-4 w-4" />
              Popular Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {popularSearches.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleQuickSearch(suggestion)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <span className="text-sm">{suggestion.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.count}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPinIcon className="h-4 w-4" />
              Trending Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendingLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location.name)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <span className="text-sm">{location.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {location.count} jobs
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search results summary */}
      {data && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Search Results</h3>
              <Badge variant="outline">
                {data.pagination.total} jobs found
              </Badge>
            </div>

            {data.stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Average Rate</p>
                    <p className="text-lg font-bold">${data.stats.averageRate}/hr</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Jobs</p>
                    <p className="text-lg font-bold">{data.stats.totalJobs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Top Type</p>
                    <p className="text-lg font-bold">
                      {Object.entries(data.stats.jobTypes).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.jobs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Top matches:</p>
                <div className="space-y-1">
                  {data.jobs.slice(0, 3).map((job) => (
                    <button
                      key={job.id}
                      onClick={() => onJobSelect?.(job)}
                      className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.location.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${job.hourly_rate}/hr</p>
                        {job.distance && (
                          <p className="text-xs text-gray-500">{job.distance}mi</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to search jobs</p>
              <Button variant="outline" onClick={handleSearch}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
