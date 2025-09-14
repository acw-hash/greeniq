'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Something went wrong!</h2>
                  <p className="text-muted-foreground mt-2">
                    An unexpected error occurred. Our team has been notified.
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 text-left">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        Error details (development)
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {error.message}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => reset()}>
                    Try again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/'}
                  >
                    Go home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

