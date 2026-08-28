import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  listPendingInvitations,
  revokeInvitation,
  resendInvitation,
} = await import("@/features/users/services/invitation.service")

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
      roleId: "role-1",
      invitedBy: "user-1",
    })

    expect(mockSupabase.from).toHaveBeenCalledWith("invitations")
    expect(builder.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      email: "a@b.com",
      role_id: "role-1",
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
      createInvitation({
        organizationId: "org-1",
        email: "a@b.com",
        roleId: "role-1",
        invitedBy: "user-1",
      })
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
      createInvitation({
        organizationId: "org-1",
        email: "a@b.com",
        roleId: "role-1",
        invitedBy: "user-1",
      })
    ).rejects.toEqual(sendError)
  })
})

describe("getInvitationByToken", () => {
  it("calls the get_invitation_by_token RPC and returns the first row", async () => {
    const row = {
      email: "a@b.com",
      role_name: "Member",
      status: "pending",
      organization_name: "Acme",
    }
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
    const membership = { id: "m-1", organization_id: "org-1", role_id: "role-1" }
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

describe("listPendingInvitations", () => {
  it("lists pending invitations for an organization", async () => {
    const rows = [
      { id: "inv-1", email: "a@b.com", role: { id: "role-1", name: "Member" }, status: "pending" },
    ]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listPendingInvitations("org-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("invitations")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.eq).toHaveBeenCalledWith("status", "pending")
    expect(result).toEqual(rows)
  })
})

describe("revokeInvitation", () => {
  it("updates the invitation status to revoked", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await revokeInvitation("inv-1")

    expect(builder.update).toHaveBeenCalledWith({ status: "revoked" })
    expect(builder.eq).toHaveBeenCalledWith("id", "inv-1")
  })

  it("throws when the update fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(revokeInvitation("inv-1")).rejects.toEqual(error)
  })
})

describe("resendInvitation", () => {
  it("bumps the expiry and re-invokes the send-invite-email function", async () => {
    const invitation = { id: "inv-1", email: "a@b.com" }
    const builder = createQueryBuilderMock({ data: invitation, error: null })
    mockSupabase.from.mockReturnValue(builder)
    mockSupabase.functions.invoke.mockResolvedValue({ data: { ok: true }, error: null })

    const result = await resendInvitation("inv-1")

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ expires_at: expect.any(String) })
    )
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("send-invite-email", {
      body: { invitationId: "inv-1", isResend: true },
    })
    expect(result).toEqual(invitation)
  })
})
