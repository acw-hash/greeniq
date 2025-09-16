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
  golfCourseProfileSchema, 
  COURSE_FACILITIES,
  CERTIFICATIONS,
  type GolfCourseProfileInput 
} from '@/lib/validations/profile'

interface GolfCourseFormProps {
  initialData?: Partial<GolfCourseProfileInput>
  onSubmit: (data: GolfCourseProfileInput) => void
  isLoading?: boolean
}

export function GolfCourseForm({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}: GolfCourseFormProps) {
  const form = useForm<GolfCourseProfileInput>({
    resolver: zodResolver(golfCourseProfileSchema),
    defaultValues: {
      course_name: initialData?.course_name || '',
      course_type: initialData?.course_type || undefined,
      address: initialData?.address || '',
      description: initialData?.description || '',
      facilities: {
        total_holes: initialData?.facilities?.total_holes || undefined,
        driving_range: initialData?.facilities?.driving_range || false,
        putting_green: initialData?.facilities?.putting_green || false,
        pro_shop: initialData?.facilities?.pro_shop || false,
        restaurant: initialData?.facilities?.restaurant || false,
        cart_rental: initialData?.facilities?.cart_rental || false,
        club_rental: initialData?.facilities?.club_rental || false,
        lessons_available: initialData?.facilities?.lessons_available || false,
        irrigation_system: initialData?.facilities?.irrigation_system || undefined,
        maintenance_equipment: initialData?.facilities?.maintenance_equipment || [],
      },
      preferred_qualifications: initialData?.preferred_qualifications || [],
    },
  })

  const facilitiesList = [
    { key: 'driving_range', label: 'Driving Range' },
    { key: 'putting_green', label: 'Putting Green' },
    { key: 'pro_shop', label: 'Pro Shop' },
    { key: 'restaurant', label: 'Restaurant/Clubhouse' },
    { key: 'cart_rental', label: 'Cart Rental' },
    { key: 'club_rental', label: 'Club Rental' },
    { key: 'lessons_available', label: 'Golf Lessons Available' },
  ] as const

  const handleSubmit = (data: GolfCourseProfileInput) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="course_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pebble Beach Golf Links" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full course address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your golf course, its features, and what makes it special..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help professionals understand your course and maintenance needs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Course Details */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="facilities.total_holes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Holes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="18"
                      min="1"
                      max="72"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facilities.irrigation_system"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Irrigation System</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select irrigation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="smart">Smart/Computer Controlled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Facilities Checkboxes */}
            <div className="space-y-3">
              <FormLabel>Course Facilities</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {facilitiesList.map((facility: any) => (
                  <FormField
                    key={facility.key}
                    control={form.control}
                    name={`facilities.${facility.key}` as any}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            {facility.label}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle>Preferred Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="preferred_qualifications"
              render={() => (
                <FormItem>
                  <FormDescription className="mb-4">
                    Select certifications and qualifications you prefer when hiring professionals
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3">
                    {CERTIFICATIONS.map((cert: string) => (
                      <FormField
                        key={cert}
                        control={form.control}
                        name="preferred_qualifications"
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Golf Course Profile'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
