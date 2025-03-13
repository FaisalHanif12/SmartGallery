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
  StatusBar,
  Modal
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
  const { hasPasscode, verifyPasscode, setPasscode, theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaLibrary.Asset | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [refreshGrid, setRefreshGrid] = useState(0);
  
  // Animation values
  const [unlockAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));
  
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

  // Handle passcode creation
  const handleCreatePasscode = async () => {
    if (!passcodeInput.trim()) {
      setPasscodeError('Please enter a passcode');
      shakePasscodeInput();
      return;
    }

    if (passcodeInput !== confirmPasscodeInput) {
      setPasscodeError('Passcodes do not match');
      setConfirmPasscodeInput('');
      shakePasscodeInput();
      return;
    }

    setIsLoading(true);
    try {
      await setPasscode(passcodeInput);
      // After setting passcode, show verification screen
      setPasscodeInput('');
      setConfirmPasscodeInput('');
      setPasscodeError('');
    } catch (error) {
      console.error('Error setting passcode:', error);
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
    setRefreshGrid(prev => prev + 1);
  };
  
  // Render passcode creation screen
  const renderPasscodeCreation = () => {
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
        
        <View style={styles.passcodeContainer}>
          <View style={styles.lockIconContainer}>
            <IconSymbol 
              name="lock-closed" 
              size={40} 
              color={isDark ? '#ffffff' : '#007AFF'} 
            />
          </View>
          
          <ThemedText style={styles.title}>Set Passcode</ThemedText>
          <ThemedText style={styles.subtitle}>Create a passcode to protect your hidden images</ThemedText>
          
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
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: passcodeError ? '#ff3b30' : isDark ? '#333333' : '#e0e0e0',
                  marginBottom: 15
                }
              ]}
              placeholder="Enter new passcode"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={passcodeInput}
              onChangeText={setPasscodeInput}
              secureTextEntry
              keyboardType="number-pad"
              autoFocus
            />

            <TextInput
              style={[
                styles.passcodeInput,
                { 
                  backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: passcodeError ? '#ff3b30' : isDark ? '#333333' : '#e0e0e0'
                }
              ]}
              placeholder="Confirm passcode"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={confirmPasscodeInput}
              onChangeText={setConfirmPasscodeInput}
              secureTextEntry
              keyboardType="number-pad"
              onSubmitEditing={handleCreatePasscode}
            />
          </Animated.View>
          
          {passcodeError ? (
            <ThemedText style={styles.errorText}>{passcodeError}</ThemedText>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.unlockButton,
              { 
                backgroundColor: isDark ? '#ffffff' : '#007AFF',
                width: '80%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                marginTop: 30
              }
            ]}
            onPress={handleCreatePasscode}
            disabled={isLoading}
          >
            <ThemedText style={[
              styles.unlockButtonText,
              { color: isDark ? '#000000' : '#ffffff' }
            ]}>
              {isLoading ? 'Setting...' : 'Set Passcode'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cancelButton, { marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[
              styles.cancelButtonText, 
              { color: isDark ? '#ffffff' : '#000000', opacity: 0.8 }
            ]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Render passcode verification screen
  const renderPasscodeVerification = () => {
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
              name="lock-closed" 
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
              { 
                backgroundColor: isDark ? '#ffffff' : '#007AFF',
                width: '80%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                marginTop: 30
              }
            ]}
            onPress={handleVerifyPasscode}
            disabled={isLoading}
          >
            <ThemedText style={[
              styles.unlockButtonText,
              { color: isDark ? '#000000' : '#ffffff' }
            ]}>
              {isLoading ? 'Verifying...' : 'Unlock'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cancelButton, { marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[
              styles.cancelButtonText, 
              { color: isDark ? '#ffffff' : '#000000', opacity: 0.8 }
            ]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  };
  
  // If not unlocked and no passcode set, show passcode creation
  if (!isUnlocked && !hasPasscode) {
    return renderPasscodeCreation();
  }
  
  // If not unlocked and has passcode, show verification
  if (!isUnlocked && hasPasscode) {
    return renderPasscodeVerification();
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
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  passcodeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
    textAlign: 'center',
  },
  passcodeInput: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'center'
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  unlockButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelButtonText: {
    fontSize: 16,
  },
}); 