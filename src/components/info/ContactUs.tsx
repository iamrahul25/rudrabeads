import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { infoStyles as s } from '@/components/info/styles';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useAccount } from '@/context/AccountContext';
import { business, directionsUrl, telUrl, whatsappUrl } from '@/data/business';
import {
  buildEnquiryMessage,
  validateEnquiry,
  type Enquiry,
  type EnquiryErrors,
} from '@/lib/enquiry';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type ContactRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  url: string;
};

const contactRows: ContactRow[] = [
  { icon: 'call-outline', label: `Call ${business.phone}`, hint: 'Business line', url: telUrl(business.phone) },
  { icon: 'phone-portrait-outline', label: `Call ${business.mobile}`, hint: 'Mobile', url: telUrl(business.mobile) },
  { icon: 'logo-whatsapp', label: `WhatsApp ${business.mobile}`, hint: 'Chat with us', url: whatsappUrl() },
  { icon: 'navigate-outline', label: 'Get Directions', hint: 'Open in Google Maps', url: directionsUrl },
];

type SendState = 'idle' | 'opened' | 'failed';

export function ContactUs() {
  const { profile } = useAccount();
  const [enquiry, setEnquiry] = useState<Enquiry>({
    name: profile.name,
    mobile: profile.phone,
    email: profile.email,
    requirement: '',
  });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sendState, setSendState] = useState<SendState>('idle');

  const field = (key: keyof Enquiry) => ({
    value: enquiry[key],
    error: errors[key],
    onChangeText: (text: string) => {
      const next = { ...enquiry, [key]: text };
      setEnquiry(next);
      setSendState('idle');
      if (submitted) setErrors(validateEnquiry(next));
    },
  });

  const send = async () => {
    setSubmitted(true);
    const nextErrors = validateEnquiry(enquiry);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await Linking.openURL(whatsappUrl(buildEnquiryMessage(enquiry, business.name)));
      setSendState('opened');
    } catch {
      setSendState('failed');
    }
  };

  return (
    <>
      <View style={s.card}>
        <View style={styles.person}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={colors.surface} />
          </View>
          <View style={styles.personText}>
            <Text style={s.cardTitle}>{business.ceo.replace(/^Mr\.\s*/, '')} (CEO)</Text>
            <Text style={styles.company}>{business.name}</Text>
          </View>
        </View>
        <View style={s.bullet}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={s.bulletText} selectable>
            {business.address}
          </Text>
        </View>
      </View>

      <View style={s.list}>
        {contactRows.map((row) => (
          <Pressable
            key={row.label}
            style={s.row}
            onPress={() => Linking.openURL(row.url).catch(() => undefined)}
            accessibilityRole="link"
            accessibilityLabel={`${row.label}. ${row.hint}`}
          >
            <Ionicons name={row.icon} size={20} color={colors.primary} />
            <View style={s.rowText}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowHint}>{row.hint}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Corporate Office</Text>
        <Text style={s.paragraph} selectable>
          {business.address}
        </Text>
        <Text style={s.rowHint}>GST No. {business.gst}</Text>
      </View>

      <UnderlinedHeading style={s.sectionTitleWrap} textStyle={s.sectionTitle}>
        Send an Enquiry
      </UnderlinedHeading>
      <Text style={s.paragraph}>
        Tell us what you need. Your enquiry opens in WhatsApp, ready to send to {business.name}.
      </Text>
      <View>
        <TextField
          label="Describe Your Requirement"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Product, quantity, size…"
          {...field('requirement')}
        />
        <TextField label="Name" autoComplete="name" textContentType="name" {...field('name')} />
        <TextField
          label="Mobile number"
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          {...field('mobile')}
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
        <PrimaryButton label="Send on WhatsApp" onPress={send} />
        {sendState === 'opened' ? (
          <Text style={[s.rowHint, styles.status]} accessibilityLiveRegion="polite">
            WhatsApp opened with your enquiry. Tap send in WhatsApp to deliver it.
          </Text>
        ) : null}
        {sendState === 'failed' ? (
          <Text style={[styles.status, styles.failed]} accessibilityLiveRegion="polite">
            Could not open WhatsApp. Please call us on {business.mobile}.
          </Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personText: {
    gap: 2,
  },
  company: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  status: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  failed: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.danger,
  },
});
