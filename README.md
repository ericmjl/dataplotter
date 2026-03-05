# Dataplotter

A browser-based data analysis and plotting app: tables, statistical analyses, and graphs (bar, scatter, line, dose-response, etc.) with an optional **Chat** panel driven by an LLM (Groq, Anthropic, or any OpenAI-compatible API).

**Stack:** React 19, TypeScript, Vite 7, Zustand, Plotly.js, Vercel AI SDK.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: set one LLM key for Chat
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173/`). Use the sidebar to add tables, analyses, and graphs; use the right-hand Chat panel (with an API key set) for natural-language commands.

## Documentation

Docs follow the [Diataxis](https://diataxis.fr/) framework and live in **`docs/`**:

| Purpose        | Where to look |
|----------------|----------------|
| **Learn / run** | [docs/tutorials/getting-started.md](docs/tutorials/getting-started.md) |
| **Do a task**   | [docs/how-to-guides/](docs/how-to-guides/) |
| **Look up**     | [docs/reference/](docs/reference/) (layout, env, architecture) |
| **Understand**  | [docs/explanation/](docs/explanation/) (design decisions) |

**Coding agents and contributors:** read [AGENTS.md](AGENTS.md) for conventions and where to change things.

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start dev server           |
| `npm run build`| Type-check + production build |
| `npm test`     | Run Vitest tests           |
| `npm run lint`| Run ESLint                 |

## License

See [LICENSE](LICENSE) if present.
