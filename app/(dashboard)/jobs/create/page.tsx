'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import JobForm from '@/components/jobs/JobForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  LightbulbIcon,
  ClockIcon,
  DollarSignIcon
} from 'lucide-react'
import { useJobStore } from '@/lib/stores/jobStore'

export default function CreateJobPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resetForm } = useJobStore()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            golf_course_profiles (*)
          `)
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          setError('Profile not found. Please complete your profile first.')
          return
        }

        if (profile.user_type !== 'golf_course') {
          setError('Only golf courses can create jobs.')
          return
        }

        setProfile(profile)
      } catch (err) {
        console.error('Error checking user:', err)
        setError('An error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleSuccess = () => {
    resetForm()
    router.push('/jobs')
  }

  const handleCancel = () => {
    resetForm()
    router.back()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Post a New Job</h1>
            <p className="text-gray-600">
              Create a job posting to find qualified professionals for your golf course
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2">
            <JobForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>

          {/* Sidebar with tips and info */}
          <div className="space-y-6">
            {/* Course info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Course</CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.golf_course_profiles && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">{profile.golf_course_profiles.course_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {profile.golf_course_profiles.course_type} Course
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.golf_course_profiles.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LightbulbIcon className="h-5 w-5" />
                  Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Be Specific</p>
                      <p className="text-xs text-gray-600">
                        Include detailed job requirements and expectations
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Set Competitive Rates</p>
                      <p className="text-xs text-gray-600">
                        Research local market rates to attract quality professionals
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Include Certifications</p>
                      <p className="text-xs text-gray-600">
                        Specify required certifications to find qualified candidates
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Set Clear Timeline</p>
                      <p className="text-xs text-gray-600">
                        Provide start and end dates to help professionals plan
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSignIcon className="h-5 w-5" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Rate</span>
                  <span className="text-sm font-semibold">$28/hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-semibold">2-4 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Professionals</span>
                  <span className="text-sm font-semibold">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Job Completion Rate</span>
                  <span className="text-sm font-semibold">94%</span>
                </div>
              </CardContent>
            </Card>

            {/* Process timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Job Posted</p>
                    <p className="text-xs text-gray-600">
                      Your job goes live and professionals can see it
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Applications Received</p>
                    <p className="text-xs text-gray-600">
                      Qualified professionals apply with proposals
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Review & Select</p>
                    <p className="text-xs text-gray-600">
                      Review applications and select the best candidate
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Job Completed</p>
                    <p className="text-xs text-gray-600">
                      Work is completed and payment is processed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}