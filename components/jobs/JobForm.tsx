'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { jobSchema, JobFormData, jobTypeDisplayNames, experienceLevelDisplayNames, urgencyLevelDisplayNames, rateSuggestions, certificationTypes } from '@/lib/validations/jobs'
import { useJobStore, useAutoSave } from '@/lib/stores/jobStore'
import { useCreateJob, useUpdateJob } from '@/lib/hooks/useJobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, MapPinIcon, ClockIcon, DollarSignIcon, AlertTriangleIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/utils/toast'

interface JobFormProps {
  initialData?: Partial<JobFormData>
  jobId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface StepProps {
  form: any
  control: any
  errors: any
  watch: any
  setValue: any
  trigger: any
}

// Step 1: Basic Information
const Step1BasicInfo = ({ form, control, errors, watch, setValue, trigger }: StepProps) => {
  const jobType = watch('job_type')
  const rateSuggestion = jobType ? rateSuggestions[jobType as keyof typeof rateSuggestions] : null

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Job Title *</Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="title"
              placeholder="e.g., Greens Mowing and Maintenance"
              className={cn(errors.title && "border-red-500")}
            />
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="job_type">Job Type *</Label>
        <Controller
          name="job_type"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={cn(errors.job_type && "border-red-500")}>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(jobTypeDisplayNames).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.job_type && (
          <p className="text-sm text-red-500 mt-1">{errors.job_type.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Job Description *</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="description"
              placeholder="Describe the job requirements, tasks, and expectations..."
              className={cn("min-h-[120px]", errors.description && "border-red-500")}
            />
          )}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
          <p className="text-sm text-gray-500 ml-auto">
            {watch('description')?.length || 0}/2000 characters
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="urgency_level">Urgency Level *</Label>
        <Controller
          name="urgency_level"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={cn(errors.urgency_level && "border-red-500")}>
                <SelectValue placeholder="Select urgency level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(urgencyLevelDisplayNames).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.urgency_level && (
          <p className="text-sm text-red-500 mt-1">{errors.urgency_level.message}</p>
        )}
      </div>

      {rateSuggestion && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSignIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Rate Suggestion</span>
          </div>
          <p className="text-sm text-blue-700">
            For {jobTypeDisplayNames[jobType as keyof typeof jobTypeDisplayNames]}, typical rates range from ${rateSuggestion.min}-${rateSuggestion.max}/hour.
            Recommended: ${rateSuggestion.recommended}/hour
          </p>
        </div>
      )}
    </div>
  )
}

