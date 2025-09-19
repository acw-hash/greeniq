'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { Send, ArrowLeft, MapPin, Clock, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface JobConversationProps {
  jobId: string
  conversationId: string
  initialConversation?: any
}

export function JobConversation({ jobId, conversationId, initialConversation }: JobConversationProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState('')

  // Fetch conversation details
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch conversation')
      return response.json()
    },
    initialData: initialConversation
  })

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    }
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, message_type: 'text' })
      })
      if (!response.ok) throw new Error('Failed to send message')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      setNewMessage('')
    }
  })

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const job = conversation?.jobs
  const courseProfile = conversation?.profiles_job_conversations_course_id_fkey
  const professionalProfile = conversation?.profiles_job_conversations_professional_id_fkey

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Job Conversation</h1>
            <p className="text-muted-foreground">{job?.title}</p>
          </div>
        </div>
        <Badge variant={job?.status === 'completed' ? 'default' : 'secondary'}>
          {job?.status}
        </Badge>
      </div>

      {/* Job Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {courseProfile?.golf_course_profiles?.course_name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">${job?.hourly_rate}/hour</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(job?.start_date), 'PPP')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={courseProfile?.avatar_url} />
                <AvatarFallback>
                  {courseProfile?.full_name?.charAt(0) || 'G'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{courseProfile?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {courseProfile?.golf_course_profiles?.course_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={professionalProfile?.avatar_url} />
                <AvatarFallback>
                  {professionalProfile?.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{professionalProfile?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {professionalProfile?.professional_profiles?.experience_level} Professional
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto space-y-4 mb-4">
            {messagesLoading ? (
              <div className="text-center text-muted-foreground">Loading messages...</div>
            ) : messages?.length === 0 ? (
              <div className="text-center text-muted-foreground">No messages yet</div>
            ) : (
              messages?.map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.sender_id === courseProfile?.id ? "justify-start" : "justify-end"
                  )}
                >
                  {message.sender_id === courseProfile?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={courseProfile?.avatar_url} />
                      <AvatarFallback>
                        {courseProfile?.full_name?.charAt(0) || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                      message.sender_id === courseProfile?.id
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender_id === courseProfile?.id
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    )}>
                      {format(new Date(message.created_at), 'PPp')}
                    </p>
                  </div>
                  
                  {message.sender_id === professionalProfile?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={professionalProfile?.avatar_url} />
                      <AvatarFallback>
                        {professionalProfile?.full_name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
