/**
 * Addon API — The SDK surface exposed to addon developers.
 *
 * Each addon receives a sandboxed instance of this API.
 * Permissions are checked at runtime based on the addon manifest.
 *
 * This module also provides the event bus for addon ↔ app communication.
 */

import type {
  AddonPermission,
  AddonEvent,
  AddonEventType,
  ProjectionSurface,
} from '../shared/types';

// ─── Event Bus ───────────────────────────────────────────────────────────────

type EventHandler = (event: AddonEvent) => void;

/** Global addon event bus — singleton */
class AddonEventBus {
  private listeners = new Map<AddonEventType, Set<EventHandler>>();

  on(type: AddonEventType, handler: EventHandler): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  off(type: AddonEventType, handler: EventHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  emit(event: AddonEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[AddonEventBus] Error in handler for ${event.type}:`, err);
        }
      }
    }
  }

  /** Remove all listeners for a specific addon (by checking closure scope) */
  removeAllForAddon(addonId: string): void {
    // tracked externally by the registry
    void addonId;
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const addonEventBus = new AddonEventBus();

// ─── Helper: emit events ─────────────────────────────────────────────────────

export function emitAddonEvent<T = unknown>(
  type: AddonEventType,
  source: string,
  data: T,
): void {
  addonEventBus.emit({
    type,
    timestamp: Date.now(),
    source,
    data,
  });
}

// ─── Sandboxed API Factory ───────────────────────────────────────────────────

/**
 * Creates a permission-gated API instance for a specific addon.
 * Only methods matching the addon's permissions are functional.
 */
export function createAddonAPI(
  addonId: string,
  permissions: AddonPermission[],
  getStorage: () => Record<string, unknown>,
  setStorage: (data: Record<string, unknown>) => void,
  getSurfaces: () => ProjectionSurface[],
) {
  const hasPermission = (perm: AddonPermission): boolean =>
    permissions.includes(perm);

  const requirePermission = (perm: AddonPermission): void => {
    if (!hasPermission(perm)) {
      throw new Error(
        `Addon "${addonId}" lacks permission "${perm}". ` +
        `Add it to your addon.json permissions array.`,
      );
    }
  };

  return {
    /** Addon metadata */
    addonId,
    permissions,

    /** Check if addon has a specific permission */
    hasPermission,

    // ─── Events ───────────────────────────────────────────────────────

    /** Subscribe to an app/addon event */
    on(type: AddonEventType, handler: EventHandler): () => void {
      addonEventBus.on(type, handler);
      return () => addonEventBus.off(type, handler);
    },

    /** Emit a custom event (source will be set to this addon's ID) */
    emit<T = unknown>(type: AddonEventType, data: T): void {
      emitAddonEvent(type, addonId, data);
    },

    // ─── Projection (read) ────────────────────────────────────────────

    /** Get current projection surfaces */
    getSurfaces(): ProjectionSurface[] {
      requirePermission('projection:read');
      return getSurfaces();
    },

    // ─── Storage ──────────────────────────────────────────────────────

    /** Read addon-scoped persistent storage */
    getStorageData(): Record<string, unknown> {
      requirePermission('storage:read');
      return getStorage();
    },

    /** Write addon-scoped persistent storage */
    setStorageData(data: Record<string, unknown>): void {
      requirePermission('storage:write');
      setStorage(data);
    },

    // ─── Utilities ────────────────────────────────────────────────────

    /** Safe console logger prefixed with addon name */
    log: {
      info: (...args: unknown[]) => console.log(`[Addon:${addonId}]`, ...args),
      warn: (...args: unknown[]) => console.warn(`[Addon:${addonId}]`, ...args),
      error: (...args: unknown[]) => console.error(`[Addon:${addonId}]`, ...args),
    },

    /** Get the current app version */
    getAppVersion(): string {
      return process.env.npm_package_version ?? '0.0.0';
    },
  };
}

/** Type of the API instance passed to addons */
export type AddonAPIInstance = ReturnType<typeof createAddonAPI>;
