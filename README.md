# 🎯 Projection Mapper

[![Tests](https://github.com/Obi811/projection-mapper-app/actions/workflows/test.yml/badge.svg)](https://github.com/Obi811/projection-mapper-app/actions/workflows/test.yml)
[![Build](https://github.com/Obi811/projection-mapper-app/actions/workflows/build.yml/badge.svg)](https://github.com/Obi811/projection-mapper-app/actions/workflows/build.yml)
[![Release](https://github.com/Obi811/projection-mapper-app/actions/workflows/release.yml/badge.svg)](https://github.com/Obi811/projection-mapper-app/actions/workflows/release.yml)
[![Auto Release](https://github.com/Obi811/projection-mapper-app/actions/workflows/auto-release.yml/badge.svg)](https://github.com/Obi811/projection-mapper-app/actions/workflows/auto-release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Professional projection mapping desktop application for Mac and Windows, built with **Electron**, **React**, **TypeScript**, and **Three.js** — now with a **mobile companion app** (Expo / React Native) in a single **npm-workspaces monorepo**.

---

## 📦 Monorepo Structure

This repository is an **npm-workspaces monorepo**:

```
projection-mapper-app/
├── packages/
│   └── shared/        # @projection-mapper/shared — protocol, API contract & shared types
├── apps/
│   ├── desktop/       # @projection-mapper/desktop — Electron desktop app (Mac/Win/Linux)
│   └── mobile/        # @projection-mapper/mobile — Expo companion & remote-control app
├── package.json       # workspace root (scripts, husky, commitlint)
└── .github/workflows/ # CI/CD for all packages
```

### Why a monorepo?
The **mobile remote-control app** and the **desktop server** must speak exactly the same
WebSocket protocol. The `@projection-mapper/shared` package is the **single source of truth**
for that protocol (`remote-protocol.ts`) and the licensing API contract (`api.ts`), so the wire
format can never drift between the two apps.

### Common commands (run from the repo root)

| Command | Description |
| --- | --- |
| `npm install` | Install all workspaces |
| `npm run dev:desktop` | Start the Electron app in dev mode |
| `npm run dev:mobile` | Start the Expo dev server |
| `npm run build` | Build `shared` + `desktop` |
| `npm test` | Run `shared` + `desktop` unit tests |
| `npm run lint` / `npm run typecheck` | Lint / type-check all packages |
| `npm run package:mac\|win\|linux` | Package the desktop binaries |

You can also target a single workspace, e.g. `npm run test -w @projection-mapper/desktop`.

### 📱 Mobile companion app
The Expo app (`apps/mobile`) provides:
- **Remote control** of the desktop over the local network (WebSocket), with QR-code pairing
  (scan the code from the desktop *Remote* panel) or manual host/port/token entry.
- **Transport controls** (play/pause/stop/seek), volume, scene navigation and output blackout.
- **Standalone mode** — an offline cue board that works without a desktop connection.
- **Account & licensing** — login/registration against `licensing.obitron.de`, role badge
  (user / admin / owner) and license dashboard.

See [`apps/mobile/README.md`](apps/mobile/README.md) for setup, running on a device and building
with EAS for the App Store / TestFlight (requires an Apple Developer account).

---

## Features

### Current (v0.1.0)
- ✅ Electron desktop application with secure IPC architecture
- ✅ React UI with dark theme optimized for projection work
- ✅ Three.js WebGL canvas with text projection
- ✅ Authentication service (email/password login & registration)
- ✅ Social auth preparation (Google / Apple)
- ✅ License validation with device-ID binding
- ✅ Feature gating system (basic & premium tiers)
- ✅ Addon marketplace API client
- ✅ Automatic token refresh with request queuing

### Roadmap
- 🔲 Keystone correction (corner-pin warping)
- 🔲 Multi-surface projection (multi-projector support)
- 🔲 Media import (images, videos, GIFs)
- 🔲 Audio-reactive sync
- 🔲 DMX lighting integration
- ✅ Addon runtime & marketplace UI
- 🔲 Remote control (mobile companion)
- 🔲 Project save/load (.pmp files)
- 🔲 Fullscreen output mode (per-display)

---

## Architecture

```
projection-mapper-app/
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── index.ts          # App entry, window creation, lifecycle
│   │   ├── ipc.ts            # IPC handler registration (auth, license, device)
│   │   ├── preload.ts        # Secure contextBridge (renderer ↔ main)
│   │   └── store.ts          # Persistent storage (electron-store)
│   │
│   ├── renderer/             # React UI (Vite-bundled)
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Root component with routing
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ProjectionCanvas.tsx   # Three.js WebGL canvas
│   │   │   ├── Sidebar.tsx            # Control panel
│   │   │   └── Toolbar.tsx            # Top navigation bar
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useFeatureGate.ts      # Feature flag checking
│   │   ├── pages/            # Page-level components
│   │   │   ├── LoginPage.tsx          # Auth screen
│   │   │   └── ProjectionPage.tsx     # Main workspace
│   │   └── styles/           # Global CSS
│   │
│   ├── services/             # API clients (shared between main & renderer)
│   │   ├── api-client.ts     # Axios instance with auto token refresh
│   │   ├── auth-service.ts   # Login, register, social auth, logout
│   │   ├── license-service.ts # Validation, activation, feature gating
│   │   └── addon-service.ts  # Marketplace API
│   │
│   └── shared/               # Shared types & constants
│       ├── types/index.ts    # All TypeScript interfaces & enums
│       └── constants/index.ts # API URLs, feature lists, store keys
│
├── tests/                    # Test suites
│   ├── unit/                 # Vitest unit tests
│   └── e2e/                  # Playwright E2E tests
│
├── public/                   # Static assets
├── index.html                # Vite HTML entry
├── vite.config.ts            # Vite config (renderer build)
├── tsconfig.json             # Base TypeScript config
├── tsconfig.main.json        # Main process TS config
└── vitest.config.ts          # Test runner config
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Electron + React** | Cross-platform desktop with rich UI, familiar web tooling |
| **Vite** | Fast HMR, modern ESM, excellent DX |
| **Three.js + R3F** | Industry-standard WebGL with React integration |
| **Zustand** (prepared) | Lightweight state management, no boilerplate |
| **electron-store** | Simple, typed persistent storage |
| **Axios + interceptors** | Automatic token refresh, request queuing on 401 |
| **contextBridge** | Secure IPC — no Node.js exposure in renderer |

### Security Model

- `contextIsolation: true` — renderer has no Node.js access
- `nodeIntegration: false` — no `require()` in renderer
- `sandbox: true` — OS-level sandboxing
- CSP headers restrict network access to the Obitron API
- Tokens stored in OS-level user config (not localStorage)

---

## Setup & Development

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### Install

```bash
git clone https://github.com/Obi811/projection-mapper-app.git
cd projection-mapper-app
npm install
```

### Development

```bash
# Start both Electron main process and Vite dev server
npm run dev

# Or start them separately:
npm run dev:main      # Compile main process (watch mode)
npm run dev:renderer  # Start Vite dev server (port 5173)
npm start             # Launch Electron (after build:main)
```

### Testing

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:e2e      # E2E tests (Playwright)
```

### Build & Package

```bash
npm run build         # Build main + renderer
npm run package:mac   # Package for macOS (.dmg)
npm run package:win   # Package for Windows (.exe)
npm run package:all   # Package for all platforms
```

---

## API Integration

All API calls target **https://licensing.obitron.de**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Email/password login |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/social` | POST | Google/Apple OAuth |
| `/auth/passkey/register/start` | POST | Start passkey registration |
| `/auth/passkey/register/finish` | POST | Complete passkey registration |
| `/auth/passkey/login/start` | POST | Start passkey login |
| `/auth/passkey/login/finish` | POST | Complete passkey login |
| `/licenses/validate` | POST | Validate license + device |
| `/licenses/activate` | POST | Activate license on device |
| `/addons` | GET | List marketplace addons |
| `/addons/my` | GET | User's purchased addons |
| `/addons/:id/purchase` | POST | Purchase addon |
| `/addons/check/:slug` | GET | Check addon ownership |

### Feature Flags

| Flag | Tier | Description |
|------|------|-------------|
| `basic_projection` | Basic | Core projection rendering |
| `text_overlay` | Basic | Text overlays on surfaces |
| `media_import` | Basic | Image/video import |
| `gif_support` | Basic | Animated GIF support |
| `multi_surface` | Premium | Multiple projection surfaces |
| `keystone_correction` | Premium | Corner-pin warping |
| `audio_sync` | Premium | Audio-reactive effects |
| `dmx_support` | Premium | DMX lighting control |
| `addon_system` | Premium | Install marketplace addons |
| `remote_control` | Premium | Mobile companion control |

---

## CI/CD Pipeline

This project uses **GitHub Actions** for continuous integration and delivery with **automatic releases** based on [Conventional Commits](https://www.conventionalcommits.org/).

### Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **Tests** | Push & PR to `main`/`develop` | Lint, typecheck, unit tests (Node 20) |
| **Build** | Push to `main` & PR | Cross-platform builds (Mac, Windows, Linux) |
| **Release** | Git tag `v*.*.*` | Manual release with binaries on GitHub Releases |
| **Auto Release** | Push to `main`/`develop` | Automatic version bump, tag, changelog & release |

### Branch Strategy

| Branch | Purpose | Release Type | Example Version |
|--------|---------|--------------|-----------------|
| `main` | Stable production releases | Stable | `v1.2.0` |
| `develop` | Pre-release / beta testing | Beta (pre-release) | `v1.2.0-beta.1` |

### Automatic Release Process

The **Auto Release** workflow runs on every push to `main` or `develop`:

1. **Quality Gate** — Lint, typecheck, and unit tests must pass
2. **Commit Analysis** — Parses conventional commits since the last tag:
   - `feat:` → **minor** bump (0.4.0 → 0.5.0)
   - `fix:` / `perf:` → **patch** bump (0.4.0 → 0.4.1)
   - `feat!:` / `fix!:` (breaking) → **major** bump (0.4.0 → 1.0.0)
   - Other types (`docs:`, `chore:`, etc.) → no release
3. **Release** — Bumps `package.json`, creates git tag, pushes, publishes GitHub Release
4. **Build Binaries** — Cross-platform builds (Mac, Windows, Linux) attached to the release

> ⚠️ **No release is created if tests fail** — the quality gate blocks all downstream jobs.

### Manual Version Bump (NPM Scripts)

```bash
npm run version:patch    # 0.5.0 → 0.5.1
npm run version:minor    # 0.5.0 → 0.6.0
npm run version:major    # 0.5.0 → 1.0.0
npm run version:beta     # 0.5.0 → 0.5.1-beta.0
```

### Local Development

```bash
# Install dependencies (also sets up Husky git hooks)
npm install

# Start development (Electron + Vite HMR)
npm run dev

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Package for your platform
npm run package:mac     # macOS (.dmg, .zip)
npm run package:win     # Windows (.exe)
npm run package:linux   # Linux (.AppImage, .deb)
npm run package:all     # All platforms
```

### Conventional Commits

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via **commitlint** + **Husky** git hooks. Every commit message is validated locally before it reaches CI.

#### Commit Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

| Prefix | Bump | Category | Example |
|--------|------|----------|---------|
| `feat:` | minor | ✨ Features | `feat: add keystone correction` |
| `fix:` | patch | 🐛 Bug Fixes | `fix: resolve token refresh race condition` |
| `perf:` | patch | ⚡ Performance | `perf: optimize WebGL render loop` |
| `docs:` | — | 📝 Documentation | `docs: update API reference` |
| `style:` | — | 💄 Code Style | `style: fix indentation` |
| `refactor:` | — | ♻️ Refactoring | `refactor: extract projection service` |
| `test:` | — | ✅ Testing | `test: add canvas unit tests` |
| `build:` | — | 📦 Build | `build: update electron-builder config` |
| `ci:` | — | 👷 CI/CD | `ci: add Windows code signing` |
| `chore:` | — | 🔧 Maintenance | `chore: update dependencies` |
| `revert:` | — | ⏪ Revert | `revert: undo feature X` |
| `feat!:` | **major** | 💥 Breaking | `feat!: change project file format` |

#### Breaking Changes

Add `!` after the type or include `BREAKING CHANGE:` in the footer:
```
feat!: redesign projection surface API

BREAKING CHANGE: ProjectionSurface interface now requires a `transform` property.
```

### Code Signing

> ⚠️ Builds are currently **unsigned**. To enable code signing, add the following repository secrets:

| Secret | Platform | Description |
|--------|----------|-------------|
| `MAC_CERTIFICATE` | macOS | Base64-encoded `.p12` certificate |
| `MAC_CERTIFICATE_PASSWORD` | macOS | Certificate password |
| `WIN_CERTIFICATE` | Windows | Base64-encoded `.pfx` certificate |
| `WIN_CERTIFICATE_PASSWORD` | Windows | Certificate password |

---

## Contributing

1. Create a feature branch from `develop`: `git checkout -b feature/my-feature develop`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages (enforced by Husky hooks)
3. Make your changes and add tests
4. Run `npm test && npm run lint && npm run typecheck` to verify
5. Submit a pull request to `develop` — CI will run tests and builds automatically
6. After review, merge to `develop` → automatic **beta** release
7. When ready for production, merge `develop` → `main` → automatic **stable** release

---

## License

MIT © Obi811