// Step 2: Location & Scheduling
const Step2LocationScheduling = ({ form, control, errors, watch, setValue, trigger }: StepProps) => {
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="address">Job Location *</Label>
        <Controller
          name="location.address"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              <Input
                {...field}
                id="address"
                placeholder="Enter job location address"
                className={cn("flex-1", errors.location?.address && "border-red-500")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMapOpen(true)}
              >
                <MapPinIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
        {errors.location?.address && (
          <p className="text-sm text-red-500 mt-1">{errors.location.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitude *</Label>
          <Controller
            name="location.lat"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="lat"
                type="number"
                step="any"
                placeholder="40.7128"
                className={cn(errors.location?.lat && "border-red-500")}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
          {errors.location?.lat && (
            <p className="text-sm text-red-500 mt-1">{errors.location.lat.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lng">Longitude *</Label>
          <Controller
            name="location.lng"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="lng"
                type="number"
                step="any"
                placeholder="-74.0060"
                className={cn(errors.location?.lng && "border-red-500")}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
          {errors.location?.lng && (
            <p className="text-sm text-red-500 mt-1">{errors.location.lng.message}</p>
          )}
        </div>
      </div>

      {/* Google Maps integration placeholder */}
      {isMapOpen && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Google Maps integration would be implemented here for location selection.
            For now, please enter coordinates manually.
          </p>
        </div>
      )}

      <div>
        <Label>Start Date & Time *</Label>
        <div className="flex gap-2 mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                  errors.start_date && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date)
                  if (date) {
                    setValue('start_date', date.toISOString())
                    trigger('start_date')
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <Input
                type="time"
                className="w-32"
                onChange={(e) => {
                  if (startDate && e.target.value) {
                    const [hours, minutes] = e.target.value.split(':')
                    const newDate = new Date(startDate)
                    newDate.setHours(parseInt(hours), parseInt(minutes))
                    field.onChange(newDate.toISOString())
                  }
                }}
              />
            )}
          />
        </div>
        {errors.start_date && (
          <p className="text-sm text-red-500 mt-1">{errors.start_date.message}</p>
        )}
      </div>

      <div>
        <Label>End Date & Time (Optional)</Label>
        <div className="flex gap-2 mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                  errors.end_date && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date)
                  if (date) {
                    setValue('end_date', date.toISOString())
                    trigger('end_date')
                  }
                }}
                disabled={(date) => date < (startDate || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <Input
                type="time"
                className="w-32"
                onChange={(e) => {
                  if (endDate && e.target.value) {
                    const [hours, minutes] = e.target.value.split(':')
                    const newDate = new Date(endDate)
                    newDate.setHours(parseInt(hours), parseInt(minutes))
                    field.onChange(newDate.toISOString())
                  }
                }}
              />
            )}
          />
        </div>
        {errors.end_date && (
          <p className="text-sm text-red-500 mt-1">{errors.end_date.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="estimated_duration">Estimated Duration (hours)</Label>
        <Controller
          name="estimated_duration"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="estimated_duration"
              type="number"
              min="1"
              max="24"
              placeholder="8"
              className={cn(errors.estimated_duration && "border-red-500")}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          )}
        />
        {errors.estimated_duration && (
          <p className="text-sm text-red-500 mt-1">{errors.estimated_duration.message}</p>
        )}
      </div>
    </div>
  )
}

// Step 3: Requirements & Compensation
const Step3RequirementsCompensation = ({ form, control, errors, watch, setValue, trigger }: StepProps) => {
  const jobType = watch('job_type')
  const rateSuggestion = jobType ? rateSuggestions[jobType as keyof typeof rateSuggestions] : null

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="required_experience">Required Experience Level</Label>
        <Controller
          name="required_experience"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={cn(errors.required_experience && "border-red-500")}>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(experienceLevelDisplayNames).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.required_experience && (
          <p className="text-sm text-red-500 mt-1">{errors.required_experience.message}</p>
        )}
      </div>

      <div>
        <Label>Required Certifications</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {certificationTypes.map((cert) => (
            <Controller
              key={cert}
              name="required_certifications"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={cert}
                    checked={field.value?.includes(cert) || false}
                    onCheckedChange={(checked) => {
                      const current = field.value || []
                      if (checked) {
                        field.onChange([...current, cert])
                      } else {
                        field.onChange(current.filter((c: string) => c !== cert))
                      }
                    }}
                  />
                  <Label htmlFor={cert} className="text-sm font-normal">
                    {cert}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
        {errors.required_certifications && (
          <p className="text-sm text-red-500 mt-1">{errors.required_certifications.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="hourly_rate">Hourly Rate ($) *</Label>
        <Controller
          name="hourly_rate"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="hourly_rate"
              type="number"
              min="15"
              max="200"
              step="0.01"
              placeholder="25.00"
              className={cn(errors.hourly_rate && "border-red-500")}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
        {errors.hourly_rate && (
          <p className="text-sm text-red-500 mt-1">{errors.hourly_rate.message}</p>
        )}
        {rateSuggestion && (
          <p className="text-sm text-gray-500 mt-1">
            Suggested range: ${rateSuggestion.min}-${rateSuggestion.max}/hour
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="special_equipment">Special Equipment Needed</Label>
        <Controller
          name="special_equipment"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="special_equipment"
              placeholder="List any special equipment or tools required for this job..."
              className={cn("min-h-[80px]", errors.special_equipment && "border-red-500")}
            />
          )}
        />
        {errors.special_equipment && (
          <p className="text-sm text-red-500 mt-1">{errors.special_equipment.message}</p>
        )}
      </div>
    </div>
  )
}

// Step 4: Review & Publish
const Step4ReviewPublish = ({ form, control, errors, watch, setValue, trigger }: StepProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const watchedData = watch()

  // Update form validation when terms acceptance changes
  useEffect(() => {
    setValue('termsAccepted', termsAccepted)
    trigger('termsAccepted')
  }, [termsAccepted, setValue, trigger])

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Job Preview</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Job Title</h4>
            <p className="text-gray-700">{watchedData.title}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">Job Type</h4>
            <p className="text-gray-700">{jobTypeDisplayNames[watchedData.job_type as keyof typeof jobTypeDisplayNames]}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{watchedData.description}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">Location</h4>
            <p className="text-gray-700">{watchedData.location?.address}</p>
            <p className="text-sm text-gray-500">
              Coordinates: {watchedData.location?.lat}, {watchedData.location?.lng}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Start Date</h4>
              <p className="text-gray-700">
                {watchedData.start_date ? format(new Date(watchedData.start_date), "PPP 'at' p") : 'Not set'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">End Date</h4>
              <p className="text-gray-700">
                {watchedData.end_date ? format(new Date(watchedData.end_date), "PPP 'at' p") : 'Not specified'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Hourly Rate</h4>
              <p className="text-gray-700">${watchedData.hourly_rate}/hour</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Urgency Level</h4>
              <p className="text-gray-700">{urgencyLevelDisplayNames[watchedData.urgency_level as keyof typeof urgencyLevelDisplayNames]}</p>
            </div>
          </div>
          
          {watchedData.required_experience && (
            <div>
              <h4 className="font-medium text-gray-900">Required Experience</h4>
              <p className="text-gray-700">{experienceLevelDisplayNames[watchedData.required_experience as keyof typeof experienceLevelDisplayNames]}</p>
            </div>
          )}
          
          {watchedData.required_certifications?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900">Required Certifications</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {watchedData.required_certifications.map((cert: string) => (
                  <Badge key={cert} variant="secondary">{cert}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {watchedData.special_equipment && (
            <div>
              <h4 className="font-medium text-gray-900">Special Equipment</h4>
              <p className="text-gray-700">{watchedData.special_equipment}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          />
          <Label htmlFor="terms" className="text-sm">
            I agree to the{' '}
            <a href="/terms" className="text-primary hover:underline" target="_blank">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </a>
            . I confirm that all information provided is accurate and I am authorized to post this job.
          </Label>
        </div>
        {!termsAccepted && (
          <p className="text-sm text-red-500 mt-1">You must accept the terms and conditions to continue.</p>
        )}
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">Ready to Post</span>
        </div>
        <p className="text-sm text-green-700">
          Your job posting is ready! Once submitted, it will be visible to qualified professionals in your area.
        </p>
      </div>
    </div>
  )
}

const stepComponents = [Step1BasicInfo, Step2LocationScheduling, Step3RequirementsCompensation, Step4ReviewPublish]
const stepTitles = ['Basic Information', 'Location & Scheduling', 'Requirements & Compensation', 'Review & Publish']
const stepDescriptions = [
  'Provide basic job information and description',
  'Set location and scheduling details',
  'Define requirements and compensation',
  'Review and publish your job posting'
]

export default function JobForm({ initialData, jobId, onSuccess, onCancel }: JobFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  
  const { formState, updateFormData, setFormStep, setFormSubmitting, resetForm } = useJobStore()
  const { startAutoSave, stopAutoSave } = useAutoSave()
  
  const createJobMutation = useCreateJob()
  const updateJobMutation = useUpdateJob()
  
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      job_type: 'general_maintenance',
      location: { lat: 0, lng: 0, address: '' },
      start_date: '',
      hourly_rate: 20,
      required_certifications: [],
      urgency_level: 'normal',
      estimated_duration: undefined,
      special_equipment: '',
      termsAccepted: false,
      ...initialData
    }
  })

  const { control, handleSubmit, watch, setValue, trigger, formState: { errors, isValid } } = form
  const watchedData = watch()

  // Memoize watchedData to prevent infinite loops
  const memoizedWatchedData = useMemo(() => watchedData, [
    watchedData.title,
    watchedData.description,
    watchedData.job_type,
    watchedData.hourly_rate,
    watchedData.location?.address,
    watchedData.location?.lat,
    watchedData.location?.lng,
    watchedData.start_date,
    watchedData.end_date,
    watchedData.required_experience,
    watchedData.urgency_level,
    watchedData.estimated_duration,
    watchedData.special_equipment,
    watchedData.termsAccepted,
    JSON.stringify(watchedData.required_certifications)
  ])

  // Memoize auto-save function to prevent infinite loops
  const memoizedStartAutoSave = useCallback((data: Partial<JobFormData>) => {
    if (formState.autoSaveEnabled && Object.keys(data).length > 0) {
      startAutoSave(data)
    }
  }, [formState.autoSaveEnabled, startAutoSave])

  // Auto-save functionality with memoized data
  useEffect(() => {
    memoizedStartAutoSave(memoizedWatchedData)
    return () => stopAutoSave()
  }, [memoizedWatchedData, memoizedStartAutoSave, stopAutoSave])

  // Update store when form data changes with memoized data
  useEffect(() => {
    updateFormData(memoizedWatchedData)
  }, [memoizedWatchedData, updateFormData])

  // Step validation functions
  const validateStep1 = async () => {
    return await trigger(['title', 'job_type', 'description', 'urgency_level'])
  }

  const validateStep2 = async () => {
    return await trigger(['location.address', 'location.lat', 'location.lng', 'start_date'])
  }

  const validateStep3 = async () => {
    return await trigger(['hourly_rate'])
  }

  const validateStep4 = async () => {
    // Check if terms are accepted
    return await trigger(['termsAccepted'])
  }

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        return await validateStep1()
      case 2:
        return await validateStep2()
      case 3:
        return await validateStep3()
      case 4:
        return await validateStep4()
      default:
        return false
    }
  }

  const nextStep = async () => {
    const isStepValid = await validateCurrentStep()
    if (isStepValid && currentStep < stepComponents.length) {
      setCurrentStep(currentStep + 1)
      setFormStep(currentStep + 1)
    } else {
      toast.error('Please fill in all required fields before proceeding.')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFormStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true)
    setFormSubmitting(true)
    
    try {
      let result
      if (jobId) {
        result = await updateJobMutation.mutateAsync({ id: jobId, data })
      } else {
        result = await createJobMutation.mutateAsync(data)
      }
      
      toast.success('Job posted successfully!')
      resetForm()
      
      // Redirect to job details page
      if (result?.job?.id) {
        router.push(`/jobs/${result.job.id}`)
      } else {
        onSuccess?.()
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      toast.error(error?.message || 'Failed to post job. Please try again.')
    } finally {
      setIsSubmitting(false)
      setFormSubmitting(false)
    }
  }

  const CurrentStepComponent = stepComponents[currentStep - 1]
  const progress = (currentStep / stepComponents.length) * 100

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Post a Job</CardTitle>
            <CardDescription>{stepDescriptions[currentStep - 1]}</CardDescription>
          </div>
          <Badge variant="outline">Step {currentStep} of {stepComponents.length}</Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CurrentStepComponent
            form={form}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
          />
          
          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              
              {currentStep < stepComponents.length ? (
                <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isValid}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}