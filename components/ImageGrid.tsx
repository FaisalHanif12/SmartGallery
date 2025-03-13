import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  View,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Text,
  Platform,
  TextInput,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUIState } from '@/context/UIStateContext';
import { Toast } from './ui/Toast';

const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = width / numColumns - 10;

// Key for storing favorites in AsyncStorage
const FAVORITES_STORAGE_KEY = 'smartgallery_favorites';
// Key for storing "deleted" images (we're not actually deleting them)
const DELETED_STORAGE_KEY = 'smartgallery_deleted';

type ImageGridProps = {
  category: string;
  onImagePress: (asset: MediaLibrary.Asset) => void;
};

export function ImageGrid({ category, onImagePress }: ImageGridProps) {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [deletedItems, setDeletedItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { theme, setTabBarVisible, hiddenImages, addToHidden, hasPasscode, verifyPasscode } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Load favorites and deleted items from AsyncStorage
  const loadStoredData = useCallback(async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      
      const storedDeleted = await AsyncStorage.getItem(DELETED_STORAGE_KEY);
      if (storedDeleted) {
        setDeletedItems(JSON.parse(storedDeleted));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }, []);

  // Request permissions and load initial data
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        await loadStoredData();
        loadImages();
      } else {
        setIsLoading(false);
      }
    })();
  }, []);

  // Reload images when category changes
  useEffect(() => {
    if (hasPermission) {
      loadImages();
    }
  }, [category, hasPermission, favorites, deletedItems, selectedAlbum]);

  // Exit selection mode when category changes
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedItems([]);
  }, [category]);

  // Hide tab bar when entering selection mode, show it when exiting
  useEffect(() => {
    setTabBarVisible(!isSelectionMode);
    
    // Make sure tab bar is visible when component unmounts
    return () => {
      setTabBarVisible(true);
    };
  }, [isSelectionMode, setTabBarVisible]);

  // Function to toggle favorite status for a single item
  const toggleFavorite = async (assetId: string) => {
    try {
      let newFavorites;
      if (favorites.includes(assetId)) {
        newFavorites = favorites.filter(id => id !== assetId);
      } else {
        newFavorites = [...favorites, assetId];
      }
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      
      // Reload images if we're in favorites category
      if (category === 'favorites') {
        loadImages();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorites', 'error');
    }
  };

  // Function to show toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Function to hide toast
  const hideToast = () => {
    setToastVisible(false);
  };

  // Function to add multiple items to favorites
  const addMultipleToFavorites = async () => {
    try {
      let newFavorites = [...favorites];
      // Store the count before clearing the array
      const selectedCount = selectedItems.length;
      
      // Add each selected item to favorites if not already there
      selectedItems.forEach(id => {
        if (!newFavorites.includes(id)) {
          newFavorites.push(id);
        }
      });
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      
      // Exit selection mode and show tab bar
      setIsSelectionMode(false);
      setSelectedItems([]);
      
      // Show success toast instead of alert with the stored count
      showToast(`${selectedCount} items added to favorites`, 'success');
      
      // Reload images if we're in favorites category
      if (category === 'favorites') {
        loadImages();
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      showToast('Failed to update favorites', 'error');
    }
  };

  // Function to mark an image as "deleted"
  const markAsDeleted = async (assetId: string) => {
    try {
      const newDeletedItems = [...deletedItems, assetId];
      setDeletedItems(newDeletedItems);
      await AsyncStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(newDeletedItems));
      
      // Reload images
      loadImages();
    } catch (error) {
      console.error('Error marking as deleted:', error);
      showToast('Failed to move item to deleted', 'error');
    }
  };

  // Function to mark multiple images as deleted
  const moveMultipleToDeleted = async () => {
    try {
      let newDeletedItems = [...deletedItems];
      // Store the count before clearing the array
      const selectedCount = selectedItems.length;
      
      // Add each selected item to deleted if not already there
      selectedItems.forEach(id => {
        if (!newDeletedItems.includes(id)) {
          newDeletedItems.push(id);
        }
      });
      
      setDeletedItems(newDeletedItems);
      await AsyncStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(newDeletedItems));
      
      // Remove from favorites if needed
      let newFavorites = [...favorites];
      let favoritesChanged = false;
      
      selectedItems.forEach(id => {
        if (newFavorites.includes(id)) {
          newFavorites = newFavorites.filter(favId => favId !== id);
          favoritesChanged = true;
        }
      });
      
      if (favoritesChanged) {
        setFavorites(newFavorites);
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      }
      
      // Exit selection mode and show tab bar
      setIsSelectionMode(false);
      setSelectedItems([]);
      
      // Show success toast instead of alert with the stored count
      showToast(`${selectedCount} items moved to Recently Deleted`, 'success');
      
      // Reload images
      loadImages();
    } catch (error) {
      console.error('Error moving to deleted:', error);
      showToast('Failed to move items to Recently Deleted', 'error');
    }
  };

  // Function to restore a "deleted" image
  const restoreFromDeleted = async (assetId: string) => {
    try {
      const newDeletedItems = deletedItems.filter(id => id !== assetId);
      setDeletedItems(newDeletedItems);
      await AsyncStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(newDeletedItems));
      
      // Reload images if we're in deleted category
      if (category === 'deleted') {
        loadImages();
      }
    } catch (error) {
      console.error('Error restoring from deleted:', error);
      showToast('Failed to restore item', 'error');
    }
  };

  // Load albums
  const loadAlbums = async () => {
    try {
      const albumsResult = await MediaLibrary.getAlbumsAsync();
      setAlbums(albumsResult);
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  // Add a new function to handle adding to hidden images
  const promptForPasscode = () => {
    if (hasPasscode) {
      setShowPasscodePrompt(true);
      setPasscodeInput('');
      setPasscodeError('');
    } else {
      // If no passcode is set, directly add to hidden
      addToHiddenImages();
    }
  };

  const addToHiddenImages = async () => {
    try {
      // Store the count before clearing the array
      const selectedCount = selectedItems.length;
      
      await addToHidden(selectedItems);
      
      // Exit selection mode and show tab bar
      setIsSelectionMode(false);
      setSelectedItems([]);
      
      // Show success toast
      showToast(`${selectedCount} items added to Hidden Images`, 'success');
      
      // Reload images
      loadImages();
    } catch (error) {
      console.error('Error adding to hidden images:', error);
      showToast('Failed to add items to Hidden Images', 'error');
    } finally {
      setShowPasscodePrompt(false);
    }
  };

  const handlePasscodeSubmit = async () => {
    if (!passcodeInput.trim()) {
      setPasscodeError('Please enter a passcode');
      return;
    }

    const isValid = await verifyPasscode(passcodeInput);
    if (isValid) {
      addToHiddenImages();
    } else {
      setPasscodeError('Invalid passcode');
      setPasscodeInput('');
    }
  };

  // Main function to load images based on category
  const loadImages = async () => {
    setIsLoading(true);
    try {
      if (category === 'albums' && !selectedAlbum) {
        // Load albums list
        await loadAlbums();
        setPhotos([]);
        setIsLoading(false);
        return;
      }

      let assets: MediaLibrary.Asset[] = [];
      
      if (category === 'albums' && selectedAlbum) {
        // Get photos from selected album
        const { assets: albumAssets } = await MediaLibrary.getAssetsAsync({
          album: selectedAlbum,
          mediaType: 'photo',
          first: 100,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        assets = albumAssets;
      } else {
        // Get all photos
        const { assets: allAssets } = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 200, // Increased limit for better coverage
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        assets = allAssets;
      }

      // Filter based on category
      let filteredAssets = assets;
      
      if (category === 'favorites') {
        // Filter to show only favorites
        filteredAssets = assets.filter(asset => favorites.includes(asset.id));
      } else if (category === 'deleted') {
        // Filter to show only deleted items
        filteredAssets = assets.filter(asset => deletedItems.includes(asset.id));
      } else if (category === 'hidden') {
        // Filter to show only hidden items
        filteredAssets = assets.filter(asset => hiddenImages.includes(asset.id));
      } else if (category === 'all') {
        // Show all except deleted and hidden items
        filteredAssets = assets.filter(asset => 
          !deletedItems.includes(asset.id) && 
          !hiddenImages.includes(asset.id)
        );
      } else if (category === 'people') {
        // In a real app, you would use face detection
        // For now, we'll just show a subset of images as a placeholder
        filteredAssets = assets.filter((_, index) => index % 3 === 0);
      }

      setPhotos(filteredAssets);
    } catch (error) {
      console.error('Error loading images:', error);
      showToast('Failed to load images from your gallery', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadImages();
  }, [category, selectedAlbum]);

  // Toggle selection of an item
  const toggleSelection = (assetId: string) => {
    let newSelectedItems;
    
    if (selectedItems.includes(assetId)) {
      // Remove from selection
      newSelectedItems = selectedItems.filter(id => id !== assetId);
    } else {
      // Add to selection
      newSelectedItems = [...selectedItems, assetId];
    }
    
    setSelectedItems(newSelectedItems);
    
    // Exit selection mode if no items selected
    if (newSelectedItems.length === 0) {
      setIsSelectionMode(false);
    }
  };

  // Handle long press on image
  const handleLongPress = (asset: MediaLibrary.Asset) => {
    // Enter selection mode and select the item
    setIsSelectionMode(true);
    setSelectedItems([asset.id]);
  };

  // Handle press on image
  const handleImagePress = (asset: MediaLibrary.Asset) => {
    if (isSelectionMode) {
      // In selection mode, toggle selection
      toggleSelection(asset.id);
    } else {
      // Normal mode, open image viewer
      onImagePress(asset);
    }
  };

  // Cancel selection mode
  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems([]);
    // Tab bar visibility is handled by the useEffect
  };

  // Render album item
  const renderAlbumItem = ({ item }: { item: MediaLibrary.Album }) => {
    return (
      <TouchableOpacity
        style={[
          styles.albumContainer,
          {
            backgroundColor: isDark ? '#1c1c1e' : '#fff',
          },
        ]}
        onPress={() => setSelectedAlbum(item.id)}>
        <View style={styles.albumIconContainer}>
          <Text style={styles.albumIcon}>📁</Text>
        </View>
        <ThemedText style={styles.albumTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.albumCount}>{item.assetCount} photos</ThemedText>
      </TouchableOpacity>
    );
  };

  // Render image item
  const renderItem = ({ item, index }: { item: MediaLibrary.Asset; index: number }) => {
    // Create a staggered animation effect
    const animatedValue = new Animated.Value(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();

    const animatedStyle = {
      opacity: animatedValue,
      transform: [
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };

    // Vary the height slightly for a masonry-like effect
    const heightVariation = index % 3 === 0 ? 0 : index % 3 === 1 ? 20 : -20;
    const itemHeight = imageSize + heightVariation;

    const isFavorite = favorites.includes(item.id);
    const isSelected = selectedItems.includes(item.id);

    return (
      <Animated.View style={[styles.imageWrapper, animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.imageContainer,
            {
              height: itemHeight,
              backgroundColor: isDark ? '#1c1c1e' : '#fff',
            },
            isSelected && styles.selectedImageContainer,
          ]}
          onPress={() => handleImagePress(item)}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.7}>
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
            resizeMode="cover"
          />
          {isFavorite && !isSelectionMode && (
            <View style={styles.favoriteIcon}>
              <Text>❤️</Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.selectionOverlay}>
              <View style={styles.checkmarkContainer}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#ffffff" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Back button for album view
  const renderAlbumHeader = () => {
    if (!selectedAlbum) return null;
    
    return (
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedAlbum(null)}>
        <ThemedText style={styles.backButtonText}>← Back to Albums</ThemedText>
      </TouchableOpacity>
    );
  };

  // Render multi-selection action bar
  const renderSelectionActionBar = () => {
    if (!isSelectionMode) return null;
    
    return (
      <View style={[
        styles.selectionActionBar,
        { 
          backgroundColor: isDark ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Extra padding for iOS home indicator
        }
      ]}>
        <View style={styles.selectionInfo}>
          <ThemedText style={styles.selectionCount}>{selectedItems.length} selected</ThemedText>
        </View>
        
        <View style={styles.selectionActions}>
          <TouchableOpacity 
            style={styles.selectionActionButton}
            onPress={addMultipleToFavorites}>
            <View style={styles.actionIconContainer}>
              <IconSymbol name="heart.fill" size={22} color="#ff3b30" />
            </View>
            <ThemedText style={styles.selectionActionText}>Add to Favorites</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.selectionActionButton}
            onPress={moveMultipleToDeleted}>
            <View style={styles.actionIconContainer}>
              <IconSymbol name="trash" size={22} color={colors.text} />
            </View>
            <ThemedText style={styles.selectionActionText}>Move to Deleted</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.selectionActionButton}
            onPress={promptForPasscode}>
            <View style={styles.actionIconContainer}>
              <IconSymbol name="eye.slash" size={22} color={colors.text} />
            </View>
            <ThemedText style={styles.selectionActionText}>Add to Hidden</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.selectionActionButton}
            onPress={cancelSelection}>
            <View style={styles.actionIconContainer}>
              <IconSymbol name="xmark.circle" size={22} color={colors.text} />
            </View>
            <ThemedText style={styles.selectionActionText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Add a passcode prompt modal
  const renderPasscodePrompt = () => {
    if (!showPasscodePrompt) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={[
          styles.passcodePrompt,
          { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }
        ]}>
          <ThemedText style={styles.passcodeTitle}>Enter Passcode</ThemedText>
          <ThemedText style={styles.passcodeSubtitle}>
            Enter your passcode to add items to Hidden Images
          </ThemedText>
          
          <TextInput
            style={[
              styles.passcodeInput,
              { 
                color: colors.text,
                backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0',
                borderColor: passcodeError ? '#ff3b30' : 'transparent'
              }
            ]}
            value={passcodeInput}
            onChangeText={setPasscodeInput}
            placeholder="Enter passcode"
            placeholderTextColor={colors.text + '50'}
            secureTextEntry
            keyboardType="number-pad"
            autoFocus
          />
          
          {passcodeError ? (
            <ThemedText style={styles.passcodeError}>{passcodeError}</ThemedText>
          ) : null}
          
          <View style={styles.passcodeButtons}>
            <TouchableOpacity
              style={[
                styles.passcodeButton,
                { backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0' }
              ]}
              onPress={() => setShowPasscodePrompt(false)}
            >
              <ThemedText style={styles.passcodeButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.passcodeButton,
                { backgroundColor: colors.tint }
              ]}
              onPress={handlePasscodeSubmit}
            >
              <ThemedText style={[styles.passcodeButtonText, { color: '#ffffff' }]}>Submit</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Permission request view
  if (hasPermission === null) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  // Permission denied view
  if (hasPermission === false) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Gallery access permission is required.</ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');
          }}>
          <ThemedText style={{ color: '#fff' }}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Loading view
  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  // Albums list view
  if (category === 'albums' && !selectedAlbum) {
    if (albums.length === 0) {
      return (
        <ThemedView style={styles.centered}>
          <ThemedText>No albums found.</ThemedText>
        </ThemedView>
      );
    }
    
    return (
      <FlatList
        data={albums}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.albumList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  }

  // Empty state view
  if (photos.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No photos found in this category.</ThemedText>
      </ThemedView>
    );
  }

  // Photos grid view
  return (
    <View style={{ flex: 1 }}>
      {renderAlbumHeader()}
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.grid,
          isSelectionMode && { paddingBottom: Platform.OS === 'ios' ? 120 : 100 } // Increased padding for selection action bar
        ]}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={21}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {renderSelectionActionBar()}
      {renderPasscodePrompt()}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 5,
  },
  imageWrapper: {
    flex: 1/numColumns,
    padding: 5,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectedImageContainer: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  albumList: {
    padding: 16,
  },
  albumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  albumIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  albumIcon: {
    fontSize: 24,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  albumCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 1000,
  },
  selectionInfo: {
    marginBottom: 10,
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectionActionButton: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectionActionText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  passcodePrompt: {
    width: '80%',
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
  passcodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  passcodeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  passcodeInput: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  passcodeError: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 10,
  },
  passcodeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  passcodeButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  passcodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 