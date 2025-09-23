import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { JobStatusFilter } from '@/components/jobs/JobStatusFilter'
import { EnhancedJobCard } from '@/components/jobs/JobCard'
import { EnhancedJobList } from '@/components/jobs/EnhancedJobList'
import { JobWithApplicationStatus } from '@/types/jobs'

// Mock data for testing
const mockJobWithApplication: JobWithApplicationStatus = {
  id: 'job-1',
  title: 'Greenskeeping Job',
  description: 'Maintain golf course greens',
  job_type: 'greenskeeping',
  location: { address: '123 Golf St', lat: 40.7128, lng: -74.0060 },
  start_date: '2024-01-15',
  end_date: null,
  hourly_rate: 25,
  required_certifications: ['pesticide_license'],
  required_experience: 'intermediate',
  urgency_level: 'normal',
  status: 'open',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  golf_course_id: 'course-1',
  hasApplied: true,
  userApplication: {
    id: 'app-1',
    job_id: 'job-1',
    professional_id: 'prof-1',
    status: 'pending',
    message: 'I am interested in this position',
    proposed_rate: 25,
    applied_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  golf_course_profiles: {
    course_name: 'Test Golf Course',
    location: 'Test Location'
  }
}

const mockJobWithoutApplication: JobWithApplicationStatus = {
  id: 'job-2',
  title: 'Equipment Operation Job',
  description: 'Operate golf course equipment',
  job_type: 'equipment_operation',
  location: { address: '456 Golf Ave', lat: 40.7128, lng: -74.0060 },
  start_date: '2024-01-20',
  end_date: null,
  hourly_rate: 30,
  required_certifications: ['equipment_certified'],
  required_experience: 'expert',
  urgency_level: 'high',
  status: 'open',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  golf_course_id: 'course-2',
  hasApplied: false,
  userApplication: null,
  golf_course_profiles: {
    course_name: 'Another Golf Course',
    location: 'Another Location'
  }
}

describe('Application Status Filter Components', () => {
  describe('JobStatusFilter', () => {
    it('should render filter buttons with correct counts', () => {
      const mockOnFilterChange = vi.fn()
      
      render(
        <JobStatusFilter
          onFilterChange={mockOnFilterChange}
          currentFilter="all"
          appliedCount={5}
          notAppliedCount={10}
        />
      )
      
      expect(screen.getByText('All Jobs')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument() // 5 + 10
      expect(screen.getByText('Available to Apply')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Applied')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should call onFilterChange when buttons are clicked', () => {
      const mockOnFilterChange = vi.fn()
      
      render(
        <JobStatusFilter
          onFilterChange={mockOnFilterChange}
          currentFilter="all"
          appliedCount={5}
          notAppliedCount={10}
        />
      )
      
      fireEvent.click(screen.getByText('Applied'))
      expect(mockOnFilterChange).toHaveBeenCalledWith('applied')
      
      fireEvent.click(screen.getByText('Available to Apply'))
      expect(mockOnFilterChange).toHaveBeenCalledWith('not_applied')
    })

    it('should highlight the current filter', () => {
      const mockOnFilterChange = vi.fn()
      
      render(
        <JobStatusFilter
          onFilterChange={mockOnFilterChange}
          currentFilter="applied"
          appliedCount={5}
          notAppliedCount={10}
        />
      )
      
      const appliedButton = screen.getByText('Applied').closest('button')
      expect(appliedButton).toHaveClass('bg-primary') // default variant for active filter
    })
  })

  describe('EnhancedJobCard', () => {
    it('should show application status badge for applied jobs', () => {
      render(
        <EnhancedJobCard
          job={mockJobWithApplication}
          onApply={vi.fn()}
        />
      )
      
      expect(screen.getByText('Applied')).toBeInTheDocument()
    })

    it('should show disabled button for applied jobs', () => {
      render(
        <EnhancedJobCard
          job={mockJobWithApplication}
          onApply={vi.fn()}
        />
      )
      
      const button = screen.getByText('Application Pending')
      expect(button).toBeDisabled()
    })

    it('should show apply button for non-applied jobs', () => {
      render(
        <EnhancedJobCard
          job={mockJobWithoutApplication}
          onApply={vi.fn()}
        />
      )
      
      const button = screen.getByText('Apply Now')
      expect(button).not.toBeDisabled()
    })

    it('should call onApply when apply button is clicked', () => {
      const mockOnApply = vi.fn()
      
      render(
        <EnhancedJobCard
          job={mockJobWithoutApplication}
          onApply={mockOnApply}
        />
      )
      
      fireEvent.click(screen.getByText('Apply Now'))
      expect(mockOnApply).toHaveBeenCalledWith('job-2')
    })

    it('should show accepted status for accepted applications', () => {
      const acceptedJob = {
        ...mockJobWithApplication,
        userApplication: {
          ...mockJobWithApplication.userApplication!,
          status: 'accepted'
        }
      }
      
      render(
        <EnhancedJobCard
          job={acceptedJob}
          onApply={vi.fn()}
        />
      )
      
      expect(screen.getByText('Accepted')).toBeInTheDocument()
      expect(screen.getByText('Accepted')).toBeDisabled()
    })

    it('should show rejected status for rejected applications', () => {
      const rejectedJob = {
        ...mockJobWithApplication,
        userApplication: {
          ...mockJobWithApplication.userApplication!,
          status: 'rejected'
        }
      }
      
      render(
        <EnhancedJobCard
          job={rejectedJob}
          onApply={vi.fn()}
        />
      )
      
      expect(screen.getByText('Rejected')).toBeInTheDocument()
      expect(screen.getByText('Rejected')).toBeDisabled()
    })
  })

  describe('EnhancedJobList', () => {
    const mockJobs = [mockJobWithApplication, mockJobWithoutApplication]
    
    it('should render all jobs by default', () => {
      render(
        <EnhancedJobList
          initialJobs={mockJobs}
        />
      )
      
      expect(screen.getByText('Greenskeeping Job')).toBeInTheDocument()
      expect(screen.getByText('Equipment Operation Job')).toBeInTheDocument()
    })

    it('should filter to show only applied jobs', () => {
      render(
        <EnhancedJobList
          initialJobs={mockJobs}
        />
      )
      
      // Click on Applied filter
      fireEvent.click(screen.getByText('Applied'))
      
      expect(screen.getByText('Greenskeeping Job')).toBeInTheDocument()
      expect(screen.queryByText('Equipment Operation Job')).not.toBeInTheDocument()
    })

    it('should filter to show only non-applied jobs', () => {
      render(
        <EnhancedJobList
          initialJobs={mockJobs}
        />
      )
      
      // Click on Available to Apply filter
      fireEvent.click(screen.getByText('Available to Apply'))
      
      expect(screen.queryByText('Greenskeeping Job')).not.toBeInTheDocument()
      expect(screen.getByText('Equipment Operation Job')).toBeInTheDocument()
    })

    it('should show appropriate message when no jobs match filter', () => {
      render(
        <EnhancedJobList
          initialJobs={[mockJobWithoutApplication]} // Only non-applied job
        />
      )
      
      // Click on Applied filter
      fireEvent.click(screen.getByText('Applied'))
      
      expect(screen.getByText("You haven't applied to any jobs yet.")).toBeInTheDocument()
    })

    it('should show correct counts in filter buttons', () => {
      render(
        <EnhancedJobList
          initialJobs={mockJobs}
        />
      )
      
      expect(screen.getByText('2')).toBeInTheDocument() // All Jobs count
      expect(screen.getByText('1')).toBeInTheDocument() // Applied count
      expect(screen.getByText('1')).toBeInTheDocument() // Available to Apply count
    })
  })
})
