"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { useAuthStore } from '@/lib/stores/authStore'
import { useProfile } from '@/lib/hooks/useProfile'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Edit } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile: authProfile } = useAuthStore()
  const { data: profileData, isLoading, error } = useProfile()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Failed to load profile</h3>
                <p className="text-muted-foreground">
                  There was an error loading your profile information.
                </p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, golfCourseProfile, professionalProfile, completionProgress } = profileData || {}

  const handleEditProfile = () => {
    router.push('/profile/edit')
  }

  // Calculate profile completeness
  const isProfileComplete = completionProgress >= 80

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile information and settings
            </p>
          </div>
          <Button onClick={handleEditProfile} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
        </div>

        {/* Profile Completion Alert */}
        {!isProfileComplete && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your profile is {completionProgress}% complete. Complete your profile to appear in more search results and receive better job matches.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900"
                    onClick={handleEditProfile}
                  >
                    Complete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        {profile && (
          <ProfileCard
            profile={profile}
            golfCourseProfile={golfCourseProfile}
            professionalProfile={professionalProfile}
            completionProgress={completionProgress}
            isOwner={true}
            onEdit={handleEditProfile}
          />
        )}

        {/* Quick Stats for Professionals */}
        {profile?.user_type === 'professional' && professionalProfile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {professionalProfile.total_jobs || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Jobs Completed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {professionalProfile.rating > 0 ? professionalProfile.rating.toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${professionalProfile.hourly_rate || 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity - Placeholder for future implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Recent activity will appear here once you start using the platform.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
