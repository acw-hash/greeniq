import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

interface DashboardStatsProps {
  userType?: string
  userId: string
}

export async function DashboardStats({ userType, userId }: DashboardStatsProps) {
  const supabase = await createClient()
  
  if (userType === 'golf_course') {
    // Get golf course stats
    const [
      { count: totalJobs },
      { count: activeJobs },
      { count: totalApplications },
      { data: recentJobs }
    ] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('course_id', userId),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('course_id', userId).eq('status', 'open'),
      supabase.from('jobs').select('applications(*)', { count: 'exact', head: true }).eq('course_id', userId),
      supabase.from('jobs').select('*').eq('course_id', userId).order('created_at', { ascending: false }).limit(5)
    ])

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime job postings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              From qualified professionals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Jobs receiving applications
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userType === 'professional') {
    // Get professional stats
    const [
      { count: totalApplications },
      { count: acceptedApplications },
      { count: completedJobs },
      { data: professionalProfile }
    ] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('professional_id', userId),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('professional_id', userId).eq('status', 'accepted'),
      supabase.from('applications').select('jobs!inner(*)', { count: 'exact', head: true }).eq('professional_id', userId).eq('jobs.status', 'completed'),
      supabase.from('professional_profiles').select('*').eq('profile_id', userId).single()
    ])

    const successRate = totalApplications ? Math.round((acceptedApplications || 0) / totalApplications * 100) : 0

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total applications submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Applications accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Badge variant="secondary" className="text-xs">
              ⭐ {professionalProfile?.rating?.toFixed(1) || '0.0'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professionalProfile?.total_jobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Reviews received
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
