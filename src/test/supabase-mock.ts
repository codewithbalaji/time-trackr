import { vi } from "vitest"

// Shared shape for mocking `@/lib/supabase` across service, hook, and
// component/integration tests. Use with:
//   vi.mock("@/lib/supabase", () => ({ supabase: createMockSupabaseClient() }))
export function createMockSupabaseClient() {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
  }
}
