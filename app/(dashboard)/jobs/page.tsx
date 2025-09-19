'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import MyJobsPage from '@/components/jobs/MyJobsPage'
import BrowseJobsPage from '@/components/jobs/BrowseJobsPage'

export default function JobsPage() {
  const { profile } = useAuth()
  
  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Golf courses see their posted jobs
  if (profile.user_type === 'golf_course') {
    return <MyJobsPage />
  }
  
  // Professionals see job browsing/discovery
  if (profile.user_type === 'professional') {
    return <BrowseJobsPage />
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  )
}