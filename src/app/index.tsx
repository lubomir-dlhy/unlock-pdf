import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { unlockPdf, UnlockResult } from '../lib/unlock-pdf';

interface PickedFile {
  uri: string;
  name: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done'; result: UnlockResult }
  | { kind: 'error'; message: string };

export default function UnlockScreen() {
  const dark = useColorScheme() === 'dark';
  const c = dark ? palette.dark : palette.light;

  const [file, setFile] = useState<PickedFile | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const pickFile = useCallback(async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    setFile({ uri: asset.uri, name: asset.name });
    setStatus({ kind: 'idle' });
  }, []);

  const unlock = useCallback(async () => {
    if (!file || !password) return;
    Keyboard.dismiss();
    setStatus({ kind: 'working' });
    try {
      const result = await unlockPdf(file.uri, file.name, password);
      setStatus({ kind: 'done', result });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }, [file, password]);

  const share = useCallback(async () => {
    if (status.kind !== 'done') return;
    await Sharing.shareAsync(status.result.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Save unlocked PDF',
    });
  }, [status]);

  const reset = useCallback(() => {
    setFile(null);
    setPassword('');
    setStatus({ kind: 'idle' });
  }, []);

  const canUnlock = !!file && password.length > 0 && status.kind !== 'working';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
              <SymbolView name="lock.open.fill" size={30} tintColor={c.accent} />
            </View>
            <Text style={[styles.title, { color: c.text }]}>Unlock PDF</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Remove the password from a protected PDF.{'\n'}Everything stays on your iPhone.
            </Text>
          </View>

          {status.kind === 'done' ? (
            /* ── Success state ── */
            <View style={[styles.card, { backgroundColor: c.card }]}>
              <SymbolView name="checkmark.circle.fill" size={56} tintColor={c.success} />
              <Text style={[styles.doneTitle, { color: c.text }]}>PDF unlocked</Text>
              <Text style={[styles.fileName, { color: c.textSecondary }]} numberOfLines={1}>
                {status.result.name}
              </Text>
              <Pressable
                onPress={share}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 },
                ]}>
                <SymbolView name="square.and.arrow.up" size={18} tintColor="#fff" />
                <Text style={styles.primaryButtonLabel}>Save or Share</Text>
              </Pressable>
              <Pressable onPress={reset} hitSlop={8}>
                <Text style={[styles.linkLabel, { color: c.accent }]}>Unlock another PDF</Text>
              </Pressable>
            </View>
          ) : (
            /* ── Picker + password form ── */
            <View style={styles.form}>
              <Pressable
                onPress={pickFile}
                style={({ pressed }) => [
                  styles.picker,
                  {
                    backgroundColor: c.card,
                    borderColor: file ? c.accent : c.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <SymbolView
                  name={file ? 'doc.fill' : 'doc.badge.plus'}
                  size={26}
                  tintColor={file ? c.accent : c.textSecondary}
                />
                <View style={styles.flexShrink}>
                  <Text
                    style={[styles.pickerLabel, { color: file ? c.text : c.textSecondary }]}
                    numberOfLines={1}>
                    {file ? file.name : 'Choose a PDF…'}
                  </Text>
                  {file && (
                    <Text style={[styles.pickerHint, { color: c.textSecondary }]}>
                      Tap to choose a different file
                    </Text>
                  )}
                </View>
              </Pressable>

              <View style={[styles.passwordRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <SymbolView name="key.fill" size={18} tintColor={c.textSecondary} />
                <TextInput
                  style={[styles.passwordInput, { color: c.text }]}
                  placeholder="PDF password"
                  placeholderTextColor={c.textSecondary}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (status.kind === 'error') setStatus({ kind: 'idle' });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={unlock}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <SymbolView
                    name={showPassword ? 'eye.slash' : 'eye'}
                    size={20}
                    tintColor={c.textSecondary}
                  />
                </Pressable>
              </View>

              {status.kind === 'error' && (
                <View style={styles.errorRow}>
                  <SymbolView name="exclamationmark.triangle.fill" size={16} tintColor={c.error} />
                  <Text style={[styles.errorLabel, { color: c.error }]}>{status.message}</Text>
                </View>
              )}

              <Pressable
                onPress={unlock}
                disabled={!canUnlock}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: c.accent,
                    opacity: !canUnlock ? 0.35 : pressed ? 0.85 : 1,
                  },
                ]}>
                {status.kind === 'working' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <SymbolView name="lock.open" size={18} tintColor="#fff" />
                    <Text style={styles.primaryButtonLabel}>Unlock PDF</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          <Text style={[styles.footer, { color: c.textSecondary }]}>
            Works offline · No files leave your device
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const palette = {
  light: {
    background: '#F2F3F7',
    card: '#FFFFFF',
    border: '#E2E4EA',
    text: '#16181D',
    textSecondary: '#6E7380',
    accent: '#3B6CF6',
    accentSoft: '#E6ECFE',
    success: '#2FA163',
    error: '#D64545',
  },
  dark: {
    background: '#0E0F12',
    card: '#1A1C21',
    border: '#2A2D35',
    text: '#F4F5F7',
    textSecondary: '#9BA0AC',
    accent: '#5B86FF',
    accentSoft: '#21294A',
    success: '#46C07F',
    error: '#F26D6D',
  },
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  form: { gap: 14 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerHint: {
    fontSize: 12,
    marginTop: 2,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 17,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  errorLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    alignSelf: 'stretch',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  card: {
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  doneTitle: {
    fontSize: 21,
    fontWeight: '700',
  },
  fileName: {
    fontSize: 14,
    maxWidth: '90%',
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '500',
    padding: 6,
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
  },
});
