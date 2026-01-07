# Projection Mapper for macOS

![App Screenshot](screenshots/main.png)
![Demo](screenshots/demo.gif)

## 🎯 Features
✅ **Real-time Projection Mapping** - Live preview with draggable control points  
✅ **Multiple Surfaces** - Create and manage multiple projection areas  
✅ **Image Support** - JPG, PNG, BMP, GIF formats  
✅ **Project Management** - Save/Load JSON projects, CSV export  
✅ **Professional UI** - Dark theme, responsive macOS design  

## 🚀 Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/projection-mapper-macos.git

# Install dependencies
flutter pub get

# Run on macOS
flutter run -d macos
📁 Project Structure

text
lib/
├── models/          # Data models (Projection, ControlPoint)
├── ui/             # UI components (Canvas, Panels, Dialogs)
├── services/       # Business logic (ProjectionService)
└── extensions/     # Helper extensions
🔧 Requirements

Flutter 3.0+
macOS 10.15+
Xcode 14+
📄 License

MIT License - see LICENSE file

text

### **4. Wichtige Dateien erstellen**
```bash
# Repository-Struktur
mkdir -p .github/workflows screenshots docs

# Dokumentation
touch docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md

# GitHub Templates
touch .github/ISSUE_TEMPLATE/feature_request.md
touch .github/ISSUE_TEMPLATE/bug_report.md
ARCHITECTURE.md Inhalt:

markdown
# System Architecture

## Core Components
1. **ProjectionService** - Central business logic
2. **ProjectionCanvas** - Interactive drawing surface
3. **PreviewPanel** - Real-time projection preview
4. **ControlPanel** - UI controls and tools

## Data Flow
User Input → ControlPanel → ProjectionService → Canvas/Preview

## Extension Points
- Plugin system (planned)
- Export formats
- Protocol support (OSC/Art-Net)
5. Screenshots hinzufügen

bash
# App in verschiedenen Zuständen screenshoten:
# 1. main.png - Hauptansicht
# 2. canvas.png - Canvas mit Punkten
# 3. preview.png - Vorschau-Modus
# 4. export.png - Export-Dialog
