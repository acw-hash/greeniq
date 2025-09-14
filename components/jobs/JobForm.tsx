"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, MapPin, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  createJobSchema,
  JOB_TYPES,
  URGENCY_LEVELS,
  EXPERIENCE_LEVELS,
  CERTIFICATIONS,
  type CreateJobInput 
} from '@/lib/validations/jobs'
import { cn } from '@/lib/utils/cn'

interface JobFormProps {
  initialData?: Partial<CreateJobInput>
  onSubmit: (data: CreateJobInput) => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function JobForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  mode = 'create'
}: JobFormProps) {
  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      job_type: initialData?.job_type || undefined,
      location: initialData?.location || {
        lat: 0,
        lng: 0,
        address: ''
      },
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      hourly_rate: initialData?.hourly_rate || undefined,
      required_certifications: initialData?.required_certifications || [],
      required_experience: initialData?.required_experience || undefined,
      urgency_level: initialData?.urgency_level || 'normal',
    },
  })

  const handleSubmit = (data: CreateJobInput) => {
    onSubmit(data)
  }

  const jobTypeEntries = Object.entries(JOB_TYPES)
  const urgencyEntries = Object.entries(URGENCY_LEVELS)
  const experienceEntries = Object.entries(EXPERIENCE_LEVELS)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Greenskeeper for Weekend Tournament Prep"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Clear, descriptive title that explains what needs to be done
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobTypeEntries.map(([value, description]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <div className="font-medium">
                              {value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work that needs to be done, any specific requirements, and what you expect from the professional..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include specific tasks, tools needed, and any special requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {urgencyEntries.map(([value, description]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <div className="font-medium capitalize">
                              {value}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location and Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="location.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Location *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter the job location address"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Specific location where the work will be performed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                          disabled={(date) => {
                            const startDate = form.getValues('start_date')
                            return date < new Date() || (startDate && date <= new Date(startDate))
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave blank for single-day jobs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements and Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements & Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (USD) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="25"
                        min="10"
                        max="200"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your budget for this job per hour
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="required_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Experience Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select minimum experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No specific requirement</SelectItem>
                      {experienceEntries.map(([value, description]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <div className="font-medium capitalize">
                              {value} Level
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="required_certifications"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Required Certifications</FormLabel>
                    <FormDescription>
                      Select any certifications required for this job
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {CERTIFICATIONS.map((cert) => (
                      <FormField
                        key={cert}
                        control={form.control}
                        name="required_certifications"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={cert}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(cert)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, cert])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== cert
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {cert.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? 'Posting...' : mode === 'edit' ? 'Update Job' : 'Post Job'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
