import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSignInButton } from '@/components/admin/GoogleSignInButton';
import { Button, Loading, Notice } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminContext';
import { errorMessage, isApiConfigured } from '@/lib/api';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const GOOGLE_CLIENT_ID = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim();

export function AdminLogin() {
  const { signIn } = useAdmin();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const onCredential = async (credential: string) => {
    setError(null);
    setVerifying(true);
    try {
      await signIn(credential);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const setupMissing = !isApiConfigured
    ? 'EXPO_PUBLIC_API_URL is not set, so the admin panel cannot reach the server.'
    : !GOOGLE_CLIENT_ID
      ? 'EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set, so Google sign-in cannot start.'
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Image source={require('../../../assets/logo.webp')} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>RudraBeads Admin</Text>
        <Text style={styles.subtitle}>
          Sign in with your Google account. Only approved admin emails can access this panel.
        </Text>

        {setupMissing ? (
          <Notice tone="error" message={`${setupMissing} Add it to .env.local and restart Expo.`} />
        ) : verifying ? (
          <Loading label="Checking your account…" />
        ) : (
          <GoogleSignInButton clientId={GOOGLE_CLIENT_ID} onCredential={onCredential} onError={setError} />
        )}

        <Notice tone="error" message={error} />

        <Button label="Back to store" variant="ghost" icon="arrow-back" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  logo: { width: 40, height: 60, alignSelf: 'center' },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
