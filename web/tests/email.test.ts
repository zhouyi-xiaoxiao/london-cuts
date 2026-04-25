// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEmailModule() {
  vi.resetModules();
  return import("@/lib/email");
}

describe("transactional email helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("skips owner signup notifications until env is configured", async () => {
    vi.stubEnv("OWNER_NOTIFY_EMAIL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("should not send"));
    const { sendOwnerNewSignupEmail } = await loadEmailModule();

    await expect(
      sendOwnerNewSignupEmail({
        email: "new@example.com",
        handle: "new-user",
        displayName: "New User",
        inviteCode: "beta-001",
        profileId: "profile-1",
      }),
    ).resolves.toBe("skipped");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends owner signup notifications through Resend when configured", async () => {
    vi.stubEnv("OWNER_NOTIFY_EMAIL", "owner@example.com");
    vi.stubEnv("RESEND_API_KEY", "resend-test-key");
    vi.stubEnv(
      "TRANSACTIONAL_FROM_EMAIL",
      "London Cuts <no-reply@auth.example.com>",
    );
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://london-cuts.example");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "email-1" }), { status: 200 }),
    );
    const { sendOwnerNewSignupEmail } = await loadEmailModule();

    await expect(
      sendOwnerNewSignupEmail({
        email: "new@example.com",
        handle: "new-user",
        displayName: "New User",
        inviteCode: "beta-001",
        profileId: "profile-1",
      }),
    ).resolves.toBe("sent");

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer resend-test-key",
      "content-type": "application/json",
    });
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      from: "London Cuts <no-reply@auth.example.com>",
      to: "owner@example.com",
      subject: "London Cuts new signup: @new-user",
    });
    expect(body.text).toContain("new@example.com");
    expect(body.text).toContain("https://london-cuts.example/@new-user");
  });
});
