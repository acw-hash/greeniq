import { z } from 'zod'

// Job type enum
export const jobTypeEnum = z.enum([
  'greenskeeping',
  'equipment_operation', 
  'irrigation',
  'landscaping',
  'general_maintenance'
])

// Experience level enum
export const experienceLevelEnum = z.enum(['entry', 'intermediate', 'expert'])

// Urgency level enum
export const urgencyLevelEnum = z.enum(['normal', 'high', 'emergency'])

// Status enum
export const jobStatusEnum = z.enum(['open', 'in_progress', 'completed', 'cancelled'])

// Certification types
export const certificationTypes = [
  'Pesticide License',
  'Equipment Certified',
  'Irrigation Certified', 
  'Turf Management Certified',
  'Safety Trained',
  'CDL License'
] as const

// Location schema
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
  address: z.string().min(1, 'Address is required')
})

// Main job schema
export const jobSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, 'Title contains invalid characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  job_type: jobTypeEnum,
  
  location: locationSchema,
  
  start_date: z.string()
    .datetime('Invalid start date format')
    .refine((date) => new Date(date) > new Date(), 'Start date must be in the future'),
  
  end_date: z.string()
    .datetime('Invalid end date format')
    .optional(),
  
  hourly_rate: z.number()
    .min(15, 'Minimum rate is $15/hour')
    .max(200, 'Maximum rate is $200/hour')
    .multipleOf(0.01, 'Rate must be in cents'),
  
  required_certifications: z.array(z.string())
    .default([])
    .refine((certs) => certs.every(cert => certificationTypes.includes(cert as any)), 
      'Invalid certification type'),
  
  required_experience: experienceLevelEnum.optional(),
  
  urgency_level: urgencyLevelEnum.default('normal'),
  
  estimated_duration: z.number()
    .min(1, 'Duration must be at least 1 hour')
    .max(24, 'Duration cannot exceed 24 hours')
    .optional(),
  
  special_equipment: z.string()
    .max(500, 'Special equipment description must be less than 500 characters')
    .optional(),
  
  termsAccepted: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions')
})

// Job update schema (allows partial updates)
export const jobUpdateSchema = jobSchema.partial().extend({
  id: z.string().uuid('Invalid job ID'),
  status: jobStatusEnum.optional()
})

// Job search/filter schema
export const jobSearchSchema = z.object({
  search: z.string().optional(),
  job_type: jobTypeEnum.optional(),
  min_rate: z.number().min(0).optional(),
  max_rate: z.number().min(0).optional(),
  location: locationSchema.optional(),
  radius: z.number().min(1).max(100).default(25), // miles
  urgency_level: urgencyLevelEnum.optional(),
  required_experience: experienceLevelEnum.optional(),
  required_certifications: z.array(z.string()).optional(),
  status: jobStatusEnum.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

// Job form data type
export type JobFormData = z.infer<typeof jobSchema>
export type JobUpdateData = z.infer<typeof jobUpdateSchema>
export type JobSearchData = z.infer<typeof jobSearchSchema>
export type JobType = z.infer<typeof jobTypeEnum>
export type ExperienceLevel = z.infer<typeof experienceLevelEnum>
export type UrgencyLevel = z.infer<typeof urgencyLevelEnum>
export type JobStatus = z.infer<typeof jobStatusEnum>

// Job type display names
export const jobTypeDisplayNames: Record<JobType, string> = {
  greenskeeping: 'Greenskeeping',
  equipment_operation: 'Equipment Operation',
  irrigation: 'Irrigation',
  landscaping: 'Landscaping',
  general_maintenance: 'General Maintenance'
}

// Experience level display names
export const experienceLevelDisplayNames: Record<ExperienceLevel, string> = {
  entry: 'Entry Level (0-2 years)',
  intermediate: 'Intermediate (2-5 years)',
  expert: 'Expert (5+ years)'
}

// Urgency level display names
export const urgencyLevelDisplayNames: Record<UrgencyLevel, string> = {
  normal: 'Normal',
  high: 'High Priority',
  emergency: 'Emergency'
}

// Status display names
export const statusDisplayNames: Record<JobStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

// Rate suggestions based on job type
export const rateSuggestions: Record<JobType, { min: number; max: number; recommended: number }> = {
  greenskeeping: { min: 18, max: 35, recommended: 25 },
  equipment_operation: { min: 20, max: 40, recommended: 30 },
  irrigation: { min: 22, max: 45, recommended: 32 },
  landscaping: { min: 15, max: 30, recommended: 22 },
  general_maintenance: { min: 16, max: 28, recommended: 20 }
}

// Application schemas
export const applicationStatusEnum = z.enum(['pending', 'accepted', 'rejected'])

export const createApplicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  proposed_rate: z.number()
    .min(15, 'Minimum rate is $15/hour')
    .max(200, 'Maximum rate is $200/hour')
    .multipleOf(0.01, 'Rate must be in cents')
    .optional()
})

export const updateApplicationSchema = z.object({
  id: z.string().uuid('Invalid application ID'),
  status: applicationStatusEnum,
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .optional(),
  proposed_rate: z.number()
    .min(15, 'Minimum rate is $15/hour')
    .max(200, 'Maximum rate is $200/hour')
    .multipleOf(0.01, 'Rate must be in cents')
    .optional()
})

// Application types
export type ApplicationFormData = z.infer<typeof createApplicationSchema>
export type ApplicationUpdateData = z.infer<typeof updateApplicationSchema>
export type UpdateApplicationData = ApplicationUpdateData // Alias for backward compatibility
export type CreateApplicationInput = ApplicationFormData // Alias for backward compatibility
export type ApplicationStatus = z.infer<typeof applicationStatusEnum>

// Application status display names
export const applicationStatusDisplayNames: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected'
}