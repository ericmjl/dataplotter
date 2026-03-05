# How to add a new LLM provider

**Goal:** Support another provider (e.g. OpenAI, Mistral) for the Chat panel using the Vercel AI SDK.

## 1. Install the provider package

Use the official AI SDK provider if it exists:

```bash
npm install @ai-sdk/openai   # example
```

See [Vercel AI SDK providers](https://sdk.vercel.ai/providers) for the list.

## 2. Env vars

- Add new `VITE_*` env vars in `src/nl/callLLM.ts` (e.g. `VITE_OPENAI_API_KEY`).
- Document them in `.env.example` and in [reference/environment-variables.md](../reference/environment-variables.md).

## 3. Wire the provider in callLLM

**File:** `src/nl/callLLM.ts`

- Import the provider factory (e.g. `createOpenAI` from `@ai-sdk/openai`).
- In `getModel()`, add a branch **in the desired priority order** (current order: Groq → Anthropic → OpenAI-compatible). Example:

  ```ts
  if (NEW_PROVIDER_KEY?.trim()) {
    const provider = createNewProvider({ apiKey: NEW_PROVIDER_KEY });
    return { model: provider('model-name'), provider: 'new-provider' as const };
  }
  ```

- Use a specific model id supported by that provider (check the provider’s docs).

## 4. Update getLLMProvider()

- Add the new provider to the return type and to the conditional checks so the UI (or logging) can show which provider is active.

## 5. Update docs and error copy

- **Orchestrator** (`src/nl/orchestrator.ts`): update the “no LLM” error message to mention the new env var.
- **ChatPanel** placeholder text: mention the new option.
- **docs/reference/environment-variables.md** and **.env.example**: add the new variables.

## Notes

- Tools and message shape are shared; no change needed in `orchestrator.ts` or tool definitions when adding a provider.
- For **OpenAI-compatible** APIs (custom base URL + key), use the existing “OpenAI-compatible” path and `@ai-sdk/openai` with `baseURL` and `apiKey`; only add a **new** provider when it’s a different SDK (e.g. Anthropic, Groq).
