import React, { useState, useRef, useEffect } from 'react';
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
  FlatList,
  Text
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';
import { askQuestionAboutImage } from '@/services/imageQAService';

// Message interface for chat
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ImageQAScreen() {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
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
        // Add welcome message
        setMessages([
          {
            id: Date.now().toString(),
            text: "I can answer questions about this image. What would you like to know?",
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };
  
  // Send message to AI
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedImage) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Use the imageQAService to get a response
      const aiResponse = await askQuestionAboutImage(selectedImage, userMessage.text);
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't process your question. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'AI Image Q&A',
          headerStyle: {
            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
          },
          headerTintColor: isDark ? '#ffffff' : '#000000',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {!selectedImage ? (
          <View style={styles.selectImageContainer}>
            <View style={styles.imagePromptContainer}>
              <ThemedText type="title" style={styles.title}>
                AI Image Q&A
              </ThemedText>
              <ThemedText type="subtitle" style={styles.subtitle}>
                Select an image and ask questions about it
              </ThemedText>
              
              <TouchableOpacity
                style={[
                  styles.selectImageButton,
                  { backgroundColor: colors.tint }
                ]}
                onPress={handleSelectImage}
              >
                <Text style={styles.selectImageButtonText}>
                  Select Image
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.chatContainer}>
              <View style={styles.selectedImageContainer}>
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.selectedImage} 
                  resizeMode="cover"
                />
              </View>
              
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      message.isUser
                        ? [styles.userMessage, { backgroundColor: colors.tint }]
                        : [
                            styles.aiMessage,
                            { 
                              backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0',
                            }
                          ]
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.messageText,
                        message.isUser && { color: isDark ? '#000000' : '#ffffff' }
                      ]}
                    >
                      {message.text}
                    </ThemedText>
                  </View>
                ))}
                
                {isLoading && (
                  <View
                    style={[
                      styles.messageBubble,
                      styles.aiMessage,
                      { 
                        backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0',
                      }
                    ]}
                  >
                    <ActivityIndicator
                      size="small"
                      color={colors.tint}
                      style={styles.loadingIndicator}
                    />
                  </View>
                )}
              </ScrollView>
              
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  borderTopColor: isDark ? '#2c2c2e' : '#e0e0e0'
                }
              ]}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    { 
                      color: isDark ? '#ffffff' : '#000000',
                      backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0'
                    }
                  ]}
                  placeholder="Ask a question about the image..."
                  placeholderTextColor={isDark ? '#8e8e93' : '#a0a0a0'}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                />
                
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.tint }
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={isDark ? '#000000' : '#ffffff'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  selectImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePromptContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  selectImageButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectImageButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  chatContainer: {
    flex: 1,
  },
  selectedImageContainer: {
    width: '100%',
    height: height * 0.3,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingIndicator: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 