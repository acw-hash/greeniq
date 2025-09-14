"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { FileUpload } from './FileUpload'
import { GolfCourseForm } from './GolfCourseForm'
import { ProfessionalForm } from './ProfessionalForm'
import { useUpdateProfile, useUpdateGolfCourseProfile, useUpdateProfessionalProfile, useUploadProfileImage } from '@/lib/hooks/useProfile'
import { useAuthStore } from '@/lib/stores/authStore'
import { 
  profileUpdateSchema, 
  type ProfileUpdateInput,
  type GolfCourseProfileInput,
  type ProfessionalProfileInput
} from '@/lib/validations/profile'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type GolfCourseProfile = Database['public']['Tables']['golf_course_profiles']['Row']
type ProfessionalProfile = Database['public']['Tables']['professional_profiles']['Row']

interface ProfileFormProps {
  profile: Profile
  golfCourseProfile?: GolfCourseProfile | null
  professionalProfile?: ProfessionalProfile | null
  onSuccess?: () => void
}

export function ProfileForm({ 
  profile, 
  golfCourseProfile, 
  professionalProfile,
  onSuccess
}: ProfileFormProps) {
  const [profileImage, setProfileImage] = useState<File | string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  const updateProfile = useUpdateProfile()
  const updateGolfCourseProfile = useUpdateGolfCourseProfile()
  const updateProfessionalProfile = useUpdateProfessionalProfile()
  const uploadImage = useUploadProfileImage()

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: undefined, // Will be handled by geocoding
    },
  })

  const handleBasicProfileSubmit = async (data: ProfileUpdateInput) => {
    try {
      await updateProfile.mutateAsync(data)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleGolfCourseSubmit = async (data: GolfCourseProfileInput) => {
    try {
      await updateGolfCourseProfile.mutateAsync(data)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to update golf course profile:', error)
    }
  }

  const handleProfessionalSubmit = async (data: ProfessionalProfileInput) => {
    try {
      await updateProfessionalProfile.mutateAsync(data)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to update professional profile:', error)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setProfileImage(file)
      await uploadImage.mutateAsync(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  const handleImageRemove = () => {
    setProfileImage(null)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">
            {profile.user_type === 'golf_course' ? 'Course Details' : 'Professional Details'}
          </TabsTrigger>
          <TabsTrigger value="media">Photos & Files</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleBasicProfileSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your contact phone number for job communications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? 'Saving...' : 'Save Basic Info'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role-specific Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {profile.user_type === 'golf_course' ? (
            <GolfCourseForm
              initialData={golfCourseProfile || undefined}
              onSubmit={handleGolfCourseSubmit}
              isLoading={updateGolfCourseProfile.isPending}
            />
          ) : (
            <ProfessionalForm
              initialData={professionalProfile || undefined}
              onSubmit={handleProfessionalSubmit}
              isLoading={updateProfessionalProfile.isPending}
            />
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleImageUpload}
                onFileRemove={handleImageRemove}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                maxSize={5 * 1024 * 1024} // 5MB
                value={profileImage}
                disabled={uploadImage.isPending}
              />
            </CardContent>
          </Card>

          {profile.user_type === 'professional' && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload certificates, licenses, and other professional documents to verify your qualifications.
                  </p>
                  <FileUpload
                    onFileSelect={(file) => {
                      // Handle certification upload
                      console.log('Certificate uploaded:', file.name)
                    }}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'image/*': ['.png', '.jpg', '.jpeg']
                    }}
                    maxSize={10 * 1024 * 1024} // 10MB
                    multiple={true}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
