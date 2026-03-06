# Guide for coding agents and developers

This file gives **rules and conventions** for AI coding agents and human developers working on this repo. Follow it to keep behavior and style consistent.

## Before you start

1. **Read the docs.**  
   - [docs/README.md](docs/README.md) — Diataxis index.  
   - [docs/reference/project-layout.md](docs/reference/project-layout.md) — Where code lives.  
   - [docs/reference/architecture.md](docs/reference/architecture.md) — State, data flow, Chat.

2. **Run the app.**  
   - [docs/tutorials/getting-started.md](docs/tutorials/getting-started.md): `npm install`, optional `.env.local`, `npm run dev`.

3. **Before implementation:** When the user describes problems, new features, or bug fixes, **always update HLD, LLD, and EARS** (as applicable) and **study the codebase thoroughly** before writing implementation code. Keep design and specs in sync with behavior.

## Conventions

### Code

- **TypeScript:** Use strict types. No `any` unless justified and commented.
- **State:** All project and UI state goes through the Zustand store; no ad-hoc global state. Use actions from `src/store/` (e.g. `addTable`, `setSelection`).
- **Hooks:** Call all hooks unconditionally at the top of components (no hooks after `if`/early return). This avoids “Rendered more hooks than during the previous render.”
- **New features:** When adding a graph type or analysis type, follow the how-to guides in `docs/how-to-guides/` so types, registry, engine, and UI stay in sync.

### Styles

- **CSS:** Prefer the design tokens and classes in `src/index.css` (e.g. `--bg-surface`, `--accent`, `.sidebar-item`, `.btn-primary`). Don’t introduce one-off inline styles for layout/colors unless necessary.
- **Layout:** Sidebar | main content | chat panel. Don’t remove the permanent chat panel or change the three-column shell without good reason.

### Chat / LLM

- **Providers:** LLM selection is in `src/nl/callLLM.ts`. Priority: Groq → Anthropic → OpenAI-compatible. Add new providers there and document env vars in `.env.example` and [docs/reference/environment-variables.md](docs/reference/environment-variables.md).
- **Tools:** Tool definitions (Zod schemas) live in `src/nl/schemas.ts` and are passed to the AI SDK in `callLLM.ts`. Execution is in `src/nl/orchestrator.ts`. Keep tool names and argument shapes in sync.

### Persistence

- **Save:** Only JSON is supported for saving. Do not re-add Prism/Pzfx export.
- **Secrets:** Never commit API keys or `.env.local`. Use `.env.example` for documented variable names and examples.

### Testing and quality

- **Before claiming “done”:** Run `npm run build` and, if you changed logic or lib code, `npm test`. Fix any new type or lint errors.
- **Tests:** Vitest; test files next to source (`*.test.ts`). Prefer testing engine and lib code; UI tests only where they add clear value.

### Documentation

- **Diataxis:**  
  - **Tutorial** — Step-by-step for newcomers (e.g. getting started).  
  - **How-to** — One specific task (e.g. add a graph type, add an LLM provider).  
  - **Reference** — Facts: layout, env vars, architecture.  
  - **Explanation** — Why things are as they are (design decisions).
- When you add a feature that affects setup, behavior, or architecture, update the relevant doc (and this file if conventions change).

## Quick reference

| I want to…              | See |
|--------------------------|-----|
| Run the app              | [docs/tutorials/getting-started.md](docs/tutorials/getting-started.md) |
| Add a graph type         | [docs/how-to-guides/how-to-add-a-graph-type.md](docs/how-to-guides/how-to-add-a-graph-type.md) |
| Add an analysis type     | [docs/how-to-guides/how-to-add-an-analysis-type.md](docs/how-to-guides/how-to-add-an-analysis-type.md) |
| Add an LLM provider      | [docs/how-to-guides/how-to-add-an-llm-provider.md](docs/how-to-guides/how-to-add-an-llm-provider.md) |
| Run tests / lint         | [docs/how-to-guides/how-to-run-tests-and-lint.md](docs/how-to-guides/how-to-run-tests-and-lint.md) |
| Find where code lives    | [docs/reference/project-layout.md](docs/reference/project-layout.md) |
| Understand env vars      | [docs/reference/environment-variables.md](docs/reference/environment-variables.md) |
| Understand architecture  | [docs/reference/architecture.md](docs/reference/architecture.md) |
| Understand “why”         | [docs/explanation/design-decisions.md](docs/explanation/design-decisions.md) |
