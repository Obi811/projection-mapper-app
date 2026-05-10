# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
