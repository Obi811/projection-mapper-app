# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/Obi811/projection-mapper-app/releases/tag/v0.1.0
