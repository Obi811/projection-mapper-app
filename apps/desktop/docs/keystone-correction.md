# Keystone Correction Setup Guide

## Overview

Keystone correction compensates for the geometric distortion that occurs when a projector is not perfectly perpendicular to the projection surface. The 4-point keystone system allows you to independently adjust each corner of the projection to achieve a perfectly rectangular image on any angled surface.

> **Premium Feature**: Keystone correction requires a Premium or Enterprise license. See the [License](#feature-gating) section for details.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Renderer Process (React UI)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ CornerHandles│  │ KeystonePanel│  │  Toolbar   │  │
│  │  (overlay)   │  │  (sidebar)   │  │  (toggle)  │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                 │         │
│         └────────┬───────┘                 │         │
│                  │                         │         │
│         ┌────────▼─────────┐               │         │
│         │  ProjectionPage  │◄──────────────┘         │
│         │  (state manager) │                         │
│         └────────┬─────────┘                         │
│                  │                                   │
│         ┌────────▼─────────┐                         │
│         │ ProjectionCanvas │                         │
│         │  ┌─────────────┐ │                         │
│         │  │ KeystoneMesh│ │  (Three.js deformation) │
│         │  └─────────────┘ │                         │
│         └──────────────────┘                         │
└─────────────────────┬───────────────────────────────┘
                      │ IPC
┌─────────────────────▼───────────────────────────────┐
│  Main Process                                        │
│  ┌──────────────────┐  ┌────────────────────────┐   │
│  │ Keystone Service  │  │   electron-store        │   │
│  │ (configs/presets) │──│ (persistence layer)     │   │
│  └──────────────────┘  └────────────────────────┘   │
│  ┌──────────────────┐                               │
│  │ Keystone Engine   │  (algorithms — pure math)    │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

## Components

### Keystone Engine (`src/services/keystone-engine.ts`)

Pure mathematical algorithms for keystone correction:

- **`computePerspectiveMatrix(corners)`** — Computes a 3×3 homography matrix from 4 corner points using the Direct Linear Transform (DLT) algorithm
- **`transformPoint(matrix, point)`** — Applies a perspective transform to a 2D point
- **`computeDeformedMesh(corners, subdivisions, width, height)`** — Generates deformed vertex positions and UV coordinates for a subdivided plane mesh
- **`toMatrix4(m3)`** — Converts a 3×3 matrix to a Three.js-compatible 4×4 matrix (column-major)
- **`isIdentityKeystone(corners)`** — Checks if corners match the default (no correction)
- **`clampCorner(point)`** — Constrains a point to [0..1] range
- **`snapToGrid(point, gridSize)`** — Snaps a point to the nearest grid position
- **`validateCorners(corners)`** — Validates that corners form a non-degenerate quadrilateral

### Keystone Service (`src/services/keystone-service.ts`)

State management for keystone configurations and presets:

- **Config CRUD**: `getConfig()`, `saveConfig()`, `deleteConfig()`, `resetConfig()`
- **Preset Management**: `savePreset()`, `deletePreset()`, `applyPreset()`, `getPresets()`
- **Persistence**: `loadConfigs()`, `loadPresets()` (from electron-store via IPC)

### KeystoneMesh (`src/renderer/components/KeystoneMesh.tsx`)

Three.js mesh component that renders a deformed projection surface:

- Subdivided `BufferGeometry` with bilinear interpolation
- Real-time vertex updates when corners change
- Visual border (amber when deformed, indigo when identity)
- UV-correct for texture mapping

### CornerHandles (`src/renderer/components/CornerHandles.tsx`)

Interactive HTML overlay for dragging corner points:

- Mouse drag with clamping to [0..1]
- Keyboard arrow keys (±0.5%, Shift for ±0.1%)
- Tab to cycle through corners
- Snap-to-grid (5% increments)
- Visual feedback (colour, scale, selection indicator)

### KeystonePanel (`src/renderer/components/KeystonePanel.tsx`)

Sidebar panel for keystone settings:

- Enable/disable toggle
- Numeric input for each corner (X, Y)
- Mesh quality (subdivision) slider
- Snap-to-grid toggle
- Preset save/load/delete
- Reset to default
- Keyboard shortcut hints

## Setup Steps

### 1. Enable Keystone Correction

1. Open the Projection Mapper application
2. In the left sidebar, find the **Keystone Correction** section
3. Check the **Enabled** checkbox
4. The projection surface will now respond to corner adjustments

### 2. Adjust Corners

**Method A: Interactive Drag**
1. Click the **◇ Keystone** button in the toolbar (or click **Edit Corners** in the sidebar)
2. Drag any of the 4 corner handles (TL, TR, BR, BL) to adjust
3. The projection surface deforms in real-time

**Method B: Numeric Input**
1. In the Keystone Correction panel, enter precise X and Y values for each corner
2. Values range from 0.000 to 1.000 (normalised coordinates)

**Method C: Keyboard**
1. Click on a corner handle to select it
2. Use **Arrow keys** to move (0.5% per press)
3. Hold **Shift** for fine adjustment (0.1% per press)
4. Press **Tab** to cycle through corners
5. Press **Escape** to deselect

### 3. Save a Preset

1. In the **Presets** section of the Keystone panel, enter a name
2. Click **Save** or press **Enter**
3. The current corner positions are saved as a preset

### 4. Load a Preset

1. Click on a preset name in the list
2. The corners are immediately applied

## Configuration

### KeystoneConfig Schema

```typescript
interface KeystoneConfig {
  id: string;
  projectorId: string;
  name: string;
  corners: [Point2D, Point2D, Point2D, Point2D]; // [TL, TR, BR, BL]
  meshSubdivisions: number; // 1-32 (default: 8)
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Corner Coordinate System

- **Normalised range**: `[0..1]` for both X and Y
- **Origin**: Bottom-left = `(0, 0)`
- **Top-right**: `(1, 1)`
- **Default corners** (no correction):
  - Top-Left: `(0, 1)`
  - Top-Right: `(1, 1)`
  - Bottom-Right: `(1, 0)`
  - Bottom-Left: `(0, 0)`

### Mesh Subdivisions

Higher subdivision values produce smoother deformation at the cost of more geometry:

| Subdivisions | Vertices | Triangles | Use Case |
|---|---|---|---|
| 1 | 4 | 2 | Minimal correction |
| 4 | 25 | 32 | Light keystoning |
| 8 | 81 | 128 | Standard (default) |
| 16 | 289 | 512 | Heavy correction |
| 32 | 1089 | 2048 | Maximum quality |

## IPC Channels

| Channel | Direction | Description |
|---|---|---|
| `keystone:getConfig` | Renderer → Main | Get keystone config for a projector |
| `keystone:saveConfig` | Renderer → Main | Save/update keystone config |
| `keystone:deleteConfig` | Renderer → Main | Delete keystone config |
| `keystone:getPresets` | Renderer → Main | Get presets for a projector |
| `keystone:savePreset` | Renderer → Main | Save a new preset |
| `keystone:deletePreset` | Renderer → Main | Delete a preset |
| `keystone:reset` | Renderer → Main | Reset to default corners |

## Feature Gating

Keystone correction is a **Premium** feature. The `keystone_correction` flag must be present in the user's enabled features to use this functionality.

When the feature is not enabled:
- The Keystone panel shows a "PREMIUM" badge
- A description of the feature is displayed
- An "Upgrade to Premium" button is shown

## Persistence

Keystone configurations and presets are persisted via `electron-store`:

- **Configs**: `keystone.configs` key — Array of `KeystoneConfig` objects
- **Presets**: `keystone.presets` key — Array of `KeystonePreset` objects

Data is loaded on application startup and saved automatically when changes are made through the UI.

## Troubleshooting

### Projection surface doesn't deform
- Ensure keystone correction is **enabled** in the sidebar panel
- Check that you have a Premium license with the `keystone_correction` feature
- Verify that corners have been moved from default positions

### Corner handles not visible
- Click the **◇ Keystone** button in the toolbar to enter edit mode
- Ensure keystone correction is enabled

### Deformation looks incorrect
- Reset to default (click **↺ Reset to Default**)
- Increase mesh subdivisions for heavy corrections
- Ensure corners form a valid (non-self-intersecting) quadrilateral

### Preset not loading
- Check that the preset was saved for the correct projector
- Maximum of 20 presets per projector
