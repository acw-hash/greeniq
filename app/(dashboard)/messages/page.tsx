'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, MapPin, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/authStore'

export default function MessagesPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/messages')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      return response.json()
    },
    enabled: !!user
  })

  if (!user) return null

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Manage your conversations with golf courses and professionals.
            </p>
          </div>
          <div className="text-center py-8">Loading conversations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Manage your conversations with golf courses and professionals.
            </p>
          </div>
          <div className="text-center py-8 text-red-600">
            Error loading conversations: {error.message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Manage your conversations with golf courses and professionals.
          </p>
        </div>
        
        {conversations && conversations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No conversations yet</h3>
                  <p className="text-muted-foreground">
                    {profile?.user_type === 'professional' 
                      ? "You'll see conversations here once a golf course accepts your application and you confirm the job."
                      : "You'll see conversations here once you accept an application and the professional confirms the job."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {conversations?.map((conversation: any) => (
              <Card 
                key={conversation.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/messages/${conversation.job_id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {profile?.user_type === 'golf_course' 
                            ? conversation.professional?.full_name?.charAt(0) || 'P'
                            : conversation.course?.full_name?.charAt(0) || 'G'
                          }
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg truncate">
                            {profile?.user_type === 'golf_course' 
                              ? conversation.professional?.full_name
                              : conversation.course?.golf_course_profiles?.course_name
                            }
                          </h3>
                          <Badge variant="outline">
                            {conversation.jobs?.status}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          {conversation.jobs?.title}
                        </h4>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {profile?.user_type === 'golf_course' 
                                ? conversation.professional?.professional_profiles?.experience_level
                                : conversation.course?.golf_course_profiles?.course_name
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {conversation.latest_message 
                                ? format(new Date(conversation.latest_message.created_at), 'MMM d, h:mm a')
                                : format(new Date(conversation.created_at), 'MMM d, h:mm a')
                              }
                            </span>
                          </div>
                        </div>
                        
                        {conversation.latest_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.latest_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
