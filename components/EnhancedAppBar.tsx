import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type EnhancedAppBarProps = {
  onSearch: (query: string) => void;
  onProfilePress: () => void;
  onFilterPress: () => void;
};

export function EnhancedAppBar({ onSearch, onProfilePress, onFilterPress }: EnhancedAppBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          Smart Gallery
        </ThemedText>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={onProfilePress}>
          <View style={[
            styles.profileIconContainer,
            { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }
          ]}>
            <IconSymbol name="person.crop.circle" size={28} color={colors.tint} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(44, 44, 46, 0.8)' 
            : 'rgba(240, 240, 240, 0.8)',
          borderColor: isFocused ? colors.tint : 'transparent',
        }
      ]}>
        <IconSymbol 
          name="magnifyingglass" 
          size={20} 
          color={isFocused ? colors.tint : colorScheme === 'dark' ? '#aaa' : '#777'} 
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: colorScheme === 'dark' ? '#fff' : '#000' }
          ]}
          placeholder="Search by people, objects, or events..."
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <TouchableOpacity 
          onPress={onFilterPress}
          style={styles.filterButton}
        >
          <View style={[
            styles.filterIconContainer,
            { backgroundColor: colorScheme === 'dark' ? '#3a3a3c' : '#e0e0e0' }
          ]}>
            <IconSymbol name="slider.horizontal.3" size={16} color={colors.tint} />
          </View>
        </TouchableOpacity>
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
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileButton: {
    position: 'absolute',
    right: 0,
  },
  profileIconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterButton: {
    marginLeft: 5,
  },
  filterIconContainer: {
    padding: 8,
    borderRadius: 12,
  },
}); 