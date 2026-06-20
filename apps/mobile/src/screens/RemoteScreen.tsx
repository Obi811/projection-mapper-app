import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRemote } from '../context/RemoteContext';
import { Button, Card, Heading, Muted, Pill } from '../components/ui';
import { theme } from '../theme';
import { PairScreen } from './PairScreen';
import { ConnectionStatus } from '../remote/RemoteControlClient';

function statusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return theme.colors.success;
    case 'connecting':
    case 'authenticating':
      return theme.colors.warning;
    case 'auth_failed':
    case 'error':
      return theme.colors.danger;
    default:
      return theme.colors.textFaint;
  }
}

function statusLabel(status: ConnectionStatus): string {
  const map: Record<ConnectionStatus, string> = {
    disconnected: 'Getrennt',
    connecting: 'Verbinde…',
    authenticating: 'Authentifiziere…',
    connected: 'Verbunden',
    auth_failed: 'Auth fehlgeschlagen',
    error: 'Fehler',
  };
  return map[status];
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function RemoteScreen() {
  const { status, state, error, client, disconnect, lastConnection } = useRemote();

  // Not connected yet → show the pairing screen.
  if (status !== 'connected') {
    return (
      <View style={styles.flex}>
        {(status === 'auth_failed' || status === 'error') && error && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        )}
        <PairScreen />
      </View>
    );
  }

  const playing = state?.isPlaying ?? false;
  const scenes = state?.scenes ?? [];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Heading>Remote</Heading>
          <Muted>{lastConnection ? `${lastConnection.host}:${lastConnection.port}` : ''}</Muted>
        </View>
        <Pill label={statusLabel(status)} color={statusColor(status)} />
      </View>

      {/* Transport */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Wiedergabe</Text>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(state?.position ?? 0)}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    state && state.duration > 0
                      ? Math.min(100, (state.position / state.duration) * 100)
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.time}>{formatTime(state?.duration ?? 0)}</Text>
        </View>
        <View style={styles.transportRow}>
          <TransportButton label="⏮" onPress={() => client.prevScene()} />
          <TransportButton
            label={playing ? '⏸' : '▶️'}
            primary
            onPress={() => (playing ? client.pause() : client.play())}
          />
          <TransportButton label="⏹" onPress={() => client.stop()} />
          <TransportButton label="⏭" onPress={() => client.nextScene()} />
        </View>
      </Card>

      {/* Volume */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Lautstärke</Text>
        <View style={styles.volumeRow}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <Button
              key={v}
              title={`${Math.round(v * 100)}%`}
              variant={Math.abs((state?.volume ?? 1) - v) < 0.13 ? 'primary' : 'secondary'}
              onPress={() => client.setVolume(v)}
              style={styles.volBtn}
            />
          ))}
        </View>
      </Card>

      {/* Scenes */}
      {scenes.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Szenen</Text>
          {scenes.map((scene) => (
            <TouchableOpacity
              key={scene.id}
              style={[
                styles.sceneRow,
                state?.activeSceneId === scene.id && styles.sceneRowActive,
              ]}
              onPress={() => client.selectScene(scene.id)}
            >
              <Text style={styles.sceneName}>{scene.name}</Text>
              {state?.activeSceneId === scene.id && <Text style={styles.sceneLive}>LIVE</Text>}
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Output */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Ausgabe</Text>
        <Button
          title={state?.blackout ? '🔆 Blackout aufheben' : '⬛ Blackout aktivieren'}
          variant={state?.blackout ? 'primary' : 'secondary'}
          onPress={() => client.setBlackout(!state?.blackout)}
        />
        <Muted style={styles.projectorInfo}>
          {state?.projectorCount ?? 0} Projektor(en) verbunden
        </Muted>
      </Card>

      <Button title="Verbindung trennen" variant="danger" onPress={disconnect} />
    </ScrollView>
  );
}

function TransportButton({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.transportBtn, primary && styles.transportBtnPrimary]}
    >
      <Text style={styles.transportLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing(3), gap: theme.spacing(2) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { gap: theme.spacing(1.5) },
  sectionTitle: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  time: { color: theme.colors.textMuted, fontSize: theme.font.small, width: 44, textAlign: 'center' },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: theme.colors.primary },
  transportRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing(1) },
  transportBtn: {
    flex: 1,
    height: 64,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportBtnPrimary: { backgroundColor: theme.colors.primary },
  transportLabel: { fontSize: 24, color: theme.colors.text },
  volumeRow: { flexDirection: 'row', gap: 6 },
  volBtn: { flex: 1, height: 40, paddingHorizontal: 0 },
  sceneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  sceneRowActive: { borderWidth: 1, borderColor: theme.colors.primary },
  sceneName: { color: theme.colors.text, fontSize: theme.font.body },
  sceneLive: { color: theme.colors.success, fontSize: theme.font.tiny, fontWeight: '800' },
  projectorInfo: { textAlign: 'center' },
  banner: { backgroundColor: theme.colors.danger, padding: theme.spacing(1.5) },
  bannerText: { color: '#fff', textAlign: 'center', fontSize: theme.font.small },
});
