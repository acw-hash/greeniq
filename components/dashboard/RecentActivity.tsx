import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/format'
import Link from 'next/link'
import { 
  Briefcase, 
  MessageSquare, 
  CreditCard, 
  FileText,
  ArrowRight
} from 'lucide-react'

interface RecentActivityProps {
  userType?: string
  userId: string
}

export async function RecentActivity({ userType, userId }: RecentActivityProps) {
  const supabase = await createClient()
  
  if (userType === 'golf_course') {
    // Get recent activity for golf course
    const [
      { data: recentJobs },
      { data: recentApplications },
      { data: recentMessages }
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('course_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('applications')
        .select(`
          *,
          jobs!inner(title),
          professional_profiles!inner(profile_id, profiles!inner(full_name))
        `)
        .eq('jobs.course_id', userId)
        .order('applied_at', { ascending: false })
        .limit(3),
      supabase
        .from('messages')
        .select(`
          *,
          jobs!inner(title, course_id),
          profiles!inner(full_name, user_type)
        `)
        .eq('jobs.course_id', userId)
        .neq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Recent Jobs
            </CardTitle>
            <CardDescription>
              Your latest job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs?.length ? recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{job.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(job.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No jobs posted yet
                </p>
              )}
              <Link href="/jobs">
                <Button variant="outline" size="sm" className="w-full">
                  View All Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Applications
            </CardTitle>
            <CardDescription>
              Latest applications from professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications?.length ? recentApplications.map((application: any) => (
                <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{application.jobs?.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      by {application.professional_profiles?.profiles?.full_name} • {formatRelativeTime(application.applied_at)}
                    </p>
                  </div>
                  <Badge variant={
                    application.status === 'pending' ? 'default' :
                    application.status === 'accepted' ? 'default' : 'secondary'
                  }>
                    {application.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No applications yet
                </p>
              )}
              <Link href="/applications">
                <Button variant="outline" size="sm" className="w-full">
                  View All Applications
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userType === 'professional') {
    // Get recent activity for professional
    const [
      { data: recentApplications },
      { data: recentJobs }
    ] = await Promise.all([
      supabase
        .from('applications')
        .select(`
          *,
          jobs!inner(title, golf_course_profiles!inner(course_name))
        `)
        .eq('professional_id', userId)
        .order('applied_at', { ascending: false })
        .limit(3),
      supabase
        .from('jobs')
        .select(`
          *,
          golf_course_profiles!inner(course_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              My Applications
            </CardTitle>
            <CardDescription>
              Your recent job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications?.length ? recentApplications.map((application: any) => (
                <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{application.jobs?.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {application.jobs?.golf_course_profiles?.course_name} • {formatRelativeTime(application.applied_at)}
                    </p>
                  </div>
                  <Badge variant={
                    application.status === 'pending' ? 'default' :
                    application.status === 'accepted' ? 'default' : 'secondary'
                  }>
                    {application.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No applications yet
                </p>
              )}
              <Link href="/applications">
                <Button variant="outline" size="sm" className="w-full">
                  View All Applications
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              New Opportunities
            </CardTitle>
            <CardDescription>
              Latest jobs you might be interested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs?.length ? recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{job.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {job.golf_course_profiles?.course_name} • ${job.hourly_rate}/hr
                    </p>
                  </div>
                  <Badge variant="outline">
                    {job.urgency_level}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No new jobs available
                </p>
              )}
              <Link href="/jobs">
                <Button variant="outline" size="sm" className="w-full">
                  Browse All Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
