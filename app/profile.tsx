import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image, 
  Platform, 
  TextInput, 
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppBarSimple } from '@/components/AppBarSimple';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Storage keys
const PROFILE_NAME_KEY = 'profile_name';
const PROFILE_PICTURE_KEY = 'profile_picture_uri';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const [name, setName] = useState('User');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  
  // Animation values
  const buttonScale = useState(new Animated.Value(1))[0];
  
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
  
  // Button press animation
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setIsEditing(true));
  };
  
  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#121212', '#1a1a1a', '#202020'] : ['#f8f8f8', '#f0f0f0', '#e8e8e8']}
        style={StyleSheet.absoluteFillObject}
      />
      
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
          onPress={handleSelectProfilePicture}
          activeOpacity={0.8}
        >
          {profilePicture ? (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.profilePicture} 
            />
          ) : (
            <View style={[
              styles.profilePicturePlaceholder,
              { backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0' }
            ]}>
              <IconSymbol name="person.fill" size={80} color={colors.tint} />
            </View>
          )}
          
          {isEditing && (
            <View style={styles.editOverlay}>
              <IconSymbol name="camera.fill" size={28} color="#FFFFFF" />
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
            <View style={styles.statLabelContainer}>
              <IconSymbol name="photo" size={16} color={isDark ? '#aaaaaa' : '#777777'} />
              <ThemedText style={styles.statLabel}>Photos</ThemedText>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalAlbums}</ThemedText>
            <View style={styles.statLabelContainer}>
              <IconSymbol name="folder" size={16} color={isDark ? '#aaaaaa' : '#777777'} />
              <ThemedText style={styles.statLabel}>Albums</ThemedText>
            </View>
          </View>
        </View>
        
        {/* Edit Profile Button (only shown when not in edit mode) */}
        {!isEditing && (
          <TouchableOpacity 
            onPressIn={animateButtonPress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.editButton,
                { 
                  backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0',
                  transform: [{ scale: buttonScale }]
                }
              ]}
            >
              <IconSymbol name="pencil.outline" size={18} color={colors.tint} />
              <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
            </Animated.View>
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
    marginTop: 30,
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    letterSpacing: 0.3,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 200,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
    width: '90%',
    maxWidth: 400,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    marginLeft: 6,
    opacity: 0.6,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#ccc',
    opacity: 0.5,
    marginHorizontal: 30,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
    width: width * 0.6,
    maxWidth: 250,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 16,
  },
}); 