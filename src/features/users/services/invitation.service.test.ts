import { beforeEach, describe, expect, it, vi } from "vitest"

import { FunctionsFetchError } from "@supabase/supabase-js"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  listPendingInvitations,
  listPendingInvitationsForCurrentUser,
  declineInvitation,
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

  it("turns a FunctionsFetchError into a code the error map recognises", async () => {
    // A request that never reached the function (offline, CORS, cold start)
    // used to fall through toInvitationError untouched and surface as an
    // unexplained "Something went wrong."
    const invitation = { id: "inv-1", email: "a@b.com", organization_id: "org-1" }
    mockSupabase.from.mockReturnValue(createQueryBuilderMock({ data: invitation, error: null }))
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: new FunctionsFetchError(new TypeError("Failed to fetch")),
    })

    await expect(
      createInvitation({
        organizationId: "org-1",
        email: "a@b.com",
        roleId: "role-1",
        invitedBy: "user-1",
      })
    ).rejects.toMatchObject({ code: "email_unreachable" })

    expect(mapOrganizationError({ code: "email_unreachable", message: "email_unreachable" })).toMatch(
      /couldn't reach the server/i
    )
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

describe("listPendingInvitationsForCurrentUser", () => {
  it("calls the get_pending_invitations_for_current_user RPC", async () => {
    const rows = [
      {
        id: "inv-1",
        token: "token-1",
        expires_at: "2026-12-31T00:00:00Z",
        role_name: "Member",
        organization_name: "Acme",
      },
    ]
    mockSupabase.rpc.mockResolvedValue({ data: rows, error: null })

    const result = await listPendingInvitationsForCurrentUser()

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_pending_invitations_for_current_user")
    expect(result).toEqual(rows)
  })

  it("throws the Supabase error", async () => {
    const error = { message: "boom" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(listPendingInvitationsForCurrentUser()).rejects.toEqual(error)
  })
})

describe("declineInvitation", () => {
  it("calls the decline_invitation RPC with the token", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

    await declineInvitation("token-1")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("decline_invitation", { p_token: "token-1" })
  })

  it("throws the Supabase error", async () => {
    const error = { message: "invitation_not_found" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(declineInvitation("token-1")).rejects.toEqual(error)
  })
})

describe("revokeInvitation", () => {
  it("updates the invitation status to revoked", async () => {
    const builder = createQueryBuilderMock({ data: [{ id: "inv-1" }], error: null })
    mockSupabase.from.mockReturnValue(builder)

    await revokeInvitation("inv-1")

    expect(builder.update).toHaveBeenCalledWith({ status: "revoked" })
    expect(builder.eq).toHaveBeenCalledWith("id", "inv-1")
  })

  it("throws when RLS refuses the update, which affects no rows and reports no error", async () => {
    const builder = createQueryBuilderMock({ data: [], error: null })
    mockSupabase.from.mockReturnValue(builder)

    await expect(revokeInvitation("inv-1")).rejects.toMatchObject({ code: "not_permitted" })
  })

  it("throws when the update fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(revokeInvitation("inv-1")).rejects.toEqual(error)
  })
})

describe("resendInvitation", () => {
  it("bumps the expiry, rotates the token, and re-invokes the send-invite-email function", async () => {
    const invitation = { id: "inv-1", email: "a@b.com" }
    const builder = createQueryBuilderMock({ data: invitation, error: null })
    mockSupabase.from.mockReturnValue(builder)
    mockSupabase.functions.invoke.mockResolvedValue({ data: { ok: true }, error: null })

    const result = await resendInvitation("inv-1")

    // The link *is* the token, so a resend has to issue a new one — otherwise
    // every previously mailed copy stays live.
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ expires_at: expect.any(String), token: expect.any(String) })
    )
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("send-invite-email", {
      body: { invitationId: "inv-1" },
    })
    expect(result).toEqual(invitation)
  })
})
