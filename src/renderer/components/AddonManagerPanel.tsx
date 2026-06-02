/**
 * AddonManagerPanel — Sidebar panel for managing installed addons.
 *
 * Shows installed addons with enable/disable toggles, links to
 * the marketplace browser, and feature-gate for addon_system.
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { InstalledAddon } from '../../shared/types';
import { ADDON_CATEGORY_LABELS } from '../../shared/constants';
import { AddonMarketplace } from './AddonMarketplace';
import { AddonDetailsDialog } from './AddonDetailsDialog';

interface AddonManagerPanelProps {
  featureEnabled: boolean;
  onUpgradePrompt: () => void;
}

export const AddonManagerPanel: React.FC<AddonManagerPanelProps> = ({
  featureEnabled,
  onUpgradePrompt,
}) => {
  const [installed, setInstalled] = useState<InstalledAddon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<InstalledAddon | null>(null);

  const refreshInstalled = useCallback(async () => {
    try {
      setLoading(true);
      const addons = await window.electronAPI.addon.getInstalled();
      setInstalled(addons ?? []);
    } catch (err) {
      console.error('[AddonManager] Failed to load installed addons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (featureEnabled) {
      refreshInstalled();
    }
  }, [featureEnabled, refreshInstalled]);

  const handleToggle = async (addon: InstalledAddon) => {
    try {
      if (addon.state === 'enabled' || addon.state === 'loaded') {
        await window.electronAPI.addon.disable(addon.manifest.id);
      } else {
        await window.electronAPI.addon.enable(addon.manifest.id);
      }
      await refreshInstalled();
    } catch (err) {
      console.error('[AddonManager] Toggle failed:', err);
    }
  };

  const handleUninstall = async (addonId: string) => {
    try {
      await window.electronAPI.addon.uninstall(addonId);
      setSelectedAddon(null);
      await refreshInstalled();
    } catch (err) {
      console.error('[AddonManager] Uninstall failed:', err);
    }
  };

  if (!featureEnabled) {
    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Addons</h3>
        <p style={styles.placeholder}>
          Addon system requires a premium license.
        </p>
        <button style={styles.upgradeButton} onClick={onUpgradePrompt}>
          Upgrade License
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Addons</h3>

        {loading && <p style={styles.placeholder}>Loading addons…</p>}

        {!loading && installed.length === 0 && (
          <p style={styles.placeholder}>
            No addons installed. Browse the marketplace to get started.
          </p>
        )}

        {installed.map((addon) => (
          <div
            key={addon.manifest.id}
            style={styles.addonItem}
            onClick={() => setSelectedAddon(addon)}
            role="button"
            tabIndex={0}
          >
            <div style={styles.addonInfo}>
              <span style={styles.addonName}>{addon.manifest.name}</span>
              <span style={styles.addonMeta}>
                v{addon.manifest.version} · {ADDON_CATEGORY_LABELS[addon.manifest.category] ?? addon.manifest.category}
              </span>
            </div>
            <button
              style={{
                ...styles.toggleButton,
                backgroundColor: addon.state === 'enabled' || addon.state === 'loaded'
                  ? '#22c55e'
                  : '#3f3f46',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(addon);
              }}
              title={addon.state === 'enabled' || addon.state === 'loaded' ? 'Disable' : 'Enable'}
            >
              {addon.state === 'enabled' || addon.state === 'loaded' ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}

        <button
          style={styles.marketplaceButton}
          onClick={() => setShowMarketplace(true)}
        >
          Browse Marketplace
        </button>
      </div>

      {showMarketplace && (
        <AddonMarketplace
          onClose={() => setShowMarketplace(false)}
          onInstalled={refreshInstalled}
        />
      )}

      {selectedAddon && (
        <AddonDetailsDialog
          addon={selectedAddon}
          onClose={() => setSelectedAddon(null)}
          onUninstall={() => handleUninstall(selectedAddon.manifest.id)}
          onToggle={() => handleToggle(selectedAddon)}
          onSettingsSaved={refreshInstalled}
        />
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a1a1aa',
    paddingBottom: 8,
    borderBottom: '1px solid #27272a',
    margin: 0,
  },
  placeholder: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    lineHeight: 1.5,
    margin: 0,
  },
  upgradeButton: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #6366f1',
    backgroundColor: 'transparent',
    color: '#6366f1',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  addonItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: 6,
    backgroundColor: '#0d0d0d',
    border: '1px solid #27272a',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  addonInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  addonName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e4e4e7',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  addonMeta: {
    fontSize: 11,
    color: '#71717a',
  },
  toggleButton: {
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  marketplaceButton: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #6366f1',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
  },
};
