# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - 2026-06-20

### Added

- **Komplette Oberfläche nach dem Login** — Die App zeigt nach der Anmeldung jetzt
  eine vollwertige, durchgängig deutsche Benutzeroberfläche statt Platzhaltern.
  - **Dashboard/Startseite** mit persönlicher Begrüßung, Lizenz-Badge, Statistik-Karten
    (konfigurierte Projektoren, aktive Projektoren, freigeschaltete Funktionen),
    Schnellzugriff-Aktionen, Projektor-Übersicht inkl. Onboarding-/Leerzustand und
    Funktionsstatus-Übersicht.
  - **Arbeitsbereich** (`Workspace`) mit Projektions-Canvas, Text-Overlay-Steuerung,
    Keystone-/Eckenkorrektur und schlanker Werkzeugleiste.
  - **Projektoren-Seite** für die Verwaltung mehrerer Projektoren (bis zu 16).
  - **Addons-Seite** für installierte Addons und den Addon-Marktplatz.
  - **Einstellungen** mit Profil, Lizenzaktivierung, freigeschalteten Funktionen
    und App-Informationen (Version, API-URL).

- **Navigation & Routing** — Neues Routing auf Basis von React Router (HashRouter).
  - Geschützte Routen (`ProtectedRoute`): nicht angemeldete Nutzer werden zur
    Anmeldung umgeleitet, nach erfolgreichem Login geht es direkt zur Startseite.
  - Linke Navigationsleiste (Dashboard, Arbeitsbereich, Projektoren, Addons,
    Einstellungen) und Kopfzeile mit Benutzerprofil, Logout und Versionsanzeige.

- **Benutzerprofil & Abmeldung** — Anzeige von Name/E-Mail des angemeldeten Nutzers
  sowie eine funktionierende Logout-Funktion über das Profilmenü.

