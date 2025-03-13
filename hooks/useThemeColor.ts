/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';

type ColorScheme = 'light' | 'dark';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  let theme: ColorScheme = 'dark';
  try {
    const uiState = useUIState();
    theme = uiState.theme;
  } catch (error) {
    // Default to dark mode if UIStateContext is not available
  }

  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
