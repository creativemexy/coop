import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Audio } from 'expo-av';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { initializeAds } from './src/utils/ads';

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Keep splash visible during initialization
        await SplashScreen.preventAutoHideAsync();
        
        // Initialize app
        await restoreSession();
        await initializeAds().catch(() => {
          /* ads are optional */
        });

        // Play coin sound and wait for it to finish
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(require('./assets/coin.mp3'));
          await sound.playAsync();

          const status = await sound.getStatusAsync();
          const audioDurationMs =
            status && status.isLoaded && typeof status.durationMillis === 'number'
              ? status.durationMillis + 250
              : 4000;

          const minSplashDurationMs = Math.max(4000, audioDurationMs);

          await new Promise<void>((resolve) => {
            let settled = false;

            const finish = () => {
              if (settled) return;
              settled = true;
              sound.setOnPlaybackStatusUpdate(null);
              resolve();
            };

            const timer = setTimeout(finish, minSplashDurationMs);

            sound.setOnPlaybackStatusUpdate((playbackStatus) => {
              if (!playbackStatus || !('didJustFinish' in playbackStatus)) return;

              if (playbackStatus.didJustFinish) {
                clearTimeout(timer);
                finish();
              }
            });
          });
        } catch (error) {
          console.warn('Error playing splash sound:', error);
          // Still show splash for at least 4 seconds
          await new Promise((resolve) => setTimeout(resolve, 4000));
        }
      } catch (error) {
        console.warn('App initialization error:', error);
      } finally {
        // Hide splash after sound finishes
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
        setIsReady(true);
      }
    };

    prepare();
  }, [restoreSession]);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
