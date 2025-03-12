import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type AppBarSimpleProps = {
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
};

export function AppBarSimple({ 
  title, 
  leftIcon, 
  rightIcon, 
  onLeftIconPress, 
  onRightIconPress 
}: AppBarSimpleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.titleContainer}>
        {leftIcon && (
          <TouchableOpacity
            style={styles.leftButton}
            onPress={onLeftIconPress}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }
            ]}>
              <IconSymbol name={leftIcon} size={22} color={colors.tint} />
            </View>
          </TouchableOpacity>
        )}
        
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={onRightIconPress}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }
            ]}>
              <IconSymbol name={rightIcon} size={22} color={colors.tint} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  leftButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  rightButton: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 16,
  },
}); 