import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, Animated } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';

// Custom tab bar background component
const CustomTabBarBackground = ({ style }: { style?: ViewStyle }) => {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  return (
    <View 
      style={[
        style, 
        { 
          backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
          opacity: Platform.OS === 'ios' ? 0.9 : 1,
        }
      ]} 
    />
  );
};

export default function TabLayout() {
  const { theme, isTabBarVisible, hasPasscode } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Create animated value for tab bar visibility
  const [tabBarHeight] = React.useState(new Animated.Value(isTabBarVisible ? 1 : 0));

  // Update animation when visibility changes
  React.useEffect(() => {
    Animated.timing(tabBarHeight, {
      toValue: isTabBarVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isTabBarVisible, tabBarHeight]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => <CustomTabBarBackground style={styles.tabBarBackground} />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 5,
          borderRadius: 25,
          height: 65,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3.5,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          // Hide tab bar when not visible
          transform: [
            {
              translateY: tabBarHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
          opacity: tabBarHeight,
          // Prevent interaction when hidden
          display: isTabBarVisible ? 'flex' : 'none',
        },
        tabBarItemStyle: {
          height: 50,
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { backgroundColor: `${color}20` }]
            ]}>
              <IconSymbol size={22} name="photo.on.rectangle" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="hidden"
        options={{
          title: 'Hidden',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { backgroundColor: `${color}20` }]
            ]}>
              <IconSymbol size={22} name="eye-off" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="edit"
        options={{
          title: 'Edit Image',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { backgroundColor: `${color}20` }]
            ]}>
              <IconSymbol size={22} name="color-wand-outline" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="aicaption"
        options={{
          title: 'AI Caption',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { backgroundColor: `${color}20` }]
            ]}>
              <IconSymbol size={22} name="chatbubble-outline" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { backgroundColor: `${color}20` }]
            ]}>
              <IconSymbol size={22} name="settings-outline" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    borderRadius: 25,
    overflow: 'hidden',
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },
});
