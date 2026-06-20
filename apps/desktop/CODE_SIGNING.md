# Code Signing & Notarization für macOS

## 🚨 Aktueller Status

Die macOS-App ist **NICHT code-signiert**. Das bedeutet:

- ✅ Die App funktioniert, wenn man das Quarantine-Attribut entfernt oder per Rechtsklick → Öffnen startet
- ❌ Beim Doppelklick erscheint: "Projection Mapper.app ist beschädigt"
- ❌ Die App kann nicht im Mac App Store veröffentlicht werden
- ❌ Gatekeeper warnt Nutzer vor der App

## 🔧 Sofortlösung für Nutzer (ohne Code Signing)

### Methode 1: Rechtsklick → Öffnen

1. **Rechtsklick** auf `Projection Mapper.app`
2. Wähle **"Öffnen"** (nicht Doppelklick!)
3. Im Dialog → **"Öffnen"** bestätigen
4. Ab jetzt funktioniert auch Doppelklick

### Methode 2: Quarantine-Attribut entfernen (Terminal)

```bash
# Nach dem Download der .dmg
sudo xattr -cr "/Applications/Projection Mapper.app"
```

---

## 🍎 Langfristige Lösung: Apple Developer Code Signing

Um eine professionell signierte und notarisierte App zu erstellen, benötigst du:

1. **Apple Developer Account** ($99/Jahr)
2. **Developer ID Application Certificate**
3. **App-spezifisches Passwort** für Notarization

---

## 📋 Schritt-für-Schritt: Code Signing einrichten

### Schritt 1: Apple Developer Account

1. Gehe zu https://developer.apple.com/programs/
2. Melde dich mit deiner Apple-ID an
3. **Enroll** in das Apple Developer Program ($99/Jahr)
4. Warte auf Bestätigung (~24h)

---

### Schritt 2: Developer ID Certificate erstellen

#### 2.1 Certificate Signing Request (CSR) erstellen

1. Öffne **Schlüsselbundverwaltung** (Keychain Access)
2. Menü: **Schlüsselbundverwaltung** → **Zertifikatsassistent** → **Zertifikat einer Zertifizierungsinstanz anfordern...**
3. Eingabe:
   - **E-Mail-Adresse:** Deine Apple-ID
   - **Name:** Dein Name oder Firmenname
   - **CA-E-Mail:** Leer lassen
   - **Anfrage:** "Auf der Festplatte sichern"
4. **Speichern** → `CertificateSigningRequest.certSigningRequest`

#### 2.2 Certificate in Apple Developer Portal erstellen

1. Gehe zu https://developer.apple.com/account/resources/certificates/list
2. Klicke **"+"** (Add Certificate)
3. Wähle **"Developer ID Application"** (nicht "Mac App Distribution"!)
4. **Continue**
5. **Upload** die CSR-Datei
6. **Download** das Certificate (`.cer` Datei)

#### 2.3 Certificate installieren

1. **Doppelklick** auf die `.cer` Datei
2. Certificate wird in **Schlüsselbundverwaltung** importiert
3. Verifiziere: Du solltest jetzt ein Certificate mit Namen wie "Developer ID Application: Dein Name (TEAM_ID)" sehen

---

### Schritt 3: App-spezifisches Passwort für Notarization

1. Gehe zu https://appleid.apple.com/account/manage
2. **App-spezifische Passwörter** → **Generieren**
3. **Label:** "Projection Mapper Notarization"
4. **Passwort kopieren** (wird nur einmal angezeigt!)

---

### Schritt 4: Credentials in Code konfigurieren

#### 4.1 Lokale Entwicklung (auf deinem Mac)

Erstelle eine Datei `apps/desktop/.env.local` (wird NICHT committet):

```bash
# Apple Developer Credentials für Code Signing
APPLE_ID="deine-apple-id@example.com"
APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-spezifisches Passwort
APPLE_TEAM_ID="XXXXXXXXXX"  # Deine Team-ID (10 Zeichen)

# Optional: Certificate Common Name (falls mehrere Certificates)
# CSC_NAME="Developer ID Application: Dein Name (TEAM_ID)"
```

**Team-ID finden:**
- https://developer.apple.com/account → **Membership** → **Team ID**

#### 4.2 GitHub Actions (CI/CD)

Füge die Credentials als **GitHub Secrets** hinzu:

1. Gehe zu deinem GitHub Repo → **Settings** → **Secrets and variables** → **Actions**
2. Klicke **"New repository secret"** für jedes:
   - `APPLE_ID`: Deine Apple-ID E-Mail
   - `APPLE_APP_SPECIFIC_PASSWORD`: App-spezifisches Passwort
   - `APPLE_TEAM_ID`: Deine Team-ID

**Certificate als Base64:**

```bash
# Certificate exportieren (mit privatem Schlüssel)
# In Schlüsselbundverwaltung:
# - Rechtsklick auf "Developer ID Application" Certificate
# - "Exportieren" → Dateiformat: ".p12"
# - Passwort setzen (z.B. "temp123")
# - Speichern als DeveloperID.p12

# Base64-codieren
base64 -i DeveloperID.p12 | pbcopy

# Füge in GitHub Secrets ein:
# CSC_LINK: <Base64-String>
# CSC_KEY_PASSWORD: temp123
```

