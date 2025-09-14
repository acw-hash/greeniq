"use client"

import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User, Database, Trash2, Info, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export function SignOutTest() {
  const { user, profile, isAuthenticated, signOut, forceAuthReset, mcpValidatedSignOut, mcpValidateSession } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState<any>({})

  const refreshSessionInfo = async () => {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      setSessionInfo({
        session: session ? {
          userId: session.user?.id,
          email: session.user?.email,
          expiresAt: session.expires_at,
          isExpired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
        } : null,
        user: currentUser,
        sessionError: error?.message,
        userError: userError?.message
      })
    } catch (error) {
      console.error('Error getting session info:', error)
      setSessionInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const refreshStorageInfo = () => {
    if (typeof window !== 'undefined') {
      const localStorage_keys: string[] = []
      const sessionStorage_keys: string[] = []
      
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          localStorage_keys.push(key)
        }
      }
      
      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          sessionStorage_keys.push(key)
        }
      }
      
      setStorageInfo({
        localStorage: localStorage_keys,
        sessionStorage: sessionStorage_keys,
        totalLocalStorage: localStorage.length,
        totalSessionStorage: sessionStorage.length
      })
    }
  }

  useEffect(() => {
    refreshSessionInfo()
    refreshStorageInfo()
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      refreshSessionInfo()
      refreshStorageInfo()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleTestSignOut = async () => {
    try {
      console.log('🧪 Testing sign out functionality...')
      await signOut()
      console.log('✅ Sign out test completed')
    } catch (error) {
      console.error('❌ Sign out test failed:', error)
    }
  }

  const handleForceReset = async () => {
    try {
      console.log('💥 Testing force auth reset...')
      await forceAuthReset()
      console.log('✅ Force reset completed')
    } catch (error) {
      console.error('❌ Force reset failed:', error)
    }
  }

  const handleMCPSignOut = async () => {
    try {
      console.log('🔍 Testing MCP-validated sign out...')
      await mcpValidatedSignOut()
      console.log('✅ MCP sign out completed')
    } catch (error) {
      console.error('❌ MCP sign out failed:', error)
    }
  }

  const handleMCPValidation = async () => {
    try {
      console.log('🔍 Testing MCP session validation...')
      const isValid = await mcpValidateSession()
      console.log(`✅ MCP validation result: ${isValid ? 'VALID' : 'INVALID'}`)
    } catch (error) {
      console.error('❌ MCP validation failed:', error)
    }
  }

  const handleClearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      console.log('🗑️ All storage cleared manually')
      refreshStorageInfo()
    }
  }

  const handleClearQueryCache = () => {
    if (typeof window !== 'undefined' && (window as any).__REACT_QUERY_CLIENT__) {
      const queryClient = (window as any).__REACT_QUERY_CLIENT__
      queryClient.clear()
      console.log('🗑️ Query cache cleared manually')
    }
  }

  const handleRefreshInfo = () => {
    refreshSessionInfo()
    refreshStorageInfo()
    console.log('🔄 Debug info refreshed')
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Enhanced Auth Debug Panel (SSR)
          </CardTitle>
          <CardDescription>
            Comprehensive authentication debugging with @supabase/ssr
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Refresh Button */}
          <Button 
            onClick={handleRefreshInfo}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Debug Info
          </Button>

          {/* Auth Status */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Auth Store Status
            </h4>
            <div className="text-sm space-y-1 bg-muted p-3 rounded">
              <div className="flex items-center gap-2">
                Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              <div>User ID: {user?.id || 'None'}</div>
              <div>Email: {user?.email || 'None'}</div>
              <div>Profile: {profile?.full_name || 'None'}</div>
            </div>
          </div>

          {/* Session Info */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Supabase Session Info
            </h4>
            <div className="text-sm bg-muted p-3 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
          </div>

          {/* Storage Info */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Browser Storage
            </h4>
            <div className="text-sm bg-muted p-3 rounded">
              <div>Local Storage Keys: {storageInfo.localStorage?.length || 0} total ({storageInfo.totalLocalStorage} total keys)</div>
              <div>Session Storage Keys: {storageInfo.sessionStorage?.length || 0} total ({storageInfo.totalSessionStorage} total keys)</div>
              {storageInfo.localStorage?.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Auth-related localStorage keys:</div>
                  <ul className="list-disc list-inside ml-2">
                    {storageInfo.localStorage.map((key: string) => (
                      <li key={key}>{key}</li>
                    ))}
                  </ul>
                </div>
              )}
              {storageInfo.sessionStorage?.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Auth-related sessionStorage keys:</div>
                  <ul className="list-disc list-inside ml-2">
                    {storageInfo.sessionStorage.map((key: string) => (
                      <li key={key}>{key}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            <h4 className="font-medium">Sign Out Tests</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleTestSignOut}
                variant="destructive"
                disabled={!isAuthenticated}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Test Sign Out
              </Button>
              
              <Button 
                onClick={handleMCPSignOut}
                variant="destructive"
                className="bg-blue-600 hover:bg-blue-700"
              >
                🔍 MCP Sign Out
              </Button>

              <Button 
                onClick={handleForceReset}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                💥 Force Reset
              </Button>

              <Button 
                onClick={handleMCPValidation}
                variant="outline"
              >
                🔍 MCP Validate
              </Button>
              
              <Button 
                onClick={handleClearLocalStorage}
                variant="outline"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Storage
              </Button>
              
              <Button 
                onClick={handleClearQueryCache}
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside mt-1">
              <li>Open browser console to see detailed debug logs</li>
              <li>Session info refreshes automatically every 5 seconds</li>
              <li>Use "Clear Storage" to manually clear all auth data</li>
              <li>"Force Reset" performs nuclear option cleanup</li>
              <li>"MCP Validate" tests database-level auth validation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
