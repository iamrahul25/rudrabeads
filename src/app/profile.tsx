import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useAccount, type Profile } from '@/context/AccountContext';
import { useGoBack } from '@/hooks/useGoBack';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Errors = Partial<Record<keyof Profile, string>>;

function validate(profile: Profile): Errors {
  const errors: Errors = {};
  if (profile.name.trim().length < 2) errors.name = 'Enter your name.';
  if (profile.phone.trim() && !isValidPhone(profile.phone)) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (profile.email.trim() && !isValidEmail(profile.email)) errors.email = 'Enter a valid email.';
  return errors;
}

export default function ProfileScreen() {
  const goBack = useGoBack('/(tabs)/account');
  const { profile, updateProfile } = useAccount();
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<Errors>({});

  const save = () => {
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    updateProfile({
      name: draft.name.trim(),
      phone: draft.phone.trim() ? normalizePhone(draft.phone) : '',
      email: draft.email.trim(),
    });
    goBack();
  };

  const field = (key: keyof Profile) => ({
    value: draft[key],
    error: errors[key],
    onChangeText: (text: string) => setDraft((prev) => ({ ...prev, [key]: text })),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title="Edit Profile" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Name" autoComplete="name" textContentType="name" {...field('name')} />
        <TextField
          label="Mobile number"
          optional
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          {...field('phone')}
        />
        <TextField
          label="Email"
          optional
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          {...field('email')}
        />
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Save" onPress={save} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
