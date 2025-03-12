import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppBarSimple } from '@/components/AppBarSimple';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function EditScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleBackPress = () => {
    Alert.alert('Back', 'Navigate back to previous screen');
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Navigate to profile screen');
  };

  return (
    <ThemedView style={styles.container}>
      <AppBarSimple
        title="Edit Image"
        leftIcon="xmark"
        rightIcon="person.crop.circle"
        onLeftIconPress={handleBackPress}
        onRightIconPress={handleProfilePress}
      />
      
      <View style={styles.content}>
        <View style={styles.editPlaceholder}>
          <IconSymbol 
            name="wand.and.stars" 
            size={50} 
            color={colors.tint} 
          />
          <ThemedText style={styles.title}>Image Editor</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select an image from your gallery to start editing
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 