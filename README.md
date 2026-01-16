Projection Mapper for macOS

https://via.placeholder.com/800x450/2D3748/FFFFFF?text=Projection+Mapper+App
A professional projection mapping application built with Flutter for macOS

🚀 Features

✅ Multi-Surface Projection Mapping

Create and manage multiple projection surfaces
Real-time interactive canvas with draggable control points
Surface visibility, opacity, and layer order control
Duplicate, rename, and delete surfaces with ease
✅ Professional Interface

Dark theme with Material Design 3
Split-screen layout: Canvas + Control Panel
Surface Manager Panel for multi-surface management
Responsive design optimized for macOS
✅ Data Management

JSON project saving/loading
CSV export for control point data
Image caching system for performance
Automatic project backups
✅ Technical Excellence

Built with Flutter 3.0+ (100% Dart)
No external plugin dependencies (pure native code)
Provider pattern for state management
Clean architecture with separation of concerns
📸 Screenshots

Single Surface Mode	Multi-Surface Mode
https://via.placeholder.com/400x250/4A5568/FFFFFF?text=Single+Surface	https://via.placeholder.com/400x250/4A5568/FFFFFF?text=Multi+Surface
Surface Manager	Control Panel
https://via.placeholder.com/400x250/4A5568/FFFFFF?text=Surface+Manager	https://via.placeholder.com/400x250/4A5568/FFFFFF?text=Control+Panel
🛠️ Installation

Prerequisites

Flutter 3.0 or higher
macOS 10.15 (Catalina) or newer
Xcode 14+ (for macOS development)
Quick Start

bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/projection-mapper-macos.git
cd projection-mapper-macos

# Install dependencies
flutter pub get

# Run the application
flutter run -d macos
Build for Distribution

bash
# Build for macOS
flutter build macos

# The built app will be in:
# build/macos/Build/Products/Release/
📁 Project Structure

text
projection-mapper-macos/
├── lib/
│   ├── models/           # Data models
│   │   ├── control_point.dart
│   │   ├── projection.dart
│   │   └── multi_surface.dart
│   ├── services/         # Business logic
│   │   └── projection_service.dart
│   └── ui/              # UI components
│       ├── projection_canvas.dart
│       ├── surface_manager_panel.dart
│       ├── control_panel.dart
│       └── image_loader.dart
├── assets/              # Images and resources
├── macos/               # macOS platform code
└── pubspec.yaml         # Dependencies
🎯 Usage Guide

1. Creating a New Project

Click the "New Project" button in the app
Choose between Single Surface or Multi-Surface mode
Name your project
2. Working with Surfaces

Add Surface: Click the "+" button in the Surface Manager
Select Surface: Click on any surface in the list
Rename: Use the context menu (⋯) → Rename
Duplicate: Create a copy with all control points
Delete: Remove unwanted surfaces (cannot delete last surface)
3. Adjusting Control Points

Click and drag any control point on the canvas
Points are automatically saved
Wireframe shows the projection area
4. Loading Images

Click the image icon in the toolbar
Select an image file (JPG, PNG, BMP, GIF)
The image will be mapped to the control points
5. Exporting Data

JSON Export: Full project data (recommended for saving)
CSV Export: Control point coordinates only (for external use)
🔧 Development

Adding New Features

The codebase is modular and easy to extend:

dart
// Example: Adding a new surface property
class ProjectionSurface {
  // Existing properties...
  String blendMode; // New property
  
  // Update toJson/fromJson methods
  // Add UI controls in surface_manager_panel.dart
}
Architecture

The app follows the MVVM pattern with Provider:

Models: Pure data classes with JSON serialization
Services: Business logic and state management
UI: Stateless/Stateful widgets that listen to the service
Dependencies

yaml
dependencies:
  flutter: # Core Flutter framework
  provider: ^6.1.1 # State management
  image: ^4.0.17 # Image processing
  # No external projection mapping plugins - pure Dart code
📈 Roadmap

Phase 1: Complete ✅

Basic projection mapping with 4+ control points
Multi-surface management system
JSON/CSV export functionality
Professional macOS UI
Phase 2: In Progress 🔄

Real image loading with file picker
Image preview on canvas
Enhanced export formats
Undo/Redo system
Phase 3: Planned 📅

Video/GIF animation support
OSC/Art-Net protocol integration
Advanced calibration tools (grid, edge detection)
Cross-platform support (Windows, Linux, iOS)
🤝 Contributing

We welcome contributions! Here's how to help:

Fork the repository
Create a feature branch
bash
git checkout -b feature/amazing-feature
Commit your changes
bash
git commit -m 'Add some amazing feature'
Push to the branch
bash
git push origin feature/amazing-feature
Open a Pull Request
Development Guidelines

Follow Dart/Flutter best practices
Add tests for new functionality
Update documentation accordingly
Use descriptive commit messages
🐛 Troubleshooting

Common Issues

File picker doesn't work on macOS:

bash
# Ensure proper entitlements
open macos/Runner.xcworkspace
# Enable App Sandbox with file access permissions
App crashes when loading large images:

The app includes an image cache system
Large images are automatically optimized
Check console for memory warnings
Control points not draggable:

Ensure you're in edit mode
Check that no surface is locked
Verify the canvas has focus
Debugging

bash
# Run with verbose logging
flutter run -d macos --verbose

# Check Flutter doctor
flutter doctor -v
📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

Flutter Team for the amazing cross-platform framework
Material Design for the beautiful UI components
Open Source Community for inspiration and tools
📞 Support

Issues: GitHub Issues
Discussions: GitHub Discussions
Email: your-email@example.com
🏆 Project Status

Current Version: 1.0.0 (Multi-Surface MVP)
Stability: Production Ready ✅
Platform: macOS (expandable to iOS/Android/Windows/Linux)
Last Updated: $(date)

<div align="center"> <p>Built with ❤️ using Flutter</p> <p>⭐ Star this repo if you find it useful!</p> </div>
🔄 Update Instructions

Latest Changes (v1.0.0)

Complete multi-surface management system
Professional dark theme interface
JSON project serialization
Performance optimizations with image caching
Upgrading from Previous Versions

bash
# Pull latest changes
git pull origin main

# Update dependencies
flutter pub get

# Clean build
flutter clean
flutter run -d macos
Happy Projection Mapping! 🎬✨
