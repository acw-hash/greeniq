import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JobsPage from '@/app/(dashboard)/jobs/page'
import BrowseJobsPage from '@/components/jobs/BrowseJobsPage'
import MyJobsPage from '@/components/jobs/MyJobsPage'

// Mock the auth provider
const mockUseAuth = vi.fn()

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock the jobs hook
vi.mock('@/lib/hooks/useJobs', () => ({
  useJobs: vi.fn(() => ({
    data: { jobs: [] },
    isLoading: false,
  })),
}))

// Mock the auth store
vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
    profile: null,
  })),
}))

describe('Job Browsing Pages', () => {
  describe('JobsPage Routing', () => {
    it('should show MyJobsPage for golf course users', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'golf_course' },
      })

      render(<JobsPage />)
      
      // Should render MyJobsPage content
      expect(screen.getByText('My Jobs')).toBeInTheDocument()
      expect(screen.getByText('Manage your posted maintenance jobs')).toBeInTheDocument()
      expect(screen.getByText('Post New Job')).toBeInTheDocument()
    })

    it('should show BrowseJobsPage for professional users', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'professional' },
      })

      render(<JobsPage />)
      
      // Should render BrowseJobsPage content
      expect(screen.getByText('Find Jobs')).toBeInTheDocument()
      expect(screen.getByText('Discover golf course maintenance opportunities near you')).toBeInTheDocument()
    })

    it('should show loading state when profile is not loaded', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
      })

      render(<JobsPage />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should show access denied for unknown user types', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'unknown' },
      })

      render(<JobsPage />)
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument()
    })
  })

  describe('BrowseJobsPage for Professionals', () => {
    it('should render job discovery interface', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'professional' },
      })

      render(<BrowseJobsPage />)
      
      // Should have search and filters
      expect(screen.getByPlaceholderText('Search jobs...')).toBeInTheDocument()
      expect(screen.getByText('Job Type')).toBeInTheDocument()
      expect(screen.getByText('Min Rate')).toBeInTheDocument()
      expect(screen.getByText('Distance')).toBeInTheDocument()
      
      // Should have proper title
      expect(screen.getByText('Find Jobs')).toBeInTheDocument()
      expect(screen.getByText('Discover golf course maintenance opportunities near you')).toBeInTheDocument()
    })

    it('should not show edit or post job buttons', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'professional' },
      })

      render(<BrowseJobsPage />)
      
      // Should NOT have golf course specific buttons
      expect(screen.queryByText('Post New Job')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('MyJobsPage for Golf Courses', () => {
    it('should render job management interface', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'golf_course' },
      })

      render(<MyJobsPage />)
      
      // Should have job management features
      expect(screen.getByText('My Jobs')).toBeInTheDocument()
      expect(screen.getByText('Manage your posted maintenance jobs')).toBeInTheDocument()
      expect(screen.getByText('Post New Job')).toBeInTheDocument()
      
      // Should have stats cards
      expect(screen.getByText('Total Jobs')).toBeInTheDocument()
      expect(screen.getByText('Open Jobs')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should show job management tabs', () => {
      mockUseAuth.mockReturnValue({
        profile: { user_type: 'golf_course' },
      })

      render(<MyJobsPage />)
      
      // Should have status tabs
      expect(screen.getByText('All Jobs')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })
})
