# Environment configuration

All secrets are read **inside server handlers only** (`src/lib/config/env.server.ts`).
Nothing secret is ever prefixed with `VITE_`, and no provider key is referenced from
client code.

## Provided automatically by Lovable Cloud

| Variable                    | Used for                                             |
| --------------------------- | ---------------------------------------------------- |
| `SUPABASE_URL`              | Server-side database access                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database access (bypasses RLS by design) |
| `SUPABASE_PUBLISHABLE_KEY`  | Reserved for public read paths                       |
| `VITE_SUPABASE_URL`         | Client bootstrap (non-secret)                        |
| `LOVABLE_API_KEY`           | Gemini LLM / image / video through the AI gateway    |

## Optional — add when the matching provider is switched on

| Variable               | Provider slot                          |
| ---------------------- | -------------------------------------- |
| `ELEVENLABS_API_KEY`   | Voice synthesis                        |
| `STABILITY_API_KEY`    | Music generation                       |
| `GEMINI_API_KEY`       | Direct Gemini access (instead of gateway) |

## Rules

- Never hard-code a key; add it as a secret and read it through `requireEnv`.
- Never log secret values — the logger redacts any key matching password, token,
  secret, api key, authorization, credential, cookie, session or hash.
- `process.env` is only read inside `.handler()` bodies, never at module scope.
