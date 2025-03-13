import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Switch, 
  TextInput, 
  Alert,
  ScrollView,
  Platform,
  Animated,
  Modal,
  StatusBar,
  Dimensions
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function SettingsScreen() {
  const { toggleTheme, theme, hasPasscode, setPasscode, resetPasscode, verifyPasscode } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [currentPasscodeInput, setCurrentPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isSettingPasscode, setIsSettingPasscode] = useState(true);
  
  // Animation values
  const switchAnim = useState(new Animated.Value(0))[0];
  
  // Handle theme toggle
  const handleThemeToggle = async () => {
    // Animate the switch
    Animated.sequence([
      Animated.timing(switchAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(switchAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Toggle theme
    await toggleTheme();
  };
  
  // Handle passcode setting
  const handlePasscodeSetting = () => {
    if (hasPasscode) {
      // If passcode exists, we need to verify before resetting
      setIsSettingPasscode(false);
      setCurrentPasscodeInput('');
      setPasscodeInput('');
      setConfirmPasscodeInput('');
      setPasscodeError('');
    } else {
      // If no passcode, we can directly set a new one
      setIsSettingPasscode(true);
      setPasscodeInput('');
      setConfirmPasscodeInput('');
      setPasscodeError('');
    }
    setShowPasscodeModal(true);
  };
  
  // Handle passcode submission
  const handlePasscodeSubmit = async () => {
    if (isSettingPasscode) {
      // Setting a new passcode
      if (!passcodeInput.trim()) {
        setPasscodeError('Please enter a passcode');
        return;
      }
      
      if (passcodeInput !== confirmPasscodeInput) {
        setPasscodeError('Passcodes do not match');
        return;
      }
      
      await setPasscode(passcodeInput);
      setShowPasscodeModal(false);
      Alert.alert('Success', 'Passcode has been set successfully');
    } else {
      // Verifying current passcode before resetting
      if (!currentPasscodeInput.trim()) {
        setPasscodeError('Please enter your current passcode');
        return;
      }
      
      const isValid = await verifyPasscode(currentPasscodeInput);
      if (!isValid) {
        setPasscodeError('Invalid passcode');
        return;
      }
      
      // If we're resetting, just reset and close
      if (!passcodeInput.trim()) {
        await resetPasscode();
        setShowPasscodeModal(false);
        Alert.alert('Success', 'Passcode has been removed');
        return;
      }
      
      // If we're setting a new one, validate it
      if (passcodeInput !== confirmPasscodeInput) {
        setPasscodeError('New passcodes do not match');
        return;
      }
      
      // Reset old passcode and set new one
      await resetPasscode();
      await setPasscode(passcodeInput);
      setShowPasscodeModal(false);
      Alert.alert('Success', 'Passcode has been updated successfully');
    }
  };
  
  // Render passcode modal
  const renderPasscodeModal = () => {
    return (
      <Modal
        visible={showPasscodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasscodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }
          ]}>
            <ThemedText style={styles.modalTitle}>
              {isSettingPasscode 
                ? 'Set Passcode for Hidden Images' 
                : 'Reset Passcode for Hidden Images'}
            </ThemedText>
            
            {!isSettingPasscode && (
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000',
                    borderColor: passcodeError ? '#ff3b30' : isDark ? '#333333' : '#e0e0e0',
                    marginBottom: 15
                  }
                ]}
                placeholder="Current Passcode"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                value={currentPasscodeInput}
                onChangeText={setCurrentPasscodeInput}
                secureTextEntry
                keyboardType="number-pad"
              />
            )}
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: passcodeError ? '#ff3b30' : isDark ? '#333333' : '#e0e0e0',
                  marginBottom: 15
                }
              ]}
              placeholder={isSettingPasscode ? "New Passcode" : "New Passcode (optional)"}
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={passcodeInput}
              onChangeText={setPasscodeInput}
              secureTextEntry
              keyboardType="number-pad"
            />
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: passcodeError ? '#ff3b30' : isDark ? '#333333' : '#e0e0e0'
                }
              ]}
              placeholder="Confirm Passcode"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={confirmPasscodeInput}
              onChangeText={setConfirmPasscodeInput}
              secureTextEntry
              keyboardType="number-pad"
            />
            
            {passcodeError ? (
              <ThemedText style={styles.errorText}>{passcodeError}</ThemedText>
            ) : null}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { 
                    backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                    marginRight: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }
                ]}
                onPress={() => setShowPasscodeModal(false)}
              >
                <ThemedText style={[
                  styles.modalButtonText,
                  { color: isDark ? '#ffffff' : '#000000' }
                ]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { 
                    backgroundColor: isDark ? '#ffffff' : '#007AFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }
                ]}
                onPress={handlePasscodeSubmit}
              >
                <ThemedText style={[
                  styles.modalButtonText,
                  { color: isDark ? '#000000' : '#ffffff' }
                ]}>
                  {isSettingPasscode ? 'Set Passcode' : 'Update Passcode'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
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
      
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <ThemedText style={styles.subtitle}>App settings and preferences</ThemedText>
      </View>
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
          
          <View style={[
            styles.settingItem,
            { backgroundColor: isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
          ]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <IconSymbol 
                  name={isDark ? "moon" : "sunny"} 
                  size={22} 
                  color={isDark ? "#ffffff" : "#ff9500"} 
                />
              </View>
              <ThemedText style={styles.settingText}>Dark Mode</ThemedText>
            </View>
            
            <Animated.View
              style={{
                transform: [
                  {
                    scale: switchAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.1, 1],
                    }),
                  },
                ],
              }}
            >
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDark ? '#007AFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </Animated.View>
          </View>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Privacy</ThemedText>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
            ]}
            onPress={handlePasscodeSetting}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <IconSymbol 
                  name="lock-closed" 
                  size={22} 
                  color={isDark ? "#ffffff" : "#007AFF"} 
                />
              </View>
              <ThemedText style={styles.settingText}>
                {hasPasscode ? "Reset Passcode" : "Set Passcode"}
              </ThemedText>
            </View>
            
            <IconSymbol 
              name="chevron-forward" 
              size={20} 
              color={colors.text + '80'} 
            />
          </TouchableOpacity>
          
          <ThemedText style={styles.settingDescription}>
            {hasPasscode 
              ? "Your hidden images are protected with a passcode." 
              : "Set a passcode to protect your hidden images."}
          </ThemedText>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          
          <View style={[
            styles.settingItem,
            { backgroundColor: isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
          ]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <IconSymbol 
                  name="information-circle" 
                  size={22} 
                  color={isDark ? "#ffffff" : "#007AFF"} 
                />
              </View>
              <ThemedText style={styles.settingText}>Version</ThemedText>
            </View>
            
            <ThemedText style={styles.versionText}>1.0.0</ThemedText>
          </View>
        </View>
      </ScrollView>
      
      {renderPasscodeModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 160 : 140,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 10,
    marginTop: 5,
    marginBottom: 15,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
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
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 