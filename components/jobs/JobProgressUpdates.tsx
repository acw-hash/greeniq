'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronDown, ChevronUp, Camera } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { JobUpdate } from '@/types/jobs'

interface JobProgressUpdatesProps {
  jobId: string
  updates: JobUpdate[]
  showAll?: boolean
}

export function JobProgressUpdates({ 
  jobId, 
  updates, 
  showAll = false 
}: JobProgressUpdatesProps) {
  const [expanded, setExpanded] = useState(showAll)
  
  const displayUpdates = expanded ? updates : updates.slice(-2)

  const getMilestoneColor = (milestone?: string) => {
    switch (milestone) {
      case 'started': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'awaiting_review': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">No updates yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Progress Updates</CardTitle>
          {updates.length > 2 && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
              ) : (
                <>Show All ({updates.length}) <ChevronDown className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayUpdates.map((update, index) => (
            <div key={update.id} className="flex gap-3 pb-4 border-b last:border-b-0">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Professional</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(update.created_at))} ago
                  </span>
                  {update.milestone && (
                    <Badge className={getMilestoneColor(update.milestone)}>
                      {update.milestone.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                
                {update.content && (
                  <p className="text-sm text-gray-700 mb-2">
                    {update.content}
                  </p>
                )}
                
                {update.photo_urls && update.photo_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {update.photo_urls.map((url, photoIndex) => (
                      <div key={photoIndex} className="relative aspect-video">
                        <Image
                          src={url}
                          alt={`Update photo ${photoIndex + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
