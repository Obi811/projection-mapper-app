import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RemoteProvider } from './src/context/RemoteContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RemoteScreen } from './src/screens/RemoteScreen';
import { StandaloneScreen } from './src/screens/StandaloneScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Button, Heading, Muted } from './src/components/ui';
import { theme } from './src/theme';

type Tab = 'remote' | 'standalone' | 'settings';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'remote', label: 'Remote', icon: '📱' },
  { key: 'standalone', label: 'Standalone', icon: '🎬' },
  { key: 'settings', label: 'Einstellungen', icon: '⚙️' },
];

function LoginRequired({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={styles.centered}>
      <Heading>Anmeldung erforderlich</Heading>
      <Muted style={styles.centerText}>
        Melde dich an, um Remote-Steuerung, Lizenzen und Portal-Funktionen zu nutzen.
      </Muted>
      <Button title="Zur Anmeldung" onPress={onLogin} style={styles.loginBtn} />
    </View>
  );
}

function MainTabs({ guest, exitGuest }: { guest: boolean; exitGuest: () => void }) {
  const [tab, setTab] = useState<Tab>(guest ? 'standalone' : 'remote');

  const renderTab = () => {
    if (tab === 'standalone') return <StandaloneScreen />;
    if (guest) return <LoginRequired onLogin={exitGuest} />;
    if (tab === 'remote') return <RemoteScreen />;
    return <SettingsScreen />;
  };

  return (
    <View style={styles.flex}>
      <View style={styles.content}>{renderTab()}</View>
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  const [guest, setGuest] = useState(false);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Muted style={styles.centerText}>Sitzung wird wiederhergestellt…</Muted>
      </View>
    );
  }

  if (!user && !guest) {
    return <LoginScreen onGuest={() => setGuest(true)} />;
  }

  return (
    <RemoteProvider>
      <MainTabs guest={!user} exitGuest={() => setGuest(false)} />
    </RemoteProvider>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar style="light" />
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing(4),
    gap: theme.spacing(1.5),
  },
  centerText: { textAlign: 'center', lineHeight: 20 },
  loginBtn: { marginTop: theme.spacing(2), alignSelf: 'stretch' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingBottom: 6,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: theme.font.tiny, color: theme.colors.textFaint },
  tabLabelActive: { color: theme.colors.primary, fontWeight: '700' },
});
