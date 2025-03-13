import { useUIState } from '@/context/UIStateContext';

// Type for color scheme
export type ColorScheme = 'light' | 'dark';

// Hook to get the current color scheme
export function useColorScheme(): ColorScheme {
  try {
    // Get theme from UIStateContext
    const { theme } = useUIState();
    return theme;
  } catch (error) {
    // Default to dark mode if UIStateContext is not available
    return 'dark';
  }
}

// These functions are kept for backward compatibility
export async function getCurrentTheme(): Promise<ColorScheme> {
  try {
    const { theme } = useUIState();
    return theme;
  } catch (error) {
    return 'dark';
  }
}

export async function toggleColorScheme(): Promise<ColorScheme> {
  try {
    const { toggleTheme, theme } = useUIState();
    await toggleTheme();
    return theme === 'dark' ? 'light' : 'dark';
  } catch (error) {
    return 'dark';
  }
}
