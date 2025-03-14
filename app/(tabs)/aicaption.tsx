import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Text,
  Clipboard,
  Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';
import { imageToBase64, generateImageCaption } from '@/services/openaiService';

// Storage key for saved captions
const SAVED_CAPTIONS_KEY = 'smartgallery_saved_captions';

// Interface for saved caption
interface SavedCaption {
  id: string;
  imageUri: string;
  caption: string;
  timestamp: number;
}

export default function AICaptionScreen() {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedCaptions, setSavedCaptions] = useState<SavedCaption[]>([]);
  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Load saved captions on mount
  useEffect(() => {
    loadSavedCaptions();
  }, []);
  
  // Reset state when screen loses focus and regains focus
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen comes into focus
      
      // Return a cleanup function that runs when the screen goes out of focus
      return () => {
        // Reset state when navigating away
        setSelectedImage(null);
        setPrompt('');
        setCaption('');
        setIsLoading(false);
      };
    }, [])
  );
  
  // Load saved captions from AsyncStorage
  const loadSavedCaptions = async () => {
    try {
      const savedCaptionsJson = await AsyncStorage.getItem(SAVED_CAPTIONS_KEY);
      if (savedCaptionsJson) {
        setSavedCaptions(JSON.parse(savedCaptionsJson));
      }
    } catch (error) {
      console.error('Error loading saved captions:', error);
    }
  };
  
  // Save caption to AsyncStorage
  const saveCaption = async (imageUri: string, captionText: string) => {
    try {
      const newCaption: SavedCaption = {
        id: Date.now().toString(),
        imageUri,
        caption: captionText,
        timestamp: Date.now()
      };
      
      const updatedCaptions = [newCaption, ...savedCaptions];
      setSavedCaptions(updatedCaptions);
      await AsyncStorage.setItem(SAVED_CAPTIONS_KEY, JSON.stringify(updatedCaptions));
    } catch (error) {
      console.error('Error saving caption:', error);
    }
  };
  
  // Handle image selection
  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setCaption(''); // Clear previous caption
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  // Generate caption for the selected image
  const handleGenerateCaption = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select an image first.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert image to base64
      let base64Image;
      try {
        base64Image = await imageToBase64(selectedImage);
        console.log('Image converted to base64');
      } catch (imageError) {
        console.error('Error converting image:', imageError);
        Alert.alert(
          'Image Processing Error',
          'There was a problem processing your image. Please try another image or restart the app.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      // Generate caption using OpenAI API
      const userPrompt = prompt.trim() 
        ? prompt 
        : 'Create an engaging, social media-ready caption for this image. Instead of describing what\'s in the image, capture its mood, emotion, and essence. The caption should be personal, thoughtful, and reflect the feeling or message that the image conveys. Make it something someone would actually post on Instagram - not a description but a meaningful caption that complements the image.';
      
      try {
        const generatedCaption = await generateImageCaption(base64Image, userPrompt);
        setCaption(generatedCaption);
        
        // Save caption
        await saveCaption(selectedImage, generatedCaption);
      } catch (apiError) {
        console.error('API error:', apiError);
        Alert.alert(
          'Caption Generation Failed',
          'There was a problem connecting to the AI service. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show toast notification
  const showCopiedToast = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };
  
  return (
    <ThemedView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Toast Notification */}
      {showToast && (
        <Animated.View 
          style={[
            styles.toastContainer,
            { 
              opacity: fadeAnim,
              backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : 'rgba(70, 70, 70, 0.9)'
            }
          ]}
        >
          <Text style={styles.toastText}>Copied!</Text>
        </Animated.View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>AI Caption Generator</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Create perfect social media captions for your photos
            </ThemedText>
          </View>
          
          {/* Image Selection Area */}
          <TouchableOpacity 
            style={[
              styles.imageContainer,
              { backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0' }
            ]}
            onPress={handleSelectImage}
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <ThemedText style={styles.placeholderText}>Tap to select an image</ThemedText>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Prompt Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  color: colors.text,
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  borderColor: isDark ? '#3a3a3c' : '#e0e0e0'
                }
              ]}
              placeholder="Enter a custom prompt or theme (optional)"
              placeholderTextColor={isDark ? '#8e8e93' : '#a0a0a0'}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
            />
          </View>
          
          {/* Generate Button */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: colors.tint }
            ]}
            onPress={handleGenerateCaption}
            disabled={isLoading || !selectedImage}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? '#000000' : '#ffffff'} size="small" />
            ) : (
              <Text style={[
                styles.generateButtonText,
                { color: isDark ? '#000000' : '#ffffff' }
              ]}>
                Generate Caption
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Generated Caption */}
          {caption ? (
            <View style={[
              styles.captionContainer,
              { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }
            ]}>
              <View style={styles.captionHeader}>
                <ThemedText type="defaultSemiBold" style={styles.captionTitle}>
                  Your Caption:
                </ThemedText>
                <TouchableOpacity 
                  style={[
                    styles.copyButton,
                    { backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0' }
                  ]}
                  onPress={() => {
                    Clipboard.setString(caption);
                    showCopiedToast();
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📋</Text>
                  <ThemedText style={styles.copyButtonText}>Copy</ThemedText>
                </TouchableOpacity>
              </View>
              <ThemedText style={[
                styles.captionText,
                { color: isDark ? '#ffffff' : '#000000' }
              ]}>
                {caption}
              </ThemedText>
            </View>
          ) : null}
          
          {/* Recent Captions */}
          {savedCaptions.length > 0 && !caption && (
            <View style={styles.recentCaptionsContainer}>
              <ThemedText type="defaultSemiBold" style={styles.recentCaptionsTitle}>
                Recent Captions
              </ThemedText>
              
              {savedCaptions.slice(0, 3).map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[
                    styles.recentCaptionItem,
                    { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }
                  ]}
                  onPress={() => {
                    setSelectedImage(item.imageUri);
                    setCaption(item.caption);
                  }}
                >
                  <Image source={{ uri: item.imageUri }} style={styles.recentCaptionImage} />
                  <View style={styles.recentCaptionContent}>
                    <ThemedText 
                      numberOfLines={2} 
                      style={styles.recentCaptionText}
                    >
                      {item.caption}
                    </ThemedText>
                    <ThemedText style={styles.recentCaptionDate}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.7,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  placeholderText: {
    opacity: 0.6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captionContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  captionTitle: {
    fontSize: 18,
  },
  captionText: {
    lineHeight: 24,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 10,
  },
  copyButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  recentCaptionsContainer: {
    marginTop: 20,
  },
  recentCaptionsTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  recentCaptionItem: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recentCaptionImage: {
    width: 80,
    height: 80,
  },
  recentCaptionContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recentCaptionText: {
    fontSize: 14,
  },
  recentCaptionDate: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 5,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -75,
    width: 150,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 