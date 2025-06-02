// Test component để kiểm tra icons
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Test các icon từ BUTTON_STATES
const buttonIcons = [
  'run',
  'clock-outline', 
  'login',
  'briefcase',
  'logout',
  'timer-sand',
  'check-circle',
  'target'
];

// Test các icon từ WEEKLY_STATUS
const weeklyIcons = [
  'alert',
  'clock',
  'close-circle',
  'account-check',
  'sleep',
  'flag',
  'eye-check',
  'help-circle',
  'beach',
  'hospital-box',
  'airplane',
  'clock-alert',
  'alert-circle',
  'calculator',
  'delete',
  'home',
  'walk'
];

export function IconTestComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 WORKLY ICON TEST</Text>
      
      <Text style={styles.sectionTitle}>Button Icons:</Text>
      <View style={styles.iconGrid}>
        {buttonIcons.map((iconName, index) => (
          <View key={index} style={styles.iconItem}>
            <MaterialCommunityIcons
              name={iconName as any}
              size={24}
              color="#2196F3"
            />
            <Text style={styles.iconLabel}>{iconName}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Weekly Status Icons:</Text>
      <View style={styles.iconGrid}>
        {weeklyIcons.map((iconName, index) => (
          <View key={index} style={styles.iconItem}>
            <MaterialCommunityIcons
              name={iconName as any}
              size={24}
              color="#4CAF50"
            />
            <Text style={styles.iconLabel}>{iconName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  iconItem: {
    alignItems: 'center',
    margin: 10,
    width: 80,
  },
  iconLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
});
