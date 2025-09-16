"use client"

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface ProfileAvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackInitials?: string
  showBorder?: boolean
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-24 h-24 text-lg',
  xl: 'w-32 h-32 text-xl'
}

export function ProfileAvatar({
  src,
  alt = 'Profile picture',
  size = 'md',
  className,
  fallbackInitials,
  showBorder = true,
  onClick
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  const shouldShowImage = src && !imageError
  const isClickable = !!onClick

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center',
        sizeClasses[size],
        showBorder && 'border-2 border-gray-200',
        isClickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {shouldShowImage ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </>
      ) : (
        /* Fallback Display */
        <div className="flex items-center justify-center w-full h-full">
          {fallbackInitials ? (
            <span className="font-semibold text-gray-600 uppercase select-none">
              {fallbackInitials.slice(0, 2)}
            </span>
          ) : (
            <User 
              className={cn(
                'text-gray-400',
                size === 'sm' && 'w-4 h-4',
                size === 'md' && 'w-6 h-6',
                size === 'lg' && 'w-12 h-12',
                size === 'xl' && 'w-16 h-16'
              )} 
            />
          )}
        </div>
      )}
    </div>
  )
}

// Utility function to get initials from name
export function getInitials(name?: string | null): string {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
