"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ApplicationList } from '@/components/applications/ApplicationList'
import { useApplications, useUpdateApplication } from '@/lib/hooks/useJobs'
import { useAuthStore } from '@/lib/stores/authStore'

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { data: applications, isLoading, error } = useApplications(undefined, user?.id)
  const updateApplication = useUpdateApplication()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      console.log('🔍 Frontend: Accepting application:', applicationId)
      
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'accepted_by_course' 
        })
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Success:', data)
      
      // Refresh the page to show updated data
      window.location.reload()
      
    } catch (error) {
      console.error('💥 Frontend error accepting application:', error)
      alert(`Failed to accept application: ${error.message}`)
    }
  }

  const handleAcceptJob = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to accept job')
      }

      // Refresh the applications list
      window.location.reload()
    } catch (error) {
      console.error('Failed to accept job:', error)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        status: 'rejected'
      })
    } catch (error) {
      console.error('Failed to reject application:', error)
    }
  }

  const handleViewApplicationDetails = (applicationId: string) => {
    router.push(`/applications/${applicationId}`)
  }

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      // Delete the application
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to withdraw application')
      }

      // Refresh the applications list
      window.location.reload()
    } catch (error) {
      console.error('Failed to withdraw application:', error)
    }
  }

  const viewMode = profile?.user_type === 'golf_course' ? 'golf_course' : 'professional'
  const pageTitle = viewMode === 'golf_course' ? 'Job Applications' : 'My Applications'
  const pageDescription = viewMode === 'golf_course' 
    ? 'Review and manage applications for your job postings'
    : 'Track your job applications and their status'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
        </div>

        {/* Applications List or Empty State */}
        {applications && applications.length === 0 && !isLoading && !error ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No applications yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {viewMode === 'professional' 
                      ? "You haven't applied to any jobs yet. Browse available jobs to get started and showcase your skills."
                      : "No one has applied to your jobs yet. Make sure your job postings are visible, detailed, and attractive to professionals."
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {viewMode === 'professional' ? (
                    <Link href="/jobs">
                      <Button>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Browse Available Jobs
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/jobs/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Post a New Job
                      </Button>
                    </Link>
                  )}
                  {viewMode === 'golf_course' && (
                    <Link href="/jobs">
                      <Button variant="outline">
                        View My Jobs
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ApplicationList
            applications={applications || []}
            viewMode={viewMode}
            isLoading={isLoading}
            error={error?.message}
            onAccept={viewMode === 'golf_course' ? handleAcceptApplication : undefined}
            onReject={viewMode === 'golf_course' ? handleRejectApplication : undefined}
            onViewDetails={handleViewApplicationDetails}
            onWithdraw={viewMode === 'professional' ? handleWithdrawApplication : undefined}
            onAcceptJob={viewMode === 'professional' ? handleAcceptJob : undefined}
            actionLoading={updateApplication.isPending}
          />
        )}
      </div>
    </div>
  )
}
