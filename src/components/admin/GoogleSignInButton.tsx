import { StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

export type GoogleSignInButtonProps = {
  clientId: string;
  /** Receives the Google ID token (a JWT) to send to the API. */
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
};

export function disableGoogleAutoSelect() {}

/** Native builds don't include the admin panel; GoogleSignInButton.web.tsx is the real button. */
export function GoogleSignInButton(_props: GoogleSignInButtonProps) {
  return <Text style={styles.text}>Google sign-in is available on the web admin panel.</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
