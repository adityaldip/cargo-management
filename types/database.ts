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
      customers: {
        Row: {
          id: string
          name: string
          code: string
          email: string
          phone: string
          address: string
          contact_person: string
          priority: 'high' | 'medium' | 'low'
          is_active: boolean
          created_date: string
          total_shipments: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          email: string
          phone: string
          address: string
          contact_person: string
          priority?: 'high' | 'medium' | 'low'
          is_active?: boolean
          created_date?: string
          total_shipments?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          email?: string
          phone?: string
          address?: string
          contact_person?: string
          priority?: 'high' | 'medium' | 'low'
          is_active?: boolean
          created_date?: string
          total_shipments?: number
          created_at?: string
          updated_at?: string
        }
      }
      customer_rules: {
        Row: {
          id: string
          name: string
          description: string
          is_active: boolean
          priority: number
          conditions: Json
          actions: Json
          match_count: number
          last_run: string | null
          where_fields: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          is_active?: boolean
          priority: number
          conditions: Json
          actions: Json
          match_count?: number
          last_run?: string | null
          where_fields?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          is_active?: boolean
          priority?: number
          conditions?: Json
          actions?: Json
          match_count?: number
          last_run?: string | null
          where_fields?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      rate_rules: {
        Row: {
          id: string
          name: string
          description: string
          is_active: boolean
          priority: number
          conditions: Json
          actions: Json
          match_count: number
          last_run: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          is_active?: boolean
          priority: number
          conditions: Json
          actions: Json
          match_count?: number
          last_run?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          is_active?: boolean
          priority?: number
          conditions?: Json
          actions?: Json
          match_count?: number
          last_run?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cargo_data: {
        Row: {
          id: string
          rec_id: string
          inb_flight_date: string
          outb_flight_date: string
          des_no: string
          rec_numb: string
          orig_oe: string
          dest_oe: string
          inb_flight_no: string
          outb_flight_no: string
          mail_cat: string
          mail_class: string
          total_kg: number
          invoice: string
          customer_name_number: string | null
          assigned_customer: string | null
          assigned_rate: number | null
          rate_currency: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rec_id: string
          inb_flight_date: string
          outb_flight_date: string
          des_no: string
          rec_numb: string
          orig_oe: string
          dest_oe: string
          inb_flight_no: string
          outb_flight_no: string
          mail_cat: string
          mail_class: string
          total_kg: number
          invoice: string
          customer_name_number?: string | null
          assigned_customer?: string | null
          assigned_rate?: number | null
          rate_currency?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rec_id?: string
          inb_flight_date?: string
          outb_flight_date?: string
          des_no?: string
          rec_numb?: string
          orig_oe?: string
          dest_oe?: string
          inb_flight_no?: string
          outb_flight_no?: string
          mail_cat?: string
          mail_class?: string
          total_kg?: number
          invoice?: string
          customer_name_number?: string | null
          assigned_customer?: string | null
          assigned_rate?: number | null
          rate_currency?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      column_mappings: {
        Row: {
          id: string
          original_name: string
          mapped_name: string
          data_type: string
          is_required: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          original_name: string
          mapped_name: string
          data_type: string
          is_required?: boolean
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          original_name?: string
          mapped_name?: string
          data_type?: string
          is_required?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          total_amount: number
          currency: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          created_date: string
          items: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_id: string
          total_amount: number
          currency: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          created_date: string
          items: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          total_amount?: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          created_date?: string
          items?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
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
      priority_level: 'high' | 'medium' | 'low'
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
      rate_type: 'fixed' | 'per_kg' | 'distance_based' | 'zone_based'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
