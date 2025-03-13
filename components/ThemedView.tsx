import { View, type ViewProps } from 'react-native';
import { useUIState } from '@/context/UIStateContext';
import { Colors } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  let theme = 'dark';
  try {
    const uiState = useUIState();
    theme = uiState.theme;
  } catch (error) {
    // Default to dark mode if UIStateContext is not available
  }

  const isDark = theme === 'dark';
  const backgroundColor = isDark 
    ? (darkColor || Colors.dark.background) 
    : (lightColor || Colors.light.background);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
