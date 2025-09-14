"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useUIStore } from '@/lib/stores/uiStore'
import type { JobFilters, CreateJobInput, CreateApplicationInput } from '@/lib/validations/jobs'

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      // Map filters to API parameters
      if (filters?.job_type) params.append('job_type', filters.job_type)
      if (filters?.min_rate) params.append('min_rate', filters.min_rate.toString())
      if (filters?.max_rate) params.append('max_rate', filters.max_rate.toString())
      if (filters?.max_distance) params.append('max_distance', filters.max_distance.toString())
      if (filters?.location) params.append('location', filters.location)
      if (filters?.urgency_level) params.append('urgency_level', filters.urgency_level)
      if (filters?.required_experience) params.append('required_experience', filters.required_experience)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.status) params.append('status', filters.status)

      const response = await fetch(`/api/jobs?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch jobs')
      }
      
      const jobs = await response.json()
      // Ensure we always return an array
      return Array.isArray(jobs) ? jobs : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  
  return useMutation({
    mutationFn: async (data: CreateJobInput) => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create job')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      addToast({
        variant: 'success',
        title: 'Job posted successfully!',
        description: 'Your job posting is now live and professionals can apply.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to post job',
        description: error.message,
      })
    },
  })
}

export function useJobApplication() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  
  return useMutation({
    mutationFn: async (data: CreateApplicationInput) => {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      addToast({
        variant: 'success',
        title: 'Application submitted!',
        description: 'Your application has been sent to the golf course.',
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to submit application',
        description: error.message,
      })
    },
  })
}

export function useApplications() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/applications')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch applications')
      }
      const result = await response.json()
      // API returns { data: [...] }, so extract the data array
      return result.data || []
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update application')
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      addToast({
        variant: 'success',
        title: `Application ${variables.status}`,
        description: `The application has been ${variables.status}.`,
      })
    },
    onError: (error) => {
      addToast({
        variant: 'destructive',
        title: 'Failed to update application',
        description: error.message,
      })
    },
  })
}
