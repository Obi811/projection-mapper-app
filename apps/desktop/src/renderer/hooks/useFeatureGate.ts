/**
 * useFeatureGate — React hook for feature flag checks.
 *
 * Reads the current feature set from the Electron store (via IPC)
 * or from the in-memory license service (browser dev mode).
 *
 * Usage:
 *   const { hasFeature, features, loading } = useFeatureGate();
 *   if (hasFeature('keystone_correction')) { ... }
 */

import { useState, useEffect, useCallback } from 'react';
import type { FeatureFlag } from '../../shared/types';

interface FeatureGateState {
  features: FeatureFlag[];
  loading: boolean;
  hasFeature: (flag: FeatureFlag) => boolean;
  refresh: () => Promise<void>;
}

export function useFeatureGate(): FeatureGateState {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.license.getFeatures();
        setFeatures(result ?? []);
      } else {
        // Browser fallback — import license service
        const { getEnabledFeatures } = await import(
          '@services/license-service'
        );
        setFeatures(getEnabledFeatures());
      }
    } catch {
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Live updates: when the main process revalidates the license against the
  // server (e.g. it was paused/revoked), it emits a license:changed event with
  // the new feature set. Apply it immediately so premium UI is gated without a
  // restart.
  useEffect(() => {
    if (!window.electronAPI?.license?.onChanged) {
      return;
    }
    const unsubscribe = window.electronAPI.license.onChanged((next) => {
      setFeatures((next ?? []) as FeatureFlag[]);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const hasFeature = useCallback(
    (flag: FeatureFlag): boolean => features.includes(flag),
    [features],
  );

  return { features, loading, hasFeature, refresh: fetchFeatures };
}
