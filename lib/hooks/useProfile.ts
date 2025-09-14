"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useUIStore } from '@/lib/stores/uiStore'
import type { 
  ProfileUpdateInput,
  GolfCourseProfileInput,
  ProfessionalProfileInput
} from '@/lib/validations/profile'

export function useProfile() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null

      const response = await fetch('/api/profiles')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      return response.json()
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: ProfileUpdateInput) => {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      addToast({
        variant: 'success',
        title: 'Profile updated!',
        description: 'Your profile has been successfully updated.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to update profile',
        description: error.message,
      })
    },
  })
}

export function useUpdateGolfCourseProfile() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: GolfCourseProfileInput) => {
      const response = await fetch('/api/profiles/golf-course', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update golf course profile')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      addToast({
        variant: 'success',
        title: 'Golf course profile updated!',
        description: 'Your golf course information has been successfully updated.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to update golf course profile',
        description: error.message,
      })
    },
  })
}

export function useUpdateProfessionalProfile() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: ProfessionalProfileInput) => {
      const response = await fetch('/api/profiles/professional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update professional profile')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      addToast({
        variant: 'success',
        title: 'Professional profile updated!',
        description: 'Your professional information has been successfully updated.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to update professional profile',
        description: error.message,
      })
    },
  })
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/profiles/upload-image', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      addToast({
        variant: 'success',
        title: 'Profile image updated!',
        description: 'Your profile image has been successfully uploaded.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to upload image',
        description: error.message,
      })
    },
  })
}

export function useCertifications() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['certifications', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/profiles/certifications')
      if (!response.ok) {
        throw new Error('Failed to fetch certifications')
      }
      return response.json()
    },
    enabled: !!user,
  })
}

export function useCreateCertification() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: {
      certification_type: string
      issuing_organization: string
      issue_date?: string
      expiry_date?: string
      document_url?: string
    }) => {
      const response = await fetch('/api/profiles/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add certification')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', user?.id] })
      addToast({
        variant: 'success',
        title: 'Certification added!',
        description: 'Your certification has been successfully added.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to add certification',
        description: error.message,
      })
    },
  })
}
