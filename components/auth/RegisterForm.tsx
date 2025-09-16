"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  golfCourseSignupSchema, 
  professionalSignupSchema,
  type GolfCourseSignupInput, 
  type ProfessionalSignupInput 
} from '@/lib/validations/auth'
import { useUIStore } from '@/lib/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

interface RegisterFormProps {
  userType: 'golf_course' | 'professional'
}

export function RegisterForm({ userType }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const router = useRouter()
  const { addToast } = useUIStore()

  const schema = userType === 'golf_course' ? golfCourseSignupSchema : professionalSignupSchema
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GolfCourseSignupInput | ProfessionalSignupInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_type: userType,
      ...(userType === 'professional' && { 
        specializations: [],
        travel_radius: 25 
      })
    }
  })

  const specializations = [
    'greenskeeping',
    'equipment_operation',
    'irrigation_maintenance', 
    'landscaping',
    'course_setup',
    'general_maintenance'
  ]

  const onSubmit = async (data: GolfCourseSignupInput | ProfessionalSignupInput) => {
    setIsLoading(true)

    try {
      console.log('📤 Submitting registration data...', { 
        email: data.email, 
        user_type: data.user_type,
        full_name: data.full_name 
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Registration failed:', result)
        addToast({
          variant: 'destructive',
          title: 'Registration failed',
          description: result.error || result.message || 'Failed to create account',
        })
        return
      }

      console.log('✅ Registration successful:', result)
      
      addToast({
        variant: 'success',
        title: 'Registration successful!',
        description: result.message || 'Please check your email to verify your account.',
      })

      router.push('/login')
    } catch (error: any) {
      console.error('💥 Registration error:', error)
      addToast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpecializationToggle = (specialization: string) => {
    const newSpecializations = selectedSpecializations.includes(specialization)
      ? selectedSpecializations.filter(s => s !== specialization)
      : [...selectedSpecializations, specialization]
    
    setSelectedSpecializations(newSpecializations)
    setValue('specializations' as any, newSpecializations)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/register')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-2xl font-bold">
              {userType === 'golf_course' ? 'Golf Course Registration' : 'Professional Registration'}
            </CardTitle>
            <CardDescription>
              {userType === 'golf_course' 
                ? 'Create your golf course account to start posting jobs'
                : 'Create your professional account to find work opportunities'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Your full name"
                {...register('full_name')}
                disabled={isLoading}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Role-specific fields */}
          {userType === 'golf_course' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course_name">Course Name</Label>
                  <Input
                    id="course_name"
                    placeholder="Your golf course name"
                    {...register('course_name')}
                    disabled={isLoading}
                  />
                  {(errors as any).course_name && (
                    <p className="text-sm text-destructive">{(errors as any).course_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_type">Course Type</Label>
                  <Select 
                    onValueChange={(value: any) => setValue('course_type', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                    </SelectContent>
                  </Select>
                  {(errors as any).course_type && (
                    <p className="text-sm text-destructive">{(errors as any).course_type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Complete course address"
                  {...register('address')}
                  disabled={isLoading}
                />
                {(errors as any).address && (
                  <p className="text-sm text-destructive">{(errors as any).address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of your course"
                  {...register('description')}
                  disabled={isLoading}
                />
                {(errors as any).description && (
                  <p className="text-sm text-destructive">{(errors as any).description.message}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select 
                    onValueChange={(value: any) => setValue('experience_level', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="expert">Expert (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                  {(errors as any).experience_level && (
                    <p className="text-sm text-destructive">{(errors as any).experience_level.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate (Optional)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    placeholder="25"
                    step="0.01"
                    {...register('hourly_rate', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {(errors as any).hourly_rate && (
                    <p className="text-sm text-destructive">{(errors as any).hourly_rate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specializations</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specializations.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={spec}
                        checked={selectedSpecializations.includes(spec)}
                        onCheckedChange={() => handleSpecializationToggle(spec)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={spec} className="text-sm capitalize">
                        {spec.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
                {(errors as any).specializations && (
                  <p className="text-sm text-destructive">{(errors as any).specializations.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="travel_radius">Travel Radius (miles)</Label>
                <Input
                  id="travel_radius"
                  type="number"
                  placeholder="25"
                  {...register('travel_radius', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {(errors as any).travel_radius && (
                  <p className="text-sm text-destructive">{(errors as any).travel_radius.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Input
                  id="bio"
                  placeholder="Tell us about your experience and expertise"
                  {...register('bio')}
                  disabled={isLoading}
                />
                {(errors as any).bio && (
                  <p className="text-sm text-destructive">{(errors as any).bio.message}</p>
                )}
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
