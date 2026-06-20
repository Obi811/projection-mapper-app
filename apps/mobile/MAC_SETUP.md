# 🍎 macOS Setup für Projection Mapper Mobile App

Du bist hier gelandet, weil `npm` auf deinem Mac noch nicht installiert ist. Kein Problem, hier ist die Schritt-für-Schritt-Anleitung!

---

## ✅ Schritt 1: Node.js & npm installieren

Es gibt **drei Möglichkeiten**, Node.js/npm auf dem Mac zu installieren. Ich empfehle **Option A (Homebrew)**.

### Option A: Homebrew (empfohlen) 🍺

**Homebrew** ist der beliebteste Paketmanager für macOS.

#### 1.1 Homebrew installieren (falls noch nicht vorhanden)

Öffne **Terminal** und füge folgenden Befehl ein:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

→ Folge den Anweisungen im Terminal (Passwort eingeben, etc.)

#### 1.2 Node.js & npm mit Homebrew installieren

```bash
brew install node
```

#### 1.3 Verifizieren

```bash
node --version    # Sollte v20.x.x oder höher anzeigen
npm --version     # Sollte 10.x.x oder höher anzeigen
```

---

### Option B: Offizieller Installer

1. Gehe zu https://nodejs.org/
2. Lade die **LTS-Version** (aktuell v20.x.x) herunter
3. Öffne die `.pkg` Datei und folge dem Installer
4. Verifiziere wie oben mit `node --version` und `npm --version`

---

### Option C: nvm (Node Version Manager) - für Profis

Wenn du mehrere Node-Versionen verwalten willst:

```bash
# nvm installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Terminal neu starten, dann:
nvm install 20
nvm use 20
nvm alias default 20
```

---

## ✅ Schritt 2: Dependencies installieren

Jetzt, wo npm installiert ist, zurück in dein Projekt:

```bash
cd ~/projection-mapper-app  # oder wo auch immer du es gecloned hast

# Alle Workspace-Dependencies installieren
npm install
```

**Das dauert 2-5 Minuten** beim ersten Mal. ☕

---

## ✅ Schritt 3: EAS CLI installieren

```bash
npm install -g eas-cli
```

Verifizieren:

```bash
eas --version
# Sollte z.B. "eas-cli/20.3.0 darwin-arm64 node-v20.x.x" anzeigen
```

---

## ✅ Schritt 4: Expo Account einrichten

```bash
cd apps/mobile
eas login
```

→ Das öffnet einen Browser, wo du dich mit deinem **Expo Account** einloggen kannst.

**Nach erfolgreichem Login:**

```bash
eas whoami
# Sollte deinen Expo-Benutzernamen anzeigen
```

---

## ✅ Schritt 5: EAS-Projekt initialisieren

```bash
eas init
```

**Was passiert:**
- Erstellt eine `projectId` auf Expo's Servern
- Verknüpft das lokale Projekt mit deinem Expo Account
- Aktualisiert `app.json` mit der `projectId`

**Wichtig:** Nach `eas init` musst du die Änderung an `app.json` committen:

```bash
git add apps/mobile/app.json
git commit -m "chore: add expo project id"
git push origin main
```

---

## ✅ Schritt 6: Ersten Development Build erstellen

### Android (einfacher, kein Apple Developer Account nötig)

```bash
cd apps/mobile
eas build --platform android --profile development
```

**Was wird abgefragt:**
1. **"Would you like to automatically create a keystore?"** → Tippe `y` (Yes)
2. **"Generate a new Android Keystore?"** → Tippe `y` (Yes)

**Dauer:** ~5-10 Minuten

**Ergebnis:** Link zu einer `.apk` Datei, die du auf ein Android-Gerät laden kannst

---

### iOS (benötigt Apple Developer Account)

```bash
cd apps/mobile
eas build --platform ios --profile development
```

**Was wird abgefragt:**
1. **"What would you like your bundle identifier to be?"** → Drücke Enter (nutzt den Wert aus `app.json`: `com.obi811.projectionmapper.remote`)
2. **"Apple Account Credentials"** → Gib deine **Apple-ID** (E-Mail) ein
3. **"Password"** → Gib dein **Apple-ID-Passwort** ein (oder App-spezifisches Passwort, falls 2FA aktiv ist)
4. **"Select a team"** → Wähle dein **Developer Team** (falls du mehrere hast)
5. **"Generate a new iOS Distribution Certificate?"** → Tippe `y` (Yes)
6. **"Generate a new iOS Provisioning Profile?"** → Tippe `y` (Yes)

