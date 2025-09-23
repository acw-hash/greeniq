import { describe, it, expect } from 'vitest'

// Simple test to verify our components can be imported
describe('Component Import Tests', () => {
  it('should be able to import JobStatusFilter', async () => {
    const { JobStatusFilter } = await import('@/components/jobs/JobStatusFilter')
    expect(JobStatusFilter).toBeDefined()
  })

  it('should be able to import EnhancedJobCard', async () => {
    const { EnhancedJobCard } = await import('@/components/jobs/JobCard')
    expect(EnhancedJobCard).toBeDefined()
  })

  it('should be able to import EnhancedJobList', async () => {
    const { EnhancedJobList } = await import('@/components/jobs/EnhancedJobList')
    expect(EnhancedJobList).toBeDefined()
  })

  it('should be able to import JobWithApplicationStatus type', async () => {
    const { JobWithApplicationStatus } = await import('@/types/jobs')
    expect(JobWithApplicationStatus).toBeDefined()
  })

  it('should be able to import useJobsWithApplicationStatus hook', async () => {
    const { useJobsWithApplicationStatus } = await import('@/lib/hooks/useJobs')
    expect(useJobsWithApplicationStatus).toBeDefined()
  })
})
