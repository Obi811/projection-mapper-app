import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Card, Heading, Muted } from '../components/ui';
import { theme } from '../theme';

interface Cue {
  id: string;
  name: string;
  color: string;
}

const STORAGE_KEY = 'pm.standalone.cues';
const PALETTE = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899'];

/**
 * Standalone mode — a self-contained cue board that works without a desktop
 * connection. Cues are persisted on the device. This is the foundation for the
 * offline projection features planned for upcoming releases.
 */
export function StandaloneScreen() {
  const [cues, setCues] = useState<Cue[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setCues(JSON.parse(raw) as Cue[]);
        } catch {
          /* ignore */
        }
      }
    })();
  }, []);

  const persist = (next: Cue[]) => {
    setCues(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addCue = () => {
    const name = newName.trim();
    if (!name) return;
    const cue: Cue = {
      id: Date.now().toString(36),
      name,
      color: PALETTE[cues.length % PALETTE.length],
    };
    persist([...cues, cue]);
    setNewName('');
  };

  const removeCue = (id: string) => {
    persist(cues.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const active = cues.find((c) => c.id === activeId) ?? null;

  return (
    <View style={styles.flex}>
      <View style={[styles.stage, { backgroundColor: active ? active.color : '#000' }]}>
        <Text style={styles.stageText}>{active ? active.name : 'Standalone-Modus'}</Text>
        {!active && <Muted style={styles.stageHint}>Wähle eine Cue, um sie auszugeben</Muted>}
      </View>

      <View style={styles.controls}>
        <Heading style={styles.title}>Cues</Heading>

        <View style={styles.addRow}>
          <TextInput
            placeholder="Neue Cue benennen…"
            placeholderTextColor={theme.colors.textFaint}
            value={newName}
            onChangeText={setNewName}
            style={styles.input}
            onSubmitEditing={addCue}
          />
          <Button title="+" onPress={addCue} style={styles.addBtn} />
        </View>

        <FlatList
          data={cues}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Card>
              <Muted>Noch keine Cues. Lege deine erste Cue an, um zu starten.</Muted>
            </Card>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveId(item.id === activeId ? null : item.id)}
              onLongPress={() => removeCue(item.id)}
              style={[
                styles.cueRow,
                { borderColor: item.color },
                activeId === item.id && { backgroundColor: theme.colors.surfaceAlt },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
              <Text style={styles.cueName}>{item.name}</Text>
              {activeId === item.id && <Text style={styles.live}>LIVE</Text>}
            </TouchableOpacity>
          )}
        />
        <Muted style={styles.footHint}>Tippen zum Ausgeben · Lange drücken zum Löschen</Muted>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  stage: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stageText: { color: '#fff', fontSize: theme.font.h2, fontWeight: '800' },
  stageHint: { color: 'rgba(255,255,255,0.8)' },
  controls: { flex: 1, padding: theme.spacing(3), gap: theme.spacing(1.5) },
  title: { fontSize: theme.font.h3 },
  addRow: { flexDirection: 'row', gap: theme.spacing(1) },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing(2),
    height: 46,
    fontSize: theme.font.body,
  },
  addBtn: { width: 56 },
  list: { gap: theme.spacing(1), paddingVertical: theme.spacing(1) },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
  swatch: { width: 18, height: 18, borderRadius: 5 },
  cueName: { flex: 1, color: theme.colors.text, fontSize: theme.font.body },
  live: { color: theme.colors.success, fontSize: theme.font.tiny, fontWeight: '800' },
  footHint: { textAlign: 'center' },
});
