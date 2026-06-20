/**
 * afterSign-Hook für electron-builder: Notarisierung der macOS-App.
 *
 * Dieser Hook wird nach dem Signieren automatisch ausgeführt. Er notarisiert
 * die App NUR, wenn alle benötigten Apple-Anmeldedaten als Umgebungsvariablen
 * vorhanden sind. Andernfalls wird die Notarisierung übersprungen (kein Fehler),
 * damit lokale Builds und Builds ohne Apple-Entwicklerkonto weiterhin funktionieren.
 *
 * Benötigte Umgebungsvariablen (z. B. als GitHub-Actions-Secrets):
 *   APPLE_ID                    – Apple-ID (E-Mail) des Entwicklerkontos
 *   APPLE_APP_SPECIFIC_PASSWORD – App-spezifisches Passwort (appleid.apple.com)
 *   APPLE_TEAM_ID               – Team-ID aus dem Apple Developer Portal
 *
 * Voraussetzung: gültiges "Developer ID Application"-Zertifikat (CSC_LINK).
 */

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Nur auf macOS notarisieren
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  // Ohne Anmeldedaten überspringen (z. B. lokale/Ad-hoc-Builds)
  if (!appleId || !appleIdPassword || !teamId) {
    console.log(
      '[notarize] Übersprungen: APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID nicht gesetzt.'
    );
    return;
  }

  // Lazy laden, damit Builds ohne installiertes Paket nicht fehlschlagen
  let notarize;
  try {
    ({ notarize } = require('@electron/notarize'));
  } catch (e) {
    console.warn(
      '[notarize] Paket "@electron/notarize" nicht installiert – Notarisierung übersprungen. ' +
        'Mit `npm i -D @electron/notarize` installieren.'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`[notarize] Notarisiere ${appName}.app … (das kann einige Minuten dauern)`);

  try {
    await notarize({
      appBundleId: context.packager.appInfo.id,
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });
    console.log(`[notarize] ${appName}.app erfolgreich notarisiert.`);
  } catch (error) {
    console.error('[notarize] Notarisierung fehlgeschlagen:', error);
    throw error;
  }
};
