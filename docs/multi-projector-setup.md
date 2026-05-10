# Multi-Projector Setup Guide

## Overview

The Projection Mapper supports driving **2 to 16 projector outputs** simultaneously from a single workstation. Each projector gets its own dedicated window with independent Three.js rendering, full-screen output, and configurable resolution.

> **Note**: Multi-projector support is a **Premium** feature. A valid Premium or Enterprise license with the `multi_surface` feature flag is required.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Main Window                        │
│  ┌─────────────┐  ┌──────────────────────────────┐   │
│  │  Sidebar     │  │     Projection Canvas        │   │
│  │  - Text      │  │     (Preview / Edit)         │   │
│  │  - Projector │  │                              │   │
│  │    Manager   │  │                              │   │
│  │  - License   │  │                              │   │
│  └─────────────┘  └──────────────────────────────┘   │
└───────────────────────┬──────────────────────────────┘
                        │ IPC
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Projector 1  │ │ Projector 2  │ │ Projector N  │
│ (Display 2)  │ │ (Display 3)  │ │ (Display N)  │
│ Fullscreen   │ │ Fullscreen   │ │ Fullscreen   │
│ Three.js     │ │ Three.js     │ │ Three.js     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Components

### Output Manager (`src/services/output-manager.ts`)
- Enumerates connected displays via Electron's `screen` API
- Manages projector configurations (CRUD)
- Tracks runtime state (idle, active, error, disconnected)
- Persists configurations via `electron-store`

### Projector Window Manager (`src/main/projector-window.ts`)
- Creates dedicated `BrowserWindow` for each projector
- Positions windows on the correct physical display
- Supports fullscreen and windowed modes
- IPC communication between main window and projector windows

### Surface Manager (`src/services/surface-manager.ts`)
- Assigns projection surfaces to specific projectors
- Manages render data (surfaces + overlays) per projector
- Provides synchronisation clock for frame-accurate sync

## Setup Steps

### 1. Connect Displays

Connect all projectors/displays to your computer. The application will detect them automatically.

### 2. Open Projector Manager

In the **Sidebar**, find the **Projectors** section. If you have a Premium license, you'll see the projector management controls.

### 3. Add a Projector

1. Click **"+ Add"**
2. In the setup dialog, click **"🔄 Scan Displays"** to detect connected displays
3. Select the target display for this projector
4. Configure:
   - **Name**: A descriptive name (e.g., "Front Wall", "Stage Left")
   - **Resolution**: Auto-detected from display, adjustable
   - **Fullscreen**: Recommended for projection output
5. Click **"Add Projector"**

### 4. Start Projection

Click the **"▶ Start"** button on a projector card to open its output window. The window will appear on the selected display in fullscreen mode.

### 5. Assign Surfaces

Surfaces from the main canvas can be assigned to specific projectors. Each surface renders on the assigned projector's output window.

## Configuration

### Projector Config Schema

```typescript
interface ProjectorConfig {
  id: string;              // Unique identifier
  name: string;            // Display name
  displayId: number;       // Electron display ID
  displayIndex: number;    // Display array index
  resolution: {
    width: number;         // Output width in pixels
    height: number;        // Output height in pixels
  };
  position: {
    x: number;             // Window X position
    y: number;             // Window Y position
  };
  enabled: boolean;        // Whether this projector is enabled
  fullscreen: boolean;     // Fullscreen mode
  assignedSurfaces: string[]; // IDs of assigned surfaces
}
```

### Storage

Projector configurations are persisted in `electron-store` under the key `projectors.configs`. The storage location depends on your OS:

| OS      | Path                                                          |
|---------|---------------------------------------------------------------|
| macOS   | `~/Library/Application Support/projection-mapper-app/config.json` |
| Windows | `%APPDATA%/projection-mapper-app/config.json`                 |
| Linux   | `~/.config/projection-mapper-app/config.json`                 |

## Limitations

- **Maximum 16 projectors** per instance
- Each projector window requires GPU resources; ensure adequate hardware
- Display hot-plugging requires a manual "Scan Displays" refresh
- Projector windows share the same Electron process

## Troubleshooting

### Display not detected
- Ensure the display is connected and recognized by your OS
- Click "Scan Displays" in the setup dialog
- Check OS display settings to verify the display is enabled

### Low frame rate
- Reduce the resolution of projector outputs
- Close unused projector windows
- Ensure GPU drivers are up to date
- Consider reducing the number of surfaces per projector

### Projector window on wrong display
- Edit the projector configuration and re-select the correct display
- Ensure display arrangement in OS settings matches physical layout

## IPC Channels

| Channel                      | Direction     | Description                        |
|------------------------------|---------------|------------------------------------|
| `projector:getDisplays`      | Renderer → Main | Enumerate connected displays      |
| `projector:scanDisplays`     | Renderer → Main | Force display re-scan             |
| `projector:getConfigs`       | Renderer → Main | Get all projector configs         |
| `projector:saveConfig`       | Renderer → Main | Create/update projector config    |
| `projector:deleteConfig`     | Renderer → Main | Delete projector config           |
| `projector:openWindow`       | Renderer → Main | Open projector output window      |
| `projector:closeWindow`      | Renderer → Main | Close projector output window     |
| `projector:getStates`        | Both          | Get/push runtime states           |
| `projector:updateContent`    | Main → Projector | Push content to projector window |
