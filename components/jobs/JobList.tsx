'use client'

import { useState, useEffect, useCallback } from 'react'
import { Job } from '@/lib/stores/jobStore'
import { useJobSearch } from '@/lib/hooks/useJobs'
import JobCard from './JobCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  SearchIcon, 
  FilterIcon, 
  MapPinIcon, 
  SlidersHorizontalIcon,
  GridIcon,
  ListIcon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobListProps {
  initialFilters?: any
  variant?: 'grid' | 'list'
  showFilters?: boolean
  showSearch?: boolean
  onJobSelect?: (job: Job) => void
  onJobApply?: (job: Job) => void
  className?: string
}

const JobListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ))}
  </div>
)

export default function JobList({ 
  initialFilters = {},
  variant = 'grid',
  showFilters = true,
  showSearch = true,
  onJobSelect,
  onJobApply,
  className 
}: JobListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(variant)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    job_type: '',
    min_rate: '',
    max_rate: '',
    urgency_level: '',
    required_experience: '',
    radius: '25',
    ...initialFilters
  })

  const { data, isLoading, error, refetch } = useJobSearch(filters)

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = () => {
    setFilters({
      search: '',
      job_type: '',
      min_rate: '',
      max_rate: '',
      urgency_level: '',
      required_experience: '',
      radius: '25'
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== '25' // radius default
  )

  const jobs = data?.jobs || []
  const pagination = data?.pagination
  const stats = data?.stats

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load jobs. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with search and filters */}
      {(showSearch || showFilters) && (
        <div className="space-y-4">
          {/* Search bar */}
          {showSearch && (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs by title or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Quick filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={filters.job_type} onValueChange={(value) => handleFilterChange('job_type', value)}>
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

              <Select value={filters.urgency_level} onValueChange={(value) => handleFilterChange('urgency_level', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min Rate"
                  value={filters.min_rate}
                  onChange={(e) => handleFilterChange('min_rate', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max Rate"
                  value={filters.max_rate}
                  onChange={(e) => handleFilterChange('max_rate', e.target.value)}
                  className="w-24"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
                More Filters
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          )}

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select value={filters.required_experience} onValueChange={(value) => handleFilterChange('required_experience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Experience</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Search Radius</label>
                  <Select value={filters.radius} onValueChange={(value) => handleFilterChange('radius', value)}>
                    <SelectTrigger>
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
                </div>
              </div>
            </div>
          )}

          {/* Stats and view controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {stats && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{stats.totalJobs} jobs found</span>
                  {stats.averageRate > 0 && (
                    <span>• Avg: ${stats.averageRate}/hr</span>
                  )}
                </div>
              )}
              
              {hasActiveFilters && (
                <div className="flex items-center gap-1">
                  {Object.entries(filters).map(([key, value]) => {
                    if (value && value !== '25') {
                      return (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <GridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job list */}
      {isLoading ? (
        <JobListSkeleton />
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters 
              ? "Try adjusting your filters to see more results."
              : "Check back later for new job postings."
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        )}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant={viewMode === 'grid' ? 'default' : 'compact'}
              onView={onJobSelect}
              onApply={onJobApply}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => handleFilterChange('page', (pagination.page - 1).toString())}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handleFilterChange('page', (pagination.page + 1).toString())}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
