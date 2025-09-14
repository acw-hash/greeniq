import { z } from 'zod'

// Profile validations
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Address is required')
  }).optional(),
})

// Golf Course Profile validations
export const golfCourseProfileSchema = z.object({
  course_name: z.string().min(2, 'Course name must be at least 2 characters'),
  course_type: z.enum(['public', 'private', 'resort', 'municipal'], {
    required_error: 'Please select a course type'
  }),
  address: z.string().min(5, 'Please enter a complete address'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
  facilities: z.object({
    total_holes: z.number().min(1).max(72).optional(),
    driving_range: z.boolean().default(false),
    putting_green: z.boolean().default(false),
    pro_shop: z.boolean().default(false),
    restaurant: z.boolean().default(false),
    cart_rental: z.boolean().default(false),
    club_rental: z.boolean().default(false),
    lessons_available: z.boolean().default(false),
    irrigation_system: z.enum(['manual', 'automatic', 'smart']).optional(),
    maintenance_equipment: z.array(z.string()).default([]),
  }).default({}),
  preferred_qualifications: z.array(z.string()).default([]),
})

// Professional Profile validations
export const professionalProfileSchema = z.object({
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(500, 'Bio must not exceed 500 characters').optional().or(z.literal('')),
  experience_level: z.enum(['entry', 'intermediate', 'expert'], {
    required_error: 'Please select your experience level'
  }),
  specializations: z.array(z.string()).min(1, 'Please select at least one specialization'),
  equipment_skills: z.array(z.string()).default([]),
  hourly_rate: z.number()
    .min(10, 'Minimum hourly rate is $10')
    .max(200, 'Maximum hourly rate is $200')
    .optional(),
  travel_radius: z.number()
    .min(1, 'Minimum travel radius is 1 mile')
    .max(100, 'Maximum travel radius is 100 miles')
    .default(25),
})

// Complete profile setup validations
export const completeGolfCourseProfileSchema = profileUpdateSchema.merge(golfCourseProfileSchema)
export const completeProfessionalProfileSchema = profileUpdateSchema.merge(professionalProfileSchema)

// Specializations and equipment options
export const SPECIALIZATIONS = [
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
  'general_maintenance'
] as const

export const EQUIPMENT_SKILLS = [
  'riding_mowers',
  'walk_behind_mowers',
  'reel_mowers',
  'aerators',
  'overseeding_equipment',
  'sprayers',
  'irrigation_controllers',
  'sand_pro',
  'utility_vehicles',
  'hand_tools',
  'chainsaw',
  'leaf_blower',
  'edger',
  'spreader'
] as const

export const CERTIFICATIONS = [
  'pesticide_applicator',
  'turf_management',
  'irrigation_certified',
  'equipment_operation',
  'chainsaw_certified',
  'first_aid_cpr',
  'commercial_drivers_license',
  'forklift_certified'
] as const

export const COURSE_FACILITIES = [
  'driving_range',
  'putting_green',
  'pro_shop',
  'restaurant',
  'cart_rental',
  'club_rental',
  'lessons_available'
] as const

// Type exports
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type GolfCourseProfileInput = z.infer<typeof golfCourseProfileSchema>
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>
export type CompleteGolfCourseProfileInput = z.infer<typeof completeGolfCourseProfileSchema>
export type CompleteProfessionalProfileInput = z.infer<typeof completeProfessionalProfileSchema>
export type Specialization = typeof SPECIALIZATIONS[number]
export type EquipmentSkill = typeof EQUIPMENT_SKILLS[number]
export type Certification = typeof CERTIFICATIONS[number]
export type CourseFacility = typeof COURSE_FACILITIES[number]
