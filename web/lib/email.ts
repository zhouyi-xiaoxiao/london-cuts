// Email sending seam. Wraps Resend.
// Implementations land in M2 (auth & invites).
// Magic-link email is sent by Supabase Auth itself (via Resend SMTP) —
// this seam is only for invite-specific / other transactional mail.
import { NotImplementedError } from "./errors";

export async function sendInviteEmail(
  _email: string,
  _code: string,
): Promise<void> {
  throw new NotImplementedError("sendInviteEmail");
}
