import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';

interface AppBarSimpleProps {
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
}

export function AppBarSimple({
  title,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
}: AppBarSimpleProps) {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Create animated values for button press effects
  const [leftScale] = React.useState(new Animated.Value(1));
  const [rightScale] = React.useState(new Animated.Value(1));

  // Button press animations
  const animateButtonPress = (scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      {/* Left Icon */}
      {leftIcon ? (
        <TouchableOpacity
          onPress={() => {
            animateButtonPress(leftScale);
            if (onLeftIconPress) onLeftIconPress();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View 
            style={[
              styles.iconButton,
              { 
                backgroundColor: isDark ? 'rgba(60, 60, 60, 0.5)' : 'rgba(240, 240, 240, 0.8)',
                transform: [{ scale: leftScale }] 
              }
            ]}
          >
            <IconSymbol name={leftIcon} size={22} color={colors.text} />
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      {/* Title */}
      <ThemedText style={styles.title}>{title}</ThemedText>

      {/* Right Icon */}
      {rightIcon ? (
        <TouchableOpacity
          onPress={() => {
            animateButtonPress(rightScale);
            if (onRightIconPress) onRightIconPress();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View 
            style={[
              styles.iconButton,
              { 
                backgroundColor: isDark ? 'rgba(60, 60, 60, 0.5)' : 'rgba(240, 240, 240, 0.8)',
                transform: [{ scale: rightScale }] 
              }
            ]}
          >
            <IconSymbol name={rightIcon} size={22} color={colors.text} />
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'ios' ? 50 : 60,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    width: '100%',
    marginBottom: 8,
    marginTop: Platform.OS === 'ios' ? 50 : 30,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
}); 