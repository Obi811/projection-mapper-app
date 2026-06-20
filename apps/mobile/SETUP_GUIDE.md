# 📱 Mobile App Setup Guide - Schritt für Schritt

Diese Anleitung führt dich durch die komplette Einrichtung der Mobile-App mit deinem Expo Account.

## ✅ Voraussetzungen

- [x] Expo Account erstellt (https://expo.dev)
- [ ] Apple Developer Account (für iOS-Builds) - $99/Jahr
- [ ] Google Play Console Account (für Android-Builds) - einmalig $25

---

## 🔐 Schritt 1: Expo Account Login

### Option A: Browser-basierter Login (empfohlen)

```bash
cd apps/mobile
eas login
```

Das öffnet einen Browser, wo du dich mit deinem Expo Account einloggen kannst.

### Option B: Terminal-Login

```bash
cd apps/mobile
eas login --username DEIN_EXPO_USERNAME --password
# Passwort wird interaktiv abgefragt
```

### Verifizierung

```bash
eas whoami
# Sollte deinen Expo-Benutzernamen anzeigen
```

---

## 🚀 Schritt 2: EAS-Projekt initialisieren

```bash
cd apps/mobile
eas init
```

**Was passiert:**
- Erstellt eine neue Projekt-ID auf Expo's Servern
- Verknüpft das lokale Projekt mit deinem Expo Account
- Aktualisiert `app.json` mit der `projectId`

**Wichtig:** Die `projectId` wird automatisch in `app.json` eingetragen. Commit diese Änderung später.

---

## 📦 Schritt 3: Erste Development Builds

Development Builds sind Custom-Builds mit deinen nativen Dependencies (z.B. `expo-camera`). Du brauchst sie, um die App mit allen Features zu testen.

### Android Development Build

```bash
cd apps/mobile
eas build --platform android --profile development
```

**Was wird abgefragt:**
1. **"Would you like to automatically create a keystore?"** → `Yes`
2. **"Generate a new Android Keystore?"** → `Yes`

**Dauer:** ~5-10 Minuten (erste Build)

**Ergebnis:** Ein `.apk` Download-Link wird angezeigt

### iOS Development Build (benötigt Apple Developer Account)

```bash
cd apps/mobile
eas build --platform ios --profile development
```

**Was wird abgefragt:**
1. **"What would you like your bundle identifier to be?"** → Bestätige `com.obi811.projectionmapper.remote` (bereits in app.json konfiguriert)
2. **"Apple Account Credentials"** → Gib deine Apple-ID ein
3. **"Select a team"** → Wähle dein Developer Team
4. **"Generate a new iOS Distribution Certificate?"** → `Yes`
5. **"Generate a new iOS Provisioning Profile?"** → `Yes`

**Dauer:** ~10-15 Minuten (erste Build)

**Ergebnis:** Ein `.ipa` Download-Link oder direkter TestFlight-Upload

---

## 🍎 Schritt 4: Apple Developer Account einrichten (für iOS)

### 4.1 App Store Connect API Key (empfohlen für CI/CD)

1. Gehe zu https://appstoreconnect.apple.com/access/api
2. Klicke "Keys" → "Generate API Key"
3. **Name:** "EAS Build for Projection Mapper"
4. **Access:** "App Manager"
5. **Download** die `.p8` Datei (nur einmal möglich!)
6. Notiere: **Issuer ID**, **Key ID**

### 4.2 API Key in EAS konfigurieren

```bash
cd apps/mobile
eas credentials
# Wähle: "iOS" → "App Store Connect API Key" → "Add a new key"
# Upload die .p8 Datei, gib Issuer ID und Key ID ein
```

**Vorteil:** Keine Passwort-Eingabe mehr bei jedem Build!

---

## 🤖 Schritt 5: Google Play Console einrichten (für Android)

### 5.1 Google Play Console Account erstellen

1. Gehe zu https://play.google.com/console
2. Erstelle einen Developer Account (einmalig $25)
3. Stimme den Nutzungsbedingungen zu

### 5.2 Service Account für automatisierte Builds

1. Gehe zu **Google Cloud Console**: https://console.cloud.google.com
2. Erstelle ein neues Projekt: "Projection Mapper Mobile"
3. Aktiviere die **Google Play Android Developer API**
4. **IAM & Admin** → **Service Accounts** → **Create Service Account**
   - **Name:** "eas-build-projection-mapper"
   - **Role:** "Service Account User"
5. **Keys** → **Add Key** → **Create New Key** → **JSON**
6. Download die `.json` Datei

### 5.3 Service Account in Play Console verknüpfen

1. Zurück zu **Play Console** → **Setup** → **API access**
2. **Link** das Google Cloud-Projekt
3. **Grant access** für den Service Account
4. **Permissions:** "Admin (all permissions)"

### 5.4 Service Account in EAS hochladen

```bash
cd apps/mobile

# Service Account JSON speichern (NICHT committen!)
# Datei speichern als: google-play-service-account.json

# In EAS hochladen
eas credentials
# Wähle: "Android" → "Google Service Account" → "Add a new key"
# Upload google-play-service-account.json
```

---

## 🧪 Schritt 6: Development Builds testen

### Android

1. **Download** die `.apk` vom EAS Build-Link
2. **Installiere** auf einem physischen Android-Gerät (oder Emulator)
3. **Starte** die App
4. Scanne den QR-Code aus dem Terminal:
   ```bash
   npm run dev:mobile
   # oder
   npm run start -w @projection-mapper/mobile
   ```

### iOS

1. **Download** die `.ipa` oder installiere via **TestFlight**
2. **Installiere** auf einem physischen iOS-Gerät (Simulator nicht für Development Builds)
3. **Starte** die App
4. Scanne den QR-Code aus dem Terminal

---

## 🏗️ Schritt 7: Production Builds (für App Store / Play Store)

**Nur wenn du die App veröffentlichen willst!**

### Android Production Build

```bash
cd apps/mobile
eas build --platform android --profile production
```

**Ergebnis:** `.aab` (Android App Bundle) für Play Store

### iOS Production Build

```bash
cd apps/mobile
eas build --platform ios --profile production
```

**Ergebnis:** `.ipa` für App Store

---

## 📤 Schritt 8: Apps in die Stores hochladen

### Android → Google Play Console

```bash
cd apps/mobile
eas submit --platform android --profile production
```

**Was wird abgefragt:**
- Wähle die `.aab` Datei vom letzten Production Build
- EAS lädt sie automatisch in den Play Console hoch

**Danach:** Gehe zu Play Console → erstelle Release → füge Store-Listing hinzu

### iOS → App Store Connect

```bash
cd apps/mobile
eas submit --platform ios --profile production
```

**Was wird abgefragt:**
- Wähle die `.ipa` Datei vom letzten Production Build
- EAS lädt sie automatisch zu TestFlight/App Store hoch

**Danach:** Gehe zu App Store Connect → erstelle Release → füge App-Informationen hinzu

---

## 🔄 Schritt 9: Over-The-Air (OTA) Updates

OTA-Updates ermöglichen JavaScript/React-Änderungen ohne neuen Store-Build!

### Update veröffentlichen

```bash
cd apps/mobile
eas update --branch production --message "Fix login bug"
```

**Wichtig:**
- ✅ Funktioniert für: JavaScript, React-Komponenten, Styles
- ❌ Funktioniert NICHT für: Native Code, neue Dependencies, app.json-Änderungen

---

## 📋 Checkliste für erste Veröffentlichung

### Vor dem ersten Build

- [ ] Icons & Splash-Screens erstellt (✅ bereits erledigt!)
- [ ] `app.json` vollständig ausgefüllt (Name, Beschreibung, Version)
- [ ] Bundle Identifiers konfiguriert
- [ ] Privacy Policy URL (falls nötig)

### App Store (iOS)

- [ ] Apple Developer Account aktiv ($99/Jahr)
- [ ] App Store Connect API Key konfiguriert
- [ ] App-Screenshots (verschiedene Geräte-Größen)
- [ ] App-Beschreibung & Keywords
- [ ] Support-URL & Marketing-URL
- [ ] Privacy Policy URL
- [ ] Altersbeschränkung festgelegt

### Play Store (Android)

- [ ] Google Play Console Account ($25 einmalig)
- [ ] Service Account konfiguriert
- [ ] App-Screenshots (Phone & Tablet)
- [ ] Feature Graphic (1024×500)
- [ ] App-Beschreibung (kurz & lang)
- [ ] Kategorien & Tags
- [ ] Datenschutzerklärung URL
- [ ] Content-Rating-Fragebogen ausgefüllt

---

## 🆘 Troubleshooting

### "Authentication failed" beim `eas login`

```bash
# Logout und erneut einloggen
eas logout
eas login
```

### "No bundle identifier specified"

→ Prüfe `app.json`:
```json
"ios": {
  "bundleIdentifier": "com.obi811.projectionmapper.remote"
}
```

### "Android build failed: Missing keystore"

```bash
# Keystore neu generieren lassen
eas build --platform android --profile development --clear-credentials
```

### "iOS build failed: No provisioning profile"

```bash
# Credentials neu konfigurieren
eas credentials
# Wähle iOS → Provisioning Profile → Add/regenerate
```

### Build bleibt bei "Waiting in queue" hängen

→ Normal! Freie Expo-Accounts haben limitierte Build-Kapazität. Warte ~5-30 Minuten.

### "This app requires a development build"

→ Du hast native Dependencies (expo-camera). Du brauchst einen Development Build, Expo Go reicht nicht.

---

## 🔗 Nützliche Links

- **EAS Build Dashboard:** https://expo.dev/accounts/[DEIN_USERNAME]/projects/projection-mapper-remote/builds
- **Expo Docs:** https://docs.expo.dev/build/introduction/
- **App Store Connect:** https://appstoreconnect.apple.com
- **Google Play Console:** https://play.google.com/console
- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/

---

## 💡 Tipps

1. **Erste Builds dauern länger** (~10-20 Min), spätere Builds sind schneller (~5-8 Min)
2. **Development Builds nur einmal pro Monat** nötig, dann OTA-Updates für Code-Änderungen
3. **TestFlight (iOS) nutzen** für Beta-Testing vor Store-Release
4. **Internal Testing (Android)** für schnelles Testing ohne Review
5. **Versionsnummern synchron halten** zwischen `app.json` und Root `package.json`

---

**Status:** ✅ Icons erstellt | 🔲 EAS konfiguriert | 🔲 Erste Builds | 🔲 Store-Veröffentlichung
