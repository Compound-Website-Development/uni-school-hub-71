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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      academic_resources: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          subject_id: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_resources_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          can_add_admins: boolean
          can_approve_grades: boolean
          can_manage_fees: boolean
          can_manage_students: boolean
          can_manage_teachers: boolean
          can_upload_bulk_data: boolean
          can_view_reports: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_add_admins?: boolean
          can_approve_grades?: boolean
          can_manage_fees?: boolean
          can_manage_students?: boolean
          can_manage_teachers?: boolean
          can_upload_bulk_data?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_add_admins?: boolean
          can_approve_grades?: boolean
          can_manage_fees?: boolean
          can_manage_students?: boolean
          can_manage_teachers?: boolean
          can_upload_bulk_data?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          priority: string
          target_role: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          priority?: string
          target_role?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          priority?: string
          target_role?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          address: string | null
          application_id: string
          applying_for_grade: number | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          generated_student_id: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          id: string
          last_grade_completed: string | null
          last_name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          previous_school: string | null
          programme: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          village: string | null
        }
        Insert: {
          address?: string | null
          application_id: string
          applying_for_grade?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          generated_student_id?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          last_grade_completed?: string | null
          last_name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          previous_school?: string | null
          programme?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          application_id?: string
          applying_for_grade?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          generated_student_id?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          last_grade_completed?: string | null
          last_name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          previous_school?: string | null
          programme?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          content: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          id: string
          score: number | null
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id?: string | null
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string | null
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          max_score: number | null
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          max_score?: number | null
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          max_score?: number | null
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_records: {
        Row: {
          action_taken: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          recorded_at: string
          severity: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          action_taken?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          recorded_at?: string
          severity?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          action_taken?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          recorded_at?: string
          severity?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      book_issues: {
        Row: {
          book_id: string | null
          created_at: string
          due_date: string | null
          id: string
          issued_on: string
          returned_on: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          issued_on?: string
          returned_on?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          issued_on?: string
          returned_on?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          id: string
          issued_on: string
          serial_number: string
          student_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_on?: string
          serial_number: string
          student_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_on?: string
          serial_number?: string
          student_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          arm: string | null
          capacity: number | null
          class_teacher_id: string | null
          created_at: string
          grade_level: number | null
          id: string
          level: string | null
          name: string
          programme_id: string | null
          room: string | null
          school_type: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          arm?: string | null
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          grade_level?: number | null
          id?: string
          level?: string | null
          name: string
          programme_id?: string | null
          room?: string | null
          school_type?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          arm?: string | null
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          grade_level?: number | null
          id?: string
          level?: string | null
          name?: string
          programme_id?: string | null
          room?: string | null
          school_type?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          created_at: string
          description: string | null
          id: string
          priority: string
          response: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          response?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          response?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      counseling_sessions: {
        Row: {
          created_at: string
          follow_up_date: string | null
          id: string
          notes: string | null
          reason: string | null
          session_date: string
          session_type: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          session_date?: string
          session_type?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          session_date?: string
          session_type?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_index: number | null
          created_at: string
          exam_id: string
          id: string
          options: Json
          points: number
          question_text: string
        }
        Insert: {
          correct_index?: number | null
          created_at?: string
          exam_id: string
          id?: string
          options?: Json
          points?: number
          question_text: string
        }
        Update: {
          correct_index?: number | null
          created_at?: string
          exam_id?: string
          id?: string
          options?: Json
          points?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_submissions: {
        Row: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          score: number | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          exam_id: string
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_id?: string
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_published: boolean
          start_time: string | null
          status: string
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_published?: boolean
          start_time?: string | null
          status?: string
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_published?: boolean
          start_time?: string | null
          status?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_items: {
        Row: {
          amount: number
          class_id: string | null
          created_at: string
          id: string
          name: string
          term_id: string | null
        }
        Insert: {
          amount?: number
          class_id?: string | null
          created_at?: string
          id?: string
          name: string
          term_id?: string | null
        }
        Update: {
          amount?: number
          class_id?: string | null
          created_at?: string
          id?: string
          name?: string
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_items_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount_paid: number
          created_at: string
          fee_item_id: string | null
          id: string
          method: string | null
          paid_at: string
          reference: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          fee_item_id?: string | null
          id?: string
          method?: string | null
          paid_at?: string
          reference?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          fee_item_id?: string | null
          id?: string
          method?: string | null
          paid_at?: string
          reference?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_audit: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          class_id: string | null
          continuous_assessment: number | null
          created_at: string
          entered_by: string | null
          exam_score: number | null
          id: string
          letter_grade: string | null
          remark: string | null
          status: string
          student_id: string
          subject_id: string | null
          term_id: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          continuous_assessment?: number | null
          created_at?: string
          entered_by?: string | null
          exam_score?: number | null
          id?: string
          letter_grade?: string | null
          remark?: string | null
          status?: string
          student_id: string
          subject_id?: string | null
          term_id?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          continuous_assessment?: number | null
          created_at?: string
          entered_by?: string | null
          exam_score?: number | null
          id?: string
          letter_grade?: string | null
          remark?: string | null
          status?: string
          student_id?: string
          subject_id?: string | null
          term_id?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          available: number
          category: string | null
          condition: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          quantity: number
          serial_number: string | null
        }
        Insert: {
          available?: number
          category?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          quantity?: number
          serial_number?: string | null
        }
        Update: {
          available?: number
          category?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          quantity?: number
          serial_number?: string | null
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          amount: number
          created_at: string
          description: string
          fee_item_id: string | null
          id: string
          invoice_id: string
          kind: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          fee_item_id?: string | null
          id?: string
          invoice_id: string
          kind?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          fee_item_id?: string | null
          id?: string
          invoice_id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          class_id: string | null
          created_at: string
          created_by: string | null
          discount_total: number
          due_date: string | null
          id: string
          notes: string | null
          serial: string
          status: string
          student_id: string
          subtotal: number
          term_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_total?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          serial: string
          status?: string
          student_id: string
          subtotal?: number
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_total?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          serial?: string
          status?: string
          student_id?: string
          subtotal?: number
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          activities: string | null
          class_id: string | null
          created_at: string
          date: string | null
          homework_assigned: string | null
          id: string
          objectives: string | null
          resources: string | null
          status: string
          subject_id: string | null
          teacher_id: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          activities?: string | null
          class_id?: string | null
          created_at?: string
          date?: string | null
          homework_assigned?: string | null
          id?: string
          objectives?: string | null
          resources?: string | null
          status?: string
          subject_id?: string | null
          teacher_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          activities?: string | null
          class_id?: string | null
          created_at?: string
          date?: string | null
          homework_assigned?: string | null
          id?: string
          objectives?: string | null
          resources?: string | null
          status?: string
          subject_id?: string | null
          teacher_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          author: string | null
          available: number
          category: string | null
          created_at: string
          id: string
          isbn: string | null
          quantity: number
          title: string
        }
        Insert: {
          author?: string | null
          available?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          quantity?: number
          title: string
        }
        Update: {
          author?: string | null
          available?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          quantity?: number
          title?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          relation: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          relation?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
          relation?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number | null
          created_at: string
          fee_item_id: string | null
          file_url: string | null
          id: string
          note: string | null
          reference: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          fee_item_id?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          fee_item_id?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          issued_at: string
          issued_by: string | null
          method: string
          note: string | null
          reference: string | null
          serial: string
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          issued_at?: string
          issued_by?: string | null
          method?: string
          note?: string | null
          reference?: string | null
          serial: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          issued_at?: string
          issued_by?: string | null
          method?: string
          note?: string | null
          reference?: string | null
          serial?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          class_id: string | null
          created_at: string
          day_of_week: number | null
          end_time: string | null
          id: string
          room: string | null
          start_time: string | null
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          location: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          id: string
          is_late: boolean
          notes: string | null
          teacher_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          is_late?: boolean
          notes?: string | null
          teacher_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          is_late?: boolean
          notes?: string | null
          teacher_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_discounts: {
        Row: {
          approved_by: string | null
          created_at: string
          discount_type: string
          id: string
          reason: string | null
          student_id: string
          term_id: string | null
          updated_at: string
          value: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          discount_type?: string
          id?: string
          reason?: string | null
          student_id: string
          term_id?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          discount_type?: string
          id?: string
          reason?: string | null
          student_id?: string
          term_id?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_discounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discounts_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          bio: string | null
          blood_group: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          first_name: string
          gender: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          hobbies: string | null
          id: string
          is_verified: boolean
          last_name: string
          middle_name: string | null
          nationality: string | null
          parent_code: string | null
          parent_id: string | null
          parent_phone: string | null
          phone: string | null
          photo_url: string | null
          programme_id: string | null
          public_token: string
          religion: string | null
          section: string | null
          state_of_origin: string | null
          status: string
          student_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          bio?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          hobbies?: string | null
          id?: string
          is_verified?: boolean
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          parent_code?: string | null
          parent_id?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo_url?: string | null
          programme_id?: string | null
          public_token?: string
          religion?: string | null
          section?: string | null
          state_of_origin?: string | null
          status?: string
          student_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          bio?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          hobbies?: string | null
          id?: string
          is_verified?: boolean
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          parent_code?: string | null
          parent_id?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo_url?: string | null
          programme_id?: string | null
          public_token?: string
          religion?: string | null
          section?: string | null
          state_of_origin?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      substitutions: {
        Row: {
          created_at: string
          date: string
          id: string
          original_teacher_id: string | null
          reason: string | null
          schedule_id: string | null
          status: string
          substitute_teacher_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          original_teacher_id?: string | null
          reason?: string | null
          schedule_id?: string | null
          status?: string
          substitute_teacher_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          original_teacher_id?: string | null
          reason?: string | null
          schedule_id?: string | null
          status?: string
          substitute_teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_original_teacher_id_fkey"
            columns: ["original_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_substitute_teacher_id_fkey"
            columns: ["substitute_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          employee_id: string | null
          first_name: string
          gender: string | null
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          photo_url: string | null
          qualification: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string | null
          first_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      term_results: {
        Row: {
          affective: Json
          average: number | null
          class_position: number | null
          class_size: number | null
          created_at: string
          gpa: number | null
          id: string
          is_published: boolean
          next_term_begins: string | null
          principal_comment: string | null
          psychomotor: Json
          student_id: string
          teacher_comment: string | null
          term_id: string | null
          times_opened: number | null
          times_present: number | null
          updated_at: string
        }
        Insert: {
          affective?: Json
          average?: number | null
          class_position?: number | null
          class_size?: number | null
          created_at?: string
          gpa?: number | null
          id?: string
          is_published?: boolean
          next_term_begins?: string | null
          principal_comment?: string | null
          psychomotor?: Json
          student_id: string
          teacher_comment?: string | null
          term_id?: string | null
          times_opened?: number | null
          times_present?: number | null
          updated_at?: string
        }
        Update: {
          affective?: Json
          average?: number | null
          class_position?: number | null
          class_size?: number | null
          created_at?: string
          gpa?: number | null
          id?: string
          is_published?: boolean
          next_term_begins?: string | null
          principal_comment?: string | null
          psychomotor?: Json
          student_id?: string
          teacher_comment?: string | null
          term_id?: string | null
          times_opened?: number | null
          times_present?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          name: string
          session: string | null
          start_date: string | null
          term_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name: string
          session?: string | null
          start_date?: string | null
          term_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name?: string
          session?: string | null
          start_date?: string | null
          term_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      transport_routes: {
        Row: {
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          name: string
          pickup_points: string | null
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          name: string
          pickup_points?: string | null
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          name?: string
          pickup_points?: string | null
          vehicle_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_log: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          name: string
          person_to_meet: string | null
          phone: string | null
          purpose: string | null
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          name: string
          person_to_meet?: string | null
          phone?: string | null
          purpose?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          name?: string
          person_to_meet?: string | null
          phone?: string | null
          purpose?: string | null
        }
        Relationships: []
      }
      wall_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      wall_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_student: { Args: { _student_id: string }; Returns: boolean }
      can_view_student: { Args: { _student_id: string }; Returns: boolean }
      debtor_report: {
        Args: { _term_id?: string }
        Returns: {
          admission_no: string
          amount_paid: number
          balance: number
          class_name: string
          due_date: string
          invoice_id: string
          serial: string
          status: string
          student_id: string
          student_name: string
          total: number
        }[]
      }
      generate_term_invoices: {
        Args: { _class_id?: string; _due_date?: string; _term_id: string }
        Returns: number
      }
      has_admin_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_invoice_serial: { Args: never; Returns: string }
      next_receipt_serial: { Args: never; Returns: string }
      public_student_profile: {
        Args: { _token: string }
        Returns: {
          admission_no: string
          attendance_present: number
          attendance_total: number
          class_name: string
          full_name: string
          photo_url: string
          status: string
        }[]
      }
      public_student_results: {
        Args: { _token: string }
        Returns: {
          letter_grade: string
          remark: string
          subject: string
          term: string
          total_score: number
        }[]
      }
      recalc_invoice: { Args: { _invoice_id: string }; Returns: undefined }
      record_manual_payment: {
        Args: {
          _amount: number
          _invoice_id: string
          _method?: string
          _note?: string
          _reference?: string
        }
        Returns: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          issued_at: string
          issued_by: string | null
          method: string
          note: string | null
          reference: string | null
          serial: string
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "receipts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      staff_teacher_records: {
        Args: never
        Returns: {
          address: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          employee_id: string | null
          first_name: string
          gender: string | null
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          photo_url: string | null
          qualification: string | null
          status: string
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "teachers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      student_exam_questions: {
        Args: { _exam_id: string }
        Returns: {
          exam_id: string
          id: string
          options: Json
          points: number
          question_text: string
        }[]
      }
      submit_exam: {
        Args: { _submission_id: string }
        Returns: {
          score: number
          total_points: number
        }[]
      }
      teaches_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      upsert_student_discount: {
        Args: {
          _discount_type: string
          _reason?: string
          _student_id: string
          _term_id: string
          _value: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin" | "parent"
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
      app_role: ["student", "teacher", "admin", "parent"],
    },
  },
} as const
