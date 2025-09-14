import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { 
  ProfileUpdateInput, 
  GolfCourseProfileInput, 
  ProfessionalProfileInput 
} from '@/lib/validations/profile'

type Profile = Database['public']['Tables']['profiles']['Row']
type GolfCourseProfile = Database['public']['Tables']['golf_course_profiles']['Row']
type ProfessionalProfile = Database['public']['Tables']['professional_profiles']['Row']

interface ProfileState {
  profile: Profile | null
  golfCourseProfile: GolfCourseProfile | null
  professionalProfile: ProfessionalProfile | null
  isLoading: boolean
  isCompleteProfile: boolean
  completionProgress: number
}

interface ProfileActions {
  setProfile: (profile: Profile | null) => void
  setGolfCourseProfile: (profile: GolfCourseProfile | null) => void
  setProfessionalProfile: (profile: ProfessionalProfile | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (data: ProfileUpdateInput) => Promise<void>
  updateGolfCourseProfile: (data: GolfCourseProfileInput) => Promise<void>
  updateProfessionalProfile: (data: ProfessionalProfileInput) => Promise<void>
  refreshProfile: () => Promise<void>
  calculateCompletion: () => void
  uploadProfileImage: (file: File) => Promise<string>
  deleteProfileImage: () => Promise<void>
}

type ProfileStore = ProfileState & ProfileActions

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // State
  profile: null,
  golfCourseProfile: null,
  professionalProfile: null,
  isLoading: false,
  isCompleteProfile: false,
  completionProgress: 0,

  // Actions
  setProfile: (profile) => {
    set({ profile })
    get().calculateCompletion()
  },

  setGolfCourseProfile: (golfCourseProfile) => {
    set({ golfCourseProfile })
    get().calculateCompletion()
  },

  setProfessionalProfile: (professionalProfile) => {
    set({ professionalProfile })
    get().calculateCompletion()
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateProfile: async (data) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        throw new Error('No authenticated user')
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          location: data.location ? `POINT(${data.location.lng} ${data.location.lat})` : null,
        })
        .eq('id', session.session.user.id)
        .select()
        .single()

      if (error) throw error

      set({ profile: updatedProfile })
      get().calculateCompletion()
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateGolfCourseProfile: async (data) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        throw new Error('No authenticated user')
      }

      const { data: updatedProfile, error } = await supabase
        .from('golf_course_profiles')
        .upsert({
          profile_id: session.session.user.id,
          ...data,
        })
        .select()
        .single()

      if (error) throw error

      set({ golfCourseProfile: updatedProfile })
      get().calculateCompletion()
    } catch (error) {
      console.error('Failed to update golf course profile:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfessionalProfile: async (data) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        throw new Error('No authenticated user')
      }

      const { data: updatedProfile, error } = await supabase
        .from('professional_profiles')
        .upsert({
          profile_id: session.session.user.id,
          ...data,
        })
        .select()
        .single()

      if (error) throw error

      set({ professionalProfile: updatedProfile })
      get().calculateCompletion()
    } catch (error) {
      console.error('Failed to update professional profile:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  refreshProfile: async () => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        throw new Error('No authenticated user')
      }

      // Fetch base profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single()

      if (profileError) throw profileError

      set({ profile })

      // Fetch role-specific profile
      if (profile.user_type === 'golf_course') {
        const { data: golfCourseProfile } = await supabase
          .from('golf_course_profiles')
          .select('*')
          .eq('profile_id', session.session.user.id)
          .single()

        set({ golfCourseProfile, professionalProfile: null })
      } else if (profile.user_type === 'professional') {
        const { data: professionalProfile } = await supabase
          .from('professional_profiles')
          .select('*')
          .eq('profile_id', session.session.user.id)
          .single()

        set({ professionalProfile, golfCourseProfile: null })
      }

      get().calculateCompletion()
    } catch (error) {
      console.error('Failed to refresh profile:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  calculateCompletion: () => {
    const { profile, golfCourseProfile, professionalProfile } = get()
    
    if (!profile) {
      set({ isCompleteProfile: false, completionProgress: 0 })
      return
    }

    let totalFields = 0
    let completedFields = 0

    // Base profile fields
    const baseFields = ['full_name', 'email', 'phone', 'location']
    totalFields += baseFields.length
    
    baseFields.forEach(field => {
      if (profile[field as keyof Profile]) {
        completedFields++
      }
    })

    // Role-specific fields
    if (profile.user_type === 'golf_course' && golfCourseProfile) {
      const golfFields = ['course_name', 'course_type', 'address', 'description']
      totalFields += golfFields.length
      
      golfFields.forEach(field => {
        if (golfCourseProfile[field as keyof GolfCourseProfile]) {
          completedFields++
        }
      })

      // Bonus for facilities and qualifications
      if (golfCourseProfile.facilities && Object.keys(golfCourseProfile.facilities as object).length > 0) {
        completedFields += 0.5
      }
      if (golfCourseProfile.preferred_qualifications && golfCourseProfile.preferred_qualifications.length > 0) {
        completedFields += 0.5
      }
    } else if (profile.user_type === 'professional' && professionalProfile) {
      const profFields = ['bio', 'experience_level', 'specializations', 'hourly_rate', 'travel_radius']
      totalFields += profFields.length
      
      profFields.forEach(field => {
        const value = professionalProfile[field as keyof ProfessionalProfile]
        if (value !== null && value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            completedFields++
          } else if (!Array.isArray(value)) {
            completedFields++
          }
        }
      })

      // Bonus for equipment skills
      if (professionalProfile.equipment_skills && professionalProfile.equipment_skills.length > 0) {
        completedFields += 0.5
      }
    }

    const progress = Math.round((completedFields / totalFields) * 100)
    const isComplete = progress >= 80 // 80% completion threshold

    set({ 
      completionProgress: progress,
      isCompleteProfile: isComplete
    })
  },

  uploadProfileImage: async (file: File) => {
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        throw new Error('No authenticated user')
      }

      // Create file name with user ID and timestamp
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Failed to upload profile image:', error)
      throw error
    }
  },

  deleteProfileImage: async () => {
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        throw new Error('No authenticated user')
      }

      // List all files for this user
      const { data: files, error: listError } = await supabase.storage
        .from('profile-images')
        .list('profiles', {
          search: session.session.user.id
        })

      if (listError) throw listError

      // Delete all user profile images
      if (files && files.length > 0) {
        const filePaths = files.map(file => `profiles/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from('profile-images')
          .remove(filePaths)

        if (deleteError) throw deleteError
      }
    } catch (error) {
      console.error('Failed to delete profile image:', error)
      throw error
    }
  },
}))
