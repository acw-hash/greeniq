import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useJobStore, Job } from '@/lib/stores/jobStore'
import { JobFormData, JobSearchData } from '@/lib/validations/jobs'
import { toast } from '@/lib/utils/toast'
import { createClient } from '@/lib/supabase/client'

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobSearchData) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  myJobs: () => [...jobKeys.all, 'my-jobs'] as const,
  search: (filters: JobSearchData) => [...jobKeys.all, 'search', filters] as const,
  applications: () => [...jobKeys.all, 'applications'] as const,
  application: (jobId?: string) => [...jobKeys.applications(), jobId] as const
}

// API functions
const fetchJobs = async (filters: JobSearchData): Promise<{ jobs: Job[]; pagination: any }> => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'location' && typeof value === 'object' && !Array.isArray(value)) {
        params.append('lat', value.lat.toString())
        params.append('lng', value.lng.toString())
        params.append('address', value.address)
      } else if (Array.isArray(value)) {
        params.append(key, value.join(','))
      } else {
        params.append(key, value.toString())
      }
    }
  })

  const response = await fetch(`/api/jobs?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch jobs')
  }
  return response.json()
}

const fetchJob = async (id: string): Promise<{ job: Job }> => {
  const response = await fetch(`/api/jobs/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch job')
  }
  return response.json()
}

const searchJobs = async (filters: JobSearchData): Promise<{ jobs: Job[]; pagination: any; stats: any }> => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'location' && typeof value === 'object' && !Array.isArray(value)) {
        params.append('lat', value.lat.toString())
        params.append('lng', value.lng.toString())
        params.append('address', value.address)
      } else if (Array.isArray(value)) {
        params.append(key, value.join(','))
      } else {
        params.append(key, value.toString())
      }
    }
  })

  const response = await fetch(`/api/jobs/search?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to search jobs')
  }
  return response.json()
}

const createJob = async (data: JobFormData): Promise<{ job: Job }> => {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create job')
  }
  
  return response.json()
}

const updateJob = async ({ id, data }: { id: string; data: Partial<JobFormData> }): Promise<{ job: Job }> => {
  const response = await fetch(`/api/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update job')
  }
  
  return response.json()
}

