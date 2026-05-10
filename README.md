# 🎯 Projection Mapper

Professional projection mapping desktop application for Mac and Windows, built with **Electron**, **React**, **TypeScript**, and **Three.js**.

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
- 🔲 Addon runtime & marketplace UI
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

All API calls target **https://obitron.abacusai.app**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Email/password login |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/social` | POST | Google/Apple OAuth |
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

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and add tests
3. Run `npm test` to verify
4. Submit a pull request

---

## License

MIT © Obi811
