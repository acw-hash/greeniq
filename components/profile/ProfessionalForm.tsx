"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  professionalProfileSchema, 
  SPECIALIZATIONS,
  EQUIPMENT_SKILLS,
  type ProfessionalProfileInput 
} from '@/lib/validations/profile'

interface ProfessionalFormProps {
  initialData?: Partial<ProfessionalProfileInput>
  onSubmit: (data: ProfessionalProfileInput) => void
  isLoading?: boolean
}

export function ProfessionalForm({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}: ProfessionalFormProps) {
  const form = useForm<ProfessionalProfileInput>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: {
      bio: initialData?.bio || '',
      experience_level: initialData?.experience_level || undefined,
      specializations: initialData?.specializations || [],
      equipment_skills: initialData?.equipment_skills || [],
      hourly_rate: initialData?.hourly_rate || undefined,
      travel_radius: initialData?.travel_radius || 25,
    },
  })

  const handleSubmit = (data: ProfessionalProfileInput) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell golf courses about your experience, approach to golf course maintenance, and what makes you stand out..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share your background and expertise to help golf courses understand your qualifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Level *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="expert">Expert (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="specializations"
              render={() => (
                <FormItem>
                  <FormDescription className="mb-4">
                    Select your areas of expertise (at least one required)
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3">
                    {SPECIALIZATIONS.map((specialization: string) => (
                      <FormField
                        key={specialization}
                        control={form.control}
                        name="specializations"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={specialization}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(specialization)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, specialization])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== specialization
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {specialization.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

        {/* Equipment Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="equipment_skills"
              render={() => (
                <FormItem>
                  <FormDescription className="mb-4">
                    Select equipment you're experienced with
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3">
                    {EQUIPMENT_SKILLS.map((skill: string) => (
                      <FormField
                        key={skill}
                        control={form.control}
                        name="equipment_skills"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={skill}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(skill)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, skill])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== skill
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

        {/* Rates and Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Rates & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="25"
                        min="10"
                        max="200"
                        className="pl-7"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your standard hourly rate. You can negotiate rates for specific jobs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="travel_radius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Radius (miles)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="25"
                        min="1"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 25)}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        miles
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Maximum distance you're willing to travel for jobs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Professional Profile'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
