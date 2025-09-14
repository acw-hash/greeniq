// Utility functions for testing registration flow
// This file should only be used in development

interface TestRegistrationData {
  email: string
  password: string
  full_name: string
  user_type: 'golf_course' | 'professional'
  course_name?: string
  course_type?: 'public' | 'private' | 'resort' | 'municipal'
  address?: string
  experience_level?: 'entry' | 'intermediate' | 'expert'
  specializations?: string[]
}

export async function testRegistrationFlow(data: TestRegistrationData) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Registration testing only available in development')
  }

  console.log('🧪 Starting registration test for:', data.email)

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        ...(data.user_type === 'golf_course' && {
          course_name: data.course_name || 'Test Golf Course',
          course_type: data.course_type || 'public',
          address: data.address || '123 Test St, Test City, TC 12345'
        }),
        ...(data.user_type === 'professional' && {
          experience_level: data.experience_level || 'intermediate',
          specializations: data.specializations || ['greenskeeping', 'equipment_operation'],
          travel_radius: 25,
          hourly_rate: 25.00
        })
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Registration test failed:', result)
      return {
        success: false,
        error: result.error,
        details: result
      }
    }

    console.log('✅ Registration test successful:', result)

    // Additional verification
    if (result.user_id) {
      const debugResponse = await fetch(`/api/debug/auth-users?user_id=${result.user_id}`)
      const debugData = await debugResponse.json()
      
      return {
        success: true,
        user_id: result.user_id,
        user_type: result.user_type,
        verification: debugData
      }
    }

    return {
      success: true,
      result
    }

  } catch (error: any) {
    console.error('💥 Registration test error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export function generateTestUser(userType: 'golf_course' | 'professional'): TestRegistrationData {
  const timestamp = Date.now()
  
  const baseData = {
    email: `test-${userType}-${timestamp}@example.com`,
    password: 'TestPassword123!',
    full_name: `Test ${userType === 'golf_course' ? 'Golf Course' : 'Professional'} ${timestamp}`,
    user_type: userType as 'golf_course' | 'professional'
  }

  if (userType === 'golf_course') {
    return {
      ...baseData,
      course_name: `Test Golf Course ${timestamp}`,
      course_type: 'public' as const,
      address: `${timestamp} Test Drive, Test City, TC 12345`
    }
  } else {
    return {
      ...baseData,
      experience_level: 'intermediate' as const,
      specializations: ['greenskeeping', 'equipment_operation']
    }
  }
}

// Console helper for manual testing
export function runRegistrationTests() {
  if (typeof window === 'undefined') {
    console.log('Registration tests can only be run in the browser')
    return
  }

  console.log('🧪 GreenCrew Registration Testing Utilities')
  console.log('Use these commands in the browser console:')
  console.log('')
  console.log('// Quick comprehensive test (RECOMMENDED):')
  console.log('testRegistrationFix()')
  console.log('')
  console.log('// Email functionality test (NEW):')
  console.log('testEmailFunctionality()')
  console.log('')
  console.log('// Individual test commands:')
  console.log('testGolfCourse = generateTestUser("golf_course")')
  console.log('testRegistrationFlow(testGolfCourse)')
  console.log('')
  console.log('testProfessional = generateTestUser("professional")')
  console.log('testRegistrationFlow(testProfessional)')
  console.log('')
  console.log('// Profile completion helpers:')
  console.log('checkUserStatus("USER_ID")')
  console.log('completeUserProfile({user_id: "...", user_type: "...", ...})')
  console.log('')
  console.log('// Email troubleshooting:')
  console.log('checkSupabaseAuthSettings()')
  console.log('fetch("/api/debug/email-config").then(r => r.json()).then(console.log)')
  console.log('')
  console.log('// System health checks:')
  console.log('fetch("/api/health").then(r => r.json()).then(console.log)')
  console.log('fetch("/api/debug/schema").then(r => r.json()).then(console.log)')

  // Make functions available globally for console testing
  if (typeof window !== 'undefined') {
    (window as any).testRegistrationFlow = testRegistrationFlow
    (window as any).generateTestUser = generateTestUser
    
    // Import and expose the new testing functions
    import('./test-registration-fix').then(module => {
      (window as any).testRegistrationFix = module.testRegistrationFix
    })
    
    import('./profile-completion').then(module => {
      (window as any).checkUserStatus = module.checkUserStatus
      (window as any).completeUserProfile = module.completeUserProfile
    })
    
    import('./test-email-functionality').then(module => {
      (window as any).testEmailFunctionality = module.testEmailFunctionality
      (window as any).checkSupabaseAuthSettings = module.checkSupabaseAuthSettings
    })
  }
}
