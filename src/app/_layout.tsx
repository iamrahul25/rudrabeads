import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts as useDMSans,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_700Bold,
  useFonts as usePlayfair,
} from '@expo-google-fonts/playfair-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';

import { AccountProvider, useAccount } from '@/context/AccountContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { useWishlist, WishlistProvider } from '@/context/WishlistContext';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_700Bold });
  const [dmLoaded] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const fontsReady = playfairLoaded && dmLoaded;

  return (
    <AccountProvider>
      <WishlistProvider>
        <CartProvider>
          <HydrationGate fontsReady={fontsReady}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="category/[id]" />
              <Stack.Screen name="mukhi/[count]" />
              <Stack.Screen name="cart" options={{ presentation: 'card' }} />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="address" />
              <Stack.Screen name="info/[page]" />
              <Stack.Screen name="notifications" />
            </Stack>
          </HydrationGate>
        </CartProvider>
      </WishlistProvider>
    </AccountProvider>
  );
}

function HydrationGate({ fontsReady, children }: { fontsReady: boolean; children: ReactNode }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const account = useAccount();
  const ready = fontsReady && cart.hydrated && wishlist.hydrated && account.hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return children;
}
