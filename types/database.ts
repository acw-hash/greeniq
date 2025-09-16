export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          job_id: string | null
          professional_id: string | null
          message: string | null
          proposed_rate: number | null
          status: string | null
          applied_at: string | null
        }
      }
      professional_profiles: {
        Row: {
          profile_id: string
          bio: string | null
          experience_level: string | null
          specializations: string[] | null
          equipment_skills: string[] | null
          hourly_rate: number | null
          travel_radius: number | null
          rating: number | null
          total_jobs: number | null
          stripe_account_id: string | null
          created_at: string | null
        }
      }
      golf_course_profiles: {
        Row: {
          profile_id: string
          course_name: string
          course_type: string | null
          address: string
          description: string | null
          facilities: any
          preferred_qualifications: string[] | null
          stripe_account_id: string | null
          created_at: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_type: string | null
          full_name: string | null
          email: string | null
          phone: string | null
          avatar_url: string | null
          location: any
          is_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          course_id: string | null
          title: string
          description: string | null
          job_type: string | null
          location: any
          start_date: string | null
          end_date: string | null
          hourly_rate: number | null
          required_certifications: string[] | null
          required_experience: string | null
          status: string | null
          urgency_level: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      messages: {
        Row: {
          id: string
          job_id: string | null
          sender_id: string | null
          content: string | null
          message_type: string | null
          metadata: any
          created_at: string | null
          updated_at: string | null
        }
      }
    }
  }
}