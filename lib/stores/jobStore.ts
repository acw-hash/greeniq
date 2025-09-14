import { create } from 'zustand'
import type { Database } from '@/types/database'
import type { JobFilters } from '@/lib/validations/jobs'

type Job = Database['public']['Tables']['jobs']['Row'] & {
  course_profile?: Database['public']['Tables']['profiles']['Row']
  golf_course_profile?: Database['public']['Tables']['golf_course_profiles']['Row']
  applications_count?: number
}

interface JobState {
  jobs: Job[]
  filters: JobFilters
  isLoading: boolean
  searchTerm: string
  viewMode: 'list' | 'map'
  selectedJob: Job | null
}

interface JobActions {
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  removeJob: (id: string) => void
  setFilters: (filters: Partial<JobFilters>) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void
  setViewMode: (mode: 'list' | 'map') => void
  setLoading: (loading: boolean) => void
  setSelectedJob: (job: Job | null) => void
}

type JobStore = JobState & JobActions

export const useJobStore = create<JobStore>((set) => ({
  // State
  jobs: [],
  filters: {},
  isLoading: false,
  searchTerm: '',
  viewMode: 'list',
  selectedJob: null,

  // Actions
  setJobs: (jobs) => set({ jobs }),
  
  addJob: (job) => set((state) => ({ 
    jobs: [job, ...state.jobs] 
  })),
  
  updateJob: (id, updates) => set((state) => ({
    jobs: state.jobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    )
  })),
  
  removeJob: (id) => set((state) => ({
    jobs: state.jobs.filter(job => job.id !== id)
  })),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  clearFilters: () => set({ filters: {} }),
  
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  
  setViewMode: (viewMode) => set({ viewMode }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setSelectedJob: (selectedJob) => set({ selectedJob }),
}))
