# Desktop App Icons

Dieses Verzeichnis enthält die Icons für die Desktop-Anwendung (macOS, Windows, Linux).

## Übersicht

**Haupt-Icon:** `icon.png` (1024×1024)
- Wird von electron-builder automatisch in plattformspezifische Formate konvertiert:
  - **macOS:** `.icns` (enthält alle benötigten Größen)
  - **Windows:** `.ico` (enthält 16, 32, 48, 64, 128, 256)
  - **Linux:** Verschiedene PNG-Größen

**Linux-spezifische Icons:** `icons/linux/`
- Vorgenerierte Größen für bessere Kontrolle über Linux-Builds
- Größen: 16×16, 32×32, 48×48, 64×64, 128×128, 256×256, 512×512

## Design

Das Icon visualisiert das Konzept des Projection Mappings:
- **Zentrale Metapher:** Stilisierter Projektor-Strahl trifft auf ein 3D-Gitter/Mesh
- **Farbschema:**
  - Hintergrund: Dunkelblau (#0b0f19) — passend zum UI-Theme
  - Projektor-Strahlen: Leuchtende Cyan/Blau-Töne (#00d4ff, #0099ff)
  - Gitter-Highlights: Neon-Pink/Magenta (#ff006e, #e100ff)
- **Stil:** Modern, minimalistisch, technisch, gut lesbar auch in kleinen Größen

## Verwendung in electron-builder

Die Icon-Konfiguration erfolgt in `package.json`:

```json
"build": {
  "icon": "build/icon.png",
  ...
}
```

electron-builder konvertiert das 1024×1024 PNG automatisch:
- **macOS:** Erstellt `.icns` mit allen Apple-Standard-Größen (16, 32, 64, 128, 256, 512, 1024)
- **Windows:** Erstellt `.ico` mit allen Windows-Standard-Größen
- **Linux:** Verwendet die PNG-Dateien aus `icons/linux/`

## Erneuerung

Falls das Icon aktualisiert werden muss:

1. Ersetze `icon.png` mit einem neuen 1024×1024 PNG (quadratisch, transparenter oder dunkler Hintergrund)
2. Regeneriere Linux-Icons:
   ```bash
   cd apps/desktop/build
   for size in 16 32 48 64 128 256 512; do
     convert icon.png -resize ${size}x${size} icons/linux/${size}x${size}.png
   done
   ```
3. Teste die Builds:
   ```bash
   npm run package:mac   # macOS
   npm run package:win   # Windows
   npm run package:linux # Linux
   ```
