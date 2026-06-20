import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Heading, Muted } from '../components/ui';
import { theme } from '../theme';

export function LoginScreen({ onGuest }: { onGuest?: () => void }) {
  const { login, register, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const submit = async () => {
    clearError();
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim() || undefined);
      }
    } catch {
      /* error surfaced via context */
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>🎛️</Text>
          <Heading style={styles.title}>Projection Mapper</Heading>
          <Muted>Companion & Remote Control</Muted>
        </View>

        <Card>
          <View style={styles.tabs}>
            <Button
              title="Anmelden"
              variant={mode === 'login' ? 'primary' : 'ghost'}
              onPress={() => setMode('login')}
              style={styles.tabBtn}
            />
            <Button
              title="Registrieren"
              variant={mode === 'register' ? 'primary' : 'ghost'}
              onPress={() => setMode('register')}
              style={styles.tabBtn}
            />
          </View>

          {mode === 'register' && (
            <TextInput
              placeholder="Name (optional)"
              placeholderTextColor={theme.colors.textFaint}
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
            />
          )}

          <TextInput
            placeholder="E-Mail"
            placeholderTextColor={theme.colors.textFaint}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            placeholder="Passwort"
            placeholderTextColor={theme.colors.textFaint}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title={mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
            onPress={submit}
            loading={loading}
            disabled={!email || !password}
            style={styles.submit}
          />
        </Card>

        {onGuest && (
          <Button
            title="Ohne Konto fortfahren (Standalone)"
            variant="ghost"
            onPress={onGuest}
            style={styles.guestBtn}
          />
        )}

        <Muted style={styles.hint}>
          Du kannst die App auch ohne Konto im Standalone-Modus verwenden — melde dich an, um
          Lizenzen und Remote-Funktionen zu nutzen.
        </Muted>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing(3), paddingTop: theme.spacing(8), gap: theme.spacing(2) },
  logoWrap: { alignItems: 'center', marginBottom: theme.spacing(3), gap: 4 },
  logo: { fontSize: 56 },
  title: { fontSize: theme.font.h1 },
  tabs: { flexDirection: 'row', gap: theme.spacing(1), marginBottom: theme.spacing(2) },
  tabBtn: { flex: 1, height: 40 },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing(2),
    height: 48,
    marginBottom: theme.spacing(1.5),
    fontSize: theme.font.body,
  },
  submit: { marginTop: theme.spacing(1) },
  guestBtn: { marginTop: theme.spacing(2) },
  error: { color: theme.colors.danger, marginBottom: theme.spacing(1), fontSize: theme.font.small },
  hint: { textAlign: 'center', marginTop: theme.spacing(2), lineHeight: 20 },
});
