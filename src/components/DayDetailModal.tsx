import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Text, Card, Button, useTheme, Divider, IconButton } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DailyWorkStatus, Shift } from '../types';
import { WEEKLY_STATUS, DAYS_OF_WEEK } from '../constants';

interface DayDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  date: string;
  status: DailyWorkStatus | null;
  shift: Shift | null;
}

export function DayDetailModal({ visible, onDismiss, date, status, shift }: DayDetailModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  const dateObj = parseISO(date);
  const dayOfWeek = DAYS_OF_WEEK.vi[dateObj.getDay()];
  const formattedDate = format(dateObj, 'dd/MM/yyyy', { locale: vi });
  
  const statusInfo = status ? WEEKLY_STATUS[status.status] : null;

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.modalContainer,
        { backgroundColor: theme.colors.surface }
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
              {dayOfWeek}, {formattedDate}
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={onDismiss}
            />
          </View>
          
          {statusInfo && (
            <View style={styles.statusContainer}>
              <Text style={[styles.statusIcon, { color: statusInfo.color }]}>
                {statusInfo.icon}
              </Text>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          )}
        </View>

        <Divider style={{ marginVertical: 16 }} />

        {/* Shift Information */}
        {shift && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Thông tin ca làm việc
              </Text>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Tên ca:
                </Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                  {shift.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Giờ làm việc:
                </Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                  {shift.startTime} - {shift.endTime}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Attendance Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Thông tin chấm công
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Giờ vào:
              </Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {formatTime(status?.vaoLogTime)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Giờ ra:
              </Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {formatTime(status?.raLogTime)}
              </Text>
            </View>

            {status && status.lateMinutes > 0 && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Đi muộn:
                </Text>
                <Text style={[styles.value, { color: '#FF9800' }]}>
                  {formatMinutes(status.lateMinutes)}
                </Text>
              </View>
            )}

            {status && status.earlyMinutes > 0 && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Về sớm:
                </Text>
                <Text style={[styles.value, { color: '#2196F3' }]}>
                  {formatMinutes(status.earlyMinutes)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Work Hours Information */}
        {status && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Thông tin giờ làm việc
              </Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Giờ hành chính:
                </Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                  {formatHours(status.standardHoursScheduled)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Giờ tăng ca:
                </Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                  {formatHours(status.otHoursScheduled)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  Tổng giờ làm việc:
                </Text>
                <Text style={[styles.value, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                  {formatHours(status.totalHoursScheduled)}
                </Text>
              </View>

              {status.sundayHoursScheduled > 0 && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                    Giờ Chủ nhật:
                  </Text>
                  <Text style={[styles.value, { color: '#9C27B0' }]}>
                    {formatHours(status.sundayHoursScheduled)}
                  </Text>
                </View>
              )}

              {status.nightHoursScheduled > 0 && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                    Giờ đêm:
                  </Text>
                  <Text style={[styles.value, { color: '#3F51B5' }]}>
                    {formatHours(status.nightHoursScheduled)}
                  </Text>
                </View>
              )}

              {status.isHolidayWork && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                    Làm việc ngày lễ:
                  </Text>
                  <Text style={[styles.value, { color: '#E91E63' }]}>
                    Có
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Close Button */}
        <Button
          mode="contained"
          onPress={onDismiss}
          style={styles.closeButton}
        >
          Đóng
        </Button>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  closeButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
