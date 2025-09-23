"use client"

import { useState } from 'react'
import { Search, Filter, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApplicationCard } from './ApplicationCard'
import { ApplicationConfirmation } from './ApplicationConfirmation'
import { useDebounce } from 'use-debounce'
import type { Database } from '@/types'

type Application = Database['public']['Tables']['applications']['Row'] & {
  jobs?: Database['public']['Tables']['jobs']['Row'] & {
    profiles?: Database['public']['Tables']['profiles']['Row'] & {
      golf_course_profiles?: Database['public']['Tables']['golf_course_profiles']['Row']
    }
  }
  profiles?: Database['public']['Tables']['profiles']['Row'] & {
    professional_profiles?: Database['public']['Tables']['professional_profiles']['Row']
  }
}

interface ApplicationListProps {
  applications: Application[]
  viewMode?: 'professional' | 'golf_course'
  isLoading?: boolean
  error?: string
  onAccept?: (applicationId: string) => void
  onReject?: (applicationId: string) => void
  onViewDetails?: (applicationId: string) => void
  onWithdraw?: (applicationId: string) => void
  onAcceptJob?: (applicationId: string) => void
  actionLoading?: boolean
}

export function ApplicationList({
  applications,
  viewMode = 'professional',
  isLoading = false,
  error,
  onAccept,
  onReject,
  onViewDetails,
  onWithdraw,
  onAcceptJob,
  actionLoading = false
}: ApplicationListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)

  // Filter applications based on search term and status
  const filteredApplications = applications.filter((application) => {
    const matchesSearch = debouncedSearchTerm === '' || 
      (viewMode === 'professional' && application.jobs?.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (viewMode === 'golf_course' && application.profiles?.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || (application.status || 'pending') === statusFilter

    return matchesSearch && matchesStatus
  })

  // Group applications by status for stats
  const statusCounts = applications.reduce((acc, app) => {
    const status = app.status || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Failed to load applications</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_: any, i: number) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{applications.length}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {statusCounts.pending || 0}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(statusCounts.accepted_by_course || 0) + (statusCounts.accepted_by_professional || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statusCounts.rejected || 0}
                </div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      {applications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    viewMode === 'professional' 
                      ? "Search jobs..." 
                      : "Search professionals..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted_by_course">Accepted by Course</SelectItem>
                  <SelectItem value="accepted_by_professional">Accepted by Professional</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {(debouncedSearchTerm || statusFilter !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {debouncedSearchTerm && (
            <Badge variant="secondary" className="px-3 py-1">
              Search: {debouncedSearchTerm}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="px-3 py-1">
              Status: {statusFilter}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application: any) => (
            <div key={application.id} className="space-y-4">
              {/* Show confirmation component for accepted applications */}
              {viewMode === 'professional' && application.status === 'accepted' && (
                <ApplicationConfirmation application={application} />
              )}
              
              <ApplicationCard
                application={application}
                viewMode={viewMode}
                onStatusUpdate={viewMode === 'golf_course' ? 
                  (id: string, status: 'accepted_by_course' | 'rejected') => {
                    if (status === 'accepted_by_course' && onAccept) onAccept(id)
                    if (status === 'rejected' && onReject) onReject(id)
                  } : undefined
                }
                onAcceptJob={viewMode === 'professional' ? onAcceptJob : undefined}
              />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No applications yet</h3>
                <p className="text-muted-foreground">
                  {viewMode === 'professional' 
                    ? "You haven't applied to any jobs yet. Browse available jobs to get started."
                    : "No one has applied to your jobs yet. Make sure your job postings are visible and attractive."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No applications match your filters</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to see more results.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
