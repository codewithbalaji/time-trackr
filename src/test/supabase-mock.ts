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
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  }
}

// A chainable query-builder mock for `.from(...).select().eq().single()`-style
// calls. Every method (other than the awaited terminal one) returns `this`, so
// tests can chain `.select().eq().maybeSingle()` regardless of call order; the
// final resolved value is `result` for every terminal call (`single`,
// `maybeSingle`, or awaiting the builder itself).
export function createQueryBuilderMock(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}
  const chainable = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "ilike",
    "not",
    "gte",
    "lt",
    "in",
    "is",
    "order",
    "limit",
  ]
  for (const method of chainable) {
    builder[method] = vi.fn(() => builder)
  }
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  builder.then = vi.fn((resolve) => Promise.resolve(result).then(resolve))
  return builder
}
