import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobCard from '@/components/jobs/JobCard'
import JobList from '@/components/jobs/JobList'
import JobSearch from '@/components/jobs/JobSearch'
import { Job } from '@/lib/stores/jobStore'

// Mock data
const mockJob: Job = {
  id: 'job-123',
  course_id: 'course-123',
  title: 'Greens Mowing and Maintenance',
  description: 'Regular maintenance of golf course greens including mowing, aeration, and fertilization.',
  job_type: 'greenskeeping',
  location: {
    lat: 37.7749,
    lng: -122.4194,
    address: '123 Golf Course Dr, San Francisco, CA'
  },
  start_date: '2024-12-01T09:00:00Z',
  end_date: '2024-12-01T17:00:00Z',
  hourly_rate: 25.50,
  required_certifications: ['Pesticide License', 'Equipment Certified'],
  required_experience: 'intermediate',
  status: 'open',
  urgency_level: 'normal',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  profiles: {
    id: 'course-123',
    full_name: 'Test Golf Course',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    golf_course_profiles: {
      course_name: 'Test Golf Course',
      course_type: 'public',
      address: '123 Golf Course Dr'
    }
  }
}

// Mock hooks
vi.mock('@/lib/hooks/useJobs', () => ({
  useJobSearch: vi.fn(() => ({
    data: {
      jobs: [mockJob],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      stats: { totalJobs: 1, averageRate: 25.50 }
    },
    isLoading: false,
    error: null,
    refetch: vi.fn()
  }))
}))

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Job Components', () => {
  describe('JobCard', () => {
    it('should render job card with correct information', () => {
      render(
        <TestWrapper>
          <JobCard job={mockJob} />
        </TestWrapper>
      )

      expect(screen.getByText('Greens Mowing and Maintenance')).toBeInTheDocument()
      expect(screen.getByText('$25.50/hr')).toBeInTheDocument()
      expect(screen.getByText('123 Golf Course Dr, San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('Normal')).toBeInTheDocument()
    })

    it('should render compact variant correctly', () => {
      render(
        <TestWrapper>
          <JobCard job={mockJob} variant="compact" />
        </TestWrapper>
      )

      expect(screen.getByText('Greens Mowing and Maintenance')).toBeInTheDocument()
      expect(screen.getByText('$25.50/hr')).toBeInTheDocument()
    })

    it('should render detailed variant correctly', () => {
      render(
        <TestWrapper>
          <JobCard job={mockJob} variant="detailed" />
        </TestWrapper>
      )

      expect(screen.getByText('Greens Mowing and Maintenance')).toBeInTheDocument()
      expect(screen.getByText('Job Description')).toBeInTheDocument()
      expect(screen.getByText('Regular maintenance of golf course greens including mowing, aeration, and fertilization.')).toBeInTheDocument()
    })

    it('should call onView when view button is clicked', () => {
      const onView = vi.fn()
      render(
        <TestWrapper>
          <JobCard job={mockJob} onView={onView} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('View'))
      expect(onView).toHaveBeenCalledWith(mockJob)
    })

    it('should call onApply when apply button is clicked', () => {
      const onApply = vi.fn()
      render(
        <TestWrapper>
          <JobCard job={mockJob} onApply={onApply} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Apply Now'))
      expect(onApply).toHaveBeenCalledWith(mockJob)
    })

    it('should show correct urgency badge color', () => {
      const highUrgencyJob = { ...mockJob, urgency_level: 'high' as const }
      render(
        <TestWrapper>
          <JobCard job={highUrgencyJob} />
        </TestWrapper>
      )

      const urgencyBadge = screen.getByText('High Priority')
      expect(urgencyBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    it('should show correct status badge color', () => {
      const inProgressJob = { ...mockJob, status: 'in_progress' as const }
      render(
        <TestWrapper>
          <JobCard job={inProgressJob} variant="detailed" />
        </TestWrapper>
      )

      const statusBadge = screen.getByText('In Progress')
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })
  })

  describe('JobList', () => {
    it('should render job list with search and filters', () => {
      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      expect(screen.getByPlaceholderText(/search jobs/i)).toBeInTheDocument()
      expect(screen.getByText('Job Type')).toBeInTheDocument()
      expect(screen.getByText('Urgency')).toBeInTheDocument()
    })

    it('should render jobs in grid layout by default', () => {
      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      const jobCard = screen.getByText('Greens Mowing and Maintenance')
      expect(jobCard).toBeInTheDocument()
    })

    it('should switch to list view when list button is clicked', () => {
      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      const listButton = screen.getByRole('button', { name: /list/i })
      fireEvent.click(listButton)

      // Should still show the job but in list format
      expect(screen.getByText('Greens Mowing and Maintenance')).toBeInTheDocument()
    })

    it('should show advanced filters when more filters is clicked', () => {
      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      const moreFiltersButton = screen.getByText('More Filters')
      fireEvent.click(moreFiltersButton)

      expect(screen.getByText('Experience Level')).toBeInTheDocument()
      expect(screen.getByText('Search Radius')).toBeInTheDocument()
    })

    it('should clear filters when clear all is clicked', () => {
      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      // Set a filter first
      const searchInput = screen.getByPlaceholderText(/search jobs/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Clear filters
      const clearButton = screen.getByText('Clear All')
      fireEvent.click(clearButton)

      expect(searchInput).toHaveValue('')
    })

    it('should show empty state when no jobs found', () => {
      vi.mocked(require('@/lib/hooks/useJobs').useJobSearch).mockReturnValue({
        data: { jobs: [], pagination: { total: 0 }, stats: {} },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      expect(screen.getByText('No jobs found')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      vi.mocked(require('@/lib/hooks/useJobs').useJobSearch).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      })

      render(
        <TestWrapper>
          <JobList />
        </TestWrapper>
      )

      // Should show skeleton loaders
      expect(screen.getByTestId('job-list-skeleton')).toBeInTheDocument()
    })
  })

  describe('JobSearch', () => {
    it('should render search interface', () => {
      render(
        <TestWrapper>
          <JobSearch />
        </TestWrapper>
      )

      expect(screen.getByText('Find Your Next Job')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search for jobs/i)).toBeInTheDocument()
      expect(screen.getByText('Job Type')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
    })

    it('should show popular searches', () => {
      render(
        <TestWrapper>
          <JobSearch />
        </TestWrapper>
      )

      expect(screen.getByText('Popular Searches')).toBeInTheDocument()
      expect(screen.getByText('Greenskeeping')).toBeInTheDocument()
      expect(screen.getByText('Irrigation Systems')).toBeInTheDocument()
    })

    it('should show trending locations', () => {
      render(
        <TestWrapper>
          <JobSearch />
        </TestWrapper>
      )

      expect(screen.getByText('Trending Locations')).toBeInTheDocument()
      expect(screen.getByText('Pebble Beach, CA')).toBeInTheDocument()
      expect(screen.getByText('Augusta, GA')).toBeInTheDocument()
    })

    it('should handle quick search clicks', () => {
      const onJobSelect = vi.fn()
      render(
        <TestWrapper>
          <JobSearch onJobSelect={onJobSelect} />
        </TestWrapper>
      )

      const greenskeepingButton = screen.getByText('Greenskeeping')
      fireEvent.click(greenskeepingButton)

      // Should update the job type filter
      expect(screen.getByDisplayValue('greenskeeping')).toBeInTheDocument()
    })

    it('should show advanced filters when advanced button is clicked', () => {
      render(
        <TestWrapper>
          <JobSearch />
        </TestWrapper>
      )

      const advancedButton = screen.getByText('Advanced')
      fireEvent.click(advancedButton)

      expect(screen.getByText('Min Rate ($/hr)')).toBeInTheDocument()
      expect(screen.getByText('Max Rate ($/hr)')).toBeInTheDocument()
      expect(screen.getByText('Experience Level')).toBeInTheDocument()
    })

    it('should clear filters when clear all is clicked', () => {
      render(
        <TestWrapper>
          <JobSearch />
        </TestWrapper>
      )

      // Set some filters
      const searchInput = screen.getByPlaceholderText(/search for jobs/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Clear filters
      const clearButton = screen.getByText('Clear All')
      fireEvent.click(clearButton)

      expect(searchInput).toHaveValue('')
    })

    it('should show search results when available', () => {
      render(
        <TestWrapper>
          <JobSearch />
        </TestWrapper>
      )

      expect(screen.getByText('Search Results')).toBeInTheDocument()
      expect(screen.getByText('1 jobs found')).toBeInTheDocument()
      expect(screen.getByText('Average Rate')).toBeInTheDocument()
      expect(screen.getByText('$25.50/hr')).toBeInTheDocument()
    })

    it('should handle job selection', () => {
      const onJobSelect = vi.fn()
      render(
        <TestWrapper>
          <JobSearch onJobSelect={onJobSelect} />
        </TestWrapper>
      )

      const jobTitle = screen.getByText('Greens Mowing and Maintenance')
      fireEvent.click(jobTitle)

      expect(onJobSelect).toHaveBeenCalledWith(mockJob)
    })
  })
})
