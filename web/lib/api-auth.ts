// M2 PR 4 — shared API auth gate.
//
// Each /api/ai/* + /api/vision/* + /api/sync/* route calls `gateApiRequest()`
// at the top of its handler. The return value tells the route whether to
// continue (allowed=true) or bail with a pre-built error Response.
//
// Behaviour is controlled by the `M2_AUTH_ENABLED` env var:
//   - UNSET or anything other than "true" → legacy behaviour. allowed=true,
//     profileId=null. Route processes the request using `body.userId`
//     ("local" for unauthenticated writes). Preserves M-iter + M1 semantics.
//   - "true" → require a signed-in + onboarded user. Unauth → 401.
//     Signed-in-but-not-onboarded → 403. Admin check is separate.
//
// This keeps M2 PRs 4+5 shippable to prod without breaking the existing
// flow. Owner flips the env var when ready to cut over to real auth.
// At that point the preview-password gate can also be dropped — both
// layers exist for belt + braces only.

import { NextResponse } from "next/server";

import {
  AgentAuthError,
  requireAgentAccess,
  type AgentScope,
} from "@/lib/agent-auth";
import { requireOnboardedUser } from "@/lib/auth";
import {
  AuthRequiredError,
  OnboardingRequiredError,
} from "@/lib/errors";

export interface GateAllow {
  allowed: true;
  /** Non-null when M2_AUTH_ENABLED=true AND the caller is onboarded.
   *  Routes should prefer this over `body.userId`. */
  profileId: string | null;
  /** true when M2 auth is actively enforced. Routes MAY use this to
   *  decide whether to apply per-user-scoped RLS in subsequent DB calls. */
  authEnforced: boolean;
  authKind: "legacy" | "session" | "agent_token";
}

export interface GateBlock {
  allowed: false;
  response: Response;
}

export type GateResult = GateAllow | GateBlock;

function m2Enabled(): boolean {
  return process.env.M2_AUTH_ENABLED === "true";
}

/**
 * Gate an API request against M2 auth. Returns either `{allowed: true}`
 * (route proceeds) or `{allowed: false, response}` (route returns the
 * pre-built error Response directly).
 *
 * Typical use:
 *
 *     const gate = await gateApiRequest();
 *     if (!gate.allowed) return gate.response;
 *     const userId = gate.profileId ?? (body.userId ?? "local");
 */
export async function gateApiRequest(
  req?: Request,
  requiredScope?: AgentScope,
): Promise<GateResult> {
  if (!m2Enabled()) {
    return {
      allowed: true,
      profileId: null,
      authEnforced: false,
      authKind: "legacy",
    };
  }

  if (req && requiredScope) {
    try {
      const access = await requireAgentAccess(req, requiredScope);
      return {
        allowed: true,
        profileId: access.ownerId,
        authEnforced: true,
        authKind: access.kind,
      };
    } catch (err) {
      if (err instanceof AgentAuthError) {
        return {
          allowed: false,
          response: NextResponse.json(
            { error: err.message, code: err.code },
            { status: err.status },
          ),
        };
      }
      // Fall through to the legacy session-only error shape below.
    }
  }

  try {
    const user = await requireOnboardedUser();
    return {
      allowed: true,
      profileId: user.profile.id,
      authEnforced: true,
      authKind: "session",
    };
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Sign in required", code: "unauthenticated" },
          { status: 401 },
        ),
      };
    }
    if (err instanceof OnboardingRequiredError) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: "Finish onboarding — redeem an invite code first",
            code: "onboarding_required",
          },
          { status: 403 },
        ),
      };
    }
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "auth check failed", code: "server_error" },
        { status: 500 },
      ),
    };
  }
}

/** True when M2 auth gate is active. Exposed so routes can branch
 *  on whether to use service_role vs user-scoped clients. */
export function isM2Enabled(): boolean {
  return m2Enabled();
}
