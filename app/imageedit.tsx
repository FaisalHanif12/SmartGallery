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
import { editImageWithAI, continueImageEditConversation } from '@/services/imageEditService';

const { width, height } = Dimensions.get('window');

// Message interface for chat
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string; // For edited images
}

// Saved chat interface
interface SavedChat {
  id: string;
  originalImageUri: string;
  currentImageUri: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function ImageEditScreen() {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
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
  }, [messages, editedImage]);
  
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
      const savedChatsJson = await AsyncStorage.getItem('saved_image_edit_chats');
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
  
  // Auto-save current chat
  const autoSaveChat = async () => {
    if (!selectedImage || messages.length === 0) return;
    
    try {
      const existingChats = [...savedChats];
      const chatId = `edit_${Date.now().toString()}`;
      
      // Check if this chat already exists
      const existingChatIndex = existingChats.findIndex(
        chat => chat.originalImageUri === selectedImage
      );
      
      if (existingChatIndex >= 0) {
        // Update existing chat
        existingChats[existingChatIndex] = {
          ...existingChats[existingChatIndex],
          currentImageUri: editedImage || selectedImage,
          messages,
          timestamp: new Date()
        };
      } else {
        // Create new chat
        const newChat: SavedChat = {
          id: chatId,
          originalImageUri: selectedImage,
          currentImageUri: editedImage || selectedImage,
          title: `Edit ${new Date().toLocaleDateString()}`,
          messages,
          timestamp: new Date()
        };
        existingChats.unshift(newChat);
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('saved_image_edit_chats', JSON.stringify(existingChats));
      setSavedChats(existingChats);
    } catch (error) {
      console.error('Error auto-saving chat:', error);
    }
  };
  
  // Save current chat with custom title
  const saveCurrentChat = async () => {
    if (!selectedImage || messages.length === 0) return;
    
    // Implement save dialog with custom title
    // For now, we'll just use a timestamp
    const title = `Edit ${new Date().toLocaleString()}`;
    
    try {
      const existingChats = [...savedChats];
      const chatId = `edit_${Date.now().toString()}`;
      
      const newChat: SavedChat = {
        id: chatId,
        originalImageUri: selectedImage,
        currentImageUri: editedImage || selectedImage,
        title,
        messages,
        timestamp: new Date()
      };
      
      existingChats.unshift(newChat);
      await AsyncStorage.setItem('saved_image_edit_chats', JSON.stringify(existingChats));
      setSavedChats(existingChats);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };
  
  // Load a saved chat
  const loadSavedChat = (chat: SavedChat) => {
    setSelectedImage(chat.originalImageUri);
    setEditedImage(chat.currentImageUri);
    setMessages(chat.messages);
    setSidebarOpen(false);
  };
  
  // Delete a saved chat
  const deleteSavedChat = async (chatId: string) => {
    try {
      const updatedChats = savedChats.filter(chat => chat.id !== chatId);
      await AsyncStorage.setItem('saved_image_edit_chats', JSON.stringify(updatedChats));
      setSavedChats(updatedChats);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };
  
  // Select an image from the gallery
  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setEditedImage(null);
      setMessages([
        {
          id: Date.now().toString(),
          text: "I've selected this image. What edits would you like to make?",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  };
  
  // Send a message and get a response
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedImage || isLoading) return;
    
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
      // If this is the first user message, we'll edit the image
      if (messages.filter(m => m.isUser).length === 0) {
        // Add a loading message
        const loadingMessage: Message = {
          id: `loading_${Date.now().toString()}`,
          text: "I'm editing your image based on your instructions...",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage, loadingMessage]);
        
        // Edit the image
        const editedImageUrl = await editImageWithAI(selectedImage, inputText.trim());
        setEditedImage(editedImageUrl);
        
        // Replace the loading message with the result
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: "I've edited your image based on your instructions. What do you think?",
          isUser: false,
          timestamp: new Date(),
          imageUrl: editedImageUrl
        };
        
        setMessages(prev => prev.filter(m => m.id !== loadingMessage.id));
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // For subsequent messages, we'll continue the conversation
        // Convert messages to the format expected by the API
        const conversation = messages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        }));
        
        // Get AI response
        const aiResponse = await continueImageEditConversation(
          editedImage || selectedImage,
          conversation,
          inputText.trim()
        );
        
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Sorry, there was an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render the sidebar with saved chats
  const renderSidebar = () => {
    return (
      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7',
            transform: [{ translateX: sidebarAnim }]
          }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <ThemedText style={styles.sidebarTitle}>Saved Edits</ThemedText>
          <TouchableOpacity
            style={styles.closeSidebarButton}
            onPress={() => setSidebarOpen(false)}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.savedChatsList}>
          {savedChats.length === 0 ? (
            <ThemedText style={styles.noSavedChats}>
              No saved edits yet. Edit an image to get started!
            </ThemedText>
          ) : (
            savedChats.map(chat => (
              <TouchableOpacity
                key={chat.id}
                style={[
                  styles.savedChatItem,
                  { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }
                ]}
                onPress={() => loadSavedChat(chat)}
              >
                <Image
                  source={{ uri: chat.currentImageUri }}
                  style={styles.savedChatImage}
                />
                <View style={styles.savedChatInfo}>
                  <ThemedText style={styles.savedChatTitle} numberOfLines={1}>
                    {chat.title}
                  </ThemedText>
                  <ThemedText style={styles.savedChatDate}>
                    {formatDate(chat.timestamp)}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.deleteChatButton}
                  onPress={() => deleteSavedChat(chat.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.text} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>
    );
  };
  
  // Render a message bubble
  const renderMessage = (message: Message) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          message.isUser
            ? [styles.userBubble, { backgroundColor: colors.tint }]
            : [styles.aiBubble, { backgroundColor: isDark ? '#2c2c2e' : '#e9e9eb' }]
        ]}
      >
        {message.imageUrl && (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.messageImage}
            resizeMode="contain"
          />
        )}
        <Text
          style={[
            styles.messageText,
            { color: message.isUser ? '#ffffff' : colors.text }
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            { color: message.isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}
        >
          {formatDate(message.timestamp)}
        </Text>
      </View>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>AI Image Editor</ThemedText>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarOpen(true)}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Sidebar */}
      {renderSidebar()}
      
      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!selectedImage ? (
          // Image selection screen
          <View style={styles.selectImageContainer}>
            <Ionicons
              name="image-outline"
              size={80}
              color={colors.tint}
              style={styles.selectImageIcon}
            />
            <ThemedText style={styles.selectImageText}>
              Select an image to start editing
            </ThemedText>
            <TouchableOpacity
              style={[styles.selectImageButton, { backgroundColor: colors.tint }]}
              onPress={handleSelectImage}
            >
              <Text style={styles.selectImageButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Chat screen
          <>
            {/* Display the current image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: editedImage || selectedImage }}
                style={styles.selectedImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Chat messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map(renderMessage)}
            </ScrollView>
            
            {/* Input area */}
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7' }]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
                    color: colors.text
                  }
                ]}
                placeholder={
                  messages.filter(m => m.isUser).length === 0
                    ? "Describe how you'd like to edit this image..."
                    : "Continue the conversation..."
                }
                placeholderTextColor={isDark ? '#8e8e93' : '#8e8e93'}
                value={inputText}
                onChangeText={setInputText}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.tint },
                  (!inputText.trim() || isLoading) && styles.disabledButton
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="send" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
      
      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setSidebarOpen(false)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  selectImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectImageIcon: {
    marginBottom: 20,
  },
  selectImageText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  selectImageButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  selectImageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
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
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeSidebarButton: {
    padding: 8,
  },
  savedChatsList: {
    flex: 1,
  },
  noSavedChats: {
    padding: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  savedChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  savedChatImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  savedChatInfo: {
    flex: 1,
  },
  savedChatTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  savedChatDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  deleteChatButton: {
    padding: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
}); 