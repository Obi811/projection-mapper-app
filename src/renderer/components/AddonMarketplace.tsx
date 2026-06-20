/**
 * AddonMarketplace — Modal overlay for browsing and installing addons.
 *
 * Fetches available addons from the marketplace API, allows filtering
 * by category, and provides install/purchase actions.
 */

import React, { useEffect, useState } from 'react';
import type { Addon, AddonCategory } from '../../shared/types';
import { ADDON_CATEGORY_LABELS } from '../../shared/constants';

interface AddonMarketplaceProps {
  onClose: () => void;
  onInstalled: () => void;
}

const CATEGORIES: (AddonCategory | 'all')[] = ['all', 'effect', 'integration', 'import_export', 'tool'];

export const AddonMarketplace: React.FC<AddonMarketplaceProps> = ({
  onClose,
  onInstalled,
}) => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<AddonCategory | 'all'>('all');
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        setLoading(true);
        setError(null);
        const cat = category === 'all' ? undefined : category;
        const result = await window.electronAPI.addon.listMarketplace(cat);
        setAddons(result ?? []);
      } catch (err) {
        setError('Marktplatz konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
        console.error('[Marketplace] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAddons();
  }, [category]);

  const handleInstall = async (addon: Addon) => {
    try {
      setInstalling(addon.id);
      // For marketplace addons, pass the slug as source path
      // The plugin loader will handle download in a real scenario
      await window.electronAPI.addon.install(addon.slug ?? addon.id);
      onInstalled();
    } catch (err) {
      console.error('[Marketplace] Install error:', err);
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Addon-Marktplatz</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div style={styles.filters}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              style={{
                ...styles.filterButton,
                ...(category === cat ? styles.filterButtonActive : {}),
              }}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'Alle' : (ADDON_CATEGORY_LABELS[cat] ?? cat)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading && <p style={styles.placeholder}>Addons werden geladen …</p>}
          {error && <p style={styles.errorText}>{error}</p>}
          {!loading && !error && addons.length === 0 && (
            <p style={styles.placeholder}>Keine Addons in dieser Kategorie gefunden.</p>
          )}

          <div style={styles.grid}>
            {addons.map((addon) => (
              <div key={addon.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardName}>{addon.name}</span>
                  <span style={styles.cardCategory}>
                    {ADDON_CATEGORY_LABELS[addon.category] ?? addon.category}
                  </span>
                </div>
                <p style={styles.cardDescription}>
                  {addon.description ?? 'Keine Beschreibung verfügbar.'}
                </p>
                <div style={styles.cardFooter}>
                  <span style={styles.cardAuthor}>
                    von {addon.author ?? 'Unbekannt'}
                  </span>
                  <button
                    style={styles.installButton}
                    onClick={() => handleInstall(addon)}
                    disabled={installing === addon.id}
                  >
                    {installing === addon.id ? 'Wird installiert …' : 'Installieren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: 720,
    maxHeight: '85vh',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #27272a',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#71717a',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  filters: {
    display: 'flex',
    gap: 8,
    padding: '12px 20px',
    borderBottom: '1px solid #27272a',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '6px 14px',
    borderRadius: 16,
    border: '1px solid #3f3f46',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    color: '#fff',
  },
  content: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  },
  placeholder: {
    fontSize: 13,
    color: '#71717a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    padding: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280, 1fr))',
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
  },
  cardCategory: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    backgroundColor: '#27272a',
    color: '#a1a1aa',
    whiteSpace: 'nowrap',
  },
  cardDescription: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 1.5,
    margin: 0,
    flex: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardAuthor: {
    fontSize: 11,
    color: '#71717a',
  },
  installButton: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
