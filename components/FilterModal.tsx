import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUIState } from '@/context/UIStateContext';

const { width } = Dimensions.get('window');

// Get current year and past 5 years
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

// Month names
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: { month: number | null; year: number | null }) => void;
  currentFilter: { month: number | null; year: number | null };
};

export function FilterModal({ visible, onClose, onApplyFilter, currentFilter }: FilterModalProps) {
  const { theme } = useUIState();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentFilter.month);
  const [selectedYear, setSelectedYear] = useState<number | null>(currentFilter.year);

  // Reset selections when modal opens with current filter
  useEffect(() => {
    if (visible) {
      setSelectedMonth(currentFilter.month);
      setSelectedYear(currentFilter.year);
    }
  }, [visible, currentFilter]);

  const handleApplyFilter = () => {
    onApplyFilter({ month: selectedMonth, year: selectedYear });
    onClose();
  };

  const handleClearFilter = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    onApplyFilter({ month: null, year: null });
    onClose();
  };

  const isFilterActive = selectedMonth !== null || selectedYear !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }
        ]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Filter Photos</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <ThemedText style={styles.sectionTitle}>Year</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedYear === null && styles.selectedOption,
                  { 
                    backgroundColor: selectedYear === null 
                      ? isDark ? '#ffffff' : '#007AFF' 
                      : isDark ? '#2c2c2e' : '#f0f0f0',
                    borderWidth: 1,
                    borderColor: selectedYear === null
                      ? isDark ? '#e0e0e0' : '#0066cc'
                      : isDark ? '#444444' : '#d0d0d0',
                  }
                ]}
                onPress={() => setSelectedYear(null)}
              >
                <ThemedText 
                  style={[
                    styles.optionText,
                    selectedYear === null && { 
                      color: isDark ? '#000000' : '#ffffff',
                      fontWeight: '600'
                    }
                  ]}
                >
                  All
                </ThemedText>
              </TouchableOpacity>
              
              {years.map(year => (
                <TouchableOpacity
                  key={`year-${year}`}
                  style={[
                    styles.optionButton,
                    selectedYear === year && styles.selectedOption,
                    { 
                      backgroundColor: selectedYear === year 
                        ? isDark ? '#ffffff' : '#007AFF'
                        : isDark ? '#2c2c2e' : '#f0f0f0',
                      borderWidth: 1,
                      borderColor: selectedYear === year
                        ? isDark ? '#e0e0e0' : '#0066cc'
                        : isDark ? '#444444' : '#d0d0d0',
                    }
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText,
                      selectedYear === year && { 
                        color: isDark ? '#000000' : '#ffffff',
                        fontWeight: '600'
                      }
                    ]}
                  >
                    {year}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <ThemedText style={styles.sectionTitle}>Month</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedMonth === null && styles.selectedOption,
                  { 
                    backgroundColor: selectedMonth === null 
                      ? isDark ? '#ffffff' : '#007AFF'
                      : isDark ? '#2c2c2e' : '#f0f0f0',
                    borderWidth: 1,
                    borderColor: selectedMonth === null
                      ? isDark ? '#e0e0e0' : '#0066cc'
                      : isDark ? '#444444' : '#d0d0d0',
                  }
                ]}
                onPress={() => setSelectedMonth(null)}
              >
                <ThemedText 
                  style={[
                    styles.optionText,
                    selectedMonth === null && { 
                      color: isDark ? '#000000' : '#ffffff',
                      fontWeight: '600'
                    }
                  ]}
                >
                  All
                </ThemedText>
              </TouchableOpacity>
              
              {months.map((month, index) => (
                <TouchableOpacity
                  key={`month-${index}`}
                  style={[
                    styles.optionButton,
                    selectedMonth === index && styles.selectedOption,
                    { 
                      backgroundColor: selectedMonth === index 
                        ? isDark ? '#ffffff' : '#007AFF'
                        : isDark ? '#2c2c2e' : '#f0f0f0',
                      borderWidth: 1,
                      borderColor: selectedMonth === index
                        ? isDark ? '#e0e0e0' : '#0066cc'
                        : isDark ? '#444444' : '#d0d0d0',
                    }
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText,
                      selectedMonth === index && { 
                        color: isDark ? '#000000' : '#ffffff',
                        fontWeight: '600'
                      }
                    ]}
                  >
                    {month}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { 
                  backgroundColor: isDark ? '#333333' : '#e0e0e0',
                  opacity: isFilterActive ? 1 : 0.5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: isDark ? '#444444' : '#d0d0d0',
                }
              ]}
              onPress={handleClearFilter}
              disabled={!isFilterActive}
            >
              <ThemedText style={[
                styles.actionButtonText,
                { 
                  color: isDark ? '#ffffff' : '#000000',
                  fontWeight: '600',
                  textShadowColor: 'rgba(0, 0, 0, 0.1)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 1
                }
              ]}>
                Clear
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                { 
                  backgroundColor: isDark ? '#ffffff' : '#007AFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  borderWidth: 1,
                  borderColor: isDark ? '#e0e0e0' : '#0066cc',
                }
              ]}
              onPress={handleApplyFilter}
            >
              <ThemedText style={[
                styles.actionButtonText, 
                { 
                  color: isDark ? '#000000' : '#ffffff',
                  fontWeight: '600',
                  textShadowColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 1
                }
              ]}>
                Apply
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionsContainer: {
    paddingVertical: 5,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedOption: {
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 