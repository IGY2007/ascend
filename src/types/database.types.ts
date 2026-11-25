// Tipos de la base de datos en el formato de `supabase gen types typescript`.
// Escrito a partir de supabase/migrations/. Cuando el proyecto esté vinculado, regenerar con:
//   npm run db:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          age: number | null
          height_cm: number | null
          initial_weight_kg: number | null
          weight_unit: string
          length_unit: string
          goal: string | null
          start_date: string
          locale: string
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          age?: number | null
          height_cm?: number | null
          initial_weight_kg?: number | null
          weight_unit?: string
          length_unit?: string
          goal?: string | null
          start_date?: string
          locale?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          age?: number | null
          height_cm?: number | null
          initial_weight_kg?: number | null
          weight_unit?: string
          length_unit?: string
          goal?: string | null
          start_date?: string
          locale?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          id: string
          owner_user_id: string | null
          name: string
          primary_muscle: string | null
          secondary_muscles: string[]
          equipment: string | null
          exercise_type: string
          instructions: string | null
          image_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          owner_user_id?: string | null
          name: string
          primary_muscle?: string | null
          secondary_muscles?: string[]
          equipment?: string | null
          exercise_type?: string
          instructions?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          owner_user_id?: string | null
          name?: string
          primary_muscle?: string | null
          secondary_muscles?: string[]
          equipment?: string | null
          exercise_type?: string
          instructions?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      exercise_user_notes: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          exercise_id: string
          notes: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_user_notes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          weekdays: number[]
          notes: string | null
          position: number
          archived_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          description?: string | null
          weekdays?: number[]
          notes?: string | null
          position?: number
          archived_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          weekdays?: number[]
          notes?: string | null
          position?: number
          archived_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      template_exercises: {
        Row: {
          id: string
          user_id: string
          template_id: string
          exercise_id: string
          position: number
          target_sets: number | null
          target_reps_min: number | null
          target_reps_max: number | null
          target_rest_seconds: number | null
          target_rir: number | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          template_id: string
          exercise_id: string
          position?: number
          target_sets?: number | null
          target_reps_min?: number | null
          target_reps_max?: number | null
          target_rest_seconds?: number | null
          target_rir?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          exercise_id?: string
          position?: number
          target_sets?: number | null
          target_reps_min?: number | null
          target_reps_max?: number | null
          target_rest_seconds?: number | null
          target_rir?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          name: string
          started_at: string
          completed_at: string | null
          duration_seconds: number | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          template_id?: string | null
          name: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          name?: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          id: string
          user_id: string
          session_id: string
          exercise_id: string | null
          exercise_name_snapshot: string
          position: number
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          session_id: string
          exercise_id?: string | null
          exercise_name_snapshot: string
          position?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          exercise_id?: string | null
          exercise_name_snapshot?: string
          position?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          id: string
          user_id: string
          session_exercise_id: string
          set_number: number
          set_type: string
          weight_kg: number | null
          repetitions: number | null
          duration_seconds: number | null
          rir: number | null
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          session_exercise_id: string
          set_number: number
          set_type?: string
          weight_kg?: number | null
          repetitions?: number | null
          duration_seconds?: number | null
          rir?: number | null
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_exercise_id?: string
          set_number?: number
          set_type?: string
          weight_kg?: number | null
          repetitions?: number | null
          duration_seconds?: number | null
          rir?: number | null
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      keep_alive: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]
