# EAS Build & Submit — Schnellstart-Checkliste

Diese Checkliste führt dich Schritt für Schritt durch das Setup von EAS Build für die Mobile Companion-App.

## ✅ Voraussetzungen

- [ ] **Expo-Account erstellt** → [expo.dev/signup](https://expo.dev/signup) (kostenlos)
- [ ] **Apple Developer Account** ($99/Jahr) → [developer.apple.com](https://developer.apple.com) (nur für iOS)
- [ ] **Google Play Console Account** ($25 einmalig) → [play.google.com/console](https://play.google.com/console) (nur für Android)
- [ ] **EAS CLI installiert**: `npm i -g eas-cli`

---

## 📱 iOS Setup (App Store / TestFlight)

### 1. EAS Login & Projekt-Linking

```bash
cd apps/mobile
eas login
eas build:configure  # bestätigt vorhandene eas.json
```

### 2. Erster Build (konfiguriert automatisch Credentials)

```bash
eas build --platform ios --profile production
```

EAS fragt nach:
- **Apple ID** (dein Apple Developer Account)
- **App-spezifisches Passwort** → [appleid.apple.com](https://appleid.apple.com) → „Sicherheit" → „App-spezifische Passwörter"
- **Team** (falls mehrere Teams vorhanden)

EAS erstellt automatisch:
- Distribution-Zertifikat
- Provisioning-Profile
- Push-Notification-Zertifikat

### 3. App in App Store Connect erstellen

1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. **Meine Apps** → **+** → **Neue App**
3. Plattform: **iOS**
4. Name: **Projection Mapper Remote**
5. Bundle-ID: **com.obi811.projectionmapper.remote** (aus Dropdown wählen — wird nach dem ersten Build verfügbar sein)
6. SKU: `projection-mapper-remote` (beliebig, aber eindeutig)

### 4. Submit-Konfiguration vervollständigen

Nach dem ersten erfolgreichen Build aktualisiere `eas.json` → `submit.production.ios`:

```json
"ios": {
  "appleId": "deine-apple-id@example.com",      // deine Apple-ID
  "ascAppId": "1234567890",                      // aus App Store Connect → App → App-Informationen → Apple-ID
  "appleTeamId": "ABCD123456"                    // 10-stellige Team-ID (wird nach dem Build angezeigt)
}
```

**Team-ID finden:**
```bash
eas device:list  # zeigt Team-ID an
```
oder in [developer.apple.com](https://developer.apple.com) → Account → Membership

### 5. Build & Submit

```bash
# Build erstellen
eas build --platform ios --profile production

# Zu TestFlight hochladen (nach erfolgreichem Build)
eas submit --platform ios --latest

# Optional: direkt in einem Kommando
eas build --platform ios --profile production --auto-submit
```

### 6. TestFlight & App Store Review

1. **TestFlight**: In App Store Connect → **TestFlight** → interne/externe Tester einladen
2. **App Store**: Wenn TestFlight-Tests erfolgreich → **App Store** → **Zur Überprüfung einreichen**

---

## 🤖 Android Setup (Google Play Store)

### 1. Google Cloud Service Account erstellen

```bash
# 1. Gehe zu https://console.cloud.google.com
# 2. Projekt erstellen: "Projection Mapper Mobile"
# 3. Hamburger-Menü → APIs & Services → Credentials
# 4. Create Credentials → Service Account
#    - Name: "projection-mapper-eas-upload"
#    - Role: "Service Account User" (zunächst minimal, später erweitern)
# 5. Service Account öffnen → Keys → Add Key → Create New Key → JSON
# 6. JSON-Datei herunterladen
```

### 2. Service Account in Play Console verknüpfen

```bash
# 1. https://play.google.com/console
# 2. Hamburger-Menü → Setup → API-Zugriff
# 3. "Service-Konten verknüpfen" → existierendes Projekt verknüpfen
# 4. Service Account auswählen → Zugriff gewähren
# 5. Berechtigungen: "Releases verwalten" + "App-Inhalte bearbeiten"
```

### 3. JSON-Key hinterlegen

```bash
cd apps/mobile
# Heruntergeladene JSON-Datei hierhin kopieren:
cp ~/Downloads/projection-mapper-xyz-abc123.json ./google-play-service-account.json

# Prüfen ob in .gitignore (sollte bereits drin sein)
cat .gitignore | grep google-play
```

### 4. App in Play Console erstellen

```bash
# 1. https://play.google.com/console → Alle Apps → App erstellen
# 2. App-Name: "Projection Mapper Remote"
# 3. Standardsprache: Deutsch
# 4. App/Spiel: App
# 5. Kostenlos/kostenpflichtig: je nach Geschäftsmodell
# 6. Folge dem Einrichtungsassistenten (Privacy Policy, Kategorie, etc.)
```

### 5. Erster Build & Upload

```bash
# Build erstellen (AAB für Play Store)
eas build --platform android --profile production

# Hochladen (landet im "Internal Testing"-Track)
eas submit --platform android --latest

# Optional: direkt in einem Kommando
eas build --platform android --profile production --auto-submit
```

### 6. Release in Play Console

```bash
# 1. Play Console → Release → Testing → Interner Test
# 2. Neues Release erstellen (der Build sollte bereits da sein)
# 3. Release-Hinweise hinzufügen
# 4. Überprüfen → Release starten

# Dann: Tester hinzufügen oder zu anderen Tracks befördern
# - Geschlossener Test (Closed Testing) → größere Testergruppe
# - Offener Test (Open Testing) → öffentliche Beta
# - Produktion → Live im Play Store
```

---

## 🎨 Assets vor Store-Release hinzufügen

**Pflicht vor Produktiv-Release:**

```bash
# 1024×1024 PNG
apps/mobile/assets/icon.png

# 1284×2778 PNG (hochauflösend, Expo skaliert automatisch)
apps/mobile/assets/splash.png

# 1024×1024 PNG (Android adaptive icon — nur Vordergrund)
apps/mobile/assets/adaptive-icon.png
```

Dann in `apps/mobile/app.json` referenzieren (siehe Hauptdoku).

---

## 🚀 Typischer Workflow nach Setup

```bash
cd apps/mobile

# Code-Änderungen gemacht → neue Version erstellen

# Development/Testing
eas build --platform ios --profile preview      # TestFlight
eas build --platform android --profile preview  # APK für interne Verteilung

# Production Release (beide Plattformen)
eas build --platform all --profile production --auto-submit

# Over-The-Air Update (nur JS/Assets, keine native Änderungen)
eas update --branch production --message "Bugfix: Verbindungsstabilität"
```

---

## 🔍 Troubleshooting

### iOS: "No valid code signing identity"
→ Lösche alte Credentials: `eas credentials --platform ios`, dann neuen Build

### iOS: "App ID not found in App Store Connect"
→ Erstelle die App manuell in App Store Connect (siehe Schritt 3 oben)

### Android: "Service account key invalid"
→ Prüfe Berechtigungen in Play Console → API-Zugriff → Service-Konto

### Build schlägt fehl: "Out of memory"
→ Normale Builds haben 12 GB RAM; für größere Apps: EAS Paid Plan mit Priority Builds

### Submit schlägt fehl (iOS): "Missing compliance"
→ In App Store Connect → App → Export Compliance manuell setzen

---

## 📚 Nützliche Links

- [EAS Build Dokumentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Dokumentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Expo Dashboard](https://expo.dev)
- [Apple Developer Portal](https://developer.apple.com)
- [Google Cloud Console](https://console.cloud.google.com)

---

## 💡 Tipps

- **Automatisierung**: Nutze `--auto-submit` um Build + Submit in einem Schritt zu machen
- **Build-Logs**: Jeder Build hat eine URL → verfolge Fortschritt in Echtzeit
- **Credentials**: EAS speichert alle Credentials sicher in der Cloud, kein lokales Keychain-Management nötig
- **Versionierung**: `eas.json` → `production` → `autoIncrement: true` bumpt die Build-Nummer automatisch
- **OTA-Updates**: Für schnelle Bug-Fixes ohne Store-Review (nur für JS/Asset-Änderungen)
