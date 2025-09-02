export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          target_min: number
          target_max: number
          reminder_1_minutes: number
          reminder_2_minutes: number
          timezone: string
          silent_start: string
          silent_end: string
          enable_general_reminders: boolean
          general_reminder_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          target_min?: number
          target_max?: number
          reminder_1_minutes?: number
          reminder_2_minutes?: number
          timezone?: string
          silent_start?: string
          silent_end?: string
          enable_general_reminders?: boolean
          general_reminder_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          target_min?: number
          target_max?: number
          reminder_1_minutes?: number
          reminder_2_minutes?: number
          timezone?: string
          silent_start?: string
          silent_end?: string
          enable_general_reminders?: boolean
          general_reminder_minutes?: number
          created_at?: string
          updated_at?: string
        }
      }
      readings: {
        Row: {
          id: string
          user_id: string
          value: number
          reading_type: 'pre_meal' | 'post_30' | 'post_90' | 'random' | 'fasting'
          carbs: number | null
          notes: string | null
          tags: string[] | null
          meal_id: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          value: number
          reading_type: 'pre_meal' | 'post_30' | 'post_90' | 'random' | 'fasting'
          carbs?: number | null
          notes?: string | null
          tags?: string[] | null
          meal_id?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          value?: number
          reading_type?: 'pre_meal' | 'post_30' | 'post_90' | 'random' | 'fasting'
          carbs?: number | null
          notes?: string | null
          tags?: string[] | null
          meal_id?: string | null
          recorded_at?: string
          created_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          name: string | null
          carbs: number | null
          pre_meal_reading_id: string | null
          started_at: string
          reminder_1_sent: boolean
          reminder_2_sent: boolean
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          carbs?: number | null
          pre_meal_reading_id?: string | null
          started_at?: string
          reminder_1_sent?: boolean
          reminder_2_sent?: boolean
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          carbs?: number | null
          pre_meal_reading_id?: string | null
          started_at?: string
          reminder_1_sent?: boolean
          reminder_2_sent?: boolean
          completed?: boolean
          created_at?: string
        }
      }
      notification_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}