import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import FaceDetection from '@react-native-ml-kit/face-detection';

// Storage keys
const FACE_DATA_KEY = 'smartgallery_face_data';

// Types
export type FaceData = {
  id: string;
  faceUri: string; // URI to the cropped face image
  name: string;
  imageIds: string[]; // Array of image IDs that contain this face
  faceFeatures?: number[]; // Face embedding features for comparison
  lastUpdated: number;
};

type FaceDetectionContextType = {
  faces: FaceData[];
  isProcessing: boolean;
  processingProgress: number;
  detectFaces: (forceReprocess?: boolean) => Promise<void>;
  getFaceImages: (faceId: string) => Promise<MediaLibrary.Asset[]>;
  getAllFaceImages: () => Promise<MediaLibrary.Asset[]>;
  renameFace: (faceId: string, newName: string) => Promise<void>;
};

export const FaceDetectionContext = createContext<FaceDetectionContextType | undefined>(undefined);

interface FaceDetectionProviderProps {
  children: ReactNode;
}

export function FaceDetectionProvider({ children }: FaceDetectionProviderProps) {
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [lastProcessedDate, setLastProcessedDate] = useState<number | null>(null);

  // Load face data on mount
  useEffect(() => {
    loadFaceData();
  }, []);

  // Load face data from AsyncStorage
  const loadFaceData = async () => {
    try {
      const storedFaceData = await AsyncStorage.getItem(FACE_DATA_KEY);
      if (storedFaceData) {
        const parsedData = JSON.parse(storedFaceData);
        setFaces(parsedData.faces || []);
        setLastProcessedDate(parsedData.lastProcessedDate || null);
      }
    } catch (error) {
      console.error('Error loading face data:', error);
    }
  };

  // Save face data to AsyncStorage
  const saveFaceData = async (updatedFaces: FaceData[]) => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(FACE_DATA_KEY, JSON.stringify({
        faces: updatedFaces,
        lastProcessedDate: now
      }));
      setFaces(updatedFaces);
      setLastProcessedDate(now);
    } catch (error) {
      console.error('Error saving face data:', error);
    }
  };

  // Process an image for face detection
  const processImageForFaces = async (asset: MediaLibrary.Asset, existingFaces: FaceData[]) => {
    try {
      // Get the image URI
      const imageUri = asset.uri;
      
      // Detect faces in the image
      const detectedFaces = await FaceDetection.process(imageUri, {
        landmarkMode: 'all',
        contourMode: 'all',
        classificationMode: 'all',
        performanceMode: 'accurate',
        minFaceSize: 0.15,
      });

      if (!detectedFaces || detectedFaces.length === 0) {
        return existingFaces;
      }

      let updatedFaces = [...existingFaces];

      // Process each detected face
      for (const detectedFace of detectedFaces) {
        // Extract face from image
        const { bounds } = detectedFace;
        const { origin, size } = bounds;
        
        // Add padding to the face crop (20%)
        const padding = {
          width: size.width * 0.2,
          height: size.height * 0.2
        };
        
        // Crop the face with padding
        const manipResult = await manipulateAsync(
          imageUri,
          [
            {
              crop: {
                originX: Math.max(0, origin.x - padding.width / 2),
                originY: Math.max(0, origin.y - padding.height / 2),
                width: size.width + padding.width,
                height: size.height + padding.height
              }
            }
          ],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        // Save the cropped face to file system
        const faceFileName = `face_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const faceDirUri = `${FileSystem.documentDirectory}faces/`;
        
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(faceDirUri);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(faceDirUri, { intermediates: true });
        }
        
        const faceUri = `${faceDirUri}${faceFileName}`;
        await FileSystem.copyAsync({
          from: manipResult.uri,
          to: faceUri
        });

        // Check if this face matches any existing faces
        // For now, we'll use a simple approach - just add to a new face
        // In a real app, you'd use face embeddings for comparison
        const faceId = `face_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Add the face
        updatedFaces.push({
          id: faceId,
          faceUri: faceUri,
          name: `Person ${updatedFaces.length + 1}`,
          imageIds: [asset.id],
          lastUpdated: Date.now()
        });
      }

      return updatedFaces;
    } catch (error) {
      console.error('Error processing image for faces:', error);
      return existingFaces;
    }
  };

  // Detect faces in all gallery images
  const detectFaces = async (forceReprocess = false) => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Media library permission not granted');
        return;
      }

      setIsProcessing(true);
      setProcessingProgress(0);

      // Get all photos
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100, // Limit to 100 photos for performance
        sortBy: [MediaLibrary.SortBy.creationTime]
      });

      // If we have processed recently and not forcing reprocess, skip
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (lastProcessedDate && now - lastProcessedDate < oneDay && !forceReprocess) {
        setIsProcessing(false);
        return;
      }

      let updatedFaces = [...faces];
      
      // Process each image
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        // Skip if this image has already been processed
        const isProcessed = updatedFaces.some(face => 
          face.imageIds.includes(asset.id)
        );
        
        if (!isProcessed || forceReprocess) {
          updatedFaces = await processImageForFaces(asset, updatedFaces);
        }
        
        // Update progress
        setProcessingProgress((i + 1) / assets.length);
      }

      // Save updated face data
      await saveFaceData(updatedFaces);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error detecting faces:', error);
      setIsProcessing(false);
    }
  };

  // Get images for a specific face
  const getFaceImages = async (faceId: string): Promise<MediaLibrary.Asset[]> => {
    try {
      const face = faces.find(f => f.id === faceId);
      if (!face) {
        return [];
      }

      const assets = await Promise.all(
        face.imageIds.map(async (id) => {
          try {
            return await MediaLibrary.getAssetInfoAsync(id);
          } catch (error) {
            console.error(`Error getting asset info for ID ${id}:`, error);
            return null;
          }
        })
      );

      return assets.filter(asset => asset !== null) as MediaLibrary.Asset[];
    } catch (error) {
      console.error('Error getting face images:', error);
      return [];
    }
  };

  // Get all images that have faces
  const getAllFaceImages = async (): Promise<MediaLibrary.Asset[]> => {
    try {
      // Get unique image IDs from all faces
      const imageIds = Array.from(
        new Set(
          faces.flatMap(face => face.imageIds)
        )
      );

      const assets = await Promise.all(
        imageIds.map(async (id) => {
          try {
            return await MediaLibrary.getAssetInfoAsync(id);
          } catch (error) {
            console.error(`Error getting asset info for ID ${id}:`, error);
            return null;
          }
        })
      );

      return assets.filter(asset => asset !== null) as MediaLibrary.Asset[];
    } catch (error) {
      console.error('Error getting all face images:', error);
      return [];
    }
  };

  // Rename a face
  const renameFace = async (faceId: string, newName: string): Promise<void> => {
    try {
      const updatedFaces = faces.map(face => 
        face.id === faceId 
          ? { ...face, name: newName, lastUpdated: Date.now() } 
          : face
      );
      
      await saveFaceData(updatedFaces);
    } catch (error) {
      console.error('Error renaming face:', error);
    }
  };

  return (
    <FaceDetectionContext.Provider 
      value={{ 
        faces,
        isProcessing,
        processingProgress,
        detectFaces,
        getFaceImages,
        getAllFaceImages,
        renameFace
      }}
    >
      {children}
    </FaceDetectionContext.Provider>
  );
}

export function useFaceDetection() {
  const context = useContext(FaceDetectionContext);
  if (context === undefined) {
    throw new Error('useFaceDetection must be used within a FaceDetectionProvider');
  }
  return context;
} 