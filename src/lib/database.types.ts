// Hand-written to match supabase/migrations/20260826052413_create_profiles.sql,
// supabase/migrations/20260827135646_create_organizations.sql,
// supabase/migrations/20260829090000_phase3_member_management_rls.sql,
// supabase/migrations/20260830120000_phase4_rbac.sql, and
// supabase/migrations/20260904090000_phase5_clients_and_projects.sql.
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
          role_id: string
          status: "active" | "suspended"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role_id: string
          status?: "active" | "suspended"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role_id?: string
          status?: "active" | "suspended"
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
          {
            foreignKeyName: "memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role_id: string
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
          role_id: string
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
          role_id?: string
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
          {
            foreignKeyName: "invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          organization_id: string
          name: string
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          id: string
          key: string
          description: string
        }
        Insert: {
          id?: string
          key: string
          description: string
        }
        Update: {
          id?: string
          key?: string
          description?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
        }
        Insert: {
          role_id: string
          permission_id: string
        }
        Update: {
          role_id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          actor_id: string | null
          action: string
          target_type: string
          target_id: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          actor_id?: string | null
          action: string
          target_type: string
          target_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          actor_id?: string | null
          action?: string
          target_type?: string
          target_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          name: string
          status: "active" | "archived"
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          status?: "active" | "archived"
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          status?: "active" | "archived"
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          name: string
          color: string
          description: string | null
          status: "active" | "archived"
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          client_id?: string | null
          name: string
          color?: string
          description?: string | null
          status?: "active" | "archived"
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string | null
          name?: string
          color?: string
          description?: string | null
          status?: "active" | "archived"
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role_name: string
          status: string
          expires_at: string
          organization_name: string
        }[]
      }
      has_permission: {
        Args: { p_organization_id: string; p_permission_key: string }
        Returns: boolean
      }
      assign_membership_role: {
        Args: { p_membership_id: string; p_role_id: string }
        Returns: Database["public"]["Tables"]["memberships"]["Row"]
      }
    }
    // Roles are rows in the `roles` table (per-organization, database-driven),
    // not a Postgres enum — see supabase/migrations/20260830120000_phase4_rbac.sql.
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
