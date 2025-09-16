import { Database } from './index'

export type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: Database['public']['Tables']['profiles']['Row']
}

export interface SendMessageData {
  job_id: string
  content: string
  message_type?: 'text' | 'image' | 'file'
  metadata?: Record<string, any>
}

export interface MessageThread {
  job_id: string
  job_title: string
  participants: {
    id: string
    full_name: string
    user_type: 'golf_course' | 'professional'
  }[]
  latest_message?: Message
  unread_count: number
}
