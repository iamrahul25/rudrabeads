import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { infoStyles as s } from '@/components/info/styles';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { business, companyPhotos } from '@/data/business';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

function SectionTitle({ children }: { children: string }) {
  return (
    <UnderlinedHeading style={s.sectionTitleWrap} textStyle={s.sectionTitle}>
      {children}
    </UnderlinedHeading>
  );
}

export function AboutUs() {
  const { isTablet } = useResponsive();
  const { about } = business;

  return (
    <>
      <View style={styles.intro}>
        <Text style={styles.kicker}>Welcome to</Text>
        <Text style={styles.brand}>{business.name}</Text>
        <Text style={styles.meta}>
          Since {business.established} · {business.city}
        </Text>
      </View>
      {about.paragraphs.map((paragraph) => (
        <Text key={paragraph.slice(0, 24)} style={s.paragraph}>
          {paragraph}
        </Text>
      ))}

      <SectionTitle>Why Us?</SectionTitle>
      <View style={s.card}>
        <Text style={s.paragraph}>{about.whyUs.intro}</Text>
        {about.whyUs.points.map((point) => (
          <View key={point} style={s.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={s.bulletText}>{point}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>Factsheet</SectionTitle>
      {about.factsheet.map((group) => (
        <View key={group.title} style={s.card}>
          <Text style={s.cardTitle}>{group.title}</Text>
          {group.rows.map(([label, value]) => (
            <View key={label} style={s.fact}>
              <Text style={s.factLabel}>{label}</Text>
              <Text style={s.factValue} selectable>
                {value}
              </Text>
            </View>
          ))}
        </View>
      ))}

      <SectionTitle>Company Album</SectionTitle>
      <View style={[styles.album, isTablet && styles.albumTablet]}>
        {companyPhotos.map((photo) => (
          <View key={photo.image} style={[styles.photoCard, isTablet && styles.photoCardTablet]}>
            <Image
              source={photo.source}
              style={[styles.photo, { aspectRatio: isTablet ? 1 : photo.width / photo.height }]}
              contentFit="cover"
              accessibilityLabel={photo.title}
            />
            <View style={styles.photoText}>
              <Text style={styles.photoSection}>{photo.section}</Text>
              <Text style={s.cardTitle}>{photo.title}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[s.card, styles.cta]}>
        <Text style={s.cardTitle}>For more information</Text>
        <Text style={s.paragraph}>{business.tagline}</Text>
        <PrimaryButton label="Contact Us" onPress={() => router.push('/info/contact')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingTop: spacing.sm,
    gap: 2,
  },
  kicker: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primarySoft,
  },
  brand: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: colors.text,
  },
  meta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  album: {
    gap: spacing.md,
  },
  albumTablet: {
    flexDirection: 'row',
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photoCardTablet: {
    flex: 1,
  },
  photo: {
    width: '100%',
    backgroundColor: colors.placeholder,
  },
  photoText: {
    padding: spacing.md,
    gap: 2,
  },
  photoSection: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  cta: {
    marginTop: spacing.md,
  },
});
