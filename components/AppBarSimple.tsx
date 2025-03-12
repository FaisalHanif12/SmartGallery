import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {/* Left Icon */}
      {leftIcon ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onLeftIconPress}
          activeOpacity={0.7}
        >
          <IconSymbol name={leftIcon} size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      {/* Title */}
      <ThemedText style={styles.title}>{title}</ThemedText>

      {/* Right Icon */}
      {rightIcon ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRightIconPress}
          activeOpacity={0.7}
        >
          <IconSymbol name={rightIcon} size={24} color={colors.text} />
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
    height: Platform.OS === 'ios' ? 44 : 56,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
    width: '100%',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
}); 