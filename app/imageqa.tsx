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
  Text,
  Animated,
  Pressable
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Saved chat interface
interface SavedChat {
  id: string;
  imageUri: string;
  title: string;
  messages: Message[];
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;
  
  // Load saved chats on mount
  useEffect(() => {
    loadSavedChats();
  }, []);
  
  // Auto-save chat when messages change
  useEffect(() => {
    if (selectedImage && messages.length > 0) {
      autoSaveChat();
    }
  }, [messages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);
  
  // Load saved chats from AsyncStorage
  const loadSavedChats = async () => {
    try {
      const savedChatsJson = await AsyncStorage.getItem('saved_image_qa_chats');
      if (savedChatsJson) {
        const parsedChats = JSON.parse(savedChatsJson);
        // Convert string timestamps back to Date objects
        const chatsWithDates = parsedChats.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSavedChats(chatsWithDates);
      }
    } catch (error) {
      console.error('Error loading saved chats:', error);
    }
  };
  
  // Auto-save current chat without alert
  const autoSaveChat = async () => {
    if (!selectedImage || messages.length === 0) return;
    
    try {
      // Create a title from the first user message or use default
      const firstUserMessage = messages.find(m => m.isUser);
      const title = firstUserMessage 
        ? firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')
        : 'Chat ' + new Date().toLocaleDateString();
      
      // Check if this chat already exists in saved chats (by image URI and first message)
      const existingChatIndex = savedChats.findIndex(chat => 
        chat.imageUri === selectedImage && 
        JSON.stringify(chat.messages[0]?.text) === JSON.stringify(messages[0]?.text)
      );
      
      const newChat: SavedChat = {
        id: existingChatIndex >= 0 ? savedChats[existingChatIndex].id : Date.now().toString(),
        imageUri: selectedImage,
        title,
        messages,
        timestamp: new Date()
      };
      
      let updatedChats;
      if (existingChatIndex >= 0) {
        // Update existing chat
        updatedChats = [...savedChats];
        updatedChats[existingChatIndex] = newChat;
      } else {
        // Add new chat
        updatedChats = [newChat, ...savedChats];
      }
      
      setSavedChats(updatedChats);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('saved_image_qa_chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error auto-saving chat:', error);
    }
  };
  
  // Save current chat with user feedback
  const saveCurrentChat = async () => {
    if (!selectedImage || messages.length === 0) return;
    
    try {
      await autoSaveChat();
      // Show feedback
      alert('Chat saved successfully!');
    } catch (error) {
      console.error('Error saving chat:', error);
      alert('Failed to save chat. Please try again.');
    }
  };
  
  // Load a saved chat
  const loadSavedChat = (chat: SavedChat) => {
    setSelectedImage(chat.imageUri);
    setMessages(chat.messages);
    setSidebarOpen(false);
  };
  
  // Delete a saved chat
  const deleteSavedChat = async (chatId: string) => {
    try {
      const updatedChats = savedChats.filter(chat => chat.id !== chatId);
      setSavedChats(updatedChats);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('saved_image_qa_chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error deleting chat:', error);
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
    
    // Scroll to bottom immediately after user message
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
    
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
      
      // Scroll to bottom again after AI response
      if (scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
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
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          headerRight: () => (
            <View style={styles.headerButtons}>
              {selectedImage && messages.length > 0 && (
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={saveCurrentChat}
                >
                  <Ionicons 
                    name="bookmark-outline" 
                    size={24} 
                    color={isDark ? '#ffffff' : '#000000'} 
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setSidebarOpen(true)}
              >
                <Ionicons 
                  name="menu" 
                  size={24} 
                  color={isDark ? '#ffffff' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Pressable 
          style={styles.overlay} 
          onPress={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar,
          { 
            transform: [{ translateX: sidebarAnim }],
            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
          }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <ThemedText type="title" style={styles.sidebarTitle}>Saved Chats</ThemedText>
          <TouchableOpacity onPress={() => setSidebarOpen(false)}>
            <Ionicons 
              name="close" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.savedChatsContainer}>
          {savedChats.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons 
                name="chatbubble-ellipses-outline" 
                size={48} 
                color={isDark ? '#4a4a4c' : '#c0c0c0'} 
              />
              <ThemedText style={styles.emptyStateText}>
                No saved chats yet
              </ThemedText>
            </View>
          ) : (
            savedChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={[
                  styles.savedChatItem,
                  { borderBottomColor: isDark ? '#2c2c2e' : '#e0e0e0' }
                ]}
                onPress={() => loadSavedChat(chat)}
              >
                <Image 
                  source={{ uri: chat.imageUri }} 
                  style={styles.savedChatImage} 
                />
                <View style={styles.savedChatInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>
                    {chat.title}
                  </ThemedText>
                  <ThemedText style={styles.savedChatDate}>
                    {formatDate(chat.timestamp)}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSavedChat(chat.id)}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={20} 
                    color={isDark ? '#ff453a' : '#ff3b30'} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
                <Text style={[
                  styles.selectImageButtonText,
                  { color: isDark ? '#000000' : '#ffffff' }
                ]}>
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
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
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
                
                <View style={styles.sendButtonContainer}>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  sidebarTitle: {
    fontSize: 20,
  },
  savedChatsContainer: {
    flex: 1,
  },
  savedChatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  savedChatImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  savedChatInfo: {
    flex: 1,
    marginLeft: 15,
  },
  savedChatDate: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    opacity: 0.6,
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
    paddingVertical: 10,
    borderTopWidth: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 50,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
}); 