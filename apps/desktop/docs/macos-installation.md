# Installation unter macOS

Diese Anleitung hilft dir, **Projection Mapper** unter macOS zu installieren und
die häufige Warnung **„App ist beschädigt und kann nicht geöffnet werden"** zu
beheben.

---

## 1. App installieren

1. Lade die passende Datei von der [Releases-Seite](https://github.com/Obi811/projection-mapper-app/releases) herunter:
   - **`Projection Mapper-<version>-arm64.dmg`** → für Macs mit Apple Silicon (M1/M2/M3/M4)
   - **`Projection Mapper-<version>.dmg`** → für Macs mit Intel-Prozessor
2. Öffne die `.dmg`-Datei per Doppelklick.
3. Ziehe **Projection Mapper** in den Ordner **Programme**.

---

## 2. „App ist beschädigt" beheben

> ⚠️ **Warum erscheint diese Meldung?**
> Aktuell ist die App **nicht von Apple notarisiert** (das erfordert ein
> kostenpflichtiges Apple-Developer-Konto). macOS Gatekeeper markiert deshalb
> heruntergeladene Apps mit dem sogenannten *Quarantäne-Attribut* und zeigt die
> Meldung „App ist beschädigt und kann nicht geöffnet werden" an.
> Die App ist **nicht** wirklich beschädigt.

### Lösung (empfohlen): Quarantäne-Attribut entfernen

Öffne die **Terminal**-App (über Spotlight: `⌘ + Leertaste`, dann „Terminal"
eingeben) und führe folgenden Befehl aus:

```bash
xattr -cr "/Applications/Projection Mapper.app"
```

Danach lässt sich die App ganz normal per Doppelklick starten.

> 💡 Falls du die App woanders abgelegt hast, passe den Pfad entsprechend an,
> z. B. `xattr -cr ~/Downloads/"Projection Mapper.app"`.

### Alternative: Über das Kontextmenü öffnen

1. Rechtsklick (oder `Ctrl` + Klick) auf **Projection Mapper** im Programme-Ordner.
2. Im Menü **„Öffnen"** wählen.
3. Im Dialog erneut auf **„Öffnen"** klicken.

> Hinweis: Bei manchen macOS-Versionen (insbesondere ab Sonoma/Sequoia)
> funktioniert nur die Terminal-Methode (`xattr -cr`) zuverlässig.

### Alternative: Über die Systemeinstellungen freigeben

1. App per Doppelklick starten (Meldung erscheint).
2. **Systemeinstellungen → Datenschutz & Sicherheit** öffnen.
3. Ganz unten bei „Projection Mapper wurde blockiert" auf **„Trotzdem öffnen"** klicken.

---

## 3. Häufige Fragen

**Ist die App sicher, obwohl sie nicht signiert ist?**
Ja. Der Quellcode ist öffentlich auf GitHub einsehbar und die Builds werden
automatisiert über GitHub Actions erstellt. Die fehlende Signatur ist rein eine
Frage des (kostenpflichtigen) Apple-Zertifikats, nicht der Sicherheit.

**Wird die App künftig signiert/notarisiert sein?**
Ja, das ist geplant. Sobald ein Apple Developer ID-Zertifikat hinterlegt ist,
entfällt dieser Schritt komplett. Die technische Vorbereitung (Hardened Runtime,
Entitlements, Notarisierungs-Hook) ist bereits enthalten – siehe
[`docs/code-signing.md`](./code-signing.md).

**Der Befehl `xattr` sagt „No such file or directory".**
Prüfe den genauen Namen/Pfad der App im Programme-Ordner und setze ihn in
Anführungszeichen (wegen des Leerzeichens im Namen).
