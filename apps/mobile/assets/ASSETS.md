# Mobile App Assets

Dieses Verzeichnis enthält die visuellen Assets für die mobile Companion-App (iOS & Android).

## Übersicht

| Asset | Datei | Größe | Verwendung |
|-------|-------|-------|------------|
| **App Icon** | `icon.png` | 1024×1024 | Haupt-Icon für iOS & Android |
| **Adaptive Icon** | `adaptive-icon.png` | 1024×1024 | Android Adaptive Icon (Vordergrund) |
| **Splash Screen** | `splash.png` | 1152×2688 | Ladebildschirm beim App-Start |

## App Icon (`icon.png`)

**Verwendung:**
- iOS Home-Screen-Icon (wird automatisch mit abgerundeten Ecken versehen)
- Android App-Icon (Standard, nicht-adaptive)

**Design:**
- Projektor-Strahl mit 3D-Gitter/Mesh
- Farben: Dunkelblau-Hintergrund (#0b0f19) mit Cyan (#00d4ff) und Magenta (#ff006e) Akzenten
- Stil: Modern, minimalistisch, technisch

**Expo-Konfiguration** (`app.json`):
```json
"icon": "./assets/icon.png"
```

## Adaptive Icon (`adaptive-icon.png`)

**Verwendung:**
- Android 8.0+ Adaptive Icon
- Ermöglicht verschiedene Icon-Formen (rund, abgerundetes Quadrat, Squircle) je nach Gerät/Launcher

**Design:**
- Identisch zum Haupt-Icon
- Hintergrundfarbe: #0b0f19 (definiert in `app.json`)

**Expo-Konfiguration** (`app.json`):
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#0b0f19"
  }
}
```

## Splash Screen (`splash.png`)

**Verwendung:**
- Wird beim App-Start angezeigt, während JavaScript-Bundle lädt
- iOS & Android (wird automatisch skaliert)

**Design:**
- Zentriertes Logo (wie App-Icon) mit Glow-Effekt
- Text: "PROJECTION MAPPER" und "Remote"
- Hintergrund: #0b0f19
- Hochformat: 1152×2688 (wird von Expo für verschiedene Bildschirmgrößen skaliert)

**Expo-Konfiguration** (`app.json`):
```json
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#0b0f19"
}
```

## Asset-Generierung

Alle Assets wurden professionell mit KI-gestützten Design-Tools erstellt und sind produktionsreif.

Falls Assets aktualisiert werden müssen:
- **Icon:** 1024×1024 PNG, quadratisch
- **Splash:** Hochformat, mindestens 1284×2778 für iOS (Expo skaliert automatisch)

## Testen

**iOS (Simulator):**
```bash
npx expo run:ios
```

**Android (Emulator):**
```bash
npx expo run:android
```

**Expo Go (Development):**
```bash
npm run start
# QR-Code mit Expo Go App scannen
```

## Store-Builds

Für produktive EAS-Builds (App Store / Play Store) sind diese Assets vollständig konfiguriert und einsatzbereit. Siehe `../EAS_SETUP.md` für Details.
