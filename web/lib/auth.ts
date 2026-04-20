// Authentication seam. Wraps Supabase Auth.
// Implementations land in M2 (currently mock-user for M-fast).
import { NotImplementedError } from "./errors";

export interface Session {
  userId: string;
  email: string;
  handle: string;
}

export async function getCurrentUser(): Promise<Session | null> {
  throw new NotImplementedError("getCurrentUser");
}

export async function requireUser(): Promise<Session> {
  throw new NotImplementedError("requireUser");
}

export async function sendMagicLink(_email: string): Promise<void> {
  throw new NotImplementedError("sendMagicLink");
}

export async function signOut(): Promise<void> {
  throw new NotImplementedError("signOut");
}

export async function verifyInvite(
  _code: string,
): Promise<{ valid: boolean; reason?: string }> {
  throw new NotImplementedError("verifyInvite");
}
