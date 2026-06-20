/**
 * useAppVersion — Liefert die aktuelle App-Version aus dem Hauptprozess.
 *
 * Im Electron-Kontext wird `app.getVersion()` über IPC abgefragt.
 * Im Browser-Dev-Modus wird ein Fallback verwendet.
 */

import { useState, useEffect } from 'react';

const FALLBACK_VERSION = '0.11.0';

export function useAppVersion(): string {
  const [version, setVersion] = useState<string>(FALLBACK_VERSION);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (window.electronAPI?.app) {
          const v = (await window.electronAPI.app.getVersion()) as string;
          if (mounted && v) setVersion(v);
        }
      } catch {
        // Fallback behalten
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return version;
}