---

### Schritt 5: `package.json` aktualisieren

Ersetze die `mac`-Konfiguration in `apps/desktop/package.json`:

```json
"mac": {
  "category": "public.app-category.graphics-design",
  "target": [
    "dmg",
    "zip"
  ],
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist",
  "notarize": {
    "teamId": "${APPLE_TEAM_ID}"
  },
  "extendInfo": {
    "NSCameraUsageDescription": "Projection Mapper benötigt keinen Kamerazugriff.",
    "NSMicrophoneUsageDescription": "Projection Mapper kann Audio für die Audio-Synchronisierung verwenden.",
    "LSMinimumSystemVersion": "10.15.0"
  }
}
```

**Wichtige Änderungen:**
- `"identity": null` → **ENTFERNEN** (nutzt automatisch das Certificate aus dem Keychain)
- `"hardenedRuntime": false` → `true` (notwendig für Notarization)
- `"notarize"` Block hinzufügen

---

### Schritt 6: `.env.local` in `.gitignore` sicherstellen

Die Datei `apps/desktop/.env.local` sollte **NIE** committet werden!

Prüfe `.gitignore`:

```bash
# Prüfen
grep -r "\.env\.local" .gitignore

# Falls nicht vorhanden, hinzufügen:
echo ".env.local" >> apps/desktop/.gitignore
```

---

### Schritt 7: Build testen

**Lokal (auf deinem Mac):**

```bash
cd apps/desktop

# Mit Signing & Notarization (falls Credentials gesetzt)
npm run package:mac
```

**GitHub Actions (automatisch bei `feat:`-Commit):**

```bash
git commit -m "feat: enable code signing for macOS"
git push origin main
```

→ Auto-Release erstellt signierte & notarisierte Binaries

---

## 🔍 Verifizierung

### Signatur prüfen

```bash
# App-Signatur prüfen
codesign -dv --verbose=4 "/Applications/Projection Mapper.app"

# Sollte zeigen:
# Authority=Developer ID Application: Dein Name (TEAM_ID)
# Signature=adhoc  (falls NICHT signiert)
```

### Notarization prüfen

```bash
# Notarization-Status prüfen
spctl -a -vvv -t install "/Applications/Projection Mapper.app"

# Erfolgreich, wenn:
# "Projection Mapper.app: accepted"
# "source=Notarized Developer ID"
```

### Gatekeeper-Test

1. **Quarantine simulieren:**
   ```bash
   xattr -w com.apple.quarantine "0081;$(date +%s);Safari" "/Applications/Projection Mapper.app"
   ```

2. **Doppelklick** auf die App

   - ✅ **Signiert & Notarisiert:** App öffnet sich ohne Warnung
   - ❌ **Nicht signiert:** "beschädigt"-Warnung

---

## 📊 Kosten & Aufwand

| Schritt | Kosten | Zeit | Häufigkeit |
|---------|--------|------|-----------|
| Apple Developer Account | $99/Jahr | 24h Wartezeit | Jährlich |
| Certificate erstellen | Kostenlos | 15 Min | Einmalig (1 Jahr gültig) |
| App-spezifisches Passwort | Kostenlos | 2 Min | Einmalig |
| GitHub Secrets einrichten | Kostenlos | 10 Min | Einmalig |
| Code-Änderung | Kostenlos | 5 Min | Einmalig |

**Gesamt:** $99/Jahr + ~1 Stunde Einrichtung

---

## ⚠️ Häufige Probleme

### "No identity found" bei `npm run package:mac`

→ Certificate nicht korrekt installiert. Prüfe in Schlüsselbundverwaltung.

### "notarytool failed" bei Notarization

→ App-spezifisches Passwort falsch oder abgelaufen. Neu generieren.

### "Gatekeeper blocked" trotz Signierung

→ App wurde nicht notarisiert. Prüfe `notarize`-Konfiguration in `package.json`.

### Build in GitHub Actions schlägt fehl

→ Secrets `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, etc. nicht gesetzt oder falsch.

---

## 🔗 Weiterführende Links

- **Apple Developer Program:** https://developer.apple.com/programs/
- **Notarization Guide:** https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution
- **electron-builder Code Signing:** https://www.electron.build/code-signing
- **electron-notarize:** https://github.com/electron/notarize

---

## 🎯 Zusammenfassung

**Aktuell (v0.16.0):**
- ❌ Nicht signiert
- ❌ Nicht notarisiert
- ⚠️ Nutzer müssen Rechtsklick → Öffnen verwenden

**Mit Apple Developer Account:**
- ✅ Signiert mit Developer ID
- ✅ Notarisiert von Apple
- ✅ Doppelklick funktioniert ohne Warnung
- ✅ Bereit für Distribution außerhalb des App Stores

**Für App Store:**
- Zusätzlich benötigt: **Mac App Distribution Certificate**
- Unterschiedliche Entitlements & Sandboxing
- App Store Review-Prozess

---

**Status:** 🔴 Code Signing deaktiviert (Gatekeeper-Warnungen)
**Nächster Schritt:** Apple Developer Account ($99/Jahr) + Certificate erstellen
