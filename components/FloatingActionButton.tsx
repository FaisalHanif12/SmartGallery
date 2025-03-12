import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Animated, 
  Modal, 
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type FABAction = {
  id: string;
  label: string;
  icon: any; // Using any type to avoid SFSymbols type issues
  onPress: () => void;
};

type FloatingActionButtonProps = {
  actions: FABAction[];
};

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    // Animate the FAB scale on press
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate the menu items
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FABAction) => {
    toggleMenu();
    action.onPress();
  };

  // Rotate the plus icon to form an X when the menu is open
  const rotateInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const fabColor = colors.tint;
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={toggleMenu}>
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.modalOverlay}>
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => {
                const translateY = animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, -10 - 70 * index],
                });
                
                const scaleInterpolate = animation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                });
                
                const opacityInterpolate = animation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.5, 1],
                });

                return (
                  <Animated.View
                    key={action.id}
                    style={[
                      styles.actionButton,
                      {
                        transform: [
                          { translateY },
                          { scale: scaleInterpolate }
                        ],
                        opacity: opacityInterpolate,
                        backgroundColor: colorScheme === 'dark' 
                          ? 'rgba(44, 44, 46, 0.9)' 
                          : 'rgba(255, 255, 255, 0.95)',
                        right: screenWidth / 2 - 110,
                      },
                    ]}>
                    <TouchableOpacity
                      style={styles.actionTouchable}
                      onPress={() => handleActionPress(action)}>
                      <View style={[
                        styles.actionIconContainer,
                        { backgroundColor: `${colors.tint}20` }
                      ]}>
                        <IconSymbol name={action.icon} size={22} color={colors.tint} />
                      </View>
                      <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Animated.View style={[
        styles.fabContainer,
        {
          transform: [
            { scale: scaleAnimation }
          ]
        }
      ]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#FFFFFF' }]}
          onPress={toggleMenu}
          activeOpacity={0.8}>
          <Animated.View style={[
            styles.fabIconContainer,
            {
              transform: [{ rotate: rotateInterpolate }]
            }
          ]}>
            <IconSymbol
              name="add-circle"
              size={28}
              color="#000000"
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 100,
  },
  actionButton: {
    position: 'absolute',
    width: 220,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  actionTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
}); 