const deleteJob = async (id: string): Promise<void> => {
  const response = await fetch(`/api/jobs/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete job')
  }
}

// Hooks
export const useJobs = (filters: JobSearchData & { course_id?: string }) => {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => fetchJobs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useJob = (id: string) => {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: async () => {
      console.log('Fetching job with ID:', id)
      const response = await fetch(`/api/jobs/${id}`)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Job fetch error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch job')
      }
      const data = await response.json()
      console.log('Job data received:', data)
      return data.job
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1
  })
}

export const useJobSearch = (filters: JobSearchData) => {
  return useQuery({
    queryKey: jobKeys.search(filters),
    queryFn: () => searchJobs(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
  })
}

export const useMyJobs = () => {
  const { searchFilters } = useJobStore()
  
  // Memoize the search filters to prevent infinite loops
  const memoizedFilters = useMemo(() => ({
    ...searchFilters,
    status: 'open' as const,
    page: 1,
    limit: 20
  }), [
    searchFilters.search,
    searchFilters.job_type,
    searchFilters.min_rate,
    searchFilters.max_rate,
    searchFilters.radius,
    searchFilters.urgency_level,
    searchFilters.required_experience,
    JSON.stringify(searchFilters.location),
    JSON.stringify(searchFilters.required_certifications)
  ])
  
  return useQuery({
    queryKey: jobKeys.list(memoizedFilters),
    queryFn: () => fetchJobs(memoizedFilters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export const useCreateJob = () => {
  const queryClient = useQueryClient()
  const { addJob, setCurrentJob, resetForm } = useJobStore()
  
  return useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() })
      
      // Update store
      addJob(data.job)
      setCurrentJob(data.job)
      resetForm()
      
      toast.success('Job created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient()
  const { updateJob: updateJobStore } = useJobStore()
  
  return useMutation({
    mutationFn: updateJob,
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() })
      
      // Update store
      updateJobStore(variables.id, data.job)
      
      toast.success('Job updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  const { removeJob, setCurrentJob } = useJobStore()
  
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: (_, id) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() })
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) })
      
      // Update store
      removeJob(id)
      setCurrentJob(null)
      
      toast.success('Job deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Optimistic updates for better UX
export const useOptimisticJobUpdate = () => {
  const queryClient = useQueryClient()
  const { updateJob: updateJobStore } = useJobStore()
  
  const optimisticUpdate = (id: string, updates: Partial<Job>) => {
    // Update store immediately
    updateJobStore(id, updates)
    
    // Update cache optimistically
    queryClient.setQueryData(jobKeys.detail(id), (old: any) => {
      if (old) {
        return { ...old, job: { ...old.job, ...updates } }
      }
      return old
    })
    
    queryClient.setQueryData(jobKeys.lists(), (old: any) => {
      if (old) {
        return {
          ...old,
          jobs: old.jobs.map((job: Job) => 
            job.id === id ? { ...job, ...updates } : job
          )
        }
      }
      return old
    })
  }
  
  return { optimisticUpdate }
}

// Prefetch utilities
export const usePrefetchJob = () => {
  const queryClient = useQueryClient()
  
  const prefetchJob = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: jobKeys.detail(id),
      queryFn: () => fetchJob(id),
      staleTime: 5 * 60 * 1000,
    })
  }
  
  return { prefetchJob }
}

// Real-time subscription hook
export const useJobSubscription = (jobId?: string) => {
  const queryClient = useQueryClient()
  const { updateJob: updateJobStore } = useJobStore()
  
  // This would integrate with Supabase real-time subscriptions
  // For now, we'll return a placeholder
  const subscribe = () => {
    // In a real implementation, you would:
    // 1. Set up Supabase real-time subscription
    // 2. Listen for job updates
    // 3. Update cache and store when changes occur
    
    return () => {
      // Cleanup subscription
    }
  }
  
  return { subscribe }
}

// Debounced search hook
export const useDebouncedJobSearch = (filters: JobSearchData, delay = 300) => {
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  
  // Memoize filters to prevent infinite loops
  const memoizedFilters = useMemo(() => filters, [
    filters.search,
    filters.job_type,
    filters.min_rate,
    filters.max_rate,
    filters.radius,
    filters.urgency_level,
    filters.required_experience,
    JSON.stringify(filters.location),
    JSON.stringify(filters.required_certifications)
  ])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(memoizedFilters)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [memoizedFilters, delay])
  
  return useJobSearch(debouncedFilters)
}

// Helper hook for job statistics
export const useJobStats = () => {
  const { data: searchData } = useJobSearch({ 
    status: 'open',
    radius: 25,
    page: 1,
    limit: 20
  })
  
  return {
    totalJobs: searchData?.stats?.totalJobs || 0,
    averageRate: searchData?.stats?.averageRate || 0,
    jobTypes: searchData?.stats?.jobTypes || {},
    urgencyLevels: searchData?.stats?.urgencyLevels || {}
  }
}

// Application hooks
export const useApplications = (jobId?: string, professionalId?: string) => {
  return useQuery({
    queryKey: jobKeys.application(jobId),
    queryFn: async () => {
      // Use the corrected API endpoint instead of direct Supabase queries
      const url = jobId ? `/api/jobs/${jobId}/applications` : '/api/applications'
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Applications fetch error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch applications')
      }
      
      const data = await response.json()
      console.log('Applications data:', data) // Debug log
      return data
    },
    enabled: !!(jobId || professionalId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateApplication = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { job_id: string; professional_id: string; message: string; proposed_rate: number }) => {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.applications() })
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      toast.success('Application submitted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export const useUpdateApplication = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'accepted' | 'rejected' }) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update application')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}