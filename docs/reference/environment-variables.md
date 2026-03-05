# Environment variables

**Reference:** All `VITE_*` variables used by the app. Loaded by Vite from `.env`, `.env.local`, etc.; only `VITE_*` are exposed to client code.

## LLM / Chat

Chat requires at least one provider. **Priority:** Groq → Anthropic → OpenAI-compatible.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GROQ_API_KEY` | No | Groq API key. Used if set; model: `openai/gpt-oss-120b`. |
| `VITE_ANTHROPIC_API_KEY` | No | Anthropic API key. Used if Groq not set; model: `claude-sonnet-4-20250514`. |
| `VITE_OPENAI_COMPATIBLE_BASE_URL` | No* | Base URL for an OpenAI-compatible API (e.g. `https://api.openai.com/v1`). *Required for custom endpoint when using with API key below. |
| `VITE_OPENAI_COMPATIBLE_API_KEY` | No* | API key for the endpoint above. *Required for custom endpoint. |
| `VITE_OPENAI_COMPATIBLE_MODEL` | No | Model name for the custom endpoint. Default: `gpt-4o-mini`. |

If none of the above are set, Chat shows a message asking for an API key; the rest of the app works.

## Files

- **`.env.local`** — Local overrides; gitignored (do not commit secrets).
- **`.env.example`** — Documented template; safe to commit. Copy to `.env.local` and fill in.

## Usage in code

- In `src/nl/callLLM.ts`: `import.meta.env.VITE_GROQ_API_KEY`, etc.
- Never commit real keys; `.env.local` is listed in `.gitignore` via `*.local`.
