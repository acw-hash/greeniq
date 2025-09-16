'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  /** Logo variant to display */
  variant?: 'full' | 'mark-only' | 'text-only'
  /** Size of the logo */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Additional CSS classes */
  className?: string
  /** Whether the logo should be clickable and link to dashboard/home */
  clickable?: boolean
  /** Custom href for the link (defaults to /dashboard for authenticated users, / for others) */
  href?: string
  /** Whether to show fallback text if image fails to load */
  showFallback?: boolean
}

const logoSizes = {
  sm: 'h-6',   // 24px height - very compact spaces
  md: 'h-8',   // 32px height - sidebar navigation
  lg: 'h-10',  // 40px height - main header
  xl: 'h-12',  // 48px height - auth pages
  '2xl': 'h-16' // 64px height - hero sections
}

const textSizes = {
  sm: 'text-sm font-bold',
  md: 'text-xl font-bold', 
  lg: 'text-2xl font-bold',
  xl: 'text-3xl font-bold',
  '2xl': 'text-4xl font-bold'
}

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  clickable = false,
  href,
  showFallback = true 
}: LogoProps) {
  const logoClasses = cn(logoSizes[size], 'w-auto', className)
  const textClasses = cn(textSizes[size], 'text-gray-900 dark:text-white')

  const LogoContent = () => {
    switch (variant) {
      case 'mark-only':
        return (
          <div className="flex items-center">
            <Image
              src="/images/greeniq-logo.png"
              alt="GreenIQ"
              width={160}
              height={40}
              className={logoClasses}
              priority={size === 'lg' || size === 'xl'}
              onError={(e) => {
                if (showFallback) {
                  // Fallback to initials if image fails
                  const target = e.target as HTMLElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }
              }}
            />
            {showFallback && (
              <div 
                className={cn(
                  'hidden items-center justify-center bg-primary rounded-lg text-white font-bold',
                  size === 'sm' ? 'w-6 h-6 text-xs' : 
                  size === 'md' ? 'w-8 h-8 text-xs' :
                  size === 'lg' ? 'w-10 h-10 text-sm' :
                  size === 'xl' ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'
                )}
                style={{ display: 'none' }}
              >
                GI
              </div>
            )}
          </div>
        )
      
      case 'text-only':
        return (
          <span className={textClasses}>
            GreenIQ
          </span>
        )
      
      case 'full':
      default:
        return (
          <div className="flex items-center space-x-2">
            <Image
              src="/images/greeniq-logo.png"
              alt="GreenIQ"
              width={160}
              height={40}
              className={logoClasses}
              priority={size === 'lg' || size === 'xl'}
              onError={(e) => {
                if (showFallback) {
                  // Fallback to icon + text if full logo fails
                  const target = e.target as HTMLElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }
              }}
            />
            {showFallback && (
              <div 
                className="hidden items-center space-x-2"
                style={{ display: 'none' }}
              >
                <div 
                  className={cn(
                    'flex items-center justify-center bg-primary rounded-lg text-white font-bold',
                    size === 'sm' ? 'w-6 h-6 text-xs' : 
                    size === 'md' ? 'w-8 h-8 text-xs' :
                    size === 'lg' ? 'w-10 h-10 text-sm' :
                    size === 'xl' ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'
                  )}
                >
                  GI
                </div>
                <span className={textClasses}>GreenIQ</span>
              </div>
            )}
          </div>
        )
    }
  }

  if (clickable) {
    const linkHref = href || '/dashboard'
    return (
      <Link href={linkHref} className="flex items-center">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

// Convenience components for common use cases
export function HeaderLogo({ className, ...props }: Omit<LogoProps, 'variant' | 'size'>) {
  return (
    <Logo 
      variant="full" 
      size="lg" 
      clickable 
      className={className}
      {...props} 
    />
  )
}

export function SidebarLogo({ className, ...props }: Omit<LogoProps, 'variant' | 'size'>) {
  return (
    <Logo 
      variant="full" 
      size="md" 
      clickable 
      className={className}
      {...props} 
    />
  )
}

export function AuthPageLogo({ className, ...props }: Omit<LogoProps, 'variant' | 'size'>) {
  return (
    <Logo 
      variant="full" 
      size="xl" 
      className={className}
      {...props} 
    />
  )
}

export function FooterLogo({ className, ...props }: Omit<LogoProps, 'variant' | 'size'>) {
  return (
    <Logo 
      variant="full" 
      size="md" 
      className={className}
      {...props} 
    />
  )
}
