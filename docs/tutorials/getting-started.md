# Getting started

**Audience:** New developers and coding agents.  
**Goal:** Run the app locally and open it in a browser.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node)

## Steps

### 1. Clone and install

```bash
git clone https://github.com/ericmjl/dataplotter.git
cd dataplotter
npm install
```

### 2. Configure environment (optional for Chat)

To use the **Chat** panel (natural-language commands), set at least one LLM provider in `.env.local`. Copy from example:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set **one** of:

- **Groq:** `VITE_GROQ_API_KEY=gsk_...`
- **Anthropic:** `VITE_ANTHROPIC_API_KEY=sk-ant-...`
- **OpenAI-compatible endpoint:**  
  `VITE_OPENAI_COMPATIBLE_BASE_URL` and `VITE_OPENAI_COMPATIBLE_API_KEY`  
  (see [Environment variables](../reference/environment-variables.md)).

If you skip this step, the app still runs; Chat will show a message asking for an API key.

### 3. Run the dev server

```bash
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173/`) in a browser.

### 4. Sanity check

- **Sidebar:** Add a table (e.g. “New from sample (column)”).
- **Main area:** Select the table, add a graph (e.g. bar), then select the graph — bars should render.
- **Chat:** If you set an API key, send a short message; you should get a reply or a tool outcome.

## Next steps

- **Project layout:** [reference/project-layout.md](../reference/project-layout.md)
- **Common tasks:** [how-to-guides/](../how-to-guides/)
- **For agents:** [AGENTS.md](../../AGENTS.md)
