import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ImageGrid } from '@/components/ImageGrid';
import { ImageViewer } from '@/components/ImageViewer';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';

const { width } = Dimensions.get('window');

export default function HiddenScreen() {
  const { hasPasscode, verifyPasscode, theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaLibrary.Asset | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [refreshGrid, setRefreshGrid] = useState(0);
  
  // Animation values
  const [unlockAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));
  
  // Check if passcode is set
  useEffect(() => {
    if (!hasPasscode) {
      // If no passcode is set, redirect to settings
      router.replace('/(tabs)/settings');
    }
  }, [hasPasscode]);
  
  // Handle passcode verification
  const handleVerifyPasscode = async () => {
    if (!passcodeInput.trim()) {
      setPasscodeError('Please enter your passcode');
      shakePasscodeInput();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isValid = await verifyPasscode(passcodeInput);
      
      if (isValid) {
        // Animate unlock
        Animated.timing(unlockAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setIsUnlocked(true);
        });
      } else {
        setPasscodeError('Invalid passcode');
        setPasscodeInput('');
        shakePasscodeInput();
      }
    } catch (error) {
      console.error('Error verifying passcode:', error);
      setPasscodeError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Shake animation for invalid passcode
  const shakePasscodeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };
  
  // Handle image press
  const handleImagePress = (asset: MediaLibrary.Asset) => {
    setSelectedImage(asset);
    setImageViewerVisible(true);
  };

  // Handle image viewer close
  const handleImageViewerClose = () => {
    setImageViewerVisible(false);
  };

  // Handle image updated
  const handleImageUpdated = () => {
    // Trigger a refresh of the ImageGrid when favorites/deleted status changes
    setRefreshGrid(prev => prev + 1);
  };
  
  // Render passcode screen
  const renderPasscodeScreen = () => {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={isDark ? ['#121212', '#1a1a1a', '#202020'] : ['#f8f8f8', '#f0f0f0', '#e8e8e8']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        
        <Animated.View 
          style={[
            styles.passcodeContainer,
            {
              opacity: unlockAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateY: unlockAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.lockIconContainer}>
            <IconSymbol 
              name="lock.fill" 
              size={40} 
              color={isDark ? '#ffffff' : '#007AFF'} 
            />
          </View>
          
          <ThemedText style={styles.title}>Hidden Images</ThemedText>
          <ThemedText style={styles.subtitle}>Enter your passcode to view hidden images</ThemedText>
          
          <Animated.View 
            style={{
              width: '100%',
              transform: [{ translateX: shakeAnim }],
            }}
          >
            <TextInput
              style={[
                styles.passcodeInput,
                { 
                  backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                  color: colors.text,
                  borderColor: passcodeError ? '#ff3b30' : 'transparent'
                }
              ]}
              placeholder="Enter passcode"
              placeholderTextColor={colors.text + '50'}
              value={passcodeInput}
              onChangeText={setPasscodeInput}
              secureTextEntry
              keyboardType="number-pad"
              autoFocus
              onSubmitEditing={handleVerifyPasscode}
            />
          </Animated.View>
          
          {passcodeError ? (
            <ThemedText style={styles.errorText}>{passcodeError}</ThemedText>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.unlockButton,
              { backgroundColor: colors.tint }
            ]}
            onPress={handleVerifyPasscode}
            disabled={isLoading}
          >
            <ThemedText style={styles.unlockButtonText}>
              {isLoading ? 'Verifying...' : 'Unlock'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  };
  
  // If not unlocked, show passcode screen
  if (!isUnlocked) {
    return renderPasscodeScreen();
  }
  
  // If unlocked, show hidden images
  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={isDark ? ['#121212', '#1a1a1a', '#202020'] : ['#f8f8f8', '#f0f0f0', '#e8e8e8']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Hidden Images</ThemedText>
      </View>
      
      <ImageGrid 
        key={`hidden-grid-${refreshGrid}`}
        category="hidden" 
        onImagePress={handleImagePress} 
      />

      {selectedImage && (
        <ImageViewer
          visible={imageViewerVisible}
          asset={selectedImage}
          onClose={handleImageViewerClose}
          onImageUpdated={handleImageUpdated}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  passcodeContainer: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: '80%',
  },
  passcodeInput: {
    width: '100%',
    maxWidth: 300,
    height: 60,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 15,
    borderWidth: 1,
    alignSelf: 'center',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  unlockButton: {
    width: '100%',
    maxWidth: 300,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
}); 