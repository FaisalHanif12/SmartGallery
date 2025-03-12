import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type CategoryTabProps = {
  onCategoryChange: (category: string) => void;
};

const categories = [
  { id: 'all', label: 'All Photos 📸' },
  { id: 'favorites', label: 'Favorites ❤️' },
  { id: 'people', label: 'People 🧑‍🤝‍🧑' },
  { id: 'deleted', label: 'Recently Deleted 🗑️' },
  { id: 'albums', label: 'Albums 📂' },
];

export function CategoryTabs({ onCategoryChange }: CategoryTabProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [itemsLayout, setItemsLayout] = useState<{ [key: string]: { x: number, width: number } }>({});
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const indicatorWidthAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange(categoryId);

    // Scroll to the selected tab
    if (scrollViewRef.current && itemsLayout[categoryId]) {
      scrollViewRef.current.scrollTo({
        x: Math.max(0, itemsLayout[categoryId].x - 20),
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (itemsLayout[activeCategory]) {
      Animated.parallel([
        Animated.spring(indicatorAnim, {
          toValue: itemsLayout[activeCategory].x,
          useNativeDriver: false,
          friction: 8,
        }),
        Animated.spring(indicatorWidthAnim, {
          toValue: itemsLayout[activeCategory].width,
          useNativeDriver: false,
          friction: 8,
        }),
      ]).start();
    }
  }, [activeCategory, itemsLayout]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive
                    ? colorScheme === 'dark'
                      ? 'rgba(80, 80, 90, 0.3)'
                      : 'rgba(240, 240, 250, 0.8)'
                    : 'transparent',
                },
              ]}
              onPress={() => handleCategoryPress(category.id)}
              onLayout={(e) => {
                const layout = e.nativeEvent.layout;
                setItemsLayout((prev) => ({
                  ...prev,
                  [category.id]: { x: layout.x, width: layout.width },
                }));
              }}>
              <ThemedText
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? colors.tint
                      : colorScheme === 'dark'
                      ? '#ccc'
                      : '#666',
                    fontWeight: isActive ? 'bold' : 'normal',
                  },
                ]}>
                {category.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.tint,
            left: indicatorAnim,
            width: indicatorWidthAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    paddingBottom: 3,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 3,
  },
}); 