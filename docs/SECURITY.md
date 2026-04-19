# Security notes

## 2026-04-19 — exposed OpenAI API key

An OpenAI API key was previously hardcoded in `app/index.html` (was `london-cuts-v3/index.html` before reorg).

That key was removed during the 2026-04-19 reorg and replaced with a loader that pulls from a gitignored `app/local-config.js`. The previously exposed key has been redacted from the repo and should be treated as compromised.

### Action required

Go to https://platform.openai.com/api-keys and **revoke the previously exposed key**. Create a new key and put it in `app/local-config.js` (copy from `app/local-config.example.js`).

### Prevention

- `.gitignore` blocks `app/local-config.js`, `.env*`, `*.key`
- `app/local-config.example.js` is the documented template; it contains only `REPLACE_ME`
- Before any commit, run: `grep -r 'sk-proj-[A-Za-z0-9_-]\{30,\}' .` (must return empty, or only REPLACE_ME)
