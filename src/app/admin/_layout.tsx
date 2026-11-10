import { Stack, router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminNav } from '@/components/admin/AdminNav';
import { Button, Loading } from '@/components/admin/ui';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function AdminLayout() {
  if (Platform.OS !== 'web') return <WebOnly />;
  return (
    <AdminProvider>
      <AdminGate />
    </AdminProvider>
  );
}

/** Every admin API call is also checked on the server; this only decides what to render. */
function AdminGate() {
  const { hydrated, session } = useAdmin();
  if (!hydrated) return <Loading />;
  if (!session) return <AdminLogin />;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminNav />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SafeAreaView>
  );
}

function WebOnly() {
  return (
    <SafeAreaView style={[styles.safe, styles.center]}>
      <View style={styles.webOnly}>
        <Text style={styles.title}>Admin panel</Text>
        <Text style={styles.text}>
          The admin panel works in a web browser. Open the RudraBeads website and go to /admin to sign in.
        </Text>
        <Button label="Back to store" variant="outline" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  webOnly: { maxWidth: 360, gap: spacing.md },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: colors.text, textAlign: 'center' },
  text: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
