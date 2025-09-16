"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Briefcase, 
  MessageSquare, 
  User, 
  Settings,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  Plus
} from 'lucide-react'

const golfCourseNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/jobs/create', label: 'Post a Job', icon: Plus },
  { href: '/applications', label: 'Applications', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
]

const professionalNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jobs', label: 'Find Jobs', icon: Briefcase },
  { href: '/applications', label: 'My Applications', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/payments', label: 'Earnings', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
]

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface NavigationProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Navigation({ isOpen, onClose }: NavigationProps) {
  const pathname = usePathname()
  const { profile } = useAuth()

  const getNavItems = () => {
    switch (profile?.user_type) {
      case 'golf_course':
        return golfCourseNavItems
      case 'professional':
        return professionalNavItems
      case 'admin':
        return adminNavItems
      default:
        return golfCourseNavItems
    }
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <nav className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 w-64 transform transition-transform duration-200 ease-in-out z-50 md:translate-x-0 md:static md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Navigation Menu */}
        <div className="pt-4 px-4 pb-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
