"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HeaderLogo } from '@/components/ui/Logo'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useNotifications } from '@/lib/hooks/useNotifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  Menu, 
  User, 
  Settings, 
  LogOut,
  MessageSquare,
  Briefcase
} from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSignOut = async () => {
    try {
      console.log('🔓 Sign out initiated from Header')
      await signOut()
      console.log('✅ Sign out completed, redirecting...')
      
      // Force a hard redirect to ensure clean state
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      // Still redirect on error to prevent user staying in protected area
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      } else {
        router.push('/')
      }
    }
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <HeaderLogo />
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {profile?.user_type === 'golf_course' && (
              <Link href="/jobs/create">
                <Button size="sm">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
              </Link>
            )}
            
            <Link href="/messages">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </Link>
          </div>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {profile?.user_type?.replace('_', ' ')}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </header>
  )
}
