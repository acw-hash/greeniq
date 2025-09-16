import { z } from 'zod'

// Job types constants
export const JOB_TYPES = [
  { value: 'greenskeeping', label: 'Greenskeeping' },
  { value: 'equipment_operation', label: 'Equipment Operations' },
  { value: 'irrigation_maintenance', label: 'Irrigation & Water Management' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'general_maintenance', label: 'General Maintenance' }
] as const

// Urgency levels constants
export const URGENCY_LEVELS = [
  { value: 'normal', label: 'Normal Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'emergency', label: 'Emergency' }
] as const

// Experience levels constants
export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'intermediate', label: 'Intermediate Level (3-5 years)' },
  { value: 'expert', label: 'Expert Level (5+ years)' }
] as const

// Certifications constants
export const CERTIFICATIONS = [
  { value: 'pesticide_license', label: 'Pesticide Applicator License' },
  { value: 'equipment_certified', label: 'Heavy Equipment Certified' },
  { value: 'irrigation_certified', label: 'Irrigation Certification' },
  { value: 'turf_management', label: 'Turf Management Certificate' },
  { value: 'safety_certified', label: 'Safety Training Certification' },
  { value: 'commercial_drivers_license', label: 'Commercial Driver\'s License' }
] as const

// Job type enum
export const jobTypeEnum = z.enum([
  'greenskeeping',
  'equipment_operation',
  'irrigation_maintenance', 
  'landscaping',
  'general_maintenance'
])

// Urgency level enum
export const urgencyLevelEnum = z.enum([
  'normal',
  'high', 
  'emergency'
])

// Location schema for PostGIS point
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
})

// Base job creation schema
export const createJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
  job_type: jobTypeEnum,
  location: locationSchema,
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().or(z.literal('')),
  hourly_rate: z.number().min(10, 'Minimum rate is $10/hour').max(200, 'Maximum rate is $200/hour'),
  required_certifications: z.array(z.string()).default([]),
  required_experience: z.enum(['entry', 'intermediate', 'expert']).optional(),
  urgency_level: urgencyLevelEnum.default('normal')
})

// Job update schema (allows partial updates)
export const updateJobSchema = createJobSchema.partial()

// Job search/filter validation
export const jobFiltersSchema = z.object({
  location: z.string().optional(),
  job_type: jobTypeEnum.optional(),
  max_distance: z.number().positive().optional(),
  min_rate: z.number().positive().optional(),
  max_rate: z.number().positive().optional(),
  certifications: z.array(z.string()).optional(),
  urgency_level: urgencyLevelEnum.optional(),
  required_experience: z.enum(['entry', 'intermediate', 'expert']).optional(),
  status: z.string().optional(),
  search: z.string().optional()
})

// Application schema
export const createApplicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  proposed_rate: z.number().positive('Proposed rate must be positive').optional()
})

// Application update schema
export const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
  message: z.string().max(1000, 'Message too long').optional()
})

// Export types for TypeScript
export type CreateJobInput = z.infer<typeof createJobSchema>
export type CreateJobData = z.infer<typeof createJobSchema>
export type UpdateJobData = z.infer<typeof updateJobSchema>
export type JobFilters = z.infer<typeof jobFiltersSchema>
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type CreateApplicationData = z.infer<typeof createApplicationSchema>
export type UpdateApplicationData = z.infer<typeof updateApplicationSchema>
export type JobType = z.infer<typeof jobTypeEnum>
export type UrgencyLevel = z.infer<typeof urgencyLevelEnum>