- **macOS Code-Signing vorbereitet**
  - Hardened Runtime, Entitlements (`build/entitlements.mac.plist`) und
    `afterSign`-Notarisierungs-Hook (`build/notarize.js`, abhängig von
    `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID`).
  - `extendInfo` (Info.plist) mit Nutzungsbeschreibungen und Mindest-Systemversion.
  - Neue Dokumentation: [`docs/macos-installation.md`](docs/macos-installation.md)
    (Workaround „App ist beschädigt" via `xattr -cr`) und
    [`docs/code-signing.md`](docs/code-signing.md) (Signatur/Notarisierung & GitHub-Actions-Secrets).

### Changed

- **Durchgängige deutsche Lokalisierung** — Alle verbliebenen englischen Texte und
  Platzhalter wurden übersetzt (Projektor-Setup-Dialog, Addon-Marktplatz,
  Addon-Details, Keystone-Panel, Projektor-Verwaltung, Fehlermeldungen u. a.).
- **Aufgeräumte UI-Struktur** — Veralteter Code mit „v0.4.0"-Platzhaltern
  (`Sidebar`, `Toolbar`, alte `ProjectionPage`) wurde durch das neue Layout
  (`AppLayout`) und seitenbasierte Komponenten ersetzt.

### Fixed

- **Kritischer Fehler: leere Oberfläche nach Login** — Nach der Anmeldung wurden
  nur Platzhalter („bitte annoncieren") angezeigt; die eigentliche Projektions-UI
  ist nun vollständig erreichbar und nutzbar.

## [0.10.1] - 2026-06-02

### Fixed

- **Build-Fehler behoben** — `tsconfig.main.json` fehlten `DOM` und `DOM.Iterable` in `lib`
  - WebAuthn-Typen (`PublicKeyCredentialCreationOptions`, `PublicKeyCredentialRequestOptions`) benötigen DOM-Typdefinitionen
  - Dies verhinderte die Erstellung der v0.10.0-Binaries (alle 3 Plattformen schlugen bei `npm run build` fehl)

- **CSP-URL aktualisiert** — `index.html` Content Security Policy korrigiert
  - `connect-src` von `obitron.abacusai.app` auf `licensing.obitron.de` geändert
  - Ermöglicht API-Requests an den neuen Lizenzserver aus dem Renderer-Prozess

## [0.9.0] - 2026-06-02

### Fixed

- **API Base URL** — Changed from `obitron.abacusai.app` to `licensing.obitron.de`
  - Fixes 404 errors on login, registration, and all API calls
  - Added `OBITRON_API_URL` environment variable support for custom API endpoints
  - Updated all documentation references

### Added

- **Social Authentication** — Fully functional Google & Apple Sign-In
  - OAuth popup flow for desktop Electron apps
  - `initiateGoogleSignIn()` / `initiateAppleSignIn()` with popup management
  - Backend token exchange via `POST /auth/social`
  - New IPC channel `AUTH_SOCIAL` for renderer ↔ main communication
  - UI buttons are now functional (no longer disabled/placeholder)

- **Passkey / WebAuthn Authentication** — Biometric login support
  - Registration flow: `POST /auth/passkey/register/start` + `navigator.credentials.create()` + `POST /auth/passkey/register/finish`
  - Login flow: `POST /auth/passkey/login/start` + `navigator.credentials.get()` + `POST /auth/passkey/login/finish`
  - WebAuthn utilities (`src/renderer/utils/webauthn.ts`): base64url encoding, credential serialization, options decoding
  - Platform authenticator detection (TouchID, FaceID, Windows Hello)
  - Passkey button auto-hidden when biometrics unavailable
  - 4 new IPC channels for passkey operations

- **Improved Auth UX**
  - German localisation for all auth UI text
  - User-friendly error messages (network, 401, 409, 429, 500)
  - Success messages with visual feedback
  - Loading states for all auth actions (email, social, passkey)
  - Disabled inputs during pending requests
  - Better error styling with colored backgrounds

### Changed

- **Auth Service** — Added `passkeyRegisterStart`, `passkeyRegisterFinish`, `passkeyLoginStart`, `passkeyLoginFinish` methods
- **IPC Handlers** — 6 new handlers (social auth + passkey lifecycle)
- **Preload Bridge** — Extended `auth` namespace with social + passkey methods
- **Unit Tests** — 5 new passkey auth tests (126 total, all passing)

## [0.7.0] - 2026-06-02

### Added

- **Addon System** — Full plugin/addon framework with marketplace integration
  - **Addon Manifest** (`addon.json`): declarative format with permissions, settings schema, categories
  - **Plugin Loader** (`src/services/plugin-loader.ts`): dynamic addon discovery, loading, lifecycle management
    - Manifest validation (semver, permissions, categories)
    - Full lifecycle: install → load → enable ⇄ disable → unload → uninstall
    - Sandboxed addon registry with graceful shutdown
  - **Addon API / SDK** (`src/services/addon-api.ts`): developer-facing API for addons
    - Event bus (subscribe/emit cross-addon events)
    - Permission-gated access (projection, storage, logging)
    - `AddonEventBus` singleton with typed events
  - **Marketplace Integration** (`src/services/addon-service.ts`): obitron.abacusai.app API client
    - Browse addons by category, view details, purchase, check ownership
    - Automatic update checking with semver comparison
  - **Addon Manager UI**: sidebar panel with enable/disable toggles
    - `AddonManagerPanel` — installed addons list, feature-gated
    - `AddonMarketplace` — modal browser with category filters
    - `AddonDetailsDialog` — settings editor, permissions view, uninstall
  - **IPC Bridge**: 14 new IPC channels for addon operations
  - **Persistent Storage**: addon state and settings in electron-store
  - **Example Addon** (`example-addons/hello-world/`): demonstrates lifecycle, events, storage, settings
  - **Feature-gated**: requires `addon_system` premium license flag
  - **Developer Documentation** (`docs/addon-development.md`): full guide with API reference
  - **Unit Tests**: plugin-loader manifest validation, addon-service marketplace integration

## [0.5.0] - 2026-06-02

### Added

- **Automatic Release System** — Conventional Commits-based automatic versioning and release
  - **Auto Release Workflow** (`.github/workflows/auto-release.yml`): 4-job pipeline
    - Quality Gate: lint, typecheck, unit tests must pass before any release
    - Commit Analysis: parses conventional commits to determine version bump type
    - Release: bumps `package.json`, creates git tag, publishes GitHub Release with notes
    - Build Binaries: cross-platform builds (Mac, Windows, Linux) attached to release
  - **Branch-specific releases**: `main` → stable (v1.0.0), `develop` → beta (v1.0.0-beta.1)
  - **commitlint** (`commitlint.config.js`): enforces conventional commit message format
    - Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
    - Subject max 100 chars, header max 120 chars
  - **Husky git hooks**: local commit validation before push
    - `commit-msg`: validates commit message format via commitlint
    - `pre-commit`: runs lint and typecheck
  - **Version-bump NPM scripts**:
    - `npm run version:patch` — bump patch version
    - `npm run version:minor` — bump minor version
    - `npm run version:major` — bump major version
    - `npm run version:beta` — bump to next beta prerelease
  - **`develop` branch**: created for beta/pre-release workflow

### Changed

- **README.md**: Comprehensive update with branch strategy, auto-release docs, conventional commits guide, contributing workflow
- **package.json**: Added `prepare` script for Husky, version-bump scripts

### Dependencies

- Added `@commitlint/cli` ^21.0.0
- Added `@commitlint/config-conventional` ^21.0.0
- Added `husky` ^9.1.0

## [0.4.1] - 2026-05-10

### Fixed

- **CI/CD Workflow Fixes** — All three GitHub Actions workflows (test, build, release) repaired
  - Added missing ESLint dependencies: `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
  - Downgraded ESLint from v9 to v8 for `.eslintrc.json` config format compatibility
  - Fixed `react/no-unknown-property` ESLint errors for Three.js JSX attributes (`position`, `args`, `geometry`, etc.)
  - Fixed TypeScript errors for Electron-specific `WebkitAppRegion` CSS property
  - Corrected build artifact paths in workflows (`release/` instead of `dist/`)
  - Created missing `playwright.config.ts` for E2E test configuration
  - Added placeholder E2E tests in `tests/e2e/app.spec.ts`
  - Updated `lint` script to use glob pattern instead of deprecated `--ext` flag
  - Downgraded `prefer-const` and `@typescript-eslint/no-var-requires` from errors to warnings
  - Removed Node.js 18 from test matrix (jsdom v29 requires Node 20+, Electron 33 uses Node 20+)
  - Fixed `electron-builder` artifact output paths in `build.yml` and `release.yml` (`release/` instead of `dist/`)
  - Fixed `tsconfig.main.json` rootDir mismatch — changed from `src/main` to `src` so `src/shared/` and `src/services/` compile correctly
  - Added author email in `package.json` for Linux `.deb` package maintainer field (electron-builder requirement)

## [0.4.0] - 2026-05-10

### Added

- **Keystone Correction System** — 4-point perspective correction for projection alignment
  - **Keystone Engine** (`src/services/keystone-engine.ts`): Pure math algorithms
    - Perspective transformation matrix (DLT homography)
    - Bilinear mesh deformation for Three.js BufferGeometry
    - 3×3 → 4×4 matrix conversion for Three.js integration
    - Utility functions: identity check, clamping, snap-to-grid, area calculation, validation
  - **Keystone Service** (`src/services/keystone-service.ts`): Config & preset management
    - Per-projector keystone configurations (1:1 mapping)
    - Preset save/load/delete (up to 20 per projector)
    - Reset to default function
    - In-memory state with electron-store persistence
  - **KeystoneMesh** (`src/renderer/components/KeystoneMesh.tsx`): Three.js deformable mesh
    - Subdivided PlaneGeometry with real-time vertex deformation
    - UV-correct rendering for texture mapping
    - Visual border indicator (amber when deformed)
  - **CornerHandles** (`src/renderer/components/CornerHandles.tsx`): Interactive overlay
    - Mouse drag for corner adjustment
    - Keyboard arrow keys (0.5% step, Shift for 0.1% fine adjustment)
    - Tab key to cycle corners, Escape to deselect
    - Snap-to-grid (5% increments, toggleable)
    - SVG guide lines with diagonals
  - **KeystonePanel** (`src/renderer/components/KeystonePanel.tsx`): Sidebar controls
    - Enable/disable toggle
    - Numeric input for precise corner values (0.000–1.000)
    - Mesh quality slider (1–32 subdivisions)
    - Preset management UI (save/load/delete)
    - Keyboard shortcut reference
  - **Feature-Gating**: `keystone_correction` premium feature check with upgrade prompt
  - **IPC Channels**: 7 new channels for keystone operations
    - `keystone:getConfig`, `keystone:saveConfig`, `keystone:deleteConfig`
    - `keystone:getPresets`, `keystone:savePreset`, `keystone:deletePreset`
    - `keystone:reset`
  - **Persistent Storage**: Keystone configs and presets saved via electron-store
    - `keystone.configs` and `keystone.presets` store keys
  - **Unit Tests**: 55 new tests (29 engine + 26 service)
  - **Documentation**: Keystone correction setup guide (`docs/keystone-correction.md`)

### Changed

- **Toolbar**: Added Keystone mode toggle button (◇ Keystone), updated version to v0.4.0
- **ProjectionCanvas**: Accepts keystone props; conditionally renders KeystoneMesh or default plane
- **ProjectionPage**: Manages keystone state, canvas size observation, and CornerHandle overlay
- **Sidebar**: Integrated KeystonePanel with feature-gated `keystone_correction` check
- **Shared Types**: Added `KeystoneConfig`, `KeystonePreset`, `KeystoneCorners`, `TransformMatrix4`
- **IpcChannel Enum**: Extended with 7 keystone channels
- **Constants**: Added keystone defaults (subdivisions, snap grid, arrow steps, max presets)
- **electron-store Schema**: Added `keystone.configs` and `keystone.presets`
- **Preload Script**: Added `keystone` API namespace with 7 IPC methods
- **Main Process**: Loads keystone configs and presets on startup

## [0.3.0] - 2026-05-10

### Added
- **Multi-Projector Support**: Drive 2–16 projector outputs simultaneously from a single workstation
- **Output Manager Service** (`src/services/output-manager.ts`): Display enumeration via Electron screen API, projector configuration CRUD, runtime state tracking
- **Surface Manager Service** (`src/services/surface-manager.ts`): Surface-to-projector assignment, render data aggregation, frame-accurate sync clock
- **Projector Window Manager** (`src/main/projector-window.ts`): Dedicated BrowserWindow per projector, fullscreen mode, display-aware positioning, IPC communication
- **Projector Setup Dialog**: Scan connected displays, configure projector name/resolution/fullscreen, edit/delete configurations
- **Projector Manager Panel**: List projectors with status indicators, preview thumbnails, start/stop controls, premium feature badge
- **Projector Preview Component**: Canvas-based thumbnail previews showing surface assignments and active status per projector
- **Feature-Gating Integration**: `multi_surface` premium feature check with upgrade prompt in sidebar
- **IPC Channels**: 9 new IPC channels for projector management (`projector:getDisplays`, `projector:saveConfig`, `projector:openWindow`, etc.)
- **Persistent Configuration**: Projector configs saved/loaded via electron-store (`projectors.configs` key)
- **Shared Types**: `DisplayInfo`, `ProjectorConfig`, `ProjectorState`, `SurfaceAssignment` interfaces
- **Unit Tests**: 32 new tests for output-manager and surface-manager services (100% pass rate)
- **Documentation**: Multi-projector setup guide (`docs/multi-projector-setup.md`)

### Changed
- Updated Sidebar to integrate Projector Manager Panel with feature-gated display
- Extended IpcChannel enum with projector management channels
- Extended electron-store schema with projector configurations
- Updated constants with multi-projector limits (MAX_PROJECTORS=16)
- Updated preload script with projector API bridge

## [0.2.0] - 2026-05-10

### Added
- **CI/CD Pipeline**: GitHub Actions workflows for testing, building, and releasing
  - Test workflow: runs on Node 18.x & 20.x with coverage reporting
  - Build workflow: cross-platform matrix builds (Mac, Windows, Linux)
  - Release workflow: automated GitHub Releases on version tags (v*.*.*)
- **CHANGELOG Automation**: Scripts for automatic changelog generation from Conventional Commits
  - `scripts/update-changelog.js` — generate changelog from git history
  - `scripts/extract-changelog.js` — extract version-specific notes for releases
- **Code Signing Preparation**: Placeholder configuration for macOS and Windows certificates
- **Status Badges**: CI/CD status badges in README.md

### Documentation
- README updated with CI/CD pipeline documentation
- Release process guide with step-by-step instructions
- Conventional Commits reference table
- Code signing setup instructions
- Local development commands reference


## [0.1.0] - 2026-05-10

### Added
- **Project Architecture**: Complete Electron + React + TypeScript + Vite setup
- **Main Process**: Window management, IPC handlers, secure preload bridge, persistent store
- **Authentication Service**: Email/password login & registration, token refresh with request queuing, social auth preparation (Google/Apple)
- **License Service**: License validation (POST /licenses/validate), device-ID generation & persistence, feature gating system with O(1) lookups
- **Addon Service**: Marketplace API client (list, purchase, check addons)
- **WebGL Canvas**: Three.js scene with @react-three/fiber, text projection overlay, projection surface placeholder, orbit controls for development
- **UI Components**: Login page with register toggle, projection workspace with sidebar controls, toolbar with app branding
- **Feature Gating Hook**: `useFeatureGate` React hook for conditional rendering
- **Testing**: Vitest unit tests for auth service and license service
- **Build Pipeline**: Vite for renderer, TypeScript compilation for main process, electron-builder packaging configuration (Mac/Win/Linux)
- **Documentation**: README with architecture overview, setup guide, API reference, and roadmap
- **Security**: Content Security Policy, contextIsolation, sandbox mode, no Node.js in renderer

### Architecture Decisions
- Chose Electron over Flutter for better WebGL/Three.js integration
- Vite over Webpack for faster development builds
- Zustand prepared for state management (not yet wired)
- electron-store for OS-native persistent storage
- Axios interceptors for transparent token refresh

[0.2.0]: https://github.com/Obi811/projection-mapper-app/releases/tag/v0.2.0
[0.1.0]: https://github.com/Obi811/projection-mapper-app/releases/tag/v0.1.0
