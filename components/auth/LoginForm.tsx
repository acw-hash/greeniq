"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { useUIStore } from '@/lib/stores/uiStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const router = useRouter()
  const { addToast } = useUIStore()
  const { updateAuthStateSync } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    console.log('🎯 Form submission started, isLoading:', isLoading)
    
    // Prevent double submissions
    if (isLoading) {
      console.log('🚫 Login already in progress, ignoring duplicate submission')
      return
    }

    // Clear any previous errors
    setFormError('')
    setIsLoading(true)
    
    console.log('🎯 Loading state set to true, button should be disabled')
    console.log('🎯 Button disabled state check will happen on next render')
    
    const supabase = createClient()

    try {
      console.log('🔐 Starting sign in process...')
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
        }
        
        setFormError(errorMessage)
        addToast({
          variant: 'destructive',
          title: 'Login failed',
          description: errorMessage,
        })
        return
      }

      console.log('✅ Sign in successful:', {
        userId: authData.user?.id,
        email: authData.user?.email
      })

      // CRITICAL: Update auth state immediately with the authenticated user
      console.log('🔄 Updating auth state immediately with authenticated user...')
      await updateAuthStateSync(authData.user)
      
      // Small delay to ensure React state updates have propagated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🔐 Auth state updated, verifying current state...')
      const currentState = useAuthStore.getState()
      console.log('📊 Current auth state after sync:', {
        isAuthenticated: currentState.isAuthenticated,
        hasUser: !!currentState.user,
        userId: currentState.user?.id,
        hasProfile: !!currentState.profile,
        profileType: currentState.profile?.user_type
      })

      addToast({
        variant: 'success',
        title: 'Welcome back!',
        description: 'Redirecting to your dashboard...',
      })

      console.log('🔄 Auth state updated, now redirecting to dashboard...')
      router.push('/dashboard')

    } catch (error) {
      console.error('💥 Unexpected login error:', error)
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setFormError(errorMessage)
      addToast({
        variant: 'destructive',
        title: 'Login failed',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    // Prevent double submissions
    if (isLoading) {
      console.log('🚫 OAuth login already in progress, ignoring duplicate submission')
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        addToast({
          variant: 'destructive',
          title: 'OAuth Error',
          description: error.message,
        })
        setIsLoading(false)
      }
      // Note: Don't set loading to false on success as user will be redirected
    } catch (error) {
      console.error('💥 OAuth error:', error)
      addToast({
        variant: 'destructive',
        title: 'OAuth Error',
        description: 'Failed to initiate Google sign-in. Please try again.',
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" style={{ opacity: isLoading ? 0.7 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter className="text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Button variant="link" className="p-0" onClick={() => router.push('/register')}>
            Sign up
          </Button>
        </p>
      </CardFooter>
    </Card>
  )
}
