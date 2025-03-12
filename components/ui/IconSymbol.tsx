// This file is a fallback for using MaterialIcons on Android and web.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconSymbolProps = {
  name: string;
  size: number;
  color: string;
};

// Map SF Symbols names to Ionicons names
const iconMap: { [key: string]: string } = {
  'photo.on.rectangle': 'images-outline',
  'magnifyingglass': 'search-outline',
  'person.2.fill': 'people-outline',
  'heart.fill': 'heart-outline',
  'gear': 'settings-outline',
  'person.crop.circle': 'person-circle-outline',
  'slider.horizontal.3': 'options-outline',
  'plus': 'add',
  'add-circle': 'add-circle',
  'xmark': 'close',
  'square.and.arrow.down': 'download-outline',
  'sparkles': 'sparkles-outline',
  'camera': 'camera-outline',
  'compass': 'compass-outline',
  'wand.and.stars': 'color-wand-outline',
  'trash': 'trash-outline',
  'chevron.left': 'chevron-back',
  'checkmark.circle.fill': 'checkmark-circle',
  'xmark.circle': 'close-circle-outline',
};

export function IconSymbol({ name, size, color }: IconSymbolProps) {
  // Convert SF Symbol name to Ionicons name
  const ionIconName = iconMap[name] || name;
  
  return (
    <Ionicons 
      name={ionIconName as any} 
      size={size} 
      color={color} 
    />
  );
}
