# How to build and run the Electron app

**How-to:** Build and run Dataplotter as a desktop app (macOS, Windows, Linux).

## Prerequisites

- Node.js and npm installed.
- Dependencies installed: `npm install`.

## Run in development

One command runs the Vite dev server and opens the app in Electron:

```bash
npm run electron:dev
```

This starts the Vite dev server and waits for it to be ready, then launches Electron loading `http://localhost:5173`. Close the Electron window or stop the process (Ctrl+C) when done.

## Build installers

Build the web app (with `base: './'` for Electron) and then package with electron-builder:

```bash
npm run electron:build
```

- **Output:** Installers are written to the `release/` directory.
- **macOS:** e.g. `release/Dataplotter-0.0.0-arm64.dmg` (or x64 depending on arch).
- **Windows:** NSIS installer in `release/`.
- **Linux:** AppImage in `release/`.

Code signing (macOS notarization, Windows Authenticode) is not configured by default; see electron-builder docs if you need signed builds.

## API keys in the desktop app

API keys are **never** included in the build. In the desktop app:

1. Open **Settings** from the header.
2. Enter one or more LLM API keys (Groq, Anthropic, or OpenAI-compatible).
3. Click **Save**. Keys are stored on your machine only (localStorage).

The packaged app does not read `.env`; use Settings only.

## Technical notes

- **Main process:** `electron/main.cjs` creates the window and loads the dev URL or `dist/index.html` in production.
- **Preload:** `electron/preload.cjs` exposes `window.electronAPI` (e.g. `platform`, `versions`) with context isolation; no API keys are passed through the main process.
- **Vite:** When `ELECTRON=1` is set (during `electron:build`), Vite uses `base: './'` so the packaged app can load assets from the file system.
