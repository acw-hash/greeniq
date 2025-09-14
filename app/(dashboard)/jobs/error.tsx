'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Jobs page error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Error Loading Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an error while loading the jobs page. This could be due to a network issue or a temporary server problem.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                Error details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => reset()} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>If this problem persists, please try:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Refreshing the page</li>
              <li>Checking your internet connection</li>
              <li>Clearing your browser cache</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

