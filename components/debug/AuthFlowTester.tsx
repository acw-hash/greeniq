"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react'

interface TestStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  details?: any
}

export function AuthFlowTester() {
  const [isVisible, setIsVisible] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [steps, setSteps] = useState<TestStep[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const authStore = useAuthStore()
  const supabase = createClient()

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ))
  }

  const runAuthFlowTest = async () => {
    if (!testEmail || !testPassword) {
      alert('Please enter test email and password')
      return
    }

    setIsRunning(true)
    
    const testSteps: TestStep[] = [
      { id: 'cleanup', name: 'Clean up existing session', status: 'pending' },
      { id: 'signin', name: 'Sign in with credentials', status: 'pending' },
      { id: 'session', name: 'Verify session created', status: 'pending' },
      { id: 'auth-state', name: 'Check auth store state', status: 'pending' },
      { id: 'profile', name: 'Verify profile exists', status: 'pending' },
      { id: 'role-profile', name: 'Check role-specific profile', status: 'pending' },
      { id: 'permissions', name: 'Test profile permissions', status: 'pending' },
      { id: 'signout', name: 'Sign out cleanly', status: 'pending' },
    ]
    
    setSteps(testSteps)

    try {
      // Step 1: Clean up existing session
      updateStep('cleanup', { status: 'running' })
      await authStore.signOut()
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStep('cleanup', { status: 'success', message: 'Session cleaned up' })

      // Step 2: Sign in
      updateStep('signin', { status: 'running' })
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (signInError) {
        updateStep('signin', { 
          status: 'error', 
          message: signInError.message,
          details: signInError
        })
        setIsRunning(false)
        return
      }

      updateStep('signin', { 
        status: 'success', 
        message: `Signed in as ${authData.user?.email}`,
        details: { userId: authData.user?.id }
      })

      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 3: Verify session
      updateStep('session', { status: 'running' })
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        updateStep('session', { 
          status: 'error', 
          message: sessionError?.message || 'No session found',
          details: sessionError
        })
      } else {
        updateStep('session', { 
          status: 'success', 
          message: `Session valid until ${new Date(session.expires_at * 1000).toLocaleString()}`,
          details: { expiresAt: session.expires_at }
        })
      }

      // Step 4: Check auth store state
      updateStep('auth-state', { status: 'running' })
      const authState = authStore
      
      if (!authState.isAuthenticated || !authState.user) {
        updateStep('auth-state', { 
          status: 'error', 
          message: `Auth store not updated: authenticated=${authState.isAuthenticated}, user=${!!authState.user}`,
          details: { 
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            isLoading: authState.isLoading
          }
        })
      } else {
        updateStep('auth-state', { 
          status: 'success', 
          message: `Auth store updated correctly`,
          details: {
            userId: authState.user.id,
            email: authState.user.email,
            isLoading: authState.isLoading
          }
        })
      }

      // Step 5: Verify profile exists
      updateStep('profile', { status: 'running' })
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        updateStep('profile', { 
          status: 'error', 
          message: `Profile not found: ${profileError.message}`,
          details: profileError
        })
      } else {
        updateStep('profile', { 
          status: 'success', 
          message: `Profile found: ${profile.full_name} (${profile.user_type})`,
          details: profile
        })

        // Step 6: Check role-specific profile
        updateStep('role-profile', { status: 'running' })
        
        if (profile.user_type === 'professional') {
          const { data: profProfile, error: profError } = await supabase
            .from('professional_profiles')
            .select('*')
            .eq('profile_id', authData.user.id)
            .single()

          if (profError) {
            updateStep('role-profile', { 
              status: 'error', 
              message: `Professional profile not found: ${profError.message}`,
              details: profError
            })
          } else {
            updateStep('role-profile', { 
              status: 'success', 
              message: `Professional profile found: ${profProfile.experience_level} level`,
              details: profProfile
            })
          }
        } else if (profile.user_type === 'golf_course') {
          const { data: golfProfile, error: golfError } = await supabase
            .from('golf_course_profiles')
            .select('*')
            .eq('profile_id', authData.user.id)
            .single()

          if (golfError) {
            updateStep('role-profile', { 
              status: 'error', 
              message: `Golf course profile not found: ${golfError.message}`,
              details: golfError
            })
          } else {
            updateStep('role-profile', { 
              status: 'success', 
              message: `Golf course profile found: ${golfProfile.course_name}`,
              details: golfProfile
            })
          }
        } else {
          updateStep('role-profile', { 
            status: 'success', 
            message: 'No role-specific profile needed',
            details: null
          })
        }
      }

      // Step 7: Test profile permissions
      updateStep('permissions', { status: 'running' })
      try {
        const { data: updateResult, error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', authData.user.id)
          .select()

        if (updateError) {
          updateStep('permissions', { 
            status: 'error', 
            message: `Profile update failed: ${updateError.message}`,
            details: updateError
          })
        } else {
          updateStep('permissions', { 
            status: 'success', 
            message: 'Profile update permissions working',
            details: updateResult
          })
        }
      } catch (permError) {
        updateStep('permissions', { 
          status: 'error', 
          message: `Permission test failed: ${permError}`,
          details: permError
        })
      }

      // Step 8: Sign out
      updateStep('signout', { status: 'running' })
      try {
        await authStore.signOut()
        
        // Verify sign out worked
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { data: { session: postSignOutSession } } = await supabase.auth.getSession()
        
        if (postSignOutSession) {
          updateStep('signout', { 
            status: 'error', 
            message: 'Session still exists after sign out',
            details: postSignOutSession
          })
        } else {
          updateStep('signout', { 
            status: 'success', 
            message: 'Successfully signed out',
            details: null
          })
        }
      } catch (signOutError) {
        updateStep('signout', { 
          status: 'error', 
          message: `Sign out failed: ${signOutError}`,
          details: signOutError
        })
      }

    } catch (error) {
      console.error('Test suite error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Play className="h-4 w-4 mr-2" />
          Auth Test
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card className="bg-white shadow-lg border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-green-900">Auth Flow Tester</CardTitle>
              <CardDescription>
                Test complete authentication flow
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Test Configuration */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Test Credentials</h4>
            <Input
              placeholder="Test email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={isRunning}
            />
            <Input
              type="password"
              placeholder="Test password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              disabled={isRunning}
            />
            <Button
              onClick={runAuthFlowTest}
              disabled={isRunning || !testEmail || !testPassword}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Auth Flow Test
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {steps.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Test Results</h4>
              {steps.map((step) => (
                <div key={step.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStepIcon(step.status)}
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                  {step.message && (
                    <p className="text-xs text-gray-600 mb-2">{step.message}</p>
                  )}
                  {step.details && step.status === 'error' && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-red-600">Error Details</summary>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-red-800 overflow-x-auto">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
