import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { infoStyles as s } from '@/components/info/styles';
import { business, type Review } from '@/data/business';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatReviewDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= value ? 'star' : 'star-outline'}
          size={size}
          color={colors.star}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={s.card}>
      <View style={styles.reviewer}>
        <View style={styles.initial}>
          <Text style={styles.initialText}>{review.name.charAt(0)}</Text>
        </View>
        <View style={styles.reviewerText}>
          <Text style={s.cardTitle}>{review.name}</Text>
          <Text style={s.rowHint}>{review.location}</Text>
        </View>
      </View>
      <View style={styles.reviewMeta}>
        <Stars value={review.rating} />
        <Text style={styles.date}>{formatReviewDate(review.date)}</Text>
      </View>
      <Text style={s.paragraph}>
        <Text style={styles.productLabel}>Product Name: </Text>
        {review.product}
      </Text>
      {review.tags.length ? (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Ionicons name="thumbs-up-outline" size={12} color={colors.primary} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function Testimonials() {
  const { rating, outOf, satisfaction, reviews } = business.testimonials;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

  return (
    <>
      <View style={[s.card, styles.summary]}>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>
            {rating}
            <Text style={styles.scoreOutOf}> / {outOf}</Text>
          </Text>
          <Stars value={rating} size={18} />
          <Text style={s.rowHint}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        <View style={styles.breakdown}>
          {breakdown.map(({ star, count }) => (
            <View
              key={star}
              style={styles.barRow}
              accessible
              accessibilityLabel={`${star} star: ${count} ${count === 1 ? 'review' : 'reviews'}`}
            >
              <Text style={styles.barLabel}>{star} star</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>({count})</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>User Satisfaction</Text>
        <View style={styles.satisfaction}>
          {satisfaction.map((item) => (
            <View key={item.label} style={styles.satisfactionItem}>
              <Text style={styles.satisfactionValue}>{item.percent}%</Text>
              <Text style={s.rowHint}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {reviews.map((review) => (
        <ReviewCard key={`${review.name}-${review.date}`} review={review} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  score: {
    alignItems: 'center',
    gap: 4,
  },
  scoreValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    color: colors.text,
  },
  scoreOutOf: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.textMuted,
  },
  breakdown: {
    flex: 1,
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    width: 44,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.placeholder,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.star,
  },
  barCount: {
    width: 24,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  satisfaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  satisfactionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  satisfactionValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: colors.success,
  },
  reviewer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  initial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.primary,
  },
  reviewerText: {
    gap: 2,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textMuted,
  },
  productLabel: {
    fontFamily: 'DMSans_600SemiBold',
    color: colors.text,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
  },
  tagText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.primary,
  },
});
