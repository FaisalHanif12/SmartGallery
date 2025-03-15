import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppBarSimple } from '@/components/AppBarSimple';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

export default function EditScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleBackPress = () => {
    router.back();
  };

  const handleProfilePress = () => {
    router.push('/settings');
  };

  const handleStartEditing = () => {
    router.push('/imageedit');
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
          <ThemedText style={styles.title}>AI Image Editor</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select an image from your gallery to start editing with AI
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.tint }]}
            onPress={handleStartEditing}
          >
            <ThemedText style={styles.startButtonText}>Start Editing</ThemedText>
          </TouchableOpacity>
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
    marginBottom: 30,
  },
  startButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 