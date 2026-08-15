import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
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
      } catch (error) {
        console.warn('App initialization error:', error);
      } finally {
        // Hide splash after initialization
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
