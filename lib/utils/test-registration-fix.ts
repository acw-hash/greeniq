// Test script for the fixed registration flow
// This file should only be used in development

interface TestUser {
  email: string
  password: string
  full_name: string
  user_type: 'golf_course' | 'professional'
  [key: string]: any
}

export async function testRegistrationFix() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Registration testing only available in development')
  }

  console.log('🧪 Testing Fixed Registration Flow')
  console.log('='.repeat(50))

  const timestamp = Date.now()
  
  // Test data for golf course
  const golfCourseUser: TestUser = {
    email: `test-golf-${timestamp}@example.com`,
    password: 'TestPassword123!',
    full_name: `Test Golf Course ${timestamp}`,
    user_type: 'golf_course',
    course_name: `Test Golf Course ${timestamp}`,
    course_type: 'public',
    address: `${timestamp} Test Drive, Test City, TC 12345`,
    phone: '+1234567890'
  }

  // Test data for professional
  const professionalUser: TestUser = {
    email: `test-pro-${timestamp}@example.com`, 
    password: 'TestPassword123!',
    full_name: `Test Professional ${timestamp}`,
    user_type: 'professional',
    experience_level: 'intermediate',
    specializations: ['greenskeeping', 'equipment_operation'],
    travel_radius: 25,
    hourly_rate: 25.00,
    phone: '+1234567890'
  }

  const results = {
    golf_course: null as any,
    professional: null as any,
    summary: {
      total_tests: 2,
      passed: 0,
      failed: 0,
      email_confirmation_required: 0
    }
  }

  // Test 1: Golf Course Registration
  console.log('\n🏌️ Testing Golf Course Registration...')
  try {
    const golfResult = await testSingleRegistration(golfCourseUser)
    results.golf_course = golfResult
    
    if (golfResult.success || golfResult.email_confirmation_required) {
      results.summary.passed++
      if (golfResult.email_confirmation_required) {
        results.summary.email_confirmation_required++
      }
    } else {
      results.summary.failed++
    }
  } catch (error) {
    console.error('❌ Golf course test failed:', error)
    results.golf_course = { success: false, error: error }
    results.summary.failed++
  }

  // Test 2: Professional Registration
  console.log('\n👷 Testing Professional Registration...')
  try {
    const profResult = await testSingleRegistration(professionalUser)
    results.professional = profResult
    
    if (profResult.success || profResult.email_confirmation_required) {
      results.summary.passed++
      if (profResult.email_confirmation_required) {
        results.summary.email_confirmation_required++
      }
    } else {
      results.summary.failed++
    }
  } catch (error) {
    console.error('❌ Professional test failed:', error)
    results.professional = { success: false, error: error }
    results.summary.failed++
  }

  // Summary
  console.log('\n📊 Test Results Summary')
  console.log('='.repeat(50))
  console.log(`Total Tests: ${results.summary.total_tests}`)
  console.log(`Passed: ${results.summary.passed}`)
  console.log(`Failed: ${results.summary.failed}`)
  console.log(`Email Confirmation Required: ${results.summary.email_confirmation_required}`)
  
  if (results.summary.email_confirmation_required > 0) {
    console.log('\n📧 Email Confirmation Notice:')
    console.log('Some tests require email confirmation. This is expected if')
    console.log('email confirmation is enabled in your Supabase Auth settings.')
    console.log('Users will need to confirm their email before profiles are created.')
  }

  if (results.summary.failed > 0) {
    console.log('\n❌ Some tests failed. Check the error details above.')
  } else {
    console.log('\n✅ All tests passed! Registration flow is working correctly.')
  }

  return results
}

async function testSingleRegistration(userData: TestUser) {
  console.log(`📝 Testing registration for: ${userData.email}`)
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const result = await response.json()

    if (response.ok) {
      console.log(`✅ Registration successful for ${userData.user_type}:`, {
        user_id: result.user_id,
        email_confirmation_required: result.email_confirmation_required || false
      })
      
      // If no email confirmation required, verify profile was created
      if (!result.email_confirmation_required) {
        const verifyResult = await verifyProfileCreated(result.user_id)
        return {
          success: true,
          user_id: result.user_id,
          user_type: userData.user_type,
          profile_verified: verifyResult.profile_exists,
          details: result
        }
      } else {
        return {
          success: true,
          email_confirmation_required: true,
          user_id: result.user_id,
          user_type: userData.user_type,
          details: result
        }
      }
    } else {
      console.error(`❌ Registration failed for ${userData.user_type}:`, result)
      return {
        success: false,
        error: result.error,
        details: result
      }
    }

  } catch (error: any) {
    console.error(`💥 Registration test error for ${userData.user_type}:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function verifyProfileCreated(userId: string) {
  try {
    const response = await fetch(`/api/debug/auth-users?user_id=${userId}`)
    const result = await response.json()
    
    return {
      profile_exists: result.profile_exists || false,
      details: result
    }
  } catch (error) {
    console.error('Error verifying profile:', error)
    return {
      profile_exists: false,
      error: error
    }
  }
}

// Console helper
export function setupRegistrationTesting() {
  if (typeof window === 'undefined') {
    console.log('Registration testing can only be run in the browser')
    return
  }

  console.log('🧪 GreenCrew Registration Testing')
  console.log('Use this command in the browser console:')
  console.log('')
  console.log('testRegistrationFix()')
  console.log('')
  console.log('This will test both golf course and professional registration flows.')

  // Make function available globally for console testing
  if (typeof window !== 'undefined') {
    (window as any).testRegistrationFix = testRegistrationFix
  }
}
