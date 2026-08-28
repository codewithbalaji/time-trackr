// Hand-written to match supabase/migrations/20260826052413_create_profiles.sql and
// supabase/migrations/20260827135646_create_organizations.sql.
// Regenerate with `supabase gen types typescript --linked > src/lib/database.types.ts`
// once the migrations have been applied to a reachable database, and replace this file.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: "owner" | "member"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: "owner" | "member"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: "owner" | "member"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: "owner" | "member"
          token: string
          status: "pending" | "accepted" | "revoked"
          invited_by: string
          expires_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: "owner" | "member"
          token?: string
          status?: "pending" | "accepted" | "revoked"
          invited_by: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: "owner" | "member"
          token?: string
          status?: "pending" | "accepted" | "revoked"
          invited_by?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization_with_owner: {
        Args: { p_name: string }
        Returns: Database["public"]["Tables"]["organizations"]["Row"]
      }
      accept_invitation: {
        Args: { p_token: string }
        Returns: Database["public"]["Tables"]["memberships"]["Row"]
      }
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          role: string
          status: string
          expires_at: string
          organization_name: string
        }[]
      }
    }
    // Roles are plain `check`-constrained text columns, not Postgres enums (see the
    // organizations migration), so there is nothing to list here.
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
