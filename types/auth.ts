import { User } from '@supabase/supabase-js'
import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type GolfCourseProfile = Database['public']['Tables']['golf_course_profiles']['Row']
export type ProfessionalProfile = Database['public']['Tables']['professional_profiles']['Row']

export interface AuthUser extends User {
  profile?: Profile
  golf_course_profile?: GolfCourseProfile
  professional_profile?: ProfessionalProfile
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  full_name: string
  user_type: 'golf_course' | 'professional'
}

export interface GolfCourseSignupData extends SignupCredentials {
  user_type: 'golf_course'
  course_name: string
  course_type: 'public' | 'private' | 'resort' | 'municipal'
  address: string
  description?: string
  phone?: string
}

export interface ProfessionalSignupData extends SignupCredentials {
  user_type: 'professional'
  bio?: string
  experience_level: 'entry' | 'intermediate' | 'expert'
  specializations: string[]
  hourly_rate?: number
  travel_radius?: number
  phone?: string
}
