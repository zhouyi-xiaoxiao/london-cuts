#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const TOKEN_PREFIX = "lc_pat_";
const VALID_SCOPES = new Set(["public:read", "project:write", "ai:run"]);
const SQL_EDITOR_INSTRUCTION =
  "Open the Supabase SQL Editor for project acymyvefnvydksxzzegw and run web/supabase/migrations/0003_api_tokens.sql, then rerun this script.";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

function usage() {
  console.error(`Usage:
  node scripts/issue-agent-token.mjs --label owner-smoke --owner-id <uuid> --scopes public:read,ai:run --store-keychain
  node scripts/issue-agent-token.mjs --label owner-smoke --owner-handle ana-ishii --scopes public:read --dry-run

Flags:
  --label <text>          Token label stored in api_tokens.
  --owner-id <uuid>      Public users.id that owns the token.
  --owner-handle <text>  Resolve users.id by public handle.
  --scopes <csv>         Comma-separated scopes: public:read, project:write, ai:run.
  --dry-run              Validate env/table/owner without issuing a token.
  --store-keychain       Store plaintext token in macOS Keychain.
  --print-once           Print plaintext token once. Avoid in shared terminals/logs.
`);
}

function parseArgs(argv) {
  const out = {
    label: "",
    ownerId: "",
    ownerHandle: "",
    scopes: ["public:read"],
    dryRun: false,
    storeKeychain: false,
    printOnce: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      out.dryRun = true;
    } else if (arg === "--store-keychain") {
      out.storeKeychain = true;
    } else if (arg === "--print-once") {
      out.printOnce = true;
    } else if (arg === "--label") {
      out.label = requireNext(argv, (i += 1), arg);
    } else if (arg === "--owner-id") {
      out.ownerId = requireNext(argv, (i += 1), arg);
    } else if (arg === "--owner-handle") {
      out.ownerHandle = requireNext(argv, (i += 1), arg).replace(/^@/, "");
    } else if (arg === "--scopes") {
      out.scopes = requireNext(argv, (i += 1), arg)
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      console.error(`Unknown flag: ${arg}`);
      usage();
      process.exit(2);
    }
  }
  return out;
}

function requireNext(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    console.error(`${flag} requires a value`);
    process.exit(2);
  }
  return value;
}

function parseEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const raw of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function hashToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateToken() {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

function isMissingRelation(error) {
  return (
    error?.code === "42P01" ||
    /api_tokens/i.test(error?.message ?? "") ||
    /does not exist/i.test(error?.message ?? "")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.label.trim()) {
    console.error("--label is required");
    usage();
    process.exit(2);
  }
  const invalidScopes = args.scopes.filter((scope) => !VALID_SCOPES.has(scope));
  if (invalidScopes.length > 0) {
    console.error(`Invalid scopes: ${invalidScopes.join(", ")}`);
    process.exit(2);
  }
  if (!args.ownerId && !args.ownerHandle) {
    console.error("--owner-id or --owner-handle is required");
    process.exit(2);
  }
  if (!args.dryRun && !args.storeKeychain && !args.printOnce) {
    console.error(
      "Refusing to issue an unrecoverable token. Use --store-keychain or --print-once.",
    );
    process.exit(2);
  }

  const env = { ...process.env, ...parseEnv(path.join(webRoot, ".env.local")) };
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const ownerId = args.ownerId || (await resolveOwnerId(supabase, args.ownerHandle));
  const { error: probeError } = await supabase
    .from("api_tokens")
    .select("id", { count: "exact", head: true })
    .limit(1);
  if (probeError) {
    if (isMissingRelation(probeError)) {
      console.error("api_tokens table is not available.");
      console.error(SQL_EDITOR_INSTRUCTION);
      process.exit(1);
    }
    console.error(probeError.message);
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(
      `Dry run OK: would issue ${args.scopes.join(",")} token '${args.label}' for ${ownerId}.`,
    );
    return;
  }

  const token = generateToken();
  const { error: insertError } = await supabase.from("api_tokens").insert({
    owner_id: ownerId,
    label: args.label.trim(),
    token_hash: hashToken(token),
    scopes: args.scopes,
  });
  if (insertError) {
    if (isMissingRelation(insertError)) {
      console.error("api_tokens table is not available.");
      console.error(SQL_EDITOR_INSTRUCTION);
      process.exit(1);
    }
    console.error(insertError.message);
    process.exit(1);
  }

  if (args.storeKeychain) {
    execFileSync("security", [
      "add-generic-password",
      "-U",
      "-s",
      "london-cuts-agent-token",
      "-a",
      args.label.trim(),
      "-w",
      token,
    ]);
    console.log("Token issued and stored in macOS Keychain service london-cuts-agent-token.");
  }
  if (args.printOnce) {
    console.log(token);
  }
}

async function resolveOwnerId(supabase, ownerHandle) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("handle", ownerHandle)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data?.id) {
    console.error(`Could not resolve owner handle '${ownerHandle}'.`);
    if (error) console.error(error.message);
    process.exit(1);
  }
  return data.id;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
