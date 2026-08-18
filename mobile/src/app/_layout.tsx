import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black } from '@expo-google-fonts/montserrat';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { RadioProvider } from '../context/RadioContext';
import { DownloadProvider } from '../context/DownloadContext';
import { VideoProvider } from '../context/VideoContext';
import PersistentPlayer from '../components/PersistentPlayer';
import FloatingVideoPlayer from '../components/FloatingVideoPlayer';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <VideoProvider>
      <DownloadProvider>
        <RadioProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="watch/[id]" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="search" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <FloatingVideoPlayer />
          <PersistentPlayer />
          <StatusBar style="auto" />
        </RadioProvider>
      </DownloadProvider>
    </VideoProvider>
  );
}
