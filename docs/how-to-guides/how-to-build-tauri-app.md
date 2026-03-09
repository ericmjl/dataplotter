# How to build and run the Tauri app

**How-to:** Package Dataplotter as a desktop app using Tauri (system webview, smaller binaries than Electron). Same Vite + React frontend; Tauri replaces the Electron shell.

## How it works

- **Dev:** Tauri runs your existing `npm run dev` (Vite on port 5173), opens a native window, and loads `http://localhost:5173` in the **system webview** (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux). No Chromium bundled.
- **Build:** Tauri runs `npm run build`, then packages the `dist/` output. The built app loads the app from the filesystem (`file://`), so Vite must use `base: './'` when building for Tauri (same as Electron).
- **Result:** Installers (e.g. .dmg, .msi, .AppImage) in `src-tauri/target/release/bundle/`. Smaller than Electron because the OS webview is used instead of shipping Chromium.

**Electron vs Tauri (this repo):** You can keep both. Electron remains the primary desktop path (see [how-to-build-electron-app.md](how-to-build-electron-app.md)); Tauri is an alternative. The same `dist/` is consumed by either; only the shell (Electron main process vs Tauri Rust app) differs.

## Prerequisites

- **Rust:** Install from [rustup.rs](https://rustup.rs). Required for Tauri.
- **Platform:**  
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`).  
  - **Windows:** Microsoft C++ Build Tools and WebView2 (usually already present on Windows 11).  
  - **Linux:** `webkit2gtk`, `libappindicator`, etc. (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).
- **Node/npm** and project deps: `npm install`.

## One-time setup

### 1. Install Tauri CLI

```bash
npm install --save-dev @tauri-apps/cli@latest
```

Add a script in `package.json` if not present:

```json
"scripts": {
  "tauri": "tauri"
}
```

### 2. Initialize Tauri

```bash
npx tauri init
```

When prompted:

- **App name:** `Dataplotter` (or keep default).
- **Window title:** `Dataplotter`.
- **Web assets:** Use the path to your built frontend. Tauri will create `src-tauri/`; from there `../dist` is the Vite output, so enter **`../dist`** when asked for the frontend dist path (or equivalent in the config step).
- **Dev server URL:** `http://localhost:5173`.
- **Build command:** `npm run build` (or a Tauri-specific build script; see step 3).
- **Done:** Tauri creates `src-tauri/` (Rust project + config).

### 3. Configure build so assets load in the packaged app

The packaged app loads `index.html` from the filesystem. Vite must use **relative base** when building for Tauri so asset paths work.

**Option A – env var in Tauri’s build command**

In `src-tauri/tauri.conf.json` (or the config file Tauri created), set:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "cross-env TAURI=1 npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  }
}
```

In `vite.config.ts`, set `base` so it is `'./'` when building for Tauri:

```ts
base: process.env.TAURI === '1' || process.env.ELECTRON === '1' ? './' : '/',
```

Install `cross-env` if you don’t have it: `npm install --save-dev cross-env`.

**Option B – dedicated script**

In `package.json`:

```json
"build:tauri": "cross-env TAURI=1 npm run build"
```

Then in `src-tauri/tauri.conf.json`:

```json
"beforeBuildCommand": "npm run build:tauri"
```

### 4. (Optional) Vite settings for Tauri

For dev, Tauri expects the dev server on a fixed port. In `vite.config.ts` you can add:

```ts
server: {
  port: 5173,
  strictPort: true,
},
```

Your existing config may already use 5173; if not, set it so it matches `devUrl` in `tauri.conf.json`.

For smaller/faster production builds when building with Tauri, you can set build target and env prefix (see [Tauri Vite guide](https://v2.tauri.app/start/frontend/vite/)). This is optional.

## Run in development

```bash
npm run tauri dev
```

This starts the Vite dev server (via `beforeDevCommand`) and opens the Tauri window. Close the window or Ctrl+C to stop.

## Build installers

```bash
npm run tauri build
```

- **Output:** Installers and bundles under `src-tauri/target/release/bundle/` (e.g. .dmg on macOS, .msi on Windows, .AppImage on Linux).
- **Unsigned:** Default build is unsigned. For notarization (macOS) or signing (Windows), see Tauri’s [distribution and signing docs](https://v2.tauri.app/distribution/).

## Electron-only features and Tauri

This project currently uses **Electron-specific APIs** in one place:

- **`window.electronAPI.runBayesianPyMC`** (see `src/components/AnalysisPanel.tsx`): runs Bayesian analysis via a Python subprocess started from the Electron main process.

With Tauri:

- **Option 1 – Tauri command:** Implement a [Tauri command](https://v2.tauri.app/develop/calling-rust/) in `src-tauri` that spawns the same Python/uv process (or a sidecar binary) and returns results. The frontend would call it with `invoke('run_bayesian_pymc', { ... })` instead of `electronAPI.runBayesianPyMC(...)`. You’d gate the UI on a Tauri API (e.g. `invoke('is_desktop')`) or a build flag.
- **Option 2 – No Python in Tauri build:** Ship the Tauri app without Bayesian PyMC; that path stays Electron-only until you add the Tauri command.

So: **Tauri can package this app today**; the same Vite build runs in both. To get full feature parity (e.g. Bayesian runner), you need to reimplement that one integration as a Tauri command or sidecar.

## Summary

| Task           | Command           |
|----------------|-------------------|
| Dev            | `npm run tauri dev`   |
| Build installers | `npm run tauri build` |
| Config         | `src-tauri/tauri.conf.json` + Vite `base` for production |

Same frontend as the web and Electron builds; Tauri only changes how the window is created and how the app is packaged.
