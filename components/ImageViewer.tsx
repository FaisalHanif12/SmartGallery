import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Keys for AsyncStorage
const FAVORITES_STORAGE_KEY = 'smartgallery_favorites';
const DELETED_STORAGE_KEY = 'smartgallery_deleted';

type ImageViewerProps = {
  asset: MediaLibrary.Asset | null;
  visible: boolean;
  onClose: () => void;
  onImageUpdated: () => void;
};

export function ImageViewer({ asset, visible, onClose, onImageUpdated }: ImageViewerProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Check if the image is in favorites when it changes
  useEffect(() => {
    if (asset) {
      checkFavoriteStatus();
    }
  }, [asset]);

  // Check if the current image is in favorites
  const checkFavoriteStatus = async () => {
    try {
      if (!asset) return;
      
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const favorites = JSON.parse(storedFavorites);
        setIsFavorite(favorites.includes(asset.id));
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async () => {
    try {
      if (!asset) return;
      
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      let favorites: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];
      
      if (favorites.includes(asset.id)) {
        // Remove from favorites
        favorites = favorites.filter(id => id !== asset.id);
        setIsFavorite(false);
      } else {
        // Add to favorites
        favorites.push(asset.id);
        setIsFavorite(true);
      }
      
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      onImageUpdated(); // Notify parent component that favorites have changed
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Move to recently deleted
  const moveToDeleted = async () => {
    try {
      if (!asset) return;
      
      const storedDeleted = await AsyncStorage.getItem(DELETED_STORAGE_KEY);
      let deletedItems: string[] = storedDeleted ? JSON.parse(storedDeleted) : [];
      
      // Add to deleted if not already there
      if (!deletedItems.includes(asset.id)) {
        deletedItems.push(asset.id);
        await AsyncStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedItems));
      }
      
      // If it was a favorite, remove from favorites
      if (isFavorite) {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          const updatedFavorites = favorites.filter((id: string) => id !== asset.id);
          await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
        }
      }
      
      onImageUpdated(); // Notify parent component that data has changed
      onClose(); // Close the viewer
    } catch (error) {
      console.error('Error moving to deleted:', error);
    }
  };

  if (!asset) return null;

  // Format creation date
  const creationDate = new Date(asset.creationTime);
  const formattedDate = creationDate.toLocaleString();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}>
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }
      ]}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        
        {/* Header - Enhanced for better visibility */}
        <View style={[
          styles.header,
          { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }
        ]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
            <ThemedText style={styles.backText}>Gallery</ThemedText>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
        
        {/* Image - Adjusted size */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: asset.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        
        {/* Image Info - Simplified */}
        <View style={styles.infoContainer}>
          <ThemedText style={styles.details}>
            Created: {formattedDate}
          </ThemedText>
        </View>
        
        {/* Bottom Actions - Refined */}
        <View style={styles.actionsOuterContainer}>
          <View style={[
            styles.actionsContainer,
            { 
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(45, 45, 50, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: colorScheme === 'dark'
                ? 'rgba(80, 80, 90, 0.3)'
                : 'rgba(200, 200, 210, 0.5)'
            }
          ]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleFavorite}>
              <View style={[
                styles.iconContainer,
                isFavorite && { 
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(255, 59, 48, 0.2)' 
                    : 'rgba(255, 59, 48, 0.1)' 
                }
              ]}>
                <IconSymbol
                  name="heart.fill"
                  size={22}
                  color={isFavorite ? '#ff3b30' : colors.text}
                />
              </View>
              <ThemedText style={[
                styles.actionText,
                isFavorite && { color: '#ff3b30' }
              ]}>
                {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={moveToDeleted}>
              <View style={styles.iconContainer}>
                <IconSymbol name="trash" size={22} color={colors.text} />
              </View>
              <ThemedText style={styles.actionText}>
                Move to Deleted
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    left: 0,
    right: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  backText: {
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 4,
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50, // Add space for the header
  },
  image: {
    width: width * 0.95,
    height: height * 0.65,
  },
  infoContainer: {
    padding: 16,
    marginTop: 15,
  },
  details: {
    fontSize: 15,
    opacity: 0.8,
    textAlign: 'center',
  },
  actionsOuterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
}); 