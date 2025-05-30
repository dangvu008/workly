import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Divider } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { AttendanceLog } from '../types';
import { BUTTON_STATES } from '../constants';
import { storageService } from '../services/storage';

interface AttendanceHistoryProps {
  visible?: boolean;
}

export function AttendanceHistory({ visible = true }: AttendanceHistoryProps) {
  const theme = useTheme();
  const { state } = useApp();
  const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    loadTodayLogs();
  }, [state.currentButtonState]); // Refresh when button state changes

  const loadTodayLogs = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await storageService.getAttendanceLogsForDate(today);
      setTodayLogs(logs);
    } catch (error) {
      console.error('Error loading today logs:', error);
    }
  };

  const getActionText = (type: AttendanceLog['type']): string => {
    const actionMap = {
      go_work: 'Đi Làm',
      check_in: 'Chấm Công Vào',
      punch: 'Ký Công',
      check_out: 'Chấm Công Ra',
      complete: 'Hoàn Tất',
    };
    return actionMap[type] || type;
  };

  const getActionIcon = (type: AttendanceLog['type']): string => {
    const iconMap = {
      go_work: '🚶‍♂️',
      check_in: '📥',
      punch: '✍️',
      check_out: '📤',
      complete: '✅',
    };
    return iconMap[type] || '📝';
  };

  const getActionColor = (type: AttendanceLog['type']): string => {
    const colorMap = {
      go_work: '#4CAF50',
      check_in: '#2196F3',
      punch: '#9C27B0',
      check_out: '#FF5722',
      complete: '#4CAF50',
    };
    return colorMap[type] || theme.colors.primary;
  };

  const formatTime = (timeString: string): string => {
    try {
      return format(parseISO(timeString), 'HH:mm', { locale: vi });
    } catch {
      return '--:--';
    }
  };

  // Don't render if no logs or not visible
  if (!visible || todayLogs.length === 0) {
    return null;
  }

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Lịch sử bấm nút hôm nay
        </Text>
        
        <ScrollView 
          style={styles.logsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {todayLogs.map((log, index) => (
            <View key={`${log.type}-${log.time}-${index}`}>
              <View style={styles.logItem}>
                <View style={styles.logIcon}>
                  <Text style={[
                    styles.iconText,
                    { color: getActionColor(log.type) }
                  ]}>
                    {getActionIcon(log.type)}
                  </Text>
                </View>
                
                <View style={styles.logContent}>
                  <Text style={[
                    styles.actionText,
                    { color: theme.colors.onSurface }
                  ]}>
                    {getActionText(log.type)}
                  </Text>
                  <Text style={[
                    styles.timeText,
                    { color: theme.colors.onSurfaceVariant }
                  ]}>
                    {formatTime(log.time)}
                  </Text>
                </View>
                
                <View style={styles.statusIndicator}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getActionColor(log.type) }
                  ]} />
                </View>
              </View>
              
              {index < todayLogs.length - 1 && (
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              )}
            </View>
          ))}
        </ScrollView>
        
        <Text style={[styles.summary, { color: theme.colors.onSurfaceVariant }]}>
          Tổng cộng: {todayLogs.length} hành động
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
    textAlign: 'center',
  },
  logsList: {
    maxHeight: 200, // Limit height to prevent taking too much space
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  logContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    marginVertical: 4,
    marginLeft: 52, // Align with content, skip icon area
  },
  summary: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
