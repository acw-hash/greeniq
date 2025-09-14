import { z } from 'zod'

// Job creation validation
export const createJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must not exceed 1000 characters'),
  job_type: z.enum([
    'greenskeeping',
    'equipment_maintenance', 
    'irrigation',
    'landscaping',
    'tree_care',
    'pest_control',
    'fertilization',
    'aeration',
    'overseeding',
    'bunker_maintenance',
    'cart_path_maintenance',
    'general_maintenance',
    'seasonal_cleanup',
    'emergency_repair'
  ], {
    required_error: 'Please select a job type'
  }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Location address is required')
  }),
  start_date: z.string().refine((date) => {
    const startDate = new Date(date)
    const now = new Date()
    return startDate >= now
  }, 'Start date must be in the future'),
  end_date: z.string().optional().refine((date) => {
    if (!date) return true
    return new Date(date) > new Date()
  }, 'End date must be in the future'),
  hourly_rate: z.number()
    .min(10, 'Minimum hourly rate is $10')
    .max(200, 'Maximum hourly rate is $200'),
  required_certifications: z.array(z.string()).default([]),
  required_experience: z.enum(['entry', 'intermediate', 'expert']).optional(),
  urgency_level: z.enum(['normal', 'high', 'emergency']).default('normal'),
}).refine((data) => {
  if (data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['end_date']
})

// Job update validation (allows partial updates)
export const updateJobSchema = createJobSchema.partial()

// Job search/filter validation
export const jobFiltersSchema = z.object({
  job_type: z.string().optional(),
  min_rate: z.number().min(0).optional(),
  max_rate: z.number().min(0).optional(),
  max_distance: z.number().min(1).max(100).optional(),
  location: z.string().optional(),
  urgency_level: z.enum(['normal', 'high', 'emergency']).optional(),
  required_experience: z.enum(['entry', 'intermediate', 'expert']).optional(),
  required_certifications: z.array(z.string()).optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  start_date_from: z.string().optional(),
  start_date_to: z.string().optional(),
  search: z.string().optional(),
})

// Application creation validation
export const createApplicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must not exceed 500 characters')
    .optional(),
  proposed_rate: z.number()
    .min(10, 'Minimum proposed rate is $10')
    .max(200, 'Maximum proposed rate is $200')
    .optional(),
})

// Application update validation
export const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']),
  message: z.string().optional(),
})

// Job types and their descriptions
export const JOB_TYPES = {
  greenskeeping: 'General course maintenance and turf care',
  equipment_maintenance: 'Repair and maintenance of golf course equipment',
  irrigation: 'Sprinkler system installation, repair, and maintenance',
  landscaping: 'Ornamental plant care and landscape design',
  tree_care: 'Tree trimming, removal, and health management',
  pest_control: 'Pest and disease management for turf and plants',
  fertilization: 'Fertilizer application and soil management',
  aeration: 'Core aeration and soil decompaction',
  overseeding: 'Grass seeding and turf renovation',
  bunker_maintenance: 'Sand trap raking, edging, and renovation',
  cart_path_maintenance: 'Cart path repair and maintenance',
  general_maintenance: 'Various maintenance tasks around the course',
  seasonal_cleanup: 'Seasonal preparation and cleanup work',
  emergency_repair: 'Urgent repairs needed immediately'
} as const

// Urgency level descriptions
export const URGENCY_LEVELS = {
  normal: 'Standard scheduling - within 1-2 weeks',
  high: 'Priority scheduling - within 2-3 days',
  emergency: 'Immediate attention required - same day'
} as const

// Experience level requirements
export const EXPERIENCE_LEVELS = {
  entry: 'Entry level - 0-2 years experience',
  intermediate: 'Intermediate - 2-5 years experience',
  expert: 'Expert level - 5+ years experience'
} as const

// Available certifications
export const CERTIFICATIONS = [
  'pesticide_applicator',
  'turf_management',
  'irrigation_specialist',
  'equipment_operation',
  'arborist_certified',
  'safety_certification',
  'cdl_license',
  'first_aid_cpr',
  'organic_maintenance',
  'golf_course_superintendent'
] as const

// Application status descriptions
export const APPLICATION_STATUS = {
  pending: 'Application submitted and under review',
  accepted: 'Application accepted - job assigned',
  rejected: 'Application declined'
} as const

// Job status descriptions
export const JOB_STATUS = {
  open: 'Job is open for applications',
  in_progress: 'Job is currently being worked on',
  completed: 'Job has been completed',
  cancelled: 'Job has been cancelled'
} as const

// Type exports
export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type JobFilters = z.infer<typeof jobFiltersSchema>
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type JobType = keyof typeof JOB_TYPES
export type UrgencyLevel = keyof typeof URGENCY_LEVELS
export type ExperienceLevel = keyof typeof EXPERIENCE_LEVELS
export type ApplicationStatus = keyof typeof APPLICATION_STATUS
export type JobStatus = keyof typeof JOB_STATUS