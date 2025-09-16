// Test email functionality for registration
// This file should only be used in development

interface EmailTestResult {
  success: boolean
  email_sent: boolean
  error?: string
  details?: any
}

export async function testEmailFunctionality(): Promise<EmailTestResult> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Email testing only available in development')
  }

  console.log('📧 Testing Email Functionality')
  console.log('='.repeat(50))

  // Step 1: Check email configuration
  console.log('\n🔧 Checking email configuration...')
  try {
    const configResponse = await fetch('/api/debug/email-config')
    const configData = await configResponse.json()
    
    console.log('✅ Email configuration check:', configData)
    
    if (configData.issues && configData.issues.length > 0) {
      console.warn('⚠️ Configuration issues found:', configData.issues)
    }
  } catch (error) {
    console.error('❌ Failed to check email configuration:', error)
  }

  // Step 2: Test registration with email
  const timestamp = Date.now()
  const testEmail = `test-email-${timestamp}@example.com`
  
  const testUser = {
    email: testEmail,
    password: 'TestPassword123!',
    full_name: `Email Test User ${timestamp}`,
    user_type: 'professional',
    experience_level: 'intermediate',
    specializations: ['greenskeeping'],
    travel_radius: 25,
    hourly_rate: 25.00
  }

  console.log('\n📝 Testing registration with email:', testEmail)

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Registration successful:', {
        user_id: result.user_id,
        email_confirmation_required: result.email_confirmation_required,
        email_sent_at: result.email_sent_at,
        email_redirect_url: result.email_redirect_url
      })

      // Check if email confirmation is required and email was sent
      if (result.email_confirmation_required) {
        if (result.email_sent_at) {
          console.log('✅ Email confirmation required and timestamp indicates email was sent')
          
          // Test resend functionality
          console.log('\n📧 Testing email resend functionality...')
          await testEmailResend(testEmail)
          
          return {
            success: true,
            email_sent: true,
            details: result
          }
        } else {
          console.warn('⚠️ Email confirmation required but no sent timestamp')
          return {
            success: false,
            email_sent: false,
            error: 'Email confirmation required but no confirmation_sent_at timestamp',
            details: result
          }
        }
      } else {
        console.log('ℹ️ No email confirmation required (immediate signup)')
        return {
          success: true,
          email_sent: false,
          details: result
        }
      }
    } else {
      console.error('❌ Registration failed:', result)
      return {
        success: false,
        email_sent: false,
        error: result.error,
        details: result
      }
    }

  } catch (error: any) {
    console.error('💥 Registration test error:', error)
    return {
      success: false,
      email_sent: false,
      error: error.message
    }
  }
}

async function testEmailResend(email: string) {
  try {
    const response = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Email resend successful:', result)
    } else {
      console.error('❌ Email resend failed:', result)
    }
  } catch (error) {
    console.error('💥 Email resend test error:', error)
  }
}

export async function checkSupabaseAuthSettings() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Auth settings check only available in development')
  }

  console.log('🔍 Checking Supabase Auth Settings')
  console.log('='.repeat(50))
  
  console.log(`
📋 To check your Supabase Auth settings:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings
3. Check these settings:

   📧 Email Confirmation:
   - Enable email confirmations: [Check if enabled]
   - Confirmation URL: Should be your domain + /auth/callback
   
   📨 Email Templates:
   - Confirm signup template: [Check if customized]
   - Email templates are active: [Verify not disabled]
   
   🔒 Security:
   - Email rate limiting: [Check if too restrictive]
   - CAPTCHA settings: [Verify not blocking emails]
   
   🌐 URL Configuration:
   - Site URL: Should match your domain
   - Redirect URLs: Should include your domain + /auth/callback

4. Check Email Provider Settings:
   - Go to Authentication → Settings → SMTP Settings
   - Verify if custom SMTP is configured correctly
   - Or check if using Supabase's default email service

5. Test with a real email address you can access
   `)

  // Check configuration via our debug endpoint
  try {
    const response = await fetch('/api/debug/email-config')
    const config = await response.json()
    
    console.log('🔧 Current configuration:', config)
    
  } catch (error) {
    console.error('❌ Failed to fetch configuration:', error)
  }
}

// Console helper for manual testing
export function setupEmailTesting() {
  if (typeof window === 'undefined') {
    console.log('Email testing can only be run in the browser')
    return
  }

  console.log('📧 GreenIQ Email Testing Utilities')
  console.log('Use these commands in the browser console:')
  console.log('')
  console.log('// Test email functionality:')
  console.log('testEmailFunctionality()')
  console.log('')
  console.log('// Check auth settings guide:')
  console.log('checkSupabaseAuthSettings()')
  console.log('')
  console.log('// Test email resend:')
  console.log('fetch("/api/auth/resend-confirmation", {')
  console.log('  method: "POST",')
  console.log('  headers: {"Content-Type": "application/json"},')
  console.log('  body: JSON.stringify({email: "your-email@example.com"})')
  console.log('}).then(r => r.json()).then(console.log)')

  // Make functions available globally for console testing
  if (typeof window !== 'undefined') {
    (window as any).testEmailFunctionality = testEmailFunctionality
    (window as any).checkSupabaseAuthSettings = checkSupabaseAuthSettings
  }
}
