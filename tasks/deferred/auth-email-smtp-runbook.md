# Auth Email SMTP Runbook

Status: complete and verified on 2026-04-24. Supabase Auth now sends through Resend SMTP instead of the built-in Supabase test mailer, and production email links use the token-hash callback flow.

## Goal

Move Supabase Auth magic-link email delivery off Supabase's built-in testing SMTP and onto a production transactional sender.

## Provider Decision

Use Resend for Supabase Auth SMTP.

Rationale:
- Supabase's built-in SMTP has very low limits and is not intended for production beta use.
- Resend has a first-party Supabase SMTP guide.
- A domain-owned sender is better than a personal Gmail or Bristol Microsoft 365 mailbox for product auth mail.

Official references:
- Supabase custom SMTP: <https://supabase.com/docs/guides/auth/auth-smtp>
- Supabase Auth rate limits: <https://supabase.com/docs/guides/auth/rate-limits>
- Resend + Supabase SMTP: <https://resend.com/docs/send-with-supabase-smtp>

## Current Resend State

- Resend account: `xiaoxiaozhouyi@gmail.com`
- Resend workspace: `xiaoxiaozhouyi`
- Sending domain: `auth.zhouyixiaoxiao.org`
- Resend domain id: `03d77d58-0fda-4a5e-ae32-e9d641e2fb11`
- Region: `eu-west-1`
- Domain status: verified
- Resend API key created: `supabase-auth-smtp`
- API key storage: macOS Keychain
  - service: `london-cuts-resend-smtp`
  - account: `supabase-auth-smtp`
- Do not write the API key into repo files or chat-visible docs.

## DNS Records Applied In IONOS

These records were added under the `zhouyixiaoxiao.org` zone on 2026-04-24.

| Purpose | Type | Name | Content | Priority | TTL |
|---|---|---|---|---:|---|
| DKIM | TXT | `resend._domainkey.auth` | Resend DKIM public key | | 3600 |
| Return-path MX | MX | `send.auth` | `feedback-smtp.eu-west-1.amazonses.com` | 10 | 3600 |
| Return-path SPF | TXT | `send.auth` | `v=spf1 include:amazonses.com ~all` | | 3600 |
| DMARC | TXT | `_dmarc.auth` | `v=DMARC1; p=none;` | | 3600 |

Notes:
- Resend displays the DMARC name as `_dmarc` relative to `auth.zhouyixiaoxiao.org`; in the parent IONOS zone this should be `_dmarc.auth`.
- Receiving MX (`auth -> inbound-smtp.eu-west-1.amazonaws.com`) is not needed for sending Supabase Auth emails and should be skipped unless inbound processing is intentionally enabled later.

Verification:
- IONOS UI shows all four records.
- `dig` against the default resolver and `@8.8.8.8` returned the DKIM TXT, return-path MX, return-path SPF TXT, and DMARC TXT records.
- Resend dashboard shows `Domain verified: Your domain is ready to send emails.`

## Historical Blockers Observed

- IONOS MCP returned: missing `IONOS_API_KEY` or `IONOS_PREFIX + IONOS_SECRET`.
- Local environment has no `IONOS_*` variables, and macOS Keychain has no generic-password item named `IONOS_API_KEY`, `IONOS_PREFIX`, `IONOS_SECRET`, `ionos`, `ionos-mcp`, `ionos-api`, or `ionos-dns`.
- IONOS web login for `zhouyixiaoxiao@gmail.com` initially reached the password step after the emailed one-time code was accepted. The owner later provided the password, and DNS was completed through the IONOS web UI.
- Supabase CLI returned: missing `SUPABASE_ACCESS_TOKEN`.
- Supabase dashboard in Playwright was initially logged out and asked for GitHub/SSO. It was later logged in, and the SMTP/rate-limit changes were applied through the dashboard UI.

## MCP/API Setup Status

IONOS MCP is installed and registered in `~/.codex/config.toml`, but it cannot act until credentials are available to the Codex process:

- Preferred long-term setup: create an IONOS DNS API key in the IONOS control panel, then expose it as `IONOS_API_KEY` for the MCP process.
- Alternative setup: expose `IONOS_PREFIX` + `IONOS_SECRET`.
- After adding credentials, verify with `mcp__ionos__.list_domains({ "contains": "zhouyixiaoxiao.org" })` before creating records.
- Do not store IONOS API credentials in this repo.

Supabase management API access is still not configured for automation:

- `SUPABASE_ACCESS_TOKEN` is not present in the current shell.
- Service-role DB credentials are not enough for Auth SMTP management configuration.
- Future dashboard work can reuse the logged-in browser session, or create a `SUPABASE_ACCESS_TOKEN` and keep it out of the repo.

## Supabase SMTP Settings Applied

In Supabase Dashboard for project `acymyvefnvydksxzzegw`:

- Auth SMTP enabled: true
- Sender email: `no-reply@auth.zhouyixiaoxiao.org`
- Sender name: `London Cuts`
- SMTP host: `smtp.resend.com`
- SMTP port: `465`
- SMTP username: `resend`
- SMTP password: read from macOS Keychain service `london-cuts-resend-smtp`, account `supabase-auth-smtp`
- Auth email rate limit: `100 emails/h`
- Minimum interval per user: `60 seconds`

Verification:
- Supabase dashboard showed `Successfully updated settings` after SMTP save.
- Supabase Rate Limits reload persisted `100 emails/h`.
- Production `/api/auth/send-magic-link` returned HTTP 200 with `{"ok":true}` for the address that previously hit rate limiting.
- Resend Logs showed `POST /emails` HTTP 200 from `London Cuts <no-reply@auth.zhouyixiaoxiao.org>` to the test recipient.
- Do not paste or store the generated one-time token from Resend logs.

## Callback And Session Fix

Observed after SMTP was fixed: the email could be sent, but clicking the generated link landed on `/auth/callback` with `Could not establish a session from this link`.

Root cause: Supabase's default `{{ .ConfirmationURL }}` template sends users through Supabase's hosted `/auth/v1/verify` URL. In this app's SSR/cookie setup that can arrive at `/auth/callback` without a usable session or PKCE verifier. The callback page therefore needs a token-hash link that it can verify directly in the browser client.

Supabase Auth email templates must use `{{ .RedirectTo }}` plus `{{ .TokenHash }}`:

- Confirm signup:
  `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a>`
- Magic link:
  `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Log In</a>`

Code requirements:

- `POST /api/auth/send-magic-link` must always send a redirect URL that already has a query string, currently `/auth/callback?next=...`, so the template can append `&token_hash=...&type=...`.
- `/auth/callback/page.tsx` must call `supabase.auth.verifyOtp({ token_hash, type })` before falling back to old PKCE `?code=` links or admin-generated `#access_token=...` links.
- Do not revert the templates to `{{ .ConfirmationURL }}` unless the callback implementation is redesigned and retested.

Dashboard verification on 2026-04-25:
- Magic link and Confirm sign up templates were reloaded in Supabase Dashboard and both persisted `token_hash` links.
- The Magic link template had one stray trailing `>` after manual editing; it was removed and reloaded cleanly.

## Temporary Link Policy

Do not send admin-generated direct magic links to external testers as the default fix. The owner wants the built-in `/sign-in` flow repaired by configuring custom SMTP and rate limits. Direct links are only an explicit, one-off emergency workaround when the owner asks for that specific recipient.
