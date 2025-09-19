import { describe, it, expect } from 'vitest'
import { jobSchema, jobUpdateSchema, jobSearchSchema } from '@/lib/validations/jobs'

describe('Job Validation Schemas', () => {
  describe('jobSchema', () => {
    const validJobData = {
      title: 'Greens Mowing and Maintenance',
      description: 'Regular maintenance of golf course greens including mowing, aeration, and fertilization.',
      job_type: 'greenskeeping',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: '123 Golf Course Dr, San Francisco, CA'
      },
      start_date: '2024-02-01T09:00:00Z',
      end_date: '2024-02-01T17:00:00Z',
      hourly_rate: 25.50,
      required_certifications: ['Pesticide License', 'Equipment Certified'],
      required_experience: 'intermediate',
      urgency_level: 'normal'
    }

    it('should validate correct job data', () => {
      const result = jobSchema.safeParse(validJobData)
      expect(result.success).toBe(true)
    })

    it('should reject job with invalid title', () => {
      const invalidData = { ...validJobData, title: 'Hi' } // Too short
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters')
      }
    })

    it('should reject job with invalid description', () => {
      const invalidData = { ...validJobData, description: 'Short' } // Too short
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 20 characters')
      }
    })

    it('should reject job with invalid job type', () => {
      const invalidData = { ...validJobData, job_type: 'invalid_type' }
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject job with invalid location', () => {
      const invalidData = { 
        ...validJobData, 
        location: { lat: 91, lng: -122.4194, address: 'Test' } // Invalid latitude
      }
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject job with past start date', () => {
      const invalidData = { 
        ...validJobData, 
        start_date: '2020-01-01T09:00:00Z' // Past date
      }
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be in the future')
      }
    })

    it('should reject job with end date before start date', () => {
      const invalidData = { 
        ...validJobData, 
        start_date: '2024-02-01T09:00:00Z',
        end_date: '2024-01-01T17:00:00Z' // Before start date
      }
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be after start date')
      }
    })

    it('should reject job with invalid hourly rate', () => {
      const invalidData = { ...validJobData, hourly_rate: 10 } // Below minimum
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Minimum rate is $15/hour')
      }
    })

    it('should reject job with invalid certifications', () => {
      const invalidData = { 
        ...validJobData, 
        required_certifications: ['Invalid Certification'] 
      }
      const result = jobSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept job without optional fields', () => {
      const minimalData = {
        title: 'Test Job',
        description: 'This is a test job description that meets the minimum requirements.',
        job_type: 'general_maintenance',
        location: {
          lat: 37.7749,
          lng: -122.4194,
          address: '123 Test St'
        },
        start_date: '2024-12-01T09:00:00Z',
        hourly_rate: 20
      }
      const result = jobSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })

  describe('jobUpdateSchema', () => {
    const validUpdateData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Updated Job Title',
      hourly_rate: 30
    }

    it('should validate correct update data', () => {
      const result = jobUpdateSchema.safeParse(validUpdateData)
      expect(result.success).toBe(true)
    })

    it('should reject update with invalid ID', () => {
      const invalidData = { ...validUpdateData, id: 'invalid-uuid' }
      const result = jobUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept partial updates', () => {
      const partialData = { id: validUpdateData.id, title: 'New Title' }
      const result = jobUpdateSchema.safeParse(partialData)
      expect(result.success).toBe(true)
    })
  })

  describe('jobSearchSchema', () => {
    const validSearchData = {
      search: 'greenskeeping',
      job_type: 'greenskeeping',
      min_rate: 20,
      max_rate: 50,
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'San Francisco, CA'
      },
      radius: 25,
      urgency_level: 'high',
      required_experience: 'intermediate',
      required_certifications: ['Pesticide License'],
      status: 'open',
      page: 1,
      limit: 20
    }

    it('should validate correct search data', () => {
      const result = jobSearchSchema.safeParse(validSearchData)
      expect(result.success).toBe(true)
    })

    it('should accept minimal search data', () => {
      const minimalData = { status: 'open' }
      const result = jobSearchSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('should reject search with invalid radius', () => {
      const invalidData = { ...validSearchData, radius: 200 } // Too large
      const result = jobSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject search with invalid page', () => {
      const invalidData = { ...validSearchData, page: 0 } // Invalid page
      const result = jobSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject search with invalid limit', () => {
      const invalidData = { ...validSearchData, limit: 200 } // Too large
      const result = jobSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
