# Environment variables

**Reference:** How the app gets configuration. **API keys are never in the build;** they are set in the app via **Settings** (header).

## LLM / Chat

Chat uses at least one provider. **Priority:** Groq → Anthropic → OpenAI-compatible. Configure in the app:

- Open **Settings** (header) and enter one or more API keys.
- Keys are stored on your device only (localStorage key `dataplotter-llm-settings`), separate from project autosave (`dataplotter-project`). They are never shipped in the build or sent anywhere except to the chosen provider.

### Optional: development only

In **development** (e.g. `npm run dev`), if you have no keys set in Settings, the app can fall back to `VITE_*` env vars from `.env` / `.env.local`. This is for convenience only; never rely on env for production or the packaged Electron app.

| Variable | Description |
|----------|-------------|
| `VITE_GROQ_API_KEY` | Groq API key; model: `openai/gpt-oss-120b`. |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key; model: `claude-sonnet-4-20250514`. |
| `VITE_OPENAI_COMPATIBLE_BASE_URL` | Base URL for an OpenAI-compatible API (e.g. `https://api.openai.com/v1`). |
| `VITE_OPENAI_COMPATIBLE_API_KEY` | API key for the endpoint above. |
| `VITE_OPENAI_COMPATIBLE_MODEL` | Model name. Default: `gpt-4o-mini`. |

- **`.env.local`** — Local overrides; gitignored (do not commit secrets).
- **`.env.example`** — Documented template; safe to commit.

## Electron

The packaged Electron app does **not** load `.env`. Users set API keys only via the in-app Settings UI.

## Usage in code

- Runtime config is in `src/store/settingsSlice.ts` (LLM settings) and read by `src/nl/callLLM.ts` via `getEffectiveConfig()` (dev fallback to `import.meta.env.VITE_*` only when not in production).
