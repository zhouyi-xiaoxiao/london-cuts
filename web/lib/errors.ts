// Typed error classes used across all seams.
// See ../docs/architecture.md#the-seam-layers

export class NotImplementedError extends Error {
  constructor(fn: string) {
    super(`Not implemented: ${fn}`);
    this.name = "NotImplementedError";
  }
}

export class InviteInvalidError extends Error {
  constructor(msg = "Invite code is invalid or used") {
    super(msg);
    this.name = "InviteInvalidError";
  }
}

export class QuotaExceededError extends Error {
  constructor(limit: number) {
    super(`Daily quota exceeded (${limit})`);
    this.name = "QuotaExceededError";
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export class OnboardingRequiredError extends Error {
  constructor() {
    super("User profile incomplete — redeem an invite code first");
    this.name = "OnboardingRequiredError";
  }
}

export class AdminRequiredError extends Error {
  constructor() {
    super("Admin privileges required");
    this.name = "AdminRequiredError";
  }
}
