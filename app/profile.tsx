import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Platform, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppBarSimple } from '@/components/AppBarSimple';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Storage keys
const PROFILE_NAME_KEY = 'profile_name';
const PROFILE_PICTURE_KEY = 'profile_picture_uri';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [name, setName] = useState('User');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  
  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
    fetchMediaStats();
  }, []);
  
  // Load profile data from AsyncStorage
  const loadProfileData = async () => {
    try {
      const storedName = await AsyncStorage.getItem(PROFILE_NAME_KEY);
      const storedPicture = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      
      if (storedName) {
        setName(storedName);
      }
      
      if (storedPicture) {
        setProfilePicture(storedPicture);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };
  
  // Save profile data to AsyncStorage
  const saveProfileData = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_NAME_KEY, name);
      if (profilePicture) {
        await AsyncStorage.setItem(PROFILE_PICTURE_KEY, profilePicture);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  };
  
  // Fetch media statistics
  const fetchMediaStats = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Get total photos
        const { totalCount } = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
        });
        setTotalPhotos(totalCount);
        
        // Get albums
        const albums = await MediaLibrary.getAlbumsAsync();
        setTotalAlbums(albums.length);
      }
    } catch (error) {
      console.error('Error fetching media stats:', error);
    }
  };
  
  // Handle profile picture selection
  const handleSelectProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting profile picture:', error);
    }
  };
  
  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      saveProfileData();
    } else {
      setIsEditing(true);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <AppBarSimple
        title="Profile"
        leftIcon="chevron.left"
        rightIcon={isEditing ? "checkmark" : "pencil"}
        onLeftIconPress={handleBackPress}
        onRightIconPress={toggleEditMode}
      />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <TouchableOpacity 
          style={styles.profilePictureContainer}
          onPress={isEditing ? handleSelectProfilePicture : undefined}
          activeOpacity={isEditing ? 0.7 : 1}
        >
          {profilePicture ? (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.profilePicture} 
            />
          ) : (
            <View style={[
              styles.profilePicturePlaceholder,
              { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }
            ]}>
              <IconSymbol name="person.fill" size={60} color={colors.tint} />
            </View>
          )}
          
          {isEditing && (
            <View style={styles.editOverlay}>
              <IconSymbol name="camera.fill" size={24} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Profile Name */}
        {isEditing ? (
          <TextInput
            style={[
              styles.nameInput,
              { color: colors.text }
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
            placeholderTextColor={colors.text + '80'}
            autoCapitalize="words"
            maxLength={30}
          />
        ) : (
          <ThemedText style={styles.name}>{name}</ThemedText>
        )}
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalPhotos}</ThemedText>
            <ThemedText style={styles.statLabel}>Photos</ThemedText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalAlbums}</ThemedText>
            <ThemedText style={styles.statLabel}>Albums</ThemedText>
          </View>
        </View>
        
        {/* Edit Profile Button (only shown when not in edit mode) */}
        {!isEditing && (
          <TouchableOpacity 
            style={[
              styles.editButton,
              { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }
            ]}
            onPress={() => setIsEditing(true)}
          >
            <IconSymbol name="pencil" size={18} color={colors.tint} />
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profilePictureContainer: {
    marginTop: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 200,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    width: '80%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#ccc',
    opacity: 0.5,
    marginHorizontal: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  editButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
}); 