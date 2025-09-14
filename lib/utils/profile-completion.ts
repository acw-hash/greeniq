// Utility functions for completing user profiles after email confirmation

export interface ProfileCompletionData {
  user_id: string
  user_type: 'golf_course' | 'professional'
  full_name: string
  email: string
  phone?: string | null
  course_data?: {
    course_name: string
    course_type: 'public' | 'private' | 'resort' | 'municipal'
    address: string
    description?: string | null
  }
  professional_data?: {
    bio?: string | null
    experience_level: 'entry' | 'intermediate' | 'expert'
    specializations: string[]
    hourly_rate?: number | null
    travel_radius?: number
  }
}

export async function completeUserProfile(data: ProfileCompletionData) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Profile completion utilities only available in development')
  }

  console.log('🔄 Starting manual profile completion for:', data.user_id)

  try {
    const response = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: data.user_id,
        user_data: {
          user_type: data.user_type,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          ...(data.course_data && { course_data: data.course_data }),
          ...(data.professional_data && { professional_data: data.professional_data })
        }
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Profile completion failed:', result)
      return {
        success: false,
        error: result.error,
        details: result
      }
    }

    console.log('✅ Profile completion successful:', result)

    return {
      success: true,
      user_id: data.user_id,
      user_type: data.user_type,
      result
    }

  } catch (error: any) {
    console.error('💥 Profile completion error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function checkUserStatus(userId: string) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('User status check only available in development')
  }

  try {
    const response = await fetch(`/api/debug/auth-users?user_id=${userId}`)
    const result = await response.json()

    console.log('📊 User status:', result)
    return result
  } catch (error: any) {
    console.error('💥 Error checking user status:', error)
    return {
      error: error.message
    }
  }
}

// Console helper for manual testing
export function setupProfileCompletionHelpers() {
  if (typeof window === 'undefined') {
    console.log('Profile completion helpers can only be run in the browser')
    return
  }

  console.log('🔧 GreenCrew Profile Completion Utilities')
  console.log('Use these commands in the browser console:')
  console.log('')
  console.log('// Check user status:')
  console.log('checkUserStatus("USER_ID_HERE")')
  console.log('')
  console.log('// Complete profile manually:')
  console.log(`completeUserProfile({
  user_id: "USER_ID_HERE",
  user_type: "golf_course", // or "professional"
  full_name: "User Name",
  email: "user@example.com",
  course_data: { // for golf courses
    course_name: "Course Name",
    course_type: "public",
    address: "123 Course St"
  }
  // OR professional_data for professionals
})`)

  // Make functions available globally for console testing
  if (typeof window !== 'undefined') {
    (window as any).completeUserProfile = completeUserProfile
    (window as any).checkUserStatus = checkUserStatus
  }
}
