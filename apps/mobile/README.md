# @projection-mapper/mobile

Mobile Companion-App für **Projection Mapper** – gebaut mit [Expo](https://expo.dev) (React Native, SDK 51).

Die App hat zwei Betriebsarten:

1. **Remote-Control** 📱 – verbindet sich per WebSocket mit dem Remote-Control-Server der Desktop-App (Feature 5) und steuert Wiedergabe, Szenen/Cues und Blackout aus der Ferne. Pairing erfolgt bequem per QR-Code oder manueller Eingabe von Host/Port/Token.
2. **Standalone** 🎛️ – ein eigenständiges Offline-Cue-Board, das auch ohne Desktop-Verbindung funktioniert.

Login, Rollen (`UserRole`) und Lizenz-Status werden über denselben Lizenz-Server wie die Desktop-App bezogen (`https://licensing.obitron.de`). Ein **Gast-Modus** erlaubt die Nutzung ohne Account.

Gemeinsame Typen und das Remote-Protokoll stammen aus dem Workspace-Paket [`@projection-mapper/shared`](../../packages/shared).

---

## Voraussetzungen

- Node.js 20+
- Die App wird aus dem **Monorepo-Root** installiert (npm workspaces):
  ```bash
  # im Repo-Root
  npm install
  ```
- Für die Ausführung auf einem echten Gerät: die **Expo Go**-App
  ([iOS](https://apps.apple.com/app/expo-go/id982107779) /
  [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).
- Für native Builds / App-Store-Auslieferung: ein **Expo-Account** und die
  [EAS CLI](https://docs.expo.dev/eas/) (`npm i -g eas-cli`) sowie ein
  **Apple Developer Account** (für iOS/TestFlight).

---

## Entwicklung starten

Vom Repo-Root:

```bash
npm run dev:mobile
```

oder direkt im Paket:

```bash
cd apps/mobile
npm run start
```

Das startet den Expo Dev-Server. Anschließend:

- **QR-Code** mit der Kamera (iOS) bzw. der Expo-Go-App (Android) scannen, oder
- `i` für den iOS-Simulator / `a` für den Android-Emulator drücken.

> Hinweis: Wichtig ist, dass sich Telefon und Rechner im **gleichen WLAN**
> befinden – sowohl für den Expo-Dev-Server als auch für die Remote-Control-
> Verbindung zur Desktop-App.

### Nützliche Scripts

| Script | Zweck |
| --- | --- |
| `npm run start` | Expo Dev-Server |
| `npm run android` | Auf Android-Gerät/Emulator starten |
| `npm run ios` | Auf iOS-Simulator starten |
| `npm run typecheck` | TypeScript prüfen |
| `npm run lint` | ESLint |

---

## Mit der Desktop-App verbinden (Remote-Control)

1. In der Desktop-App den **Remote-Control-Server** starten (Tab „Remote“).
2. Dort wird ein **QR-Code** angezeigt (enthält Host, Port und Token).
3. In der Mobile-App auf **„Verbinden“ → QR scannen** gehen und den Code abscannen
   – alternativ Host/Port/Token manuell eintragen.
4. Nach erfolgreichem Pairing erscheint der Live-Status und die Steuerung ist aktiv.

Der Standard-Port ist `8765` (`REMOTE_DEFAULT_PORT` aus `@projection-mapper/shared`).

---

## Native Builds & App-Store-Auslieferung (EAS)

Die App ist vollständig für [EAS Build](https://docs.expo.dev/build/introduction/) konfiguriert.
Bundle-Identifier: `com.obi811.projectionmapper.remote`.

### Einmalige Einrichtung

```bash
# EAS CLI global installieren
npm i -g eas-cli

# Bei Expo anmelden (erstelle einen kostenlosen Account unter https://expo.dev)
eas login

# Im mobile-App-Verzeichnis
cd apps/mobile
```

Die `eas.json`-Konfiguration ist bereits vorhanden und definiert drei Build-Profile:

| Profil | Zweck | iOS | Android |
| --- | --- | --- | --- |
| **development** | Entwicklung mit Expo Dev Client | Simulator-Build | Debug APK |
| **preview** | Interne Tests (TestFlight/interne Verteilung) | Device-Build | APK |
| **production** | Store-Release | Automatische Build-Nummer | AAB für Play Store |

### Apple Developer Account konfigurieren

Für iOS-Builds benötigst du einen **Apple Developer Account** ($99/Jahr).

```bash
# Beim ersten iOS-Build fragt EAS nach deinen Credentials
eas build --platform ios --profile production

# EAS führt dich durch:
# 1. Apple ID eingeben
# 2. App-spezifisches Passwort erstellen (https://appleid.apple.com)
# 3. Team auswählen (falls mehrere)
```

EAS übernimmt automatisch:
- Erstellung und Verwaltung der Signing-Zertifikate
- Provisioning-Profile
- Push-Notification-Zertifikate

**Wichtig:** Nach dem ersten erfolgreichen Build musst du die Platzhalter-Werte in `eas.json` unter `submit.production.ios` aktualisieren:

```json
"ios": {
  "appleId": "deine-apple-id@example.com",
  "ascAppId": "1234567890",  // aus App Store Connect
  "appleTeamId": "ABCD123456"  // 10-stellige Team-ID
}
```

**App Store Connect App-ID finden:**
1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. Erstelle eine neue App (falls noch nicht vorhanden)
3. Die App-ID findest du unter „App-Informationen" → „Allgemein"

**Team-ID finden:**
```bash
# Wird nach dem ersten Build in der Konsole angezeigt, oder:
eas device:list
```

### Google Play Console konfigurieren (Android)

Für Android-Builds benötigst du ein **Google Play Console**-Konto (einmalig $25).

```bash
# Erstelle einen Service-Account in der Google Cloud Console
# 1. https://console.cloud.google.com
# 2. Projekt erstellen
# 3. APIs & Services → Credentials → Service Account erstellen
# 4. JSON-Schlüssel herunterladen
# 5. Schlüssel in apps/mobile/google-play-service-account.json speichern
```

**Wichtig:** Die Datei `google-play-service-account.json` steht bereits in `.gitignore` und wird **NICHT** ins Repository eingecheckt.

### Builds erstellen

```bash
cd apps/mobile

# --- iOS ---

# Entwicklungs-Build (für Expo Dev Client, läuft auf Simulator)
eas build --platform ios --profile development

# Preview-Build (für TestFlight / interne Tests)
eas build --platform ios --profile preview

# Produktions-Build (für App Store)
eas build --platform ios --profile production


# --- Android ---

# Debug APK (für lokale Tests)
eas build --platform android --profile development

# Preview APK (für interne Verteilung)
eas build --platform android --profile preview

# Produktions-AAB (für Google Play Store)
eas build --platform android --profile production


# --- Beide Plattformen gleichzeitig ---
eas build --platform all --profile production
```

Builds laufen in der Cloud auf EAS-Servern. Du erhältst eine URL, um den Fortschritt zu verfolgen.

### In die Stores einreichen

Nach einem erfolgreichen **production**-Build kannst du direkt aus der EAS CLI einreichen:

```bash
# iOS → App Store Connect (TestFlight oder Review)
eas submit --platform ios --latest

# Android → Google Play Console (interner Test-Track)
eas submit --platform android --latest

# Beide Plattformen
eas submit --platform all --latest
```

**iOS:** Die App wird zunächst zu TestFlight hochgeladen. Von dort kannst du sie in App Store Connect zur Review einreichen.

**Android:** Die App wird standardmäßig in den „Internal Testing"-Track hochgeladen (siehe `eas.json` → `submit.production.android.track`).

### Lokaler Build (ohne EAS)

Falls du lokal bauen möchtest (z. B. für die Entwicklung):

```bash
# iOS (benötigt macOS + Xcode)
npx expo prebuild --platform ios
npx expo run:ios

# Android (benötigt Android Studio + SDK)
npx expo prebuild --platform android
npx expo run:android
```

> **Hinweis:** Lokale Builds erfordern die vollständige native Entwicklungsumgebung (Xcode für iOS, Android Studio für Android). EAS Build ist der empfohlene Weg, da es die Umgebung in der Cloud bereitstellt.

### App-Icons und Splash-Screens

`app.json` nutzt aktuell die Standard-Icons/Splashscreens von Expo. Vor einem produktiven Store-Release solltest du eigene Assets hinterlegen:

```bash
# Icon (1024×1024 PNG, abgerundete Ecken werden automatisch hinzugefügt)
apps/mobile/assets/icon.png

# Splash-Screen (1284×2778 PNG für iOS, 1080×1920 für Android — Expo skaliert automatisch)
apps/mobile/assets/splash.png

# Adaptive Icon für Android (1024×1024 PNG, nur Vordergrund)
apps/mobile/assets/adaptive-icon.png
```

Dann in `app.json` referenzieren:

```json
"icon": "./assets/icon.png",
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#0b0f19"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#0b0f19"
  }
}
```

### Update-Strategie (Over-The-Air Updates)

Expo unterstützt OTA-Updates für JavaScript/Asset-Änderungen ohne Store-Review:

```bash
# EAS Update einrichten (optional, aber empfohlen)
eas update:configure

# Update veröffentlichen (nur JS/Assets, kein nativer Code)
eas update --branch production --message "Bugfix: Remote-Verbindung stabilisiert"
```

Dies ermöglicht schnelle Bug-Fixes ohne App-Store-Review (iOS) oder Play-Store-Upload (Android).

> **Wichtig:** Native Änderungen (z. B. neue Permissions, native Module) erfordern weiterhin einen vollständigen Store-Release.

---

## Projektstruktur

```
apps/mobile/
├── App.tsx                 # Root, Tab-Navigation + AuthGate
├── app.json                # Expo-Konfiguration
├── metro.config.js         # Monorepo-fähige Metro-Config
├── index.ts                # Entry (registerRootComponent)
└── src/
    ├── api/                # Lizenz-Server-Client (axios) + Auth
    ├── components/         # UI-Bausteine (Card, Button, …)
    ├── context/            # AuthContext, RemoteContext
    ├── remote/             # RemoteControlClient (WebSocket)
    ├── screens/            # Login, Remote, Pair, Standalone, Settings
    └── theme.ts            # Farben & Styles
```
