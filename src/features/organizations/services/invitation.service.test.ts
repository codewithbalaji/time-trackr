import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { createInvitation, getInvitationByToken, acceptInvitation } = await import(
  "@/features/organizations/services/invitation.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createInvitation", () => {
  it("inserts an invitation row and then invokes the send-invite-email function", async () => {
    const invitation = { id: "inv-1", email: "a@b.com", organization_id: "org-1" }
    const builder = createQueryBuilderMock({ data: invitation, error: null })
    mockSupabase.from.mockReturnValue(builder)
    mockSupabase.functions.invoke.mockResolvedValue({ data: { ok: true }, error: null })

    const result = await createInvitation({
      organizationId: "org-1",
      email: "a@b.com",
      invitedBy: "user-1",
    })

    expect(mockSupabase.from).toHaveBeenCalledWith("invitations")
    expect(builder.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      email: "a@b.com",
      invited_by: "user-1",
    })
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("send-invite-email", {
      body: { invitationId: "inv-1" },
    })
    expect(result).toEqual(invitation)
  })

  it("throws when the insert fails, without invoking the email function", async () => {
    const error = { message: "23505", code: "23505" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(
      createInvitation({ organizationId: "org-1", email: "a@b.com", invitedBy: "user-1" })
    ).rejects.toEqual(error)
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled()
  })

  it("throws when sending the email fails", async () => {
    const invitation = { id: "inv-1", email: "a@b.com", organization_id: "org-1" }
    const builder = createQueryBuilderMock({ data: invitation, error: null })
    mockSupabase.from.mockReturnValue(builder)
    const sendError = { message: "boom" }
    mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: sendError })

    await expect(
      createInvitation({ organizationId: "org-1", email: "a@b.com", invitedBy: "user-1" })
    ).rejects.toEqual(sendError)
  })
})

describe("getInvitationByToken", () => {
  it("calls the get_invitation_by_token RPC and returns the first row", async () => {
    const row = { email: "a@b.com", role: "member", status: "pending", organization_name: "Acme" }
    mockSupabase.rpc.mockResolvedValue({ data: [row], error: null })

    const result = await getInvitationByToken("token-1")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_invitation_by_token", {
      p_token: "token-1",
    })
    expect(result).toEqual(row)
  })

  it("returns null when no invitation matches the token", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

    const result = await getInvitationByToken("token-1")

    expect(result).toBeNull()
  })
})

describe("acceptInvitation", () => {
  it("calls the accept_invitation RPC with the token", async () => {
    const membership = { id: "m-1", organization_id: "org-1", role: "member" }
    mockSupabase.rpc.mockResolvedValue({ data: membership, error: null })

    const result = await acceptInvitation("token-1")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("accept_invitation", { p_token: "token-1" })
    expect(result).toEqual(membership)
  })

  it("throws the Supabase error", async () => {
    const error = { message: "invitation_expired" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(acceptInvitation("token-1")).rejects.toEqual(error)
  })
})
