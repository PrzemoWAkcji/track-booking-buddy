/**
 * Supabase Database Types
 * Auto-generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contractors: {
        Row: {
          id: string
          name: string
          category: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          contractor_id: string | null
          contractor_name: string
          contractor_category: string
          date: string
          time_slot: string
          facility_type: 'track-6' | 'track-8' | 'rugby'
          tracks: number[]
          is_closed: boolean
          closed_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id?: string | null
          contractor_name: string
          contractor_category: string
          date: string
          time_slot: string
          facility_type: 'track-6' | 'track-8' | 'rugby'
          tracks: number[]
          is_closed?: boolean
          closed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string | null
          contractor_name?: string
          contractor_category?: string
          date?: string
          time_slot?: string
          facility_type?: 'track-6' | 'track-8' | 'rugby'
          tracks?: number[]
          is_closed?: boolean
          closed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_archive: {
        Row: {
          id: string
          week_start: string
          week_end: string
          facility_type: 'track-6' | 'track-8' | 'rugby'
          archived_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          week_start: string
          week_end: string
          facility_type: 'track-6' | 'track-8' | 'rugby'
          archived_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          week_start?: string
          week_end?: string
          facility_type?: 'track-6' | 'track-8' | 'rugby'
          archived_data?: Json
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type ContractorRow = Database['public']['Tables']['contractors']['Row']
export type ContractorInsert = Database['public']['Tables']['contractors']['Insert']
export type ContractorUpdate = Database['public']['Tables']['contractors']['Update']

export type ReservationRow = Database['public']['Tables']['reservations']['Row']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

export type WeeklyArchiveRow = Database['public']['Tables']['weekly_archive']['Row']
export type WeeklyArchiveInsert = Database['public']['Tables']['weekly_archive']['Insert']
export type WeeklyArchiveUpdate = Database['public']['Tables']['weekly_archive']['Update']