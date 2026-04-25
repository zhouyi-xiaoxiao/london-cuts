// Transactional email helpers. Supabase Auth sends magic links via its
// configured SMTP; this file is for app-owned notifications such as
// telling the owner when a beta user finishes onboarding.

import { env } from "./env";
import { NotImplementedError } from "./errors";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface ResendEmail {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export interface NewSignupNotification {
  email: string;
  handle: string;
  displayName: string | null;
  inviteCode: string;
  profileId: string;
}

export async function sendInviteEmail(
  _email: string,
  _code: string,
): Promise<void> {
  throw new NotImplementedError("sendInviteEmail");
}

export async function sendOwnerNewSignupEmail(
  input: NewSignupNotification,
): Promise<"sent" | "skipped"> {
  const to = env.OWNER_NOTIFY_EMAIL.trim();
  const apiKey = env.RESEND_API_KEY.trim();
  if (!to || !apiKey) return "skipped";

  const publicUrl = `${env.APP_URL.replace(/\/$/, "")}/@${input.handle}`;
  const displayName = input.displayName?.trim() || "(no display name)";
  const subject = `London Cuts new signup: @${input.handle}`;
  const text = [
    "A new London Cuts beta user completed onboarding.",
    "",
    `Name: ${displayName}`,
    `Handle: @${input.handle}`,
    `Email: ${input.email}`,
    `Invite code: ${input.inviteCode}`,
    `Profile ID: ${input.profileId}`,
    `Public URL: ${publicUrl}`,
  ].join("\n");

  await sendResendEmail({
    from: env.TRANSACTIONAL_FROM_EMAIL,
    to,
    subject,
    text,
    html: renderOwnerSignupHtml({
      ...input,
      displayName,
      publicUrl,
    }),
  });
  return "sent";
}

async function sendResendEmail(payload: ResendEmail): Promise<void> {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `Resend email failed (${res.status})${detail ? `: ${detail}` : ""}`,
    );
  }
}

function renderOwnerSignupHtml(
  input: NewSignupNotification & { displayName: string; publicUrl: string },
): string {
  const rows = [
    ["Name", input.displayName],
    ["Handle", `@${input.handle}`],
    ["Email", input.email],
    ["Invite code", input.inviteCode],
    ["Profile ID", input.profileId],
    ["Public URL", input.publicUrl],
  ];
  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">New London Cuts signup</h1>
      <p>A beta user completed onboarding.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="font-weight: 600; border-bottom: 1px solid #ddd;">${escapeHtml(label)}</td>
                <td style="border-bottom: 1px solid #ddd;">${escapeHtml(value)}</td>
              </tr>`,
          )
          .join("")}
      </table>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
