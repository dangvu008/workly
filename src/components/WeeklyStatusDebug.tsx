import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { format, addDays, startOfWeek } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storage';
import { workManager } from '../services/workManager';

export function WeeklyStatusDebug() {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const runDebugCheck = async () => {
    try {
      const today = new Date();
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
      
      let info = '🔍 Weekly Status Debug:\n\n';
      
      // Check current week dates
      info += '📅 Current week dates:\n';
      for (let i = 0; i < 7; i++) {
        const date = addDays(startOfCurrentWeek, i);
        const dateString = format(date, 'yyyy-MM-dd');
        info += `  ${i}: ${dateString}\n`;
      }
      
      info += '\n📊 Weekly status from state:\n';
      Object.entries(state.weeklyStatus).forEach(([date, status]) => {
        info += `  ${date}: ${status.status}\n`;
      });
      
      info += '\n💾 Weekly status from storage:\n';
      for (let i = 0; i < 7; i++) {
        const date = addDays(startOfCurrentWeek, i);
        const dateString = format(date, 'yyyy-MM-dd');
        const status = await storageService.getDailyWorkStatusForDate(dateString);
        info += `  ${dateString}: ${status?.status || 'null'}\n`;
      }
      
      info += '\n🔧 Active shift:\n';
      info += `  ${state.activeShift ? state.activeShift.name : 'None'}\n`;
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`❌ Error: ${error}`);
    }
  };

  const testManualUpdate = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('🧪 Testing manual update for:', today);
      
      await workManager.setManualWorkStatus(today, 'NGHI_PHEP');
      await actions.refreshWeeklyStatus();
      
      setDebugInfo(prev => prev + '\n\n✅ Manual update test completed');
    } catch (error) {
      setDebugInfo(prev => prev + `\n\n❌ Manual update failed: ${error}`);
    }
  };

  const clearTestData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await storageService.setDailyWorkStatusForDate(today, {
        status: 'pending',
        standardHoursScheduled: 0,
        otHoursScheduled: 0,
        sundayHoursScheduled: 0,
        nightHoursScheduled: 0,
        totalHoursScheduled: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        isHolidayWork: false,
      });
      await actions.refreshWeeklyStatus();
      
      setDebugInfo(prev => prev + '\n\n🗑️ Test data cleared');
    } catch (error) {
      setDebugInfo(prev => prev + `\n\n❌ Clear failed: ${error}`);
    }
  };

  useEffect(() => {
    runDebugCheck();
  }, [state.weeklyStatus]);

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Weekly Status Debug
        </Text>
        
        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={runDebugCheck} style={styles.button}>
            Refresh Debug
          </Button>
          <Button mode="contained" onPress={testManualUpdate} style={styles.button}>
            Test Update
          </Button>
          <Button mode="text" onPress={clearTestData} style={styles.button}>
            Clear
          </Button>
        </View>
        
        <Text style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}>
          {debugInfo}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
