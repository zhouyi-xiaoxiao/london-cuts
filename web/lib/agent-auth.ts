import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { requireOnboardedUser, type UserProfile } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase";

export const AGENT_TOKEN_PREFIX = "lc_pat_";

export type AgentScope = "public:read" | "project:write" | "ai:run";

export interface AgentAccess {
  kind: "session" | "agent_token" | "legacy";
  ownerId: string;
  profile: Pick<UserProfile, "id" | "handle" | "displayName" | "isAdmin"> | null;
  scopes: readonly AgentScope[];
}

export class AgentAuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 401,
    public readonly code:
      | "unauthenticated"
      | "forbidden"
      | "invalid_token"
      | "missing_scope" = "unauthenticated",
  ) {
    super(message);
  }
}

export function hashAgentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateAgentToken(): string {
  return `${AGENT_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function parseBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function requireAgentAccess(
  req: Request,
  requiredScope: AgentScope,
): Promise<AgentAccess> {
  const token = parseBearerToken(req);
  if (token) return requireTokenAccess(token, requiredScope);

  try {
    const session = await requireOnboardedUser();
    return {
      kind: "session",
      ownerId: session.profile.id,
      profile: {
        id: session.profile.id,
        handle: session.profile.handle,
        displayName: session.profile.displayName,
        isAdmin: session.profile.isAdmin,
      },
      scopes: ["public:read", "project:write", "ai:run"],
    };
  } catch {
    if (process.env.M2_AUTH_ENABLED !== "true") {
      return {
        kind: "legacy",
        ownerId: "00000000-0000-4000-8000-000000000001",
        profile: null,
        scopes: ["public:read", "project:write", "ai:run"],
      };
    }
    throw new AgentAuthError("Sign in or provide a Bearer API token", 401);
  }
}

async function requireTokenAccess(
  token: string,
  requiredScope: AgentScope,
): Promise<AgentAccess> {
  if (!token.startsWith(AGENT_TOKEN_PREFIX)) {
    throw new AgentAuthError("Invalid API token prefix", 401, "invalid_token");
  }

  let db;
  try {
    db = getServerClient();
  } catch {
    throw new AgentAuthError("API token auth is not configured", 401, "invalid_token");
  }

  const tokenHash = hashAgentToken(token);
  const { data, error } = await db
    .from("api_tokens")
    .select("id, owner_id, scopes, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data || data.revoked_at) {
    throw new AgentAuthError("Invalid or revoked API token", 401, "invalid_token");
  }

  const scopes = Array.isArray(data.scopes)
    ? (data.scopes.filter(isAgentScope) as AgentScope[])
    : [];
  if (!scopes.includes(requiredScope)) {
    throw new AgentAuthError(
      `API token is missing scope ${requiredScope}`,
      403,
      "missing_scope",
    );
  }

  await db
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  const { data: profileRow } = await db
    .from("users")
    .select("id, handle, display_name, is_admin")
    .eq("id", data.owner_id)
    .maybeSingle();
  return {
    kind: "agent_token",
    ownerId: data.owner_id as string,
    profile: profileRow
      ? {
          id: profileRow.id as string,
          handle: profileRow.handle as string,
          displayName: (profileRow.display_name as string | null) ?? null,
          isAdmin: Boolean(profileRow.is_admin),
        }
      : null,
    scopes,
  };
}

function isAgentScope(value: unknown): value is AgentScope {
  return (
    value === "public:read" ||
    value === "project:write" ||
    value === "ai:run"
  );
}
