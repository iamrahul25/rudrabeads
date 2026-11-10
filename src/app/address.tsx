import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressForm } from '@/components/AddressForm';
import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAccount } from '@/context/AccountContext';
import { useGoBack } from '@/hooks/useGoBack';
import { emptyAddress, normalizePhone, validateAddress, type AddressErrors } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function AddressScreen() {
  const goBack = useGoBack('/(tabs)/account');
  const { address: saved, profile, saveAddress } = useAccount();
  const [address, setAddress] = useState(
    () => saved ?? { ...emptyAddress, fullName: profile.name, phone: profile.phone, email: profile.email },
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const save = () => {
    const nextErrors = validateAddress(address);
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length) return;
    saveAddress({ ...address, phone: normalizePhone(address.phone), pincode: address.pincode.trim() });
    goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title="Delivery Address" onBack={goBack} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>This address is used by default at checkout.</Text>
          <AddressForm
            value={address}
            errors={submitted ? errors : {}}
            onChange={(next) => {
              setAddress(next);
              if (submitted) setErrors(validateAddress(next));
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footer}>
        <PrimaryButton label="Save Address" onPress={save} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  intro: {
    marginBottom: spacing.lg,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
