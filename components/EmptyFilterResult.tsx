import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';

type EmptyFilterResultProps = {
  month: string | null;
  year: number | null;
  onClearFilter: () => void;
};

export function EmptyFilterResult({ month, year, onClearFilter }: EmptyFilterResultProps) {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Format the filter message
  const getFilterMessage = () => {
    if (month && year) {
      return `No photos found for ${month} ${year}`;
    } else if (month) {
      return `No photos found for ${month}`;
    } else if (year) {
      return `No photos found for ${year}`;
    }
    return 'No photos found';
  };

  return (
    <View style={styles.container}>
      <IconSymbol 
        name="photo.on.rectangle.angled" 
        size={60} 
        color={isDark ? '#555' : '#ccc'} 
      />
      <ThemedText style={styles.message}>{getFilterMessage()}</ThemedText>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.tint }
        ]}
        onPress={onClearFilter}
      >
        <ThemedText style={styles.buttonText}>Clear Filter</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 