**Dauer:** ~10-15 Minuten

**Ergebnis:** Link zu einer `.ipa` Datei oder direkter **TestFlight**-Upload

---

## ✅ Schritt 7: App testen

### Android

1. **Download** die `.apk` vom Build-Link (in deinem Terminal angezeigt)
2. **Sende** die Datei an dein Android-Gerät (z.B. via AirDrop, Google Drive, Email)
3. **Installiere** die APK (du musst "Apps aus unbekannten Quellen" kurz erlauben)
4. **Starte** die Expo Dev Server auf deinem Mac:
   ```bash
   cd ~/projection-mapper-app/apps/mobile
   npm run start
   ```
5. **Scanne** den QR-Code in der App

### iOS

1. **Falls TestFlight-Upload:** Öffne die **TestFlight-App** auf deinem iPhone → die App sollte dort erscheinen
2. **Falls .ipa Download:** Du brauchst **Xcode** oder **Apple Configurator** zum Installieren (kompliziert) → TestFlight ist einfacher!
3. **Starte** die App
4. **Scanne** den QR-Code vom Dev Server (siehe Android, Schritt 4)

---

## 🎯 Schritt 8: Lokale Entwicklung starten

**Desktop-App starten:**

```bash
cd ~/projection-mapper-app
npm run dev:desktop
```

→ Öffnet die Electron-App im Dev-Modus

**Mobile-App Dev-Server starten:**

```bash
npm run dev:mobile
```

→ Startet den Expo Dev-Server, zeigt QR-Code

**Tests ausführen:**

```bash
npm test           # Alle Tests
npm run lint       # Linter
npm run typecheck  # TypeScript-Checks
```

---

## 🐛 Häufige Probleme

### "command not found: npm" nach Node.js-Installation

→ Terminal **komplett schließen und neu öffnen** (oder `source ~/.zshrc` ausführen)

### "Permission denied" bei `npm install -g`

→ Verwende `sudo npm install -g eas-cli` (nicht ideal, aber funktioniert)

**Bessere Lösung:** npm-Prefix ändern:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

Dann erneut: `npm install -g eas-cli`

### "eas: command not found" nach Installation

→ Terminal neu starten oder `source ~/.zshrc` ausführen

### Build bleibt bei "Waiting in queue" hängen

→ **Normal!** Kostenlose Expo-Accounts haben limitierte Build-Kapazität. Warte 5-30 Minuten.

### "This app requires a development build" beim Testen

→ Du kannst **nicht Expo Go** verwenden! Die App nutzt native Dependencies (`expo-camera`). Du brauchst den Development Build (`.apk` oder `.ipa`).

### Apple 2FA / App-spezifisches Passwort

Falls du **2-Faktor-Authentifizierung** für deine Apple-ID aktiviert hast:

1. Gehe zu https://appleid.apple.com
2. **App-spezifische Passwörter** → **Generieren**
3. Name: "EAS Build"
4. **Nutze dieses generierte Passwort** statt deines normalen Passworts

---

## 📋 Zusammenfassung: Was du jetzt hast

✅ Node.js & npm installiert
✅ Projekt gecloned & Dependencies installiert
✅ EAS CLI installiert
✅ Expo Account verbunden
✅ EAS-Projekt initialisiert
✅ (Optional) Ersten Development Build erstellt

---

## 🎓 Nächste Schritte

1. **Icons & Splash-Screens sind bereits fertig!** ✅
2. **Development Builds erstellen** (siehe Schritt 6)
3. **Lokale Entwicklung** (siehe Schritt 8)
4. **Production Builds für App Store / Play Store** (siehe [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) Schritt 7-8)

---

## 🔗 Hilfreiche Links

- **Node.js Download:** https://nodejs.org/
- **Homebrew:** https://brew.sh/
- **Expo Docs:** https://docs.expo.dev/
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Apple Developer:** https://developer.apple.com/
- **Google Play Console:** https://play.google.com/console

---

**Viel Erfolg! 🚀**

Bei Problemen: Schreib mir einfach die Fehlermeldung!
