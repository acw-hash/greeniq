'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { MapPin, Clock, DollarSign, Eye, MessageSquare, User, Building } from 'lucide-react'
import { format } from 'date-fns'

export function CurrentJobsList() {
  const router = useRouter()
  const { profile } = useAuth()
  
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['current-jobs'],
    queryFn: async () => {
      const response = await fetch('/api/current-jobs')
      if (!response.ok) throw new Error('Failed to fetch current jobs')
      return response.json()
    }
  })

  if (isLoading) return <div>Loading current jobs...</div>
  if (error) return <div>Error loading jobs</div>

  const isProfessional = profile?.user_type === 'professional'
  const isGolfCourse = profile?.user_type === 'golf_course'

  return (
    <div className="space-y-6">
      {jobs?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No current jobs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {jobs?.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    {isProfessional && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{job.golf_course?.course_name}</span>
                      </div>
                    )}
                    
                    {isGolfCourse && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{job.professional?.full_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${job.hourly_rate}/hr</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(job.start_date), 'PPP')}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2 ml-4">
                  <Badge variant={
                    job.submission_status === 'approved' ? 'default' :
                    job.submission_status === 'submitted' ? 'secondary' :
                    job.submission_status === 'in_progress' ? 'outline' :
                    'secondary'
                  }>
                    {job.submission_status === 'not_started' ? 'Ready to Start' :
                     job.submission_status === 'in_progress' ? 'In Progress' :
                     job.submission_status === 'submitted' ? 'Awaiting Review' :
                     job.submission_status === 'approved' ? 'Completed' :
                     job.submission_status}
                  </Badge>
                  
                  {job.last_update && (
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(job.last_update), 'PP')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  {job.updates_count > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {job.updates_count} update{job.updates_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Professional Actions */}
                  {isProfessional && (
                    <Button 
                      onClick={() => router.push(`/dashboard/jobs/${job.id}/manage`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Manage Job
                    </Button>
                  )}
                  
                  {/* Golf Course Actions */}
                  {isGolfCourse && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/jobs/${job.id}/progress`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Progress
                      </Button>
                      
                      {job.submission_status === 'submitted' && (
                        <Button 
                          onClick={() => router.push(`/dashboard/jobs/${job.id}/review`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Review Work
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Message Button */}
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/messages/${job.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
