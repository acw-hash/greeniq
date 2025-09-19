import { Suspense } from 'react'
import { CurrentJobsList } from '@/components/jobs/CurrentJobsList'

export default function CurrentJobsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Current Jobs</h1>
        <p className="text-muted-foreground">Track progress on active jobs</p>
      </div>
      
      <Suspense fallback={<div>Loading current jobs...</div>}>
        <CurrentJobsList />
      </Suspense>
    </div>
  )
}
