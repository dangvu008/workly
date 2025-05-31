import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, useTheme, Menu, Button } from 'react-native-paper';
import { format, addDays, startOfWeek, isFuture, isToday, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { WEEKLY_STATUS, DAYS_OF_WEEK } from '../constants';
import { DailyWorkStatus } from '../types';
import { storageService } from '../services/storage';
import { workManager } from '../services/workManager';
import { DayDetailModal } from './DayDetailModal';
import { ManualStatusUpdateModal } from './ManualStatusUpdateModal';

interface WeeklyStatusGridProps {
  onDayPress?: (date: string) => void;
}

export function WeeklyStatusGrid({ onDayPress }: WeeklyStatusGridProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [menuVisible, setMenuVisible] = React.useState<string | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [manualUpdateModalVisible, setManualUpdateModalVisible] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string>('');

  // Get the current week (Monday to Sunday)
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    return addDays(startOfCurrentWeek, index);
  });

  const getStatusForDate = (date: Date): DailyWorkStatus | null => {
    const dateString = format(date, 'yyyy-MM-dd');
    return state.weeklyStatus[dateString] || null;
  };

  const getStatusIcon = (date: Date): string => {
    const status = getStatusForDate(date);

    if (!status) {
      if (isFuture(date) && !isToday(date)) {
        return WEEKLY_STATUS.pending.icon;
      }
      return WEEKLY_STATUS.absent.icon;
    }

    return WEEKLY_STATUS[status.status]?.icon || WEEKLY_STATUS.pending.icon;
  };

  const getStatusColor = (date: Date): string => {
    const status = getStatusForDate(date);

    if (!status) {
      if (isFuture(date) && !isToday(date)) {
        return WEEKLY_STATUS.pending.color;
      }
      return WEEKLY_STATUS.absent.color;
    }

    return WEEKLY_STATUS[status.status]?.color || WEEKLY_STATUS.pending.color;
  };

  const handleDayPress = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateString);
    setManualUpdateModalVisible(true);
    onDayPress?.(dateString);
  };

  const handleDayLongPress = (date: Date) => {
    // Allow manual status update for current day and past days, plus future days for planning
    const canUpdate = isToday(date) || isPast(date) || isFuture(date);
    if (canUpdate) {
      const dateString = format(date, 'yyyy-MM-dd');
      setMenuVisible(dateString);
    }
  };

  // Handlers cho ManualStatusUpdateModal
  const handleStatusUpdate = async (status: DailyWorkStatus['status']) => {
    try {
      await workManager.setManualWorkStatus(selectedDate, status);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleTimeEdit = async (checkInTime: string, checkOutTime: string) => {
    try {
      await workManager.updateAttendanceTime(selectedDate, checkInTime, checkOutTime);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Error updating time:', error);
      throw error;
    }
  };

  const handleRecalculateFromLogs = async () => {
    try {
      await workManager.recalculateFromAttendanceLogs(selectedDate);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Error recalculating from logs:', error);
      throw error;
    }
  };

  const handleClearManualStatus = async () => {
    try {
      await workManager.clearManualStatusAndRecalculate(selectedDate);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Error clearing manual status:', error);
      throw error;
    }
  };

  // Legacy handler for old menu (keep for backward compatibility)
  const handleManualStatusUpdate = async (date: string, status: 'manual_present' | 'manual_absent' | 'manual_holiday' | 'manual_completed' | 'manual_review') => {
    try {
      const manualStatus: DailyWorkStatus = {
        status,
        standardHoursScheduled: (status === 'manual_present' || status === 'manual_completed') ? 8 : 0,
        otHoursScheduled: 0,
        sundayHoursScheduled: 0,
        nightHoursScheduled: 0,
        totalHoursScheduled: (status === 'manual_present' || status === 'manual_completed') ? 8 : 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        isHolidayWork: status === 'manual_holiday',
      };

      await storageService.setDailyWorkStatusForDate(date, manualStatus);
      await actions.refreshWeeklyStatus();
      setMenuVisible(null);

      const statusText = {
        manual_present: 'Có mặt',
        manual_absent: 'Nghỉ',
        manual_holiday: 'Nghỉ lễ',
        manual_completed: 'Hoàn thành',
        manual_review: 'Cần xem lại',
      }[status];

      Alert.alert('Thành công', `Đã đánh dấu ${format(new Date(date), 'dd/MM')} là "${statusText}"`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const renderDayItem = (date: Date, index: number) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayName = DAYS_OF_WEEK[state.settings?.language || 'vi'][index];
    const dayNumber = format(date, 'd');
    const statusIcon = getStatusIcon(date);
    const statusColor = getStatusColor(date);
    const isCurrentDay = isToday(date);
    const canUpdate = isToday(date) || isPast(date) || isFuture(date);

    return (
      <TouchableOpacity
        key={dateString}
        style={[
          styles.dayItem,
          { backgroundColor: theme.colors.surface },
          isCurrentDay && {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary,
            borderWidth: 2,
          }
        ]}
        onPress={() => handleDayPress(date)}
        onLongPress={() => handleDayLongPress(date)}
        delayLongPress={500}
      >
        <Text style={[
          styles.dayName,
          { color: theme.colors.onSurface },
          isCurrentDay && { color: theme.colors.primary, fontWeight: 'bold' }
        ]}>
          {dayName}
        </Text>

        <Text style={[
          styles.dayNumber,
          { color: theme.colors.onSurface },
          isCurrentDay && { color: theme.colors.primary, fontWeight: 'bold' }
        ]}>
          {dayNumber}
        </Text>

        <Text style={[
          styles.statusIcon,
          { color: statusColor }
        ]}>
          {statusIcon}
        </Text>

        {canUpdate && (
          <Menu
            visible={menuVisible === dateString}
            onDismiss={() => setMenuVisible(null)}
            anchor={<View />}
            contentStyle={{ backgroundColor: theme.colors.surface }}
          >
            <Menu.Item
              onPress={() => handleManualStatusUpdate(dateString, 'manual_present')}
              title="Đánh dấu Có mặt (P)"
              leadingIcon="check-circle"
            />
            <Menu.Item
              onPress={() => handleManualStatusUpdate(dateString, 'manual_absent')}
              title="Đánh dấu Nghỉ (B)"
              leadingIcon="sleep"
            />
            <Menu.Item
              onPress={() => handleManualStatusUpdate(dateString, 'manual_holiday')}
              title="Đánh dấu Nghỉ lễ (H)"
              leadingIcon="flag"
            />
            <Menu.Item
              onPress={() => handleManualStatusUpdate(dateString, 'manual_completed')}
              title="Đánh dấu Hoàn thành (✅)"
              leadingIcon="check-all"
            />
            <Menu.Item
              onPress={() => handleManualStatusUpdate(dateString, 'manual_review')}
              title="Đánh dấu Cần xem lại (RV)"
              leadingIcon="eye-check"
            />
          </Menu>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Trạng thái tuần này
          </Text>

          <View style={styles.grid}>
            {weekDays.map((date, index) => renderDayItem(date, index))}
          </View>

          <View style={styles.legend}>
            <Text style={[styles.legendTitle, { color: theme.colors.onSurface }]}>
              Chú thích:
            </Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <Text style={[styles.legendIcon, { color: WEEKLY_STATUS.completed.color }]}>
                  {WEEKLY_STATUS.completed.icon}
                </Text>
                <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                  Hoàn thành
                </Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.legendIcon, { color: WEEKLY_STATUS.late.color }]}>
                  {WEEKLY_STATUS.late.icon}
                </Text>
                <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                  Đi muộn
                </Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.legendIcon, { color: WEEKLY_STATUS.absent.color }]}>
                  {WEEKLY_STATUS.absent.icon}
                </Text>
                <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                  Vắng mặt
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Day Detail Modal */}
      <DayDetailModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        date={selectedDate}
        status={selectedDate ? state.weeklyStatus[selectedDate] || null : null}
        shift={state.activeShift}
      />

      {/* Manual Status Update Modal */}
      <ManualStatusUpdateModal
        visible={manualUpdateModalVisible}
        onDismiss={() => setManualUpdateModalVisible(false)}
        date={selectedDate}
        currentStatus={selectedDate ? state.weeklyStatus[selectedDate] || null : null}
        shift={state.activeShift}
        onStatusUpdate={handleStatusUpdate}
        onTimeEdit={handleTimeEdit}
        onRecalculateFromLogs={handleRecalculateFromLogs}
        onClearManualStatus={handleClearManualStatus}
      />
    </>
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
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    padding: 4,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusIcon: {
    fontSize: 16,
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
  },
});
