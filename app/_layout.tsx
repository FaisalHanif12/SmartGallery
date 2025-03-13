import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { UIStateProvider } from '@/context/UIStateContext';
import { useUIState } from '@/context/UIStateContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Key for storing theme preference
const THEME_PREFERENCE_KEY = 'smartgallery_theme_preference';

function RootLayoutNav() {
  const nativeColorScheme = useNativeColorScheme();
  const initialColorScheme = nativeColorScheme === null ? 'dark' : nativeColorScheme;
  const [loaded, setLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Load theme from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (!(savedTheme === 'light' || savedTheme === 'dark')) {
          // If no saved preference, use dark mode as default
          await AsyncStorage.setItem(THEME_PREFERENCE_KEY, 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UIStateProvider initialTheme={initialColorScheme}>
      <ThemedNavigationContainer />
    </UIStateProvider>
  );
}

function ThemedNavigationContainer() {
  const { theme } = useUIState();
  
  return (
    <>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="hidden" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default RootLayoutNav;
