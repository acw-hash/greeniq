'use client'

import { useState } from 'react'
import { useJobsWithApplicationStatus } from '@/lib/hooks/useJobs'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Clock, DollarSign, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { EnhancedJobList } from './EnhancedJobList'
import { JobWithApplicationStatus } from '@/types/jobs'

export default function BrowseJobsPage() {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all')
  const [rateFilter, setRateFilter] = useState<string>('all')
  const [distanceFilter, setDistanceFilter] = useState<string>('all')
  
  // Get all open jobs for professionals to browse with application status
  const { data: jobsData, isLoading } = useJobsWithApplicationStatus({
    status: 'open',
    search: searchTerm,
    job_type: jobTypeFilter === 'all' ? undefined : jobTypeFilter as any,
    min_rate: rateFilter === 'all' ? undefined : parseInt(rateFilter),
    radius: 25,
    page: 1,
    limit: 20
  })

  const jobs: JobWithApplicationStatus[] = jobsData?.jobs || []

  const filteredJobs = jobs?.filter(job => {
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !job.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  // TODO: Implement smart recommendations based on:
  // - Professional's specializations
  // - Location/travel radius
  // - Experience level match
  // - Previous job history
  const recommendedJobs = filteredJobs?.slice(0, 3) || []
  const otherJobs = filteredJobs?.slice(3) || []

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading available jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Jobs</h1>
        <p className="text-muted-foreground">Discover golf course maintenance opportunities near you</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="greenskeeping">Greenskeeping</SelectItem>
                <SelectItem value="equipment_operation">Equipment Operation</SelectItem>
                <SelectItem value="irrigation">Irrigation</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="general_maintenance">General Maintenance</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={rateFilter} onValueChange={setRateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Min Rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rate</SelectItem>
                <SelectItem value="20">$20+ /hour</SelectItem>
                <SelectItem value="25">$25+ /hour</SelectItem>
                <SelectItem value="30">$30+ /hour</SelectItem>
                <SelectItem value="35">$35+ /hour</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={distanceFilter} onValueChange={setDistanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Distance</SelectItem>
                <SelectItem value="10">Within 10 miles</SelectItem>
                <SelectItem value="25">Within 25 miles</SelectItem>
                <SelectItem value="50">Within 50 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Job List with Application Status Filtering */}
      <EnhancedJobList 
        initialJobs={filteredJobs}
        userType="professional"
        onJobView={(job) => {
          // Handle job view - could navigate to job details
          console.log('View job:', job.id)
        }}
        onJobSave={(job) => {
          // Handle job save
          console.log('Save job:', job.id)
        }}
        onJobShare={(job) => {
          // Handle job share
          console.log('Share job:', job.id)
        }}
      />
    </div>
  )
}

