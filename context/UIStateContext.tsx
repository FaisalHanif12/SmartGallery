import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const HIDDEN_IMAGES_KEY = 'smartgallery_hidden_images';
const HIDDEN_PASSCODE_KEY = 'smartgallery_hidden_passcode';
const THEME_PREFERENCE_KEY = 'smartgallery_theme_preference';

type ColorScheme = 'light' | 'dark';

type UIStateContextType = {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  toggleTheme: () => Promise<void>;
  theme: ColorScheme;
  hiddenImages: string[];
  addToHidden: (imageIds: string[]) => Promise<void>;
  removeFromHidden: (imageId: string) => Promise<void>;
  hasPasscode: boolean;
  setPasscode: (passcode: string) => Promise<void>;
  resetPasscode: () => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<boolean>;
};

export const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

interface UIStateProviderProps {
  children: ReactNode;
  initialTheme?: ColorScheme;
}

export function UIStateProvider({ children, initialTheme = 'dark' }: UIStateProviderProps) {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [hiddenImages, setHiddenImages] = useState<string[]>([]);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [theme, setTheme] = useState<ColorScheme>(initialTheme);

  // Load hidden images and passcode status on mount
  useEffect(() => {
    (async () => {
      try {
        // Load hidden images
        const storedHiddenImages = await AsyncStorage.getItem(HIDDEN_IMAGES_KEY);
        if (storedHiddenImages) {
          setHiddenImages(JSON.parse(storedHiddenImages));
        }

        // Check if passcode exists
        const passcode = await AsyncStorage.getItem(HIDDEN_PASSCODE_KEY);
        setHasPasscode(!!passcode);
        
        // Load saved theme preference
        const savedTheme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme as ColorScheme);
        }
      } catch (error) {
        console.error('Error loading UI state data:', error);
      }
    })();
  }, []);

  const setTabBarVisible = (visible: boolean) => {
    setIsTabBarVisible(visible);
  };

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newTheme: ColorScheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newTheme);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  // Add images to hidden
  const addToHidden = async (imageIds: string[]) => {
    try {
      const newHiddenImages = [...hiddenImages, ...imageIds.filter(id => !hiddenImages.includes(id))];
      setHiddenImages(newHiddenImages);
      await AsyncStorage.setItem(HIDDEN_IMAGES_KEY, JSON.stringify(newHiddenImages));
    } catch (error) {
      console.error('Error adding to hidden images:', error);
    }
  };

  // Remove image from hidden
  const removeFromHidden = async (imageId: string) => {
    try {
      const newHiddenImages = hiddenImages.filter(id => id !== imageId);
      setHiddenImages(newHiddenImages);
      await AsyncStorage.setItem(HIDDEN_IMAGES_KEY, JSON.stringify(newHiddenImages));
    } catch (error) {
      console.error('Error removing from hidden images:', error);
    }
  };

  // Set passcode
  const setPasscode = async (passcode: string) => {
    try {
      await AsyncStorage.setItem(HIDDEN_PASSCODE_KEY, passcode);
      setHasPasscode(true);
    } catch (error) {
      console.error('Error setting passcode:', error);
    }
  };

  // Reset passcode
  const resetPasscode = async () => {
    try {
      await AsyncStorage.removeItem(HIDDEN_PASSCODE_KEY);
      setHasPasscode(false);
    } catch (error) {
      console.error('Error resetting passcode:', error);
    }
  };

  // Verify passcode
  const verifyPasscode = async (passcode: string) => {
    try {
      const storedPasscode = await AsyncStorage.getItem(HIDDEN_PASSCODE_KEY);
      return storedPasscode === passcode;
    } catch (error) {
      console.error('Error verifying passcode:', error);
      return false;
    }
  };

  return (
    <UIStateContext.Provider 
      value={{ 
        isTabBarVisible, 
        setTabBarVisible, 
        toggleTheme,
        theme,
        hiddenImages,
        addToHidden,
        removeFromHidden,
        hasPasscode,
        setPasscode,
        resetPasscode,
        verifyPasscode
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
} 