// Invite email markup. Adapted from the GoTrue template that used to live at
// supabase/templates/invite.html — the only real change is that the link is
// our own /invite/accept?token=... URL instead of {{ .ConfirmationURL }}.
//
// Why we render this ourselves rather than letting GoTrue mail it: GoTrue can
// only ever send *its own* single-use verification link, and corporate mail
// scanners (Defender/SafeLinks and friends) pre-fetch links on delivery, which
// burns that one-time token before the human ever clicks. The invitations row's
// token is idempotent and valid for 7 days, so a scanner GET is harmless.

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type InviteEmailInput = {
  acceptUrl: string
  organizationName: string
  roleName: string
  invitedByName: string | null
}

export function renderInviteEmail({
  acceptUrl,
  organizationName,
  roleName,
  invitedByName,
}: InviteEmailInput) {
  const url = escapeHtml(acceptUrl)
  const org = escapeHtml(organizationName)
  const role = escapeHtml(roleName)
  const inviter = invitedByName ? escapeHtml(invitedByName) : null

  const intro = inviter
    ? `${inviter} has invited you to join <strong style="color: #e2e8f0;">${org}</strong> on Time Trackr as ${role}.`
    : `You have been invited to join <strong style="color: #e2e8f0;">${org}</strong> on Time Trackr as ${role}.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to Time Trackr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; padding: 48px 16px;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #141b26; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
          <tr>
            <td style="padding: 32px 36px 24px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); text-align: left;">
              <img
                src="https://res.cloudinary.com/dryhpaq1t/image/upload/v1787895855/logo_dpuznm.png"
                alt="Time Trackr"
                width="140"
                style="display: block; width: 140px; height: auto; border: 0;"
              />
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #ffffff; line-height: 1.3;">
                You've been invited
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                ${intro}
              </p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #0d9488;">
                    <a href="${url}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; background-color: #0d9488; letter-spacing: 0.2px;">
                      Accept invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                This invitation expires in 7 days.
              </p>

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  If the button above does not work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                  <a href="${url}" style="color: #2dd4bf; text-decoration: underline;">${url}</a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 36px; background-color: #0e141e; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                © 2026 Time Trackr · Enterprise Time Tracking &amp; Reporting
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
