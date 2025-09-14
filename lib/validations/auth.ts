import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  user_type: z.enum(['golf_course', 'professional']),
})

export const golfCourseSignupSchema = signupSchema.extend({
  user_type: z.literal('golf_course'),
  course_name: z.string().min(2, 'Course name must be at least 2 characters'),
  course_type: z.enum(['public', 'private', 'resort', 'municipal']),
  address: z.string().min(5, 'Please enter a complete address'),
  description: z.string().optional(),
  phone: z.string().optional(),
})

export const professionalSignupSchema = signupSchema.extend({
  user_type: z.literal('professional'),
  bio: z.string().optional(),
  experience_level: z.enum(['entry', 'intermediate', 'expert']),
  specializations: z.array(z.string()).min(1, 'Please select at least one specialization'),
  hourly_rate: z.number().min(10, 'Minimum hourly rate is $10').optional(),
  travel_radius: z.number().min(1).max(100).default(25),
  phone: z.string().optional(),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type GolfCourseSignupInput = z.infer<typeof golfCourseSignupSchema>
export type ProfessionalSignupInput = z.infer<typeof professionalSignupSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
