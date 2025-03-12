import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import { IconSymbol } from './IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  style?: ViewStyle;
}

export function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onDismiss,
  style,
}: ToastProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const timeout = useRef<NodeJS.Timeout | null>(null);

  // Icon and colors based on toast type
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark.circle.fill',
          iconColor: '#34C759',
          gradientColors: isDark 
            ? ['#1E3A2F', '#162A21'] as const
            : ['#E8F8EE', '#D5F2E2'] as const,
        };
      case 'error':
        return {
          icon: 'xmark.circle.fill',
          iconColor: '#FF3B30',
          gradientColors: isDark 
            ? ['#3A1E1E', '#2A1616'] as const
            : ['#F8E8E8', '#F2D5D5'] as const,
        };
      case 'info':
        return {
          icon: 'info.circle.fill',
          iconColor: '#007AFF',
          gradientColors: isDark 
            ? ['#1E2A3A', '#16202A'] as const
            : ['#E8F0F8', '#D5E5F2'] as const,
        };
    }
  };

  const config = getToastConfig();

  // Handle animation when visibility changes
  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      timeout.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      // Reset animation values when not visible
      translateY.setValue(20);
      opacity.setValue(0);
      backdropOpacity.setValue(0);
      scale.setValue(0.8);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [visible, duration]);

  // Handle manual dismiss
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -20,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.outerContainer}>
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
            opacity: backdropOpacity,
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.container,
          style,
          {
            transform: [
              { translateY },
              { scale }
            ],
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={config.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <IconSymbol name={config.icon} size={28} color={config.iconColor} />
            </View>
            <Text style={[
              styles.message,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}>
              {message}
            </Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dismissText,
                { color: isDark ? '#FFFFFF99' : '#00000099' }
              ]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  gradient: {
    width: Math.min(width - 60, 360),
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  dismissButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    minWidth: 100,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 