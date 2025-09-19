'use client'

import { useState } from 'react'
import { useJobs } from '@/lib/hooks/useJobs'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Clock, DollarSign, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function BrowseJobsPage() {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all')
  const [rateFilter, setRateFilter] = useState<string>('all')
  const [distanceFilter, setDistanceFilter] = useState<string>('all')
  
  // Get all open jobs for professionals to browse
  const { data: jobsData, isLoading } = useJobs({
    status: 'open',
    search: searchTerm,
    job_type: jobTypeFilter === 'all' ? undefined : jobTypeFilter as any,
    min_rate: rateFilter === 'all' ? undefined : parseInt(rateFilter),
    radius: 25,
    page: 1,
    limit: 20
  })

  const jobs = jobsData?.jobs || []

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

      {/* Recommended Jobs Section */}
      {recommendedJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recommended for You</h2>
          <div className="grid gap-6">
            {recommendedJobs.map((job) => (
              <JobCard key={job.id} job={job} isRecommended={true} />
            ))}
          </div>
        </div>
      )}

      {/* All Jobs Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {recommendedJobs.length > 0 ? 'Other Available Jobs' : 'Available Jobs'}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({otherJobs.length} jobs)
          </span>
        </h2>
        
        {otherJobs.length > 0 ? (
          <div className="grid gap-6">
            {otherJobs.map((job) => (
              <JobCard key={job.id} job={job} isRecommended={false} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search filters to find more opportunities.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, isRecommended }: { job: any; isRecommended: boolean }) {
  return (
    <Card className={isRecommended ? 'border-primary bg-primary/5' : ''}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {isRecommended && (
              <Badge className="mb-2" variant="default">Recommended</Badge>
            )}
            <Link href={`/jobs/${job.id}`}>
              <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                {job.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mb-2">
              {job.golf_course_profiles?.course_name || job.profiles?.golf_course_profiles?.course_name}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium text-green-600">${job.hourly_rate}/hr</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>2.5 miles away</span> {/* TODO: Calculate actual distance */}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={
              job.urgency_level === 'high' ? 'destructive' :
              job.urgency_level === 'emergency' ? 'destructive' : 'secondary'
            }>
              {job.urgency_level}
            </Badge>
            <Badge variant="outline">{job.job_type.replace('_', ' ')}</Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {job.description}
        </p>
        
        {job.required_certifications && job.required_certifications.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.required_certifications.slice(0, 3).map((cert: string) => (
              <Badge key={cert} variant="outline" className="text-xs">
                {cert.replace('_', ' ')}
              </Badge>
            ))}
            {job.required_certifications.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.required_certifications.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Starts: {new Date(job.start_date).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Link href={`/jobs/${job.id}`}>
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
            <Link href={`/jobs/${job.id}/apply`}>
              <Button size="sm">Apply Now</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
