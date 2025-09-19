import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { JobFormData, JobSearchData, JobType, UrgencyLevel, ExperienceLevel } from '@/lib/validations/jobs'

// Job interface based on database schema
export interface Job {
  id: string
  course_id: string
  title: string
  description: string
  job_type: JobType
  location: {
    lat: number
    lng: number
    address: string
  }
  start_date: string
  end_date?: string
  hourly_rate: number
  required_certifications: string[]
  required_experience?: ExperienceLevel
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  urgency_level: UrgencyLevel
  created_at: string
  updated_at: string
  distance?: number // Added for search results
  profiles?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    golf_course_profiles?: {
      course_name: string
      course_type: string
      address: string
    }
  }
  applications?: Application[]
}

export interface Application {
  id: string
  professional_id: string
  message: string
  proposed_rate: number
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
  profiles?: {
    id: string
    full_name: string
    avatar_url?: string
    professional_profiles?: {
      experience_level: ExperienceLevel
      specializations: string[]
      rating: number
      total_jobs: number
    }
  }
}

export interface JobSearchFilters {
  search: string
  job_type?: JobType
  min_rate?: number
  max_rate?: number
  location?: {
    lat: number
    lng: number
    address: string
  }
  radius: number
  urgency_level?: UrgencyLevel
  required_experience?: ExperienceLevel
  required_certifications?: string[]
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
}

export interface JobFormState {
  currentStep: number
  totalSteps: number
  formData: Partial<JobFormData>
  errors: Record<string, string>
  isSubmitting: boolean
  autoSaveEnabled: boolean
  lastSaved?: string
}

export interface JobStore {
  // State
  jobs: Job[]
  currentJob: Job | null
  searchFilters: JobSearchFilters
  formState: JobFormState
  isLoading: boolean
  error: string | null
  
  // Job CRUD actions
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  removeJob: (id: string) => void
  setCurrentJob: (job: Job | null) => void
  
  // Search and filtering
  setSearchFilters: (filters: Partial<JobSearchFilters>) => void
  clearSearchFilters: () => void
  
  // Form management
  setFormStep: (step: number) => void
  updateFormData: (data: Partial<JobFormData>) => void
  setFormErrors: (errors: Record<string, string>) => void
  clearFormErrors: () => void
  setFormSubmitting: (isSubmitting: boolean) => void
  resetForm: () => void
  enableAutoSave: () => void
  disableAutoSave: () => void
  setLastSaved: (timestamp: string) => void
  
  // Loading and error states
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const initialSearchFilters: JobSearchFilters = {
  search: '',
  radius: 25,
  status: 'open'
}

const initialFormState: JobFormState = {
  currentStep: 1,
  totalSteps: 4,
  formData: {},
  errors: {},
  isSubmitting: false,
  autoSaveEnabled: true
}

export const useJobStore = create<JobStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        jobs: [],
        currentJob: null,
        searchFilters: initialSearchFilters,
        formState: initialFormState,
        isLoading: false,
        error: null,

        // Job CRUD actions
        setJobs: (jobs) => set({ jobs }),
        
        addJob: (job) => set((state) => ({
          jobs: [job, ...state.jobs]
        })),
        
        updateJob: (id, updates) => set((state) => ({
          jobs: state.jobs.map(job => 
            job.id === id ? { ...job, ...updates } : job
          ),
          currentJob: state.currentJob?.id === id 
            ? { ...state.currentJob, ...updates }
            : state.currentJob
        })),
        
        removeJob: (id) => set((state) => ({
          jobs: state.jobs.filter(job => job.id !== id),
          currentJob: state.currentJob?.id === id ? null : state.currentJob
        })),
        
        setCurrentJob: (job) => set({ currentJob: job }),

        // Search and filtering
        setSearchFilters: (filters) => set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters }
        })),
        
        clearSearchFilters: () => set({ searchFilters: initialSearchFilters }),

        // Form management
        setFormStep: (step) => set((state) => ({
          formState: { ...state.formState, currentStep: step }
        })),
        
        updateFormData: (data) => set((state) => ({
          formState: {
            ...state.formState,
            formData: { ...state.formState.formData, ...data }
          }
        })),
        
        setFormErrors: (errors) => set((state) => ({
          formState: { ...state.formState, errors }
        })),
        
        clearFormErrors: () => set((state) => ({
          formState: { ...state.formState, errors: {} }
        })),
        
        setFormSubmitting: (isSubmitting) => set((state) => ({
          formState: { ...state.formState, isSubmitting }
        })),
        
        resetForm: () => set({ formState: initialFormState }),
        
        enableAutoSave: () => set((state) => ({
          formState: { ...state.formState, autoSaveEnabled: true }
        })),
        
        disableAutoSave: () => set((state) => ({
          formState: { ...state.formState, autoSaveEnabled: false }
        })),
        
        setLastSaved: (timestamp) => set((state) => ({
          formState: { ...state.formState, lastSaved: timestamp }
        })),

        // Loading and error states
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null })
      }),
      {
        name: 'job-store',
        partialize: (state) => ({
          searchFilters: state.searchFilters,
          formState: {
            ...state.formState,
            isSubmitting: false, // Don't persist submitting state
            errors: {} // Don't persist errors
          }
        })
      }
    ),
    { name: 'JobStore' }
  )
)

// Selectors for common use cases
export const useJobSearchFilters = () => useJobStore((state) => state.searchFilters)
export const useJobFormState = () => useJobStore((state) => state.formState)
export const useCurrentJob = () => useJobStore((state) => state.currentJob)
export const useJobs = () => useJobStore((state) => state.jobs)

// Auto-save functionality
let autoSaveTimeout: NodeJS.Timeout | null = null

export const useAutoSave = () => {
  const { formState, updateFormData, setLastSaved, enableAutoSave, disableAutoSave } = useJobStore()
  
  const startAutoSave = (formData: Partial<JobFormData>) => {
    if (!formState.autoSaveEnabled) return
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    autoSaveTimeout = setTimeout(async () => {
      try {
        // Here you would call your auto-save API
        // For now, we'll just update the store
        updateFormData(formData)
        setLastSaved(new Date().toISOString())
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 30000) // 30 seconds
  }
  
  const stopAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
      autoSaveTimeout = null
    }
  }
  
  return {
    startAutoSave,
    stopAutoSave,
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled: formState.autoSaveEnabled,
    lastSaved: formState.lastSaved
  }
}