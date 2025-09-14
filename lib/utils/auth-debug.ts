/**
 * Authentication debugging utilities
 * Use these functions during development to diagnose auth issues
 */

export function debugAuthStorage() {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment')
    return
  }

  console.log('🔍 === AUTH STORAGE DEBUG ===')
  
  // Check localStorage
  console.log('📦 localStorage:')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      const isAuthRelated = key.includes('supabase') || key.includes('auth') || key.includes('user')
      
      if (isAuthRelated) {
        console.log(`  🔑 ${key}: ${value?.substring(0, 200)}${value && value.length > 200 ? '...' : ''}`)
      }
    }
  }
  
  // Check sessionStorage
  console.log('💾 sessionStorage:')
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) {
      const value = sessionStorage.getItem(key)
      const isAuthRelated = key.includes('supabase') || key.includes('auth') || key.includes('user')
      
      if (isAuthRelated) {
        console.log(`  🔑 ${key}: ${value?.substring(0, 200)}${value && value.length > 200 ? '...' : ''}`)
      }
    }
  }
  
  // Check cookies
  console.log('🍪 Cookies:')
  const cookies = document.cookie.split(';')
  cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && (name.includes('supabase') || name.includes('auth') || name.includes('token'))) {
      console.log(`  🔑 ${name}: ${value?.substring(0, 100)}${value && value.length > 100 ? '...' : ''}`)
    }
  })
  
  console.log('🔍 === END AUTH STORAGE DEBUG ===')
}

export function clearAllAuthStorage() {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment')
    return
  }

  console.log('🧹 === CLEARING ALL AUTH STORAGE ===')
  
  // Clear localStorage
  const localStorageKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('supabase') || key.includes('auth') || key.includes('user'))) {
      localStorageKeys.push(key)
    }
  }
  
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key)
    console.log(`  🗑️ Removed localStorage: ${key}`)
  })
  
  // Clear sessionStorage
  const sessionStorageKeys = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && (key.includes('supabase') || key.includes('auth') || key.includes('user'))) {
      sessionStorageKeys.push(key)
    }
  }
  
  sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key)
    console.log(`  🗑️ Removed sessionStorage: ${key}`)
  })
  
  // Clear auth-related cookies
  const cookies = document.cookie.split(';')
  cookies.forEach(cookie => {
    const [name] = cookie.trim().split('=')
    if (name && (name.includes('supabase') || name.includes('auth') || name.includes('token'))) {
      // Clear cookie by setting it to expire
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      console.log(`  🗑️ Cleared cookie: ${name}`)
    }
  })
  
  console.log('✅ All auth storage cleared')
  console.log('🧹 === END CLEARING AUTH STORAGE ===')
}

export async function debugSupabaseSession() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    console.log('🔍 === SUPABASE SESSION DEBUG ===')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('📊 Session Data:', {
      hasSession: !!session,
      hasError: !!error,
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at,
      isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : null,
      accessToken: session?.access_token ? `${session.access_token.substring(0, 50)}...` : null,
      refreshToken: session?.refresh_token ? `${session.refresh_token.substring(0, 50)}...` : null
    })
    
    if (error) {
      console.error('❌ Session Error:', error)
    }
    
    console.log('🔍 === END SUPABASE SESSION DEBUG ===')
    
    return { session, error }
  } catch (error) {
    console.error('❌ Failed to debug Supabase session:', error)
    return { session: null, error }
  }
}

// Global functions for easy console access during development
if (typeof window !== 'undefined') {
  (window as any).debugAuthStorage = debugAuthStorage;
  (window as any).clearAllAuthStorage = clearAllAuthStorage;
  (window as any).debugSupabaseSession = debugSupabaseSession;
  
  console.log('🛠️ Auth debug utilities available:')
  console.log('  - debugAuthStorage()')
  console.log('  - clearAllAuthStorage()')
  console.log('  - debugSupabaseSession()')
}
