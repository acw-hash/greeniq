import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/jobs/route'
import { GET as GET_JOB, PUT, DELETE } from '@/app/api/jobs/[id]/route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis()
  }))
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('Jobs API Routes', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockProfile = {
    id: 'user-123',
    user_type: 'golf_course',
    full_name: 'Test Golf Course',
    golf_course_profiles: {
      course_name: 'Test Course',
      course_type: 'public'
    }
  }

  const mockJob = {
    id: 'job-123',
    course_id: 'user-123',
    title: 'Test Job',
    description: 'Test job description',
    job_type: 'greenskeeping',
    location: '(37.7749, -122.4194)',
    start_date: '2024-12-01T09:00:00Z',
    hourly_rate: 25,
    required_certifications: [],
    urgency_level: 'normal',
    status: 'open',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/jobs', () => {
    it('should return jobs for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().order().range().mockResolvedValue({
        data: [mockJob],
        error: null,
        count: 1
      })

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.jobs).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle search parameters', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().order().range().mockResolvedValue({
        data: [mockJob],
        error: null,
        count: 1
      })

      const request = new NextRequest('http://localhost:3000/api/jobs?search=test&job_type=greenskeeping')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSupabase.from().or).toHaveBeenCalled()
    })
  })

  describe('POST /api/jobs', () => {
    const validJobData = {
      title: 'Test Job',
      description: 'This is a test job description that meets the minimum requirements.',
      job_type: 'greenskeeping',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: '123 Test St'
      },
      start_date: '2024-12-01T09:00:00Z',
      hourly_rate: 25,
      required_certifications: [],
      urgency_level: 'normal'
    }

    it('should create job for golf course user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockProfile,
        error: null
      })

      mockSupabase.from().insert().select().single().mockResolvedValue({
        data: mockJob,
        error: null
      })

      mockSupabase.from().select().not().mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.job).toBeDefined()
    })

    it('should return 403 for non-golf course user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: { ...mockProfile, user_type: 'professional' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid job data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const invalidJobData = {
        title: 'Hi', // Too short
        description: 'Short', // Too short
        job_type: 'invalid_type',
        location: {
          lat: 91, // Invalid latitude
          lng: -122.4194,
          address: 'Test'
        },
        start_date: '2020-01-01T09:00:00Z', // Past date
        hourly_rate: 10 // Below minimum
      }

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(invalidJobData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/jobs/[id]', () => {
    it('should return job for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockJob,
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123')
      const response = await GET_JOB(request, { params: { id: 'job-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.job).toBeDefined()
    })

    it('should return 404 for non-existent job', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/non-existent')
      const response = await GET_JOB(request, { params: { id: 'non-existent' } })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/jobs/[id]', () => {
    const updateData = {
      title: 'Updated Job Title',
      hourly_rate: 30
    }

    it('should update job for owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockJob,
        error: null
      })

      mockSupabase.from().update().eq().select().single().mockResolvedValue({
        data: { ...mockJob, ...updateData },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request, { params: { id: 'job-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.job.title).toBe('Updated Job Title')
    })

    it('should return 403 for non-owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'other-user' } },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockJob,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request, { params: { id: 'job-123' } })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/jobs/[id]', () => {
    it('should delete job for owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: mockJob,
        error: null
      })

      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.from().select().eq().mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'job-123' } })

      expect(response.status).toBe(200)
    })

    it('should return 400 for completed job', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from().select().eq().single().mockResolvedValue({
        data: { ...mockJob, status: 'completed' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'job-123' } })

      expect(response.status).toBe(400)
    })
  })
})
