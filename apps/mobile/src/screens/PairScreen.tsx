import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import {
  REMOTE_DEFAULT_PORT,
  decodePairingInfo,
} from '@projection-mapper/shared';
import { useRemote } from '../context/RemoteContext';
import { Button, Card, Heading, Muted } from '../components/ui';
import { theme } from '../theme';

export function PairScreen() {
  const { connect, status, lastConnection } = useRemote();
  const [host, setHost] = useState(lastConnection?.host ?? '');
  const [port, setPort] = useState(String(lastConnection?.port ?? REMOTE_DEFAULT_PORT));
  const [token, setToken] = useState(lastConnection?.token ?? '');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleManualConnect = () => {
    const parsedPort = parseInt(port, 10) || REMOTE_DEFAULT_PORT;
    connect({ host: host.trim(), port: parsedPort, token: token.trim(), clientName: 'Mobile Remote' });
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScanning(true);
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    const info = decodePairingInfo(result.data);
    setScanning(false);
    if (info) {
      setHost(info.host);
      setPort(String(info.port));
      setToken(info.token);
      connect({ host: info.host, port: info.port, token: info.token, clientName: 'Mobile Remote' });
    }
  };

  if (scanning) {
    return (
      <View style={styles.scannerWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Scanne den QR-Code in der Desktop-App</Text>
          <Button title="Abbrechen" variant="secondary" onPress={() => setScanning(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Heading>Mit Desktop verbinden</Heading>
      <Muted style={styles.subtitle}>
        Scanne den QR-Code aus dem Remote-Panel der Desktop-App oder gib die Verbindungsdaten manuell
        ein.
      </Muted>

      <Button title="📷 QR-Code scannen" onPress={openScanner} style={styles.scanBtn} />

      <Card style={styles.card}>
        <Text style={styles.label}>Host / IP-Adresse</Text>
        <TextInput
          placeholder="192.168.1.42"
          placeholderTextColor={theme.colors.textFaint}
          value={host}
          onChangeText={setHost}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>Port</Text>
        <TextInput
          placeholder={String(REMOTE_DEFAULT_PORT)}
          placeholderTextColor={theme.colors.textFaint}
          value={port}
          onChangeText={setPort}
          style={styles.input}
          keyboardType="number-pad"
        />
        <Text style={styles.label}>Token</Text>
        <TextInput
          placeholder="Auth-Token aus der Desktop-App"
          placeholderTextColor={theme.colors.textFaint}
          value={token}
          onChangeText={setToken}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          title={status === 'connecting' ? 'Verbinde…' : 'Verbinden'}
          onPress={handleManualConnect}
          loading={status === 'connecting' || status === 'authenticating'}
          disabled={!host || !token}
          style={styles.connectBtn}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing(3), gap: theme.spacing(1) },
  subtitle: { marginBottom: theme.spacing(2), lineHeight: 20 },
  scanBtn: { marginBottom: theme.spacing(2) },
  card: { gap: 6 },
  label: { color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 8 },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing(2),
    height: 46,
    fontSize: theme.font.body,
  },
  connectBtn: { marginTop: theme.spacing(2) },
  scannerWrap: { flex: 1, backgroundColor: '#000' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#fff', fontSize: theme.font.body, textAlign: 'center', paddingHorizontal: 24 },
});
