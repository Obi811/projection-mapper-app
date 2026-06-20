import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@projection-mapper/shared';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import { Button, Card, Heading, Muted, Pill } from '../components/ui';
import { theme } from '../theme';

function roleColor(role: UserRole): string {
  switch (role) {
    case 'owner':
      return theme.colors.warning;
    case 'admin':
      return theme.colors.primary;
    default:
      return theme.colors.textMuted;
  }
}

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<authApi.PortalDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      setDashboard(await authApi.fetchDashboard());
    } catch (e) {
      const m = (e as { response?: { status?: number } })?.response?.status;
      setErr(m === 404 ? 'Portal-Daten nicht verfügbar' : 'Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.text} />}
    >
      <Heading>Einstellungen</Heading>

      {/* Profile */}
      <Card style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? user?.email ?? '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name ?? 'Unbenannt'}</Text>
            <Muted>{user?.email}</Muted>
          </View>
          {user && <Pill label={user.role} color={roleColor(user.role)} />}
        </View>
      </Card>

      {/* License */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Lizenz</Text>
        {err && <Muted>{err}</Muted>}
        {dashboard?.license ? (
          <View style={styles.licenseGrid}>
            <Stat label="Tier" value={dashboard.license.tier} />
            <Stat label="Status" value={dashboard.license.status} />
            <Stat
              label="Geräte"
              value={`${dashboard.license.activatedDevices}/${dashboard.license.maxDevices}`}
            />
            <Stat label="Aktiv" value={String(dashboard.activeDevices ?? 0)} />
          </View>
        ) : (
          !err && <Muted>Keine aktive Lizenz gefunden.</Muted>
        )}
      </Card>

      {/* Devices */}
      {dashboard?.devices && dashboard.devices.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Aktive Geräte</Text>
          {dashboard.devices.map((d) => (
            <View key={d.id} style={styles.deviceRow}>
              <View style={styles.flex1}>
                <Text style={styles.deviceName}>{d.name}</Text>
                <Muted>{d.platform}</Muted>
              </View>
              {d.current && <Pill label="dieses Gerät" color={theme.colors.success} />}
            </View>
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>App</Text>
        <Muted>Projection Mapper Remote</Muted>
        <Muted>Version 0.12.0</Muted>
        <Muted>Server: licensing.obitron.de</Muted>
      </Card>

      <Button title="Abmelden" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  flex1: { flex: 1 },
  container: { padding: theme.spacing(3), gap: theme.spacing(2) },
  card: { gap: theme.spacing(1.5) },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: theme.font.h3, fontWeight: '800' },
  profileInfo: { flex: 1 },
  name: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  sectionTitle: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: '700' },
  licenseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) },
  stat: {
    width: '45%',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
  },
  statValue: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800', textTransform: 'capitalize' },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.font.tiny, textTransform: 'uppercase' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  deviceName: { color: theme.colors.text, fontSize: theme.font.body },
});
