# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
