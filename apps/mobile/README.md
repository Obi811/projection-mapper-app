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

Die App ist für [EAS Build](https://docs.expo.dev/build/introduction/) vorbereitet.
Bundle-Identifier: `com.obi811.projectionmapper.remote`.

```bash
# einmalig
npm i -g eas-cli
eas login

# Projekt konfigurieren (legt eas.json an, falls noch nicht vorhanden)
cd apps/mobile
eas build:configure

# iOS-Build für TestFlight / App Store
eas build --platform ios --profile production

# Android-Build (AAB für den Play Store)
eas build --platform android --profile production

# In den Stores einreichen
eas submit --platform ios
eas submit --platform android
```

Für iOS-Builds wird der **Apple Developer Account** benötigt; EAS übernimmt die
Verwaltung der Signing-Zertifikate und Provisioning-Profile.

> **Assets:** `app.json` nutzt aktuell die Standard-Icons/Splashscreens von Expo.
> Vor einem produktiven Store-Release sollten echte App-Icon- und Splash-Assets
> unter `apps/mobile/assets/` hinterlegt und in `app.json` referenziert werden.

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
