import { Database } from './index'

// Job and Application Status Types
export type JobStatus = 
  | 'open' 
  | 'accepted' 
  | 'confirmed' 
  | 'in_progress' 
  | 'awaiting_review' 
  | 'completed' 
  | 'cancelled'

export type ApplicationStatus = 
  | 'pending' 
  | 'accepted' 
  | 'confirmed' 
  | 'denied' 
  | 'rejected'

export type UpdateType = 'milestone' | 'text' | 'photo' | 'completion'
export type Milestone = 'started' | 'in_progress' | 'awaiting_review' | 'completed'

// Job Update Interface
export interface JobUpdate {
  id: string
  job_id: string
  professional_id: string
  update_type: UpdateType
  milestone?: Milestone
  content?: string
  photo_urls?: string[]
  created_at: string
}

export type Job = Database['public']['Tables']['jobs']['Row'] & {
  golf_course_profiles?: Database['public']['Tables']['golf_course_profiles']['Row']
  applications?: Application[]
  job_updates?: JobUpdate[]
  _count?: {
    applications: number
  }
}

export type Application = Database['public']['Tables']['applications']['Row'] & {
  professional_profiles?: Database['public']['Tables']['professional_profiles']['Row']
  jobs?: Job
}

export type JobWithDetails = Job & {
  golf_course_profiles: Database['public']['Tables']['golf_course_profiles']['Row']
  applications: (Application & {
    professional_profiles: Database['public']['Tables']['professional_profiles']['Row']
  })[]
  job_updates: JobUpdate[]
  professional_profiles?: {
    full_name: string
    rating: number
  }
}

export interface CreateJobData {
  title: string
  description: string
  job_type: string
  location: {
    lat: number
    lng: number
  }
  start_date: string
  end_date?: string
  hourly_rate: number
  required_certifications: string[]
  required_experience?: string
  urgency_level: 'normal' | 'high' | 'emergency'
}

export interface JobFilters {
  location?: string
  job_type?: 'greenskeeping' | 'equipment_operation' | 'irrigation_maintenance' | 'landscaping' | 'general_maintenance'
  max_distance?: number
  min_rate?: number
  max_rate?: number
  certifications?: string[]
  urgency_level?: 'high' | 'normal' | 'emergency'
  start_date?: string
  end_date?: string
  search?: string
  required_experience?: string
  status?: string
}

export interface CreateApplicationData {
  job_id: string
  message?: string
  proposed_rate?: number
}

export interface JobWithApplicationStatus extends Omit<Job, 'golf_course_profiles'> {
  userApplication: Application | null
  hasApplied: boolean
  golf_course_profiles?: {
    course_name: string
    location: string
  }
}

export const JOB_TYPES = [
  'greenskeeping',
  'equipment_operation',
  'irrigation_maintenance',
  'landscaping',
  'course_setup',
  'general_maintenance'
] as const

export const URGENCY_LEVELS = [
  'normal',
  'high', 
  'emergency'
] as const

export const CERTIFICATIONS = [
  'pesticide_license',
  'equipment_certified',
  'irrigation_certified',
  'turf_management',
  'landscape_certified',
  'safety_certified'
] as const
