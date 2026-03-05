# Design decisions

**Explanation:** Why the project is structured and behaves the way it does. For context and onboarding, not step-by-step tasks.

## Why Diataxis for docs

Documentation is split into **tutorials**, **how-to guides**, **reference**, and **explanation** so that:

- **New contributors and agents** can follow a single path (tutorial) then look up facts (reference).
- **Task-oriented work** (e.g. “add a graph type”) has a dedicated how-to instead of one long README.
- **Understanding** (e.g. why we use Zustand, why bar charts need categorical x) lives in explanation, so the codebase stays the single source of truth and the “why” is written down.

## Why a single Zustand store

- **One place** for project and UI state: no prop drilling for selection or project data; components subscribe with `useStore(selector)`.
- **Actions live next to state** (project slice, UI slice), so mutations are predictable and testable.
- **Serialization** is straightforward: the whole project is one JSON tree (tables, analyses, graphs, selection) for save/load and for the NL context.

## Why Chat uses the Vercel AI SDK

- **One interface** for multiple providers (Groq, Anthropic, OpenAI-compatible): same `generateText` + tools, different provider and model.
- **Structured tools** via Zod: the SDK and providers handle tool schema and parsing; we only execute tool calls in the orchestrator and update the store.
- **OpenAI-compatible** support lets users point at any API that speaks the OpenAI chat completions (and tool-calling) format without adding a new SDK per vendor.

## Why save is JSON-only

- **Open format:** JSON is portable and easy to version, diff, and rehydrate; no binary or vendor lock-in.
- **Prism/Pzfx:** Kept as **import-only** so existing files can be loaded; export stays in a single, simple format (JSON) that the app fully controls.

## Why bar charts use categorical x-axis

- Bar charts have **category labels** on the x-axis (e.g. “Control”, “Treated”), not numeric positions. If the layout forces `xaxis.type: 'linear'`, Plotly treats those labels as numbers and the bars don’t draw. Setting `xaxis.type: 'category'` for bar charts fixes this; other graph types keep the default (e.g. linear) where appropriate.

## Why hooks are at the top

- **React’s rules of hooks:** The number and order of hooks must be the same on every render. If `useState` or `useStore` runs after an early return (e.g. “no table selected”), then when the user later selects a table, more hooks run and React throws. So all hooks are called unconditionally at the top of components like `TableView` and `GraphView`.

## Why Plotly has polyfills and global

- **Plotly.js** assumes a Node-like environment (e.g. `global`, `stream`). In the browser with Vite we add `define: { global: 'globalThis' }` and `vite-plugin-node-polyfills` so Plotly loads and runs without “global is not defined” or “stream externalized” errors.
