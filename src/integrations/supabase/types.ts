export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          created_at: string
          date: string
          day_of_week: number | null
          end_time: string
          id: string
          is_booked: boolean
          start_time: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_of_week?: number | null
          end_time: string
          id?: string
          is_booked?: boolean
          start_time: string
          trainer_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_booked?: boolean
          start_time?: string
          trainer_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"]
          client_id: string
          created_at: string
          id: string
          notes: string | null
          slot_id: string
          total_price: number | null
          commission_rate: number | null
          commission_amount: number | null
          net_amount: number | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          slot_id: string
          total_price?: number | null
          commission_rate?: number | null
          commission_amount?: number | null
          net_amount?: number | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          slot_id?: string
          total_price?: number | null
          commission_rate?: number | null
          commission_amount?: number | null
          net_amount?: number | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pose_sessions: {
        Row: {
          accuracy_score: number | null
          client_id: string
          created_at: string
          exercise_name: string
          feedback_json: Json | null
          id: string
        }
        Insert: {
          accuracy_score?: number | null
          client_id: string
          created_at?: string
          exercise_name: string
          feedback_json?: Json | null
          id?: string
        }
        Update: {
          accuracy_score?: number | null
          client_id?: string
          created_at?: string
          exercise_name?: string
          feedback_json?: Json | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_times: Json | null
          avatar_url: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          email: string | null
          experience_level: string | null
          fitness_goal: Database["public"]["Enums"]["fitness_goal"] | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          health_conditions: string | null
          id: string
          latitude: number | null
          longitude: number | null
          preferred_experience:
            | Database["public"]["Enums"]["experience_pref"]
            | null
          preferred_style: string | null
          preferred_trainer_gender:
            | Database["public"]["Enums"]["gender_type"]
            | null
          reward_points: number | null
          sessions_per_week: number | null
          training_modality: string | null
          updated_at: string
        }
        Insert: {
          available_times?: Json | null
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          health_conditions?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          preferred_experience?:
            | Database["public"]["Enums"]["experience_pref"]
            | null
          preferred_style?: string | null
          preferred_trainer_gender?:
            | Database["public"]["Enums"]["gender_type"]
            | null
          reward_points?: number | null
          sessions_per_week?: number | null
          training_modality?: string | null
          updated_at?: string
        }
        Update: {
          available_times?: Json | null
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          health_conditions?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          preferred_experience?:
            | Database["public"]["Enums"]["experience_pref"]
            | null
          preferred_style?: string | null
          preferred_trainer_gender?:
            | Database["public"]["Enums"]["gender_type"]
            | null
          reward_points?: number | null
          sessions_per_week?: number | null
          training_modality?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          trainer_id: string
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          trainer_id: string
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          trainer_id?: string
        }
        Relationships: []
      }
      trainer_matches: {
        Row: {
          client_id: string
          created_at: string
          id: string
          match_reason: Json | null
          match_score: number
          trainer_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          match_reason?: Json | null
          match_score?: number
          trainer_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          match_reason?: Json | null
          match_score?: number
          trainer_id?: string
        }
        Relationships: []
      }
      trainer_profiles: {
        Row: {
          bio: string | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          gym_name: string | null
          id: string
          is_approved: boolean | null
          is_suspended: boolean | null
          price_per_session: number | null
          rating: number | null
          rating_count: number | null
          response_rate: number | null
          retention_rate: number | null
          specialties: string[] | null
          specialized_goals: (Database["public"]["Enums"]["fitness_goal"])[] | null
          target_client_level: string[] | null
          training_location: string | null
          training_modality: string[] | null
          training_style: string | null
          auto_accept: boolean | null
          commission_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          gym_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_suspended?: boolean | null
          price_per_session?: number | null
          rating?: number | null
          rating_count?: number | null
          response_rate?: number | null
          retention_rate?: number | null
          specialties?: string[] | null
          specialized_goals?: (Database["public"]["Enums"]["fitness_goal"])[] | null
          target_client_level?: string[] | null
          training_location?: string | null
          training_modality?: string[] | null
          training_style?: string | null
          auto_accept?: boolean | null
          commission_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          gym_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_suspended?: boolean | null
          price_per_session?: number | null
          rating?: number | null
          rating_count?: number | null
          response_rate?: number | null
          retention_rate?: number | null
          specialties?: string[] | null
          specialized_goals?: (Database["public"]["Enums"]["fitness_goal"])[] | null
          target_client_level?: string[] | null
          training_location?: string | null
          training_modality?: string[] | null
          training_style?: string | null
          auto_accept?: boolean | null
          commission_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          id: string
          user_id: string
          student_id: string | null
          faculty: string | null
          major: string | null
          year: number | null
          gpa: number | null
          phone: string | null
          line_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          student_id?: string | null
          faculty?: string | null
          major?: string | null
          year?: number | null
          gpa?: number | null
          phone?: string | null
          line_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          student_id?: string | null
          faculty?: string | null
          major?: string | null
          year?: number | null
          gpa?: number | null
          phone?: string | null
          line_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          id: string
          student_id: string
          course_code: string | null
          course_name: string
          day_of_week: number
          start_time: string
          end_time: string
          room: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_code?: string | null
          course_name: string
          day_of_week: number
          start_time: string
          end_time: string
          room?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_code?: string | null
          course_name?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          room?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employers: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          company_reg_no: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          address: string | null
          description: string | null
          logo_url: string | null
          is_verified: boolean | null
          rating: number | null
          rating_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name?: string | null
          company_reg_no?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          address?: string | null
          description?: string | null
          logo_url?: string | null
          is_verified?: boolean | null
          rating?: number | null
          rating_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string | null
          company_reg_no?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          address?: string | null
          description?: string | null
          logo_url?: string | null
          is_verified?: boolean | null
          rating?: number | null
          rating_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          employer_id: string
          store_name: string
          store_type: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          operating_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          store_name: string
          store_type?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          operating_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          store_name?: string
          store_type?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          operating_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          store_id: string | null
          title: string
          description: string | null
          job_type: string | null
          wage_per_hour: number
          positions: number | null
          requirements: string | null
          benefits: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          store_id?: string | null
          title: string
          description?: string | null
          job_type?: string | null
          wage_per_hour: number
          positions?: number | null
          requirements?: string | null
          benefits?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          store_id?: string | null
          title?: string
          description?: string | null
          job_type?: string | null
          wage_per_hour?: number
          positions?: number | null
          requirements?: string | null
          benefits?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_schedules: {
        Row: {
          id: string
          job_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          job_id: string
          student_id: string
          status: string | null
          cover_note: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          student_id: string
          status?: string | null
          cover_note?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          student_id?: string
          status?: string | null
          cover_note?: string | null
          applied_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          id: string
          student_id: string
          job_id: string
          match_score: number
          match_reason: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          job_id: string
          match_score?: number
          match_reason?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          job_id?: string
          match_score?: number
          match_reason?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          id: string
          application_id: string | null
          student_id: string
          job_id: string
          work_date: string
          start_time: string
          end_time: string
          actual_start: string | null
          actual_end: string | null
          hours_worked: number | null
          total_wage: number | null
          status: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id?: string | null
          student_id: string
          job_id: string
          work_date: string
          start_time: string
          end_time: string
          actual_start?: string | null
          actual_end?: string | null
          hours_worked?: number | null
          total_wage?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string | null
          student_id?: string
          job_id?: string
          work_date?: string
          start_time?: string
          end_time?: string
          actual_start?: string | null
          actual_end?: string | null
          hours_worked?: number | null
          total_wage?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          student_id: string
          work_schedule_id: string | null
          type: string
          amount: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          work_schedule_id?: string | null
          type: string
          amount: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          work_schedule_id?: string | null
          type?: string
          amount?: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          employer_id: string
          store_id: string | null
          month: number
          year: number
          total_budget: number
          used_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          store_id?: string | null
          month: number
          year: number
          total_budget: number
          used_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          store_id?: string | null
          month?: number
          year?: number
          total_budget?: number
          used_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_daily_login: {
        Args: { _user_id: string }
        Returns: boolean
      }
      notify_trainer_new_booking: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "client" | "trainer" | "admin" | "student" | "employer"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "completed"
      experience_pref: "any" | "beginner" | "intermediate" | "advanced"
      fitness_goal:
        | "weight_loss"
        | "muscle_gain"
        | "body_recomposition"
        | "strength_training"
        | "general_fitness"
      gender_type: "male" | "female" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "trainer", "admin", "student", "employer"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
      ],
      experience_pref: ["any", "beginner", "intermediate", "advanced"],
      fitness_goal: [
        "weight_loss",
        "muscle_gain",
        "body_recomposition",
        "strength_training",
        "general_fitness",
      ],
      gender_type: ["male", "female", "other"],
    },
  },
} as const
