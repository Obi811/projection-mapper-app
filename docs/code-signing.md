# Code-Signing & Notarisierung (macOS)

Dieses Dokument beschreibt, wie **Projection Mapper** für macOS signiert und
notarisiert wird – sowohl lokal (Ad-hoc für die Entwicklung) als auch in der
CI/CD-Pipeline (GitHub Actions) mit einem Apple Developer ID-Zertifikat.

> 📌 **Kurzfassung:** Ohne hinterlegte Apple-Anmeldedaten baut die App weiterhin
> erfolgreich, ist aber **nicht** notarisiert. Endnutzer müssen dann einmalig
> `xattr -cr` ausführen – siehe [`macos-installation.md`](./macos-installation.md).

---

## 1. Was ist bereits vorbereitet?

| Bestandteil | Datei | Zweck |
|-------------|-------|-------|
| Hardened Runtime | `package.json` → `build.mac.hardenedRuntime: true` | Pflicht für Notarisierung |
| Entitlements | `build/entitlements.mac.plist` | JIT/Speicher-Rechte für Electron/V8 |
| Notarisierungs-Hook | `build/notarize.js` (`afterSign`) | Lädt App nach dem Signieren bei Apple hoch |
| Gatekeeper-Bewertung | `build.mac.gatekeeperAssess: false` | Verhindert lokale Gatekeeper-Prüfung beim Build |

Der Notarisierungs-Hook läuft **nur**, wenn die Umgebungsvariablen `APPLE_ID`,
`APPLE_APP_SPECIFIC_PASSWORD` und `APPLE_TEAM_ID` gesetzt sind. Andernfalls wird
er ohne Fehler übersprungen.

---

## 2. Lokale Entwicklung (Ad-hoc-Signatur)

Für lokale Builds ohne Apple-Konto wird die App **ad-hoc** signiert
(electron-builder erledigt das automatisch, wenn kein Zertifikat gefunden wird).
Das reicht zum lokalen Testen aus:

```bash
# Ohne Signatur-Identität bauen (Ad-hoc)
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run package:mac
```

Die fertige App liegt anschließend unter `release/`. Beim ersten Start auf einem
anderen Mac ist ggf. `xattr -cr` nötig.

---

## 3. Produktiv-Signatur & Notarisierung

Voraussetzungen:

1. **Apple Developer Program**-Mitgliedschaft (kostenpflichtig, 99 USD/Jahr).
2. Ein **„Developer ID Application"**-Zertifikat, exportiert als `.p12`-Datei.
3. Ein **app-spezifisches Passwort** (erstellt unter <https://appleid.apple.com> → „Anmeldung & Sicherheit").
4. Die **Team-ID** (sichtbar im [Apple Developer Portal](https://developer.apple.com/account) → „Membership").

### Benötigte Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `CSC_LINK` | Pfad oder Base64-String der `.p12`-Zertifikatsdatei |
| `CSC_KEY_PASSWORD` | Passwort der `.p12`-Datei |
| `APPLE_ID` | Apple-ID (E-Mail) des Entwicklerkontos |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-spezifisches Passwort |
| `APPLE_TEAM_ID` | Team-ID (z. B. `AB12CD34EF`) |

### Lokal signieren + notarisieren

```bash
export CSC_LINK="$HOME/certs/developer-id.p12"
export CSC_KEY_PASSWORD="••••••••"
export APPLE_ID="dein@apple-id.de"
export APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="AB12CD34EF"

npm run package:mac
```

electron-builder signiert die App, der `afterSign`-Hook (`build/notarize.js`)
lädt sie zu Apple hoch und wartet auf die Notarisierung.

---

## 4. GitHub Actions (CI/CD)

### Secrets anlegen

Im Repository unter **Settings → Secrets and variables → Actions → New repository secret**
folgende Secrets hinterlegen:

| Secret-Name | Wert |
|-------------|------|
| `CSC_LINK` | Base64-codierte `.p12`-Datei (`base64 -i developer-id.p12 \| pbcopy`) |
| `CSC_KEY_PASSWORD` | Passwort der `.p12`-Datei |
| `APPLE_ID` | Apple-ID (E-Mail) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-spezifisches Passwort |
| `APPLE_TEAM_ID` | Team-ID |

### Im Workflow verwenden

Im macOS-Build-Job des Release-Workflows die Secrets als Umgebungsvariablen
durchreichen (nur dann werden Signatur & Notarisierung aktiv):

```yaml
  - name: Build & notarize macOS app
    if: matrix.os == 'macos-latest'
    env:
      CSC_LINK: ${{ secrets.CSC_LINK }}
      CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
      APPLE_ID: ${{ secrets.APPLE_ID }}
      APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
      APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
    run: npm run package:mac
```

> Solange diese Secrets **nicht** gesetzt sind, läuft der Build trotzdem durch –
> die App wird dann nur ad-hoc signiert und **nicht** notarisiert.

---

## 5. Ergebnis prüfen

Nach erfolgreicher Signatur/Notarisierung lässt sich das verifizieren:

```bash
# Signatur prüfen
codesign --verify --deep --strict --verbose=2 "release/mac/Projection Mapper.app"

# Notarisierung / Gatekeeper-Akzeptanz prüfen
spctl -a -vvv -t install "release/mac/Projection Mapper.app"
```

Bei Erfolg meldet `spctl` `source=Notarized Developer ID`.
