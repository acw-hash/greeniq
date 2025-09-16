"use client"

import { User, MapPin, Phone, Mail, Star, Award, Calendar, Building } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ProfileAvatar, getInitials } from './ProfileAvatar'
import type { Database } from '@/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type GolfCourseProfile = Database['public']['Tables']['golf_course_profiles']['Row']
type ProfessionalProfile = Database['public']['Tables']['professional_profiles']['Row']

interface ProfileCardProps {
  profile: Profile
  golfCourseProfile?: GolfCourseProfile | null
  professionalProfile?: ProfessionalProfile | null
  completionProgress?: number
  isOwner?: boolean
  onEdit?: () => void
  className?: string
}

export function ProfileCard({
  profile,
  golfCourseProfile,
  professionalProfile,
  completionProgress,
  isOwner = false,
  onEdit,
  className
}: ProfileCardProps) {
  const formatLocation = (location: any) => {
    if (!location) return null
    // Handle PostGIS point format
    if (typeof location === 'string') {
      return 'Location available'
    }
    return 'Location available'
  }

  const renderGolfCourseDetails = () => {
    if (!golfCourseProfile) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{golfCourseProfile.course_name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {golfCourseProfile.course_type?.replace('_', ' ')} Course
            </p>
          </div>
        </div>

        {golfCourseProfile.description && (
          <p className="text-sm text-muted-foreground">
            {golfCourseProfile.description}
          </p>
        )}

        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{golfCourseProfile.address}</span>
        </div>

        {golfCourseProfile.facilities && Object.keys(golfCourseProfile.facilities as object).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Facilities</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(golfCourseProfile.facilities as Record<string, any>)
                .filter(([_, value]) => value === true)
                .map(([key]: [string, any]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {golfCourseProfile.preferred_qualifications && golfCourseProfile.preferred_qualifications.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Preferred Qualifications</p>
            <div className="flex flex-wrap gap-1">
              {golfCourseProfile.preferred_qualifications.map((qual: string) => (
                <Badge key={qual} variant="outline" className="text-xs">
                  {qual.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderProfessionalDetails = () => {
    if (!professionalProfile) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium capitalize">
              {professionalProfile.experience_level || 'Unknown'} Level
            </span>
          </div>
          {professionalProfile.rating && professionalProfile.rating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {professionalProfile.rating?.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({professionalProfile.total_jobs || 0} jobs)
              </span>
            </div>
          )}
        </div>

        {professionalProfile.bio && (
          <p className="text-sm text-muted-foreground">
            {professionalProfile.bio}
          </p>
        )}

        {professionalProfile.hourly_rate && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Hourly Rate</span>
            <span className="text-lg font-bold text-green-600">
              ${professionalProfile.hourly_rate}/hr
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Within {professionalProfile.travel_radius || 25} miles
          </span>
        </div>

        {professionalProfile.specializations && professionalProfile.specializations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Specializations</p>
            <div className="flex flex-wrap gap-1">
              {professionalProfile.specializations.map((spec: string) => (
                <Badge key={spec} variant="default" className="text-xs">
                  {spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {professionalProfile.equipment_skills && professionalProfile.equipment_skills.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Equipment Skills</p>
            <div className="flex flex-wrap gap-1">
              {professionalProfile.equipment_skills.map((skill: string) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <ProfileAvatar
              src={profile.avatar_url}
              alt={`${profile.full_name}'s profile picture`}
              size="lg"
              fallbackInitials={getInitials(profile.full_name)}
              showBorder={true}
            />
            <div>
              <CardTitle className="text-xl">{profile.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {profile.user_type?.replace('_', ' ')}
                {profile.is_verified && (
                  <Award className="inline h-4 w-4 ml-1 text-blue-500" />
                )}
              </p>
            </div>
          </div>
          {isOwner && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Profile
            </Button>
          )}
        </div>

        {/* Completion Progress for owner */}
        {isOwner && typeof completionProgress === 'number' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Profile Completion</span>
              <span className="font-medium">{completionProgress}%</span>
            </div>
            <Progress value={completionProgress} className="h-2" />
            {completionProgress < 80 && (
              <p className="text-xs text-muted-foreground">
                Complete your profile to appear in more search results
              </p>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {profile.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.phone}</span>
            </div>
          )}
          {profile.location && typeof profile.location === 'string' ? (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatLocation(profile.location)}</span>
            </div>
          ) : null}
        </div>

        {/* Role-specific details */}
        {profile.user_type === 'golf_course' && renderGolfCourseDetails()}
        {profile.user_type === 'professional' && renderProfessionalDetails()}

        {/* Member since */}
        <div className="flex items-center space-x-2 pt-4 border-t">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown date'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
