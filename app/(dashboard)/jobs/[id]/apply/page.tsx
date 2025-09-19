'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJob, useCreateApplication } from '@/lib/hooks/useJobs'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ApplyToJobPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { data: job, isLoading, error } = useJob(params.id)
  const createApplication = useCreateApplication()
  
  const [formData, setFormData] = useState({
    message: '',
    proposed_rate: job?.hourly_rate || 0
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Debug logging
  console.log('ApplyToJobPage - Job ID:', params.id)
  console.log('ApplyToJobPage - Job data:', job)
  console.log('ApplyToJobPage - Loading:', isLoading)
  console.log('ApplyToJobPage - Error:', error)
  console.log('ApplyToJobPage - User:', user)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.message.trim()) {
      newErrors.message = 'Please include a message with your application'
    }
    if (formData.message.length < 20) {
      newErrors.message = 'Message must be at least 20 characters'
    }
    if (formData.proposed_rate < 15 || formData.proposed_rate > 200) {
      newErrors.proposed_rate = 'Rate must be between $15-$200/hour'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await createApplication.mutateAsync({
        job_id: params.id,
        professional_id: user!.id,
        message: formData.message,
        proposed_rate: formData.proposed_rate
      })
      
      router.push(`/jobs/${params.id}?applied=true`)
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to submit application' })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div>Loading job details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div>Error loading job: {error.message}</div>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <div>Job not found. Job ID: {params.id}</div>
        <div className="mt-4">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {job.profiles?.golf_course_profiles?.course_name}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>${job.hourly_rate}/hour</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Starts {new Date(job.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>2.5 miles away</span>
                </div>
              </div>
              
              {job.required_certifications?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Required Certifications:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.required_certifications.map((cert: string) => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        {cert.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Apply for this Job</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="message">Cover Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell the golf course why you're perfect for this job. Include your relevant experience, certifications, and availability..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="min-h-[120px] mt-1"
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600 mt-1">{errors.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="rate">Your Hourly Rate *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rate"
                      type="number"
                      min="15"
                      max="200"
                      step="0.50"
                      value={formData.proposed_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposed_rate: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                  {errors.proposed_rate && (
                    <p className="text-sm text-red-600 mt-1">{errors.proposed_rate}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Job posted rate: ${job.hourly_rate}/hour
                  </p>
                </div>

                {errors.submit && (
                  <Alert>
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createApplication.isPending}
                  >
                    {createApplication.isPending ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
