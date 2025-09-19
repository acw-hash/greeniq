import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import JobForm from '@/components/jobs/JobForm'
import { useJobStore } from '@/lib/stores/jobStore'

// Mock the store
vi.mock('@/lib/stores/jobStore', () => ({
  useJobStore: vi.fn(() => ({
    formState: {
      currentStep: 1,
      totalSteps: 4,
      formData: {},
      errors: {},
      isSubmitting: false,
      autoSaveEnabled: true
    },
    updateFormData: vi.fn(),
    setFormStep: vi.fn(),
    resetForm: vi.fn()
  })),
  useAutoSave: vi.fn(() => ({
    startAutoSave: vi.fn(),
    stopAutoSave: vi.fn(),
    isAutoSaveEnabled: true,
    lastSaved: null
  }))
}))

// Mock the hooks
vi.mock('@/lib/hooks/useJobs', () => ({
  useCreateJob: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ job: { id: 'new-job' } })
  })),
  useUpdateJob: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ job: { id: 'updated-job' } })
  }))
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date) => date.toLocaleDateString())
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Job Integration Tests', () => {
  describe('Job Creation Flow', () => {
    it('should complete full job creation workflow', async () => {
      const onSuccess = vi.fn()
      
      render(
        <TestWrapper>
          <JobForm onSuccess={onSuccess} />
        </TestWrapper>
      )

      // Step 1: Basic Information
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      
      // Fill in job title
      const titleInput = screen.getByPlaceholderText(/greens mowing/i)
      fireEvent.change(titleInput, { target: { value: 'Test Job Title' } })
      
      // Select job type
      const jobTypeSelect = screen.getByDisplayValue('General Maintenance')
      fireEvent.click(jobTypeSelect)
      fireEvent.click(screen.getByText('Greenskeeping'))
      
      // Fill in description
      const descriptionInput = screen.getByPlaceholderText(/describe the job/i)
      fireEvent.change(descriptionInput, { 
        target: { value: 'This is a comprehensive test job description that meets all the minimum requirements for validation.' } 
      })
      
      // Go to next step
      fireEvent.click(screen.getByText('Next'))
      
      // Step 2: Job Details
      await waitFor(() => {
        expect(screen.getByText('Job Details')).toBeInTheDocument()
      })
      
      // Set hourly rate
      const rateInput = screen.getByPlaceholderText('25.00')
      fireEvent.change(rateInput, { target: { value: '30' } })
      
      // Select experience level
      const experienceSelect = screen.getByDisplayValue('Select experience level')
      fireEvent.click(experienceSelect)
      fireEvent.click(screen.getByText('Intermediate (2-5 years)'))
      
      // Select urgency level
      const urgencySelect = screen.getByDisplayValue('Select urgency level')
      fireEvent.click(urgencySelect)
      fireEvent.click(screen.getByText('High Priority'))
      
      // Go to next step
      fireEvent.click(screen.getByText('Next'))
      
      // Step 3: Location
      await waitFor(() => {
        expect(screen.getByText('Location')).toBeInTheDocument()
      })
      
      // Fill in address
      const addressInput = screen.getByPlaceholderText(/enter job location/i)
      fireEvent.change(addressInput, { target: { value: '123 Test Street, Test City, TC 12345' } })
      
      // Fill in coordinates
      const latInput = screen.getByPlaceholderText('40.7128')
      fireEvent.change(latInput, { target: { value: '37.7749' } })
      
      const lngInput = screen.getByPlaceholderText('-74.0060')
      fireEvent.change(lngInput, { target: { value: '-122.4194' } })
      
      // Go to next step
      fireEvent.click(screen.getByText('Next'))
      
      // Step 4: Schedule
      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })
      
      // Set start date (mock date picker)
      const startDateButton = screen.getByText('Pick a date')
      fireEvent.click(startDateButton)
      
      // Mock selecting a future date
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      
      // Go to preview
      fireEvent.click(screen.getByText('Preview & Post'))
      
      // Should show preview
      await waitFor(() => {
        expect(screen.getByText('Job Preview')).toBeInTheDocument()
        expect(screen.getByText('Test Job Title')).toBeInTheDocument()
        expect(screen.getByText('$30/hour')).toBeInTheDocument()
      })
      
      // Submit the job
      fireEvent.click(screen.getByText('Post Job'))
      
      // Should call success callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should validate form fields and show errors', async () => {
      render(
        <TestWrapper>
          <JobForm />
        </TestWrapper>
      )

      // Try to go to next step without filling required fields
      fireEvent.click(screen.getByText('Next'))
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument()
        expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument()
      })
    })

    it('should handle form cancellation', () => {
      const onCancel = vi.fn()
      
      render(
        <TestWrapper>
          <JobForm onCancel={onCancel} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Cancel'))
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('Job Editing Flow', () => {
    const existingJobData = {
      title: 'Existing Job',
      description: 'This is an existing job description that meets all requirements.',
      job_type: 'greenskeeping',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: '123 Existing St'
      },
      start_date: '2024-12-01T09:00:00Z',
      hourly_rate: 25,
      required_certifications: [],
      urgency_level: 'normal'
    }

    it('should pre-populate form with existing job data', () => {
      render(
        <TestWrapper>
          <JobForm initialData={existingJobData} jobId="existing-job" />
        </TestWrapper>
      )

      expect(screen.getByDisplayValue('Existing Job')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is an existing job description that meets all requirements.')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Greenskeeping')).toBeInTheDocument()
      expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    })

    it('should update existing job', async () => {
      const onSuccess = vi.fn()
      const mockUpdateJob = vi.fn().mockResolvedValue({ job: { id: 'updated-job' } })
      
      vi.mocked(require('@/lib/hooks/useJobs').useUpdateJob).mockReturnValue({
        mutateAsync: mockUpdateJob
      })
      
      render(
        <TestWrapper>
          <JobForm 
            initialData={existingJobData} 
            jobId="existing-job"
            onSuccess={onSuccess}
          />
        </TestWrapper>
      )

      // Update the title
      const titleInput = screen.getByDisplayValue('Existing Job')
      fireEvent.change(titleInput, { target: { value: 'Updated Job Title' } })
      
      // Go through all steps to preview
      fireEvent.click(screen.getByText('Next')) // Step 2
      fireEvent.click(screen.getByText('Next')) // Step 3
      fireEvent.click(screen.getByText('Next')) // Step 4
      fireEvent.click(screen.getByText('Preview & Post')) // Preview
      
      // Submit the update
      fireEvent.click(screen.getByText('Post Job'))
      
      await waitFor(() => {
        expect(mockUpdateJob).toHaveBeenCalledWith({
          id: 'existing-job',
          data: expect.objectContaining({
            title: 'Updated Job Title'
          })
        })
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Form State Management', () => {
    it('should manage form state across steps', () => {
      const mockUpdateFormData = vi.fn()
      const mockSetFormStep = vi.fn()
      
      vi.mocked(useJobStore).mockReturnValue({
        formState: {
          currentStep: 1,
          totalSteps: 4,
          formData: {},
          errors: {},
          isSubmitting: false,
          autoSaveEnabled: true
        },
        updateFormData: mockUpdateFormData,
        setFormStep: mockSetFormStep,
        resetForm: vi.fn()
      })
      
      render(
        <TestWrapper>
          <JobForm />
        </TestWrapper>
      )

      // Fill in some data
      const titleInput = screen.getByPlaceholderText(/greens mowing/i)
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      
      // Should update form data
      expect(mockUpdateFormData).toHaveBeenCalled()
      
      // Go to next step
      fireEvent.click(screen.getByText('Next'))
      
      // Should update form step
      expect(mockSetFormStep).toHaveBeenCalledWith(2)
    })

    it('should handle auto-save functionality', () => {
      const mockStartAutoSave = vi.fn()
      const mockStopAutoSave = vi.fn()
      
      vi.mocked(require('@/lib/stores/jobStore').useAutoSave).mockReturnValue({
        startAutoSave: mockStartAutoSave,
        stopAutoSave: mockStopAutoSave,
        isAutoSaveEnabled: true,
        lastSaved: null
      })
      
      render(
        <TestWrapper>
          <JobForm />
        </TestWrapper>
      )

      // Should start auto-save when component mounts
      expect(mockStartAutoSave).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockCreateJob = vi.fn().mockRejectedValue(new Error('API Error'))
      
      vi.mocked(require('@/lib/hooks/useJobs').useCreateJob).mockReturnValue({
        mutateAsync: mockCreateJob
      })
      
      render(
        <TestWrapper>
          <JobForm />
        </TestWrapper>
      )

      // Fill in minimal valid data
      const titleInput = screen.getByPlaceholderText(/greens mowing/i)
      fireEvent.change(titleInput, { target: { value: 'Test Job Title' } })
      
      const descriptionInput = screen.getByPlaceholderText(/describe the job/i)
      fireEvent.change(descriptionInput, { 
        target: { value: 'This is a comprehensive test job description that meets all the minimum requirements for validation.' } 
      })
      
      // Go through all steps
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Preview & Post'))
      
      // Submit the job
      fireEvent.click(screen.getByText('Post Job'))
      
      // Should handle the error
      await waitFor(() => {
        expect(mockCreateJob).toHaveBeenCalled()
      })
    })
  })
})
