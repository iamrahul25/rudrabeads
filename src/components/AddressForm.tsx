import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/TextField';
import type { Address, AddressErrors } from '@/lib/orders';
import { spacing } from '@/theme/spacing';

type Props = {
  value: Address;
  errors: AddressErrors;
  onChange: (value: Address) => void;
};

export function AddressForm({ value, errors, onChange }: Props) {
  const field = (key: keyof Address) => ({
    value: value[key],
    error: errors[key],
    onChangeText: (text: string) => onChange({ ...value, [key]: text }),
  });

  return (
    <View>
      <TextField label="Full name" autoComplete="name" textContentType="name" {...field('fullName')} />
      <TextField
        label="Mobile number"
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        textContentType="telephoneNumber"
        placeholder="10-digit mobile"
        {...field('phone')}
      />
      <TextField
        label="Email"
        optional
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        {...field('email')}
      />
      <TextField
        label="House no., building, street"
        autoComplete="address-line1"
        textContentType="streetAddressLine1"
        {...field('line1')}
      />
      <TextField
        label="Area, landmark"
        optional
        autoComplete="address-line2"
        textContentType="streetAddressLine2"
        {...field('line2')}
      />
      <View style={styles.row}>
        <TextField
          label="City"
          style={styles.half}
          autoComplete="postal-address-locality"
          textContentType="addressCity"
          {...field('city')}
        />
        <TextField
          label="Pincode"
          style={styles.half}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          textContentType="postalCode"
          {...field('pincode')}
        />
      </View>
      <TextField
        label="State"
        autoComplete="postal-address-region"
        textContentType="addressState"
        {...field('state')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
});
