"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Eye, EyeOff, User, Database, AlertCircle } from 'lucide-react'

export function AuthDebugger() {
  const [isVisible, setIsVisible] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  const authStore = useAuthStore()
  const supabase = createClient()

  const refreshDebugData = async () => {
    try {
      setError(null)
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setError(`Session Error: ${sessionError.message}`)
        return
      }
      
      setSessionData(session)
      
      // If we have a user, try to get their profile
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            golf_course_profiles(*),
            professional_profiles(*)
          `)
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          setError(`Profile Error: ${profileError.message} (Code: ${profileError.code})`)
        } else {
          setProfileData(profile)
        }
      } else {
        setProfileData(null)
      }
      
      setLastRefresh(new Date())
    } catch (error: any) {
      setError(`Unexpected Error: ${error.message}`)
    }
  }

  useEffect(() => {
    if (isVisible) {
      refreshDebugData()
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Eye className="h-4 w-4 mr-2" />
          Auth Debug
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card className="bg-white shadow-lg border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-blue-900">Auth Debugger</CardTitle>
              <CardDescription>
                Current authentication state
                {lastRefresh && (
                  <span className="text-xs block mt-1">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDebugData}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-8 w-8 p-0"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}
          
          {/* Auth Store State */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Auth Store State</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <Badge variant={authStore.isAuthenticated ? "default" : "secondary"}>
                  {authStore.isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <Badge variant={authStore.isLoading ? "destructive" : "secondary"}>
                  {authStore.isLoading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-xs">
                  {authStore.user?.id || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-xs">
                  {authStore.user?.email || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profile Type:</span>
                <span className="text-xs">
                  {authStore.profile?.user_type || 'None'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Session Data */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Supabase Session</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              {sessionData ? (
                <>
                  <div className="flex justify-between">
                    <span>Session:</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <span className="font-mono text-xs">
                      {sessionData.user?.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Confirmed:</span>
                    <Badge variant={sessionData.user?.email_confirmed_at ? "default" : "destructive"}>
                      {sessionData.user?.email_confirmed_at ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="text-xs">
                      {new Date(sessionData.expires_at * 1000).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">No session</div>
              )}
            </div>
          </div>
          
          {/* Profile Data */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Profile Data</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              {profileData ? (
                <>
                  <div className="flex justify-between">
                    <span>Profile:</span>
                    <Badge variant="default">Found</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Full Name:</span>
                    <span className="text-xs">{profileData.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Type:</span>
                    <Badge variant="outline">{profileData.user_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified:</span>
                    <Badge variant={profileData.is_verified ? "default" : "secondary"}>
                      {profileData.is_verified ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {profileData.golf_course_profiles?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-xs font-medium text-gray-700 mb-1">Golf Course:</div>
                      <div className="text-xs">{profileData.golf_course_profiles[0].course_name}</div>
                    </div>
                  )}
                  {profileData.professional_profiles?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-xs font-medium text-gray-700 mb-1">Professional:</div>
                      <div className="text-xs">Level: {profileData.professional_profiles[0].experience_level}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">No profile data</div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => authStore.refreshSession()}
              className="w-full"
            >
              Refresh Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => authStore.refreshProfile()}
              className="w-full"
            >
              Refresh Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
