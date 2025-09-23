import { createClient } from '@/lib/supabase/server'
import { ActiveJobsList } from '@/components/jobs/ActiveJobsList'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'

export default async function ActiveJobsPage() {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch active jobs
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/active`, {
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    }
  })
  
  const activeJobs = response.ok ? await response.json() : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Active Jobs</h1>
        <Badge variant="secondary">{activeJobs.length} active</Badge>
      </div>
      
      <ActiveJobsList initialJobs={activeJobs} />
    </div>
  )
}
