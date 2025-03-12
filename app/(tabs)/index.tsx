import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated, StatusBar, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { AppBar } from '@/components/AppBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ImageGrid } from '@/components/ImageGrid';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ImageViewer } from '@/components/ImageViewer';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<MediaLibrary.Asset | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [refreshGrid, setRefreshGrid] = useState(0); // Used to trigger grid refresh
  const scrollY = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // We'll handle all category filtering in the ImageGrid component
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProfilePress = () => {
    // Navigate to the profile screen
    router.push('/profile');
  };

  const handleFilterPress = () => {
    // Advanced search filters will be available soon
  };

  const handleImagePress = (asset: MediaLibrary.Asset) => {
    setSelectedImage(asset);
    setImageViewerVisible(true);
  };

  const handleImageViewerClose = () => {
    setImageViewerVisible(false);
  };

  const handleImageUpdated = () => {
    // Trigger a refresh of the ImageGrid when favorites/deleted status changes
    setRefreshGrid(prev => prev + 1);
  };

  const fabActions = [
    {
      id: 'import',
      label: 'Import Image',
      icon: 'square.and.arrow.down',
      onPress: async () => {
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
          });

          if (!result.canceled) {
            // Image imported successfully
            handleImageUpdated(); // Refresh grid to show new image
          }
        } catch (error) {
          console.error('Failed to import image:', error);
        }
      },
    },
    {
      id: 'ai',
      label: 'AI-Powered Image Q&A',
      icon: 'sparkles',
      onPress: () => {
        // AI-powered image analysis coming soon
      },
    },
    {
      id: 'camera',
      label: 'Open Camera',
      icon: 'camera',
      onPress: async () => {
        try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          
          if (status !== 'granted') {
            return;
          }
          
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
          });

          if (!result.canceled) {
            // Photo captured successfully
            handleImageUpdated(); // Refresh grid to show new image
          }
        } catch (error) {
          console.error('Failed to capture photo:', error);
        }
      },
    },
  ];

  return (
    <ThemedView style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000' : '#f8f8f8' }
    ]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <Animated.View style={[
        styles.headerContainer,
        { 
          opacity: headerOpacity,
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(0, 0, 0, 0.9)' 
            : 'rgba(248, 248, 248, 0.9)',
        }
      ]}>
        <AppBar
          onSearch={handleSearch}
          onProfilePress={handleProfilePress}
          onFilterPress={handleFilterPress}
        />
        
        <View style={styles.categoryContainer}>
          <CategoryTabs onCategoryChange={handleCategoryChange} />
        </View>
      </Animated.View>
      
      <View style={styles.gridContainer}>
        <ImageGrid
          key={`grid-${refreshGrid}`} // Force re-render when refreshGrid changes
          category={selectedCategory}
          onImagePress={handleImagePress}
        />
      </View>
      
      <FloatingActionButton actions={fabActions} />

      {/* Image Viewer Modal */}
      <ImageViewer
        asset={selectedImage}
        visible={imageViewerVisible}
        onClose={handleImageViewerClose}
        onImageUpdated={handleImageUpdated}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight,
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryContainer: {
    zIndex: 5,
  },
  gridContainer: {
    flex: 1,
    marginTop: 5,
  },
});
