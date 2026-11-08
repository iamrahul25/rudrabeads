import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

type Props = {
  children: string;
  textStyle?: TextStyle;
  style?: ViewStyle;
  lineWidth?: number;
  accessibilityRole?: 'header' | 'text';
};

export function UnderlinedHeading({
  children,
  textStyle,
  style,
  lineWidth = 28,
  accessibilityRole = 'header',
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text accessibilityRole={accessibilityRole} style={textStyle}>
        {children}
      </Text>
      <View style={[styles.line, { width: lineWidth }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
  },
  line: {
    marginTop: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
  },